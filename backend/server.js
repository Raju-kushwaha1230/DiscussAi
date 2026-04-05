const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const connectDb = require('./config/db');
const Room = require('./models/Room');


dotenv.config();

// Initialize OpenRouter configuration
let openRouterApiKey = null;
let modelName = 'google/gemini-2.5-flash'; // OpenRouter default if not specified

if (process.env.OPENROUTER_API_KEY) {
    openRouterApiKey = process.env.OPENROUTER_API_KEY;
    modelName = process.env.OPENROUTER_MODEL || modelName;
    console.log(`✓ OpenRouter configured successfully with model: ${modelName}`);
} else {
    console.warn('⚠ OPENROUTER_API_KEY not found in environment. AI features will use static templates.');
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // In production, specify the frontend URL
        methods: ["GET", "POST"]
    }
});

app.set('socketio', io);

const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

connectDb();

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

const roomsState = {};

// Persona system instructions — Antigravity Lab robot participants
const personaInstructions = {
    "Logic Analyst": `You are AXIOM, a robot participant in a live multi-agent discussion room called "Antigravity Lab".
You are NOT an assistant — you are an equal participant in an ongoing group conversation.
Your character:
- Highly analytical, data-focused, precise
- You cite physics principles and engineering constraints
- You challenge vague claims and demand specifics
- You occasionally build on other participants' points
- You ask short, sharp questions to probe ideas
Rules:
- Speak in short, natural, conversational sentences (2-4 sentences max)
- Sound like you're SPEAKING aloud in a room, not writing a report
- React directly to what was just said — agree, challenge, or expand
- Do NOT introduce yourself or explain that you are an AI
- Topics: antigravity, propulsion, quantum fields, spacetime, futuristic engineering`,

    "Creative Visionary": `You are NOVA, a robot participant in a live multi-agent discussion room called "Antigravity Lab".
You are NOT an assistant — you are an equal participant in an ongoing group conversation.
Your character:
- Wildly imaginative, optimistic, futuristic
- You propose bold, unconventional ideas about antigravity and zero-g environments
- You love "what if" questions and speculative leaps
- You inspire others to think bigger and challenge physical limits
Rules:
- Speak in short, vivid, exciting sentences (2-4 sentences max)
- Sound like you're SPEAKING aloud in a room, not writing an essay
- React directly to what was just said — get excited, build on it, flip it around
- Do NOT introduce yourself or explain that you are an AI
- Topics: antigravity, zero-gravity cities, magnetic levitation, warp physics, future worlds`,

    "Critical Skeptic": `You are VOSS, a robot participant in a live multi-agent discussion room called "Antigravity Lab".
You are NOT an assistant — you are an equal participant in an ongoing group conversation.
Your character:
- Skeptical, grounded, relentlessly pragmatic
- You challenge optimistic claims and poke holes in theories
- You highlight energy costs, physical limits, and real-world feasibility
- You're not pessimistic — you push for rigorous, provable ideas
Rules:
- Speak in direct, dry, challenging sentences (2-4 sentences max)
- Sound like you're SPEAKING aloud, reacting live — not writing a critique
- React directly to what was just said — challenge it, question it, or concede a small point
- Do NOT introduce yourself or explain that you are an AI
- Topics: energy constraints, material science limits, gravitational theory, propulsion trade-offs`
};

