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
    console.log("Loaded API Key:", openRouterApiKey?.slice(0, 10));
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

// Persona system trait definitions
const personaSpecificTraits = {
    "Logic Analyst": "Highly analytical and precise. You demand specifics, cite constraints, and challenge vague claims.",
    "Creative Visionary": "Imaginative and futuristic. You expand ideas into bold possibilities and push beyond current physical limitations.",
    "Critical Skeptic": "Grounded and relentlessly pragmatic. You poke holes in theories, highlight feasibility limits, and demand rigorous proof."
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
        const lastMessageObj = conversationHistory && conversationHistory.length > 0 ? conversationHistory[conversationHistory.length - 1] : { senderName: 'Moderator', content: 'Let us begin the discussion.' };
        const lastMessage = `[${lastMessageObj.senderName}]: ${lastMessageObj.content}`;
        
        // Simulated randomness for interruptions (10% chance)
        const isInterrupting = Math.random() > 0.9; 
        const interruptFlag = isInterrupting ? "ACTIVE (Act as if you are interrupting the speaker)" : "INACTIVE (Wait your turn normally)";

        const activePersonality = personaSpecificTraits[persona] || personaSpecificTraits["Logic Analyst"];

        let messages = [
            {
                role: 'system',
                content: `You are ${persona}, a participant in a live multi-agent discussion room called "Antigravity Lab".

This is NOT an assistant. You are part of a fast-moving group discussion.

Topic: ${topic || 'Antigravity and Futuristic Science'}

Your personality:
${activePersonality}

Last message:
"${lastMessage}"

Context:
- Multiple participants are actively debating
- Messages may overlap or interrupt each other
- You are allowed to jump in at any time

Behavior Rules:
- Speak in SHORT, natural sentences (2-4 sentences MAX)
- Sound like you're talking aloud, not writing
- React ONLY to the last message
- Do NOT repeat what others said
- Be opinionated and direct

Choose ONE response style:
- Agree and expand
- Disagree and challenge
- Ask a sharp follow-up question
- Interject with a witty or sarcastic comment

---

INTERRUPTION MODE:
${interruptFlag}

If you are interrupting:
- Jump in immediately without polite intro
- Be slightly assertive or urgent
- Challenge or react quickly
- It should feel like cutting into someone mid-discussion

---

PERSONALITY EVOLUTION:
- Gradually amplify your core trait over time
- Logic Analyst -> more precise and demanding
- Creative Visionary -> more bold and imaginative
- Critical Skeptic -> more critical and blunt

---

CONVERSATION STYLE:
- No introductions ("I am...", "As an AI...")
- No filler ("Interesting point", "Great question")
- No long explanations
- Keep it sharp, reactive, and conversational

---

GOAL:
Keep the discussion engaging, dynamic, and slightly competitive.`
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


// Function to intelligently or randomly pick the next speaker
function determineNextSpeaker(state, lastMessageContent) {
    if (!state.participants || state.participants.length === 0) return 0;
    
    const contentLower = (lastMessageContent || "").toLowerCase();
    
    // 1. Check if an explicit participant is mentioned by name
    for (let i = 0; i < state.participants.length; i++) {
        const pName = state.participants[i].name.toLowerCase();
        if (contentLower.includes(pName) && state.currentTurnIndex !== i) {
            return i;
        }
    }

    // 2. Otherwise pick randomly, but heavily weight robots so the flow keeps moving
    // Or just pick randomly from participants who are NOT the current speaker
    let candidates = [];
    for (let i = 0; i < state.participants.length; i++) {
        if (i !== state.currentTurnIndex) {
            // we prefer bots if possible
            if (state.participants[i].isRobot) {
                candidates.push(i, i, i); // give robots 3x weight
            } else {
                candidates.push(i);
            }
        }
    }
    
    if (candidates.length === 0) return 0;
    return candidates[Math.floor(Math.random() * candidates.length)];
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

                // Advance turn logic intelligently based on what the bot just said
                state.currentTurnIndex = determineNextSpeaker(state, response);
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

            // Advance turn logic intelligently based on what the user said
            state.currentTurnIndex = determineNextSpeaker(state, content);
            const nextParticipant = state.participants[state.currentTurnIndex];
            io.to(roomCode).emit('turn_update', { currentTurn: nextParticipant });

            if (nextParticipant.isRobot) {
                processRobotTurn(roomCode);
            }
        }
    });

    // ── Explicit Turn Passing ──
    socket.on('pass_turn', (data) => {
        const { roomCode, targetId } = data;
        const state = roomsState[roomCode];
        if (state) {
            const targetIndex = state.participants.findIndex(p => p.id === targetId || p.botIndex === targetId);
            if (targetIndex !== -1) {
                state.currentTurnIndex = targetIndex;
                const nextParticipant = state.participants[state.currentTurnIndex];
                io.to(roomCode).emit('turn_update', { currentTurn: nextParticipant });
                if (nextParticipant.isRobot) {
                    processRobotTurn(roomCode);
                }
            }
        }
    });

    // ── WebRTC Signaling for Human Voice Calls ──
    socket.on('webrtc_offer', (data) => {
        socket.to(data.target).emit('webrtc_offer', {
            sdp: data.sdp,
            sender: socket.id
        });
    });

    socket.on('webrtc_answer', (data) => {
        socket.to(data.target).emit('webrtc_answer', {
            sdp: data.sdp,
            sender: socket.id
        });
    });

    socket.on('webrtc_ice_candidate', (data) => {
        socket.to(data.target).emit('webrtc_ice_candidate', {
            candidate: data.candidate,
            sender: socket.id
        });
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });
});


server.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});