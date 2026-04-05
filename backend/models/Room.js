const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    senderName: { type: String, required: true },
    content: { type: String, required: true },
    isRobot: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
});

const RoomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    roomCode: { type: String, required: true, unique: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    type: { type: String, default: 'discussion' },
    privacy: { type: String, enum: ['public', 'private'], default: 'private' },
    status: { type: String, enum: ['active', 'closed'], default: 'active' },
    allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    messages: [MessageSchema]
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);