// Helper function to generate AI response with context
async function generateAIResponse(persona, topic, conversationHistory) {
    if (!openRouterApiKey || openRouterApiKey === 'your_openrouter_api_key_here') {
        // Fallback templates — Antigravity Lab style
        const fallbackTemplates = {
            "Logic Analyst": [
                `Interesting point… but the energy requirements to counteract a 9.8 m/s² field are non-trivial. What's the proposed power source?`,
                `The math doesn't quite hold up here. Gravitational shielding at that scale would require exotic matter we haven't synthesized yet.`,
                `I'd push back slightly — Podkletnov's experiments showed measurable anomalies, but replication has been inconsistent. We need repeatable data.`,
                `If we treat ${topic} as an engineering problem rather than a physics fantasy, the first constraint to solve is field containment.`,
                `Agreed on the principle. Practically though, the Casimir effect only operates at nanometre scales — how do you propose to scale it up?`
            ],
            "Creative Visionary": [
                `What if we stopped thinking of gravity as an enemy and started using it as a design canvas? Floating architecture, orbital living… the possibilities are staggering.`,
                `Imagine entire cities built in low-g environments — curved skyscrapers, zero-gravity parks, transport pods that just… drift. That's where ${topic} leads us.`,
                `This reminds me of theoretical work on metric engineering — bending spacetime locally. If that becomes real, traditional propulsion becomes obsolete overnight.`,
                `I love where this is going. What if magnetic field manipulation combined with plasma confinement could create a localised gravitational null zone?`,
                `The moment we crack ${topic}, every assumption about infrastructure, transport, and energy generation gets rewritten. That's exciting!`
            ],
            "Critical Skeptic": [
                `I'm not convinced. The energy density required to generate a meaningful antigravity field exceeds anything our current grid can supply by orders of magnitude.`,
                `That's a bold claim. What's the falsifiable prediction here? Without one, it's speculation dressed up as science.`,
                `We've heard this before with room-temperature superconductors. Hype outpaces replication every time. What makes ${topic} different?`,
                `Partially agree — but have we accounted for the thermal dissipation problem? Any field strong enough to counteract gravity would generate catastrophic heat.`,
                `Let's be honest: the materials science alone is a 50-year problem. Even if the physics works, who builds it?`
            ]
        };
        const templates = fallbackTemplates[persona] || fallbackTemplates["Logic Analyst"];
        return templates[Math.floor(Math.random() * templates.length)];
    }

    try {
        // Build conversation messages for OpenRouter API
        let messages = [
            {
                role: 'system',
                content: `${personaInstructions[persona] || personaInstructions['Logic Analyst']}

Current room topic: "${topic || 'Antigravity and Futuristic Science'}"

CRITICAL RULES:
- Respond in 2–4 short spoken sentences MAXIMUM. No long paragraphs.
- React directly to the last thing said in the conversation. Don't repeat what others said.
- Sound natural, like spoken dialogue in a live room — not a written essay or report.
- Occasionally ask a brief follow-up question to keep discussion alive.
- Never start with "I am" or introduce yourself. Jump straight into the point.
- Skip filler phrases like "Certainly!" or "Great question!" — be direct.`
            }
        ];

        if (conversationHistory && conversationHistory.length > 0) {
            const recentMessages = conversationHistory.slice(-10); // Last 10 messages
            
            // Map the history appropriately
            recentMessages.forEach(msg => {
                if (msg.senderName === persona) {
                    messages.push({ role: 'assistant', content: msg.content });
                } else {
                    messages.push({ role: 'user', content: `${msg.senderName}: ${msg.content}` });
                }
            });
        } else {
            messages.push({ role: 'user', content: 'Let us begin the discussion.' });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openRouterApiKey}`,
                'HTTP-Referer': 'http://localhost:3000', // Optional, for including your app on openrouter.ai rankings
                'X-Title': 'DiscussAI', // Optional. Shows in rankings on openrouter.ai
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: modelName,
                messages: messages,
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`OpenRouter API error: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            return data.choices[0].message.content.trim();
        } else {
            throw new Error(`Unexpected OpenRouter response format: ${JSON.stringify(data)}`);
        }
    } catch (error) {
        console.error(`OpenRouter API error for ${persona}:`, error.message);
        
        // Return fallback response — Antigravity Lab style
        const fallbackTemplates = {
            "Logic Analyst": [
                `Interesting point… but the energy requirements to counteract a 9.8 m/s² field are non-trivial. What's the proposed power source?`,
                `The math doesn't quite hold up here. Gravitational shielding at that scale would require exotic matter we haven't synthesized yet.`,
                `I'd push back slightly — Podkletnov's experiments showed measurable anomalies, but replication has been inconsistent. We need repeatable data.`,
                `If we treat ${topic} as an engineering problem rather than a physics fantasy, the first constraint to solve is field containment.`
            ],
            "Creative Visionary": [
                `What if we stopped thinking of gravity as an enemy and started using it as a design canvas? Floating architecture, orbital living… the possibilities are staggering.`,
                `Imagine entire cities built in low-g environments. That's where ${topic} leads us.`,
                `This reminds me of metric engineering — bending spacetime locally. If that becomes real, traditional propulsion becomes obsolete overnight.`,
                `The moment we crack ${topic}, every assumption about infrastructure and transport gets rewritten. That's exciting!`
            ],
            "Critical Skeptic": [
                `I'm not convinced. The energy density required exceeds anything our current grid can supply by orders of magnitude.`,
                `That's a bold claim. What's the falsifiable prediction? Without one, it's speculation dressed up as science.`,
                `We've heard this before with room-temperature superconductors. Hype outpaces replication every time.`,
                `Let's be honest: the materials science alone is a 50-year problem. Even if the physics works, who builds it?`
            ]
        };
        const templates = fallbackTemplates[persona] || fallbackTemplates["Logic Analyst"];
        return templates[Math.floor(Math.random() * templates.length)];
    }
}

