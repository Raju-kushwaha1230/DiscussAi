const Room = require('../models/Room');
const crypto = require('crypto');

// Helper to generate a unique room code
const generateRoomCode = () => {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
};

const createRoom = async (req, res) => {
    try {
        const { name, host, type, privacy } = req.body;
        
        if (!name || !host) {
            return res.status(400).json({ message: 'Room name and host are required' });
        }

        let roomCode = generateRoomCode();
        // Check if code is unique (highly likely with 3 bytes, but good practice)
        let existingRoom = await Room.findOne({ roomCode });
        while (existingRoom) {
            roomCode = generateRoomCode();
            existingRoom = await Room.findOne({ roomCode });
        }

        const newRoom = new Room({
            name,
            roomCode,
            host,
            participants: [host],
            type: type || 'discussion',
            privacy: privacy || 'private',
            allowedUsers: [host]
        });

        await newRoom.save();

        // Emit to social dashboard if public
        if (newRoom.privacy === 'public') {
            const io = req.app.get('socketio');
            if (io) {
                io.to('dashboard').emit('new_room', {
                    name: newRoom.name,
                    roomCode: newRoom.roomCode,
                    host: { name: 'Host' }, // Need to populate host or send name
                    participantCount: 1,
                    type: newRoom.type,
                    createdAt: newRoom.createdAt
                });
            }
        }

        res.status(201).json(newRoom);
    } catch (error) {
        res.status(500).json({ message: 'Error creating room', error: error.message });
    }
};

const joinRoom = async (req, res) => {
    try {
        const { roomCode, userId } = req.body;

        if (!roomCode || !userId) {
            return res.status(400).json({ message: 'Room code and user ID are required' });
        }

        const room = await Room.findOne({ roomCode });
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (room.status === 'closed') {
            return res.status(400).json({ message: 'Room is already closed' });
        }

        // Privacy check
        if (room.privacy === 'private' && !room.allowedUsers.includes(userId) && room.host.toString() !== userId) {
            return res.status(403).json({ message: 'This room is private. Please ask the host for an invite.' });
        }

        // Add user to participants if not already there
        if (!room.participants.includes(userId)) {
            room.participants.push(userId);
            // If it's private and they have the code, maybe add them to allowedUsers? 
            // Or just let them in if they already have the code? 
            // The user said "only invited", so I'll stick to a strict check.
            await room.save();
        }

        res.status(200).json(room);
    } catch (error) {
        res.status(500).json({ message: 'Error joining room', error: error.message });
    }
};

const getRoomDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const room = await Room.findById(id).populate('participants', 'name email').populate('host', 'name email');
        
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        res.status(200).json(room);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching room details', error: error.message });
    }
};

const getRoomByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const room = await Room.findOne({ roomCode: code }).populate('participants', 'name email').populate('host', 'name email');
        
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        res.status(200).json(room);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching room', error: error.message });
    }
};

const getPublicRooms = async (req, res) => {
    try {
        const rooms = await Room.find({ privacy: 'public', status: 'active' })
            .populate('host', 'name')
            .select('name roomCode host participants type createdAt');
        
        // Return rooms with participant count
        const roomsWithCount = rooms.map(room => ({
            ...room._doc,
            participantCount: room.participants.length
        }));

        res.status(200).json(roomsWithCount);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching public rooms', error: error.message });
    }
};

const getUserHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const rooms = await Room.find({ participants: userId })
            .populate('host', 'name')
            .sort({ createdAt: -1 });
        
        res.status(200).json(rooms);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user history', error: error.message });
    }
};

module.exports = {
    createRoom,
    joinRoom,
    getRoomDetails,
    getRoomByCode,
    getPublicRooms,
    getUserHistory
};