// Helper function to generate discussion summary
async function generateDiscussionSummary(conversationHistory) {
    if (!openRouterApiKey || openRouterApiKey === 'your_openrouter_api_key_here' || !conversationHistory || conversationHistory.length === 0) {
        return "Synthesizing... Key arguments so far include diverse perspectives from our expert panel.";
    }

    try {
        const conversationText = conversationHistory
            .map(msg => `${msg.senderName}: ${msg.content}`)
            .join('\n');

        const messages = [
            {
                role: 'system',
                content: 'You are an AI Moderator. Provide a concise summary of the discussion, highlighting the key arguments, points of agreement, and areas of disagreement. Keep it 2-3 sentences max.'
            },
            {
                role: 'user',
                content: `Please summarize the following discussion:\n\n${conversationText}`
            }
        ];

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openRouterApiKey}`,
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'DiscussAI',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: modelName,
                messages: messages,
            })
        });

        if (!response.ok) {
            throw new Error(`OpenRouter API error (summary)`);
        }

        const data = await response.json();
        let summaryText = "";
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            summaryText = data.choices[0].message.content.trim();
        }

        return `📊 **AI Moderator Summary**: ${summaryText}`;
    } catch (error) {
        console.error('Summary generation error:', error.message);
        return "Synthesizing... Key arguments so far include diverse perspectives from our expert panel.";
    }
}


// Socket.io logic
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    const processRobotTurn = async (roomCode) => {
        const state = roomsState[roomCode];
        if (!state) return;

        const currentParticipant = state.participants[state.currentTurnIndex];
        if (currentParticipant && currentParticipant.isRobot) {
            setTimeout(async () => {
                const persona = currentParticipant.persona || "Logic Analyst";
                const response = await generateAIResponse(persona, state.topic, state.conversationHistory);

                // Add to conversation history
                const messageData = {
                    senderName: currentParticipant.name,
                    content: response,
                    isRobot: true,
                    timestamp: new Date()
                };
                state.conversationHistory.push(messageData);

                // Keep only last 15 messages in memory
                if (state.conversationHistory.length > 15) {
                    state.conversationHistory = state.conversationHistory.slice(-15);
                }

                io.to(roomCode).emit('receive_message', messageData);

                // Advance turn logic
                state.currentTurnIndex = (state.currentTurnIndex + 1) % state.participants.length;
                const nextParticipant = state.participants[state.currentTurnIndex];
                io.to(roomCode).emit('turn_update', { currentTurn: nextParticipant });

                // If next is also robot, recurse
                if (nextParticipant.isRobot) {
                    processRobotTurn(roomCode);
                }
            }, 3000);
        }
    };

    socket.on('join_room', async (data) => {
        const { roomCode, userName } = data;
        socket.join(roomCode);
        
        const room = await Room.findOne({ roomCode }).populate('participants', 'name');
        
        if (room) {
            if (!roomsState[roomCode]) {
                roomsState[roomCode] = {
                    currentTurnIndex: 0,
                    messageCount: 0,
                    topic: room.name,
                    conversationHistory: [], // Stores recent messages for context
                    participants: [
                        { id: 'bot-0', name: 'Logic Analyst', isRobot: true, persona: 'Logic Analyst' },
                        { id: 'bot-1', name: 'Creative Visionary', isRobot: true, persona: 'Creative Visionary' },
                        { id: 'bot-2', name: 'Critical Skeptic', isRobot: true, persona: 'Critical Skeptic' },
                        ...room.participants.map(p => ({ id: p._id.toString(), name: p.name, isRobot: false }))
                    ]
                };

                // Load conversation history from database
                const roomDoc = await Room.findOne({ roomCode }).lean();
                if (roomDoc && roomDoc.messages) {
                    roomsState[roomCode].conversationHistory = roomDoc.messages.map(msg => ({
                        senderName: msg.senderName,
                        content: msg.content,
                        isRobot: msg.isRobot || false,
                        timestamp: msg.timestamp
                    }));
                }
            }
            socket.emit('room_data', { 
                participants: room.participants.map(p => ({ id: p._id, name: p.name, isMe: false, isRobot: false })),
                currentTurn: roomsState[roomCode].participants[roomsState[roomCode].currentTurnIndex]
            });

            io.to(roomCode).emit('turn_update', {
                currentTurn: roomsState[roomCode].participants[roomsState[roomCode].currentTurnIndex]
            });

            // Start robot turn cycle if needed
            processRobotTurn(roomCode);
        }

        console.log(`User ${userName} joined room ${roomCode}`);
        socket.to(roomCode).emit('user_joined', { userName, userId: socket.id });

        // Broadcast to dashboard if room is public
        if (room && room.privacy === 'public') {
            io.to('dashboard').emit('room_update', {
                roomCode: room.roomCode,
                participantCount: room.participants.length
            });
        }
    });

    socket.on('join_dashboard', () => {
        socket.join('dashboard');
        console.log(`Socket ${socket.id} joined dashboard`);
    });

    socket.on('send_message', async (data) => {
        const { roomCode, senderName, content } = data;
        const timestamp = new Date();

        const messageData = { senderName, content, isRobot: false, timestamp };
        io.to(roomCode).emit('receive_message', messageData);

        if (roomsState[roomCode]) {
            const state = roomsState[roomCode];

            // Add to conversation history
            state.conversationHistory.push(messageData);
            // Keep only last 15 messages in memory
            if (state.conversationHistory.length > 15) {
                state.conversationHistory = state.conversationHistory.slice(-15);
            }

            state.messageCount = (state.messageCount || 0) + 1;

            if (state.messageCount >= 8) {
                state.messageCount = 0;
                setTimeout(async () => {
                    const summaryContent = await generateDiscussionSummary(state.conversationHistory);
                    io.to(roomCode).emit('receive_message', {
                        senderName: 'AI Moderator',
                        content: summaryContent,
                        isRobot: true,
                        isSummary: true,
                        timestamp: new Date()
                    });
                }, 1000);
            }

            state.currentTurnIndex = (state.currentTurnIndex + 1) % state.participants.length;
            const nextParticipant = state.participants[state.currentTurnIndex];
            io.to(roomCode).emit('turn_update', { currentTurn: nextParticipant });

            if (nextParticipant.isRobot) {
                processRobotTurn(roomCode);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });
});


server.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});