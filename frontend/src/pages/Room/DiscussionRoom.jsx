import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Send, Mic, MicOff, Users, Clock, PhoneOff, Bot,
  ChevronLeft, Settings, Sparkles, ArrowRightCircle, X,
  Star, BarChart2, MessageSquare, Zap, CheckCircle2, Volume2
} from 'lucide-react';
import io from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import './DiscussionRoom.css';

const socket = io(import.meta.env.VITE_BACKEND_URL);

// ── Bot Identity Map ──
// Keys must match what the server sends in senderName / persona field
const BOT_META = {
  'AXIOM':             { codename: 'AXIOM', role: 'Logic Analyst',      color: '#3b82f6', glow: 'rgba(59,130,246,0.4)',  icon: '⬡', gradient: 'linear-gradient(135deg,#1e40af,#1e3a8a)' },
  'NOVA':              { codename: 'NOVA',  role: 'Creative Visionary',  color: '#a855f7', glow: 'rgba(168,85,247,0.4)', icon: '✦', gradient: 'linear-gradient(135deg,#7c3aed,#4c1d95)' },
  'VOSS':              { codename: 'VOSS',  role: 'Critical Skeptic',    color: '#f59e0b', glow: 'rgba(245,158,11,0.4)', icon: '◈', gradient: 'linear-gradient(135deg,#d97706,#92400e)' },
  'Logic Analyst':     { codename: 'AXIOM', role: 'Logic Analyst',      color: '#3b82f6', glow: 'rgba(59,130,246,0.4)',  icon: '⬡', gradient: 'linear-gradient(135deg,#1e40af,#1e3a8a)' },
  'Creative Visionary':{ codename: 'NOVA',  role: 'Creative Visionary',  color: '#a855f7', glow: 'rgba(168,85,247,0.4)', icon: '✦', gradient: 'linear-gradient(135deg,#7c3aed,#4c1d95)' },
  'Critical Skeptic':  { codename: 'VOSS',  role: 'Critical Skeptic',    color: '#f59e0b', glow: 'rgba(245,158,11,0.4)', icon: '◈', gradient: 'linear-gradient(135deg,#d97706,#92400e)' },
};

const DEFAULT_BOT_METAS = [
  { codename: 'AXIOM', role: 'Logic Analyst',      color: '#3b82f6', glow: 'rgba(59,130,246,0.4)',  icon: '⬡', gradient: 'linear-gradient(135deg,#1e40af,#1e3a8a)' },
  { codename: 'NOVA',  role: 'Creative Visionary',  color: '#a855f7', glow: 'rgba(168,85,247,0.4)', icon: '✦', gradient: 'linear-gradient(135deg,#7c3aed,#4c1d95)' },
  { codename: 'VOSS',  role: 'Critical Skeptic',    color: '#f59e0b', glow: 'rgba(245,158,11,0.4)', icon: '◈', gradient: 'linear-gradient(135deg,#d97706,#92400e)' },
];

const getBotMeta = (name, botIndex = 0) => {
  if (!name) return DEFAULT_BOT_METAS[botIndex % 3];
  // Direct exact match first
  if (BOT_META[name]) return BOT_META[name];
  // Partial match 
  for (const [key, val] of Object.entries(BOT_META)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return val;
  }
  // Fallback by index
  return DEFAULT_BOT_METAS[botIndex % 3];
};

const DiscussionRoom = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { topic, botCount } = location.state || { topic: 'General Discussion', botCount: 3 };

  // ── State ──
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([
    { id: 1, senderName: 'System', content: `Discussion started: "${topic}"`, type: 'system' },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900);
  const [isListening, setIsListening] = useState(false);
  const [voiceReady, setVoiceReady] = useState(false);
  const [isVisualMode, setIsVisualMode] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [sessionEndModal, setSessionEndModal] = useState(false);
  const [liveSubtitle, setLiveSubtitle] = useState('');
  const [copied, setCopied] = useState(false);

  // ── Refs ──
  const chatEndRef = useRef(null);
  const canvasVisualRef = useRef(null);   // waveform canvas in Visual Mode
  const canvasChatRef = useRef(null);      // waveform canvas in Chat Mode
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const micStreamRef = useRef(null);
  const recognitionRef = useRef(null);
  const inputTextRef = useRef('');
  const isListeningRef = useRef(false);
  const isVisualModeRef = useRef(false);
  const userRef = useRef(user);
  const currentTurnRef = useRef(null);

  // WebRTC Refs
  const peersRef = useRef({});
  const localStreamRef = useRef(null);

  useEffect(() => { isVisualModeRef.current = isVisualMode; }, [isVisualMode]);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { currentTurnRef.current = currentTurn; }, [currentTurn]);

  // Stop TTS when leaving visual mode
  useEffect(() => {
    if (!isVisualMode && window.speechSynthesis) window.speechSynthesis.cancel();
  }, [isVisualMode]);

  // ── TTS ──
  const speakMessage = useCallback((text, name, botIndex = 0) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const meta = getBotMeta(name, botIndex);

    let voice = null;
    if (meta.codename === 'AXIOM') voice = voices.find(v => v.name.includes('Male') || v.name.includes('UK')) || voices[0];
    else if (meta.codename === 'NOVA') voice = voices.find(v => v.name.includes('Female')) || voices[1];
    else if (meta.codename === 'VOSS') voice = voices.find(v => v.name.includes('AU') || v.name.includes('UK')) || voices[2];
    else voice = voices[0];

    if (voice) utterance.voice = voice;
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onstart = () => { setActiveSpeaker(name); setLiveSubtitle(''); };
    utterance.onend = () => { setActiveSpeaker(null); setLiveSubtitle(''); };
    utterance.onboundary = (e) => {
      if (e.name === 'word') setLiveSubtitle(text.slice(0, e.charIndex + e.charLength));
    };
    window.speechSynthesis.speak(utterance);
  }, []);

  // ── Waveform ──
  // Draw function defined BEFORE startWaveform to avoid hoisting issue
  function drawWaveformOnCanvas(canvasEl) {
    const analyser = analyserRef.current;
    if (!canvasEl || !analyser) return;
    const ctx = canvasEl.getContext('2d');
    const data = new Uint8Array(analyser.frequencyBinCount);
    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      analyser.getByteTimeDomainData(data);
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      // Background
      ctx.fillStyle = 'rgba(99,102,241,0.04)';
      ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
      // Waveform
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(99,102,241,0.9)';
      ctx.shadowColor = '#818cf8';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      const sliceW = canvasEl.width / data.length;
      let x = 0;
      for (let i = 0; i < data.length; i++) {
        const y = (data[i] / 255.0) * canvasEl.height;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        x += sliceW;
      }
      ctx.stroke();
    };
    render();
  }

  const startWaveform = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 128;
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      // Draw on whichever canvas is currently mounted
      const activeCanvas = isVisualModeRef.current ? canvasVisualRef.current : canvasChatRef.current;
      if (activeCanvas) drawWaveformOnCanvas(activeCanvas);
    } catch (err) { console.warn('Waveform unavailable:', err); }
  }, []);

  // Re-attach waveform canvas when switching modes while mic is active
  useEffect(() => {
    if (isListening && analyserRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      const activeCanvas = isVisualMode ? canvasVisualRef.current : canvasChatRef.current;
      if (activeCanvas) drawWaveformOnCanvas(activeCanvas);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisualMode]);

  const stopWaveform = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
    // Clear both canvases
    [canvasVisualRef.current, canvasChatRef.current].forEach(c => {
      if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height);
    });
  }, []);

  // ── Speech Recognition ──
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    recognitionRef.current = new SR();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInputText(transcript);
      inputTextRef.current = transcript;
      if (!event.results[event.results.length - 1].isFinal) {
        setActiveSpeaker(userRef.current?.name);
      }
    };

    recognitionRef.current.onerror = (e) => {
      if (e.error === 'no-speech') return; // ignore
      console.warn('STT error:', e.error);
      setIsListening(false); isListeningRef.current = false;
      setActiveSpeaker(null); stopWaveform();
    };

    recognitionRef.current.onend = () => {
      setIsListening(false); isListeningRef.current = false;
      setActiveSpeaker(null); stopWaveform();
      if (inputTextRef.current.trim() && currentTurnRef.current?.name === userRef.current?.name) {
        setVoiceReady(true);
      }
    };
  }, [stopWaveform]);

  // Auto-listen when it's the user's turn
  useEffect(() => {
    if (!currentTurn || !user) return;
    if (currentTurn.name === user.name && !isListeningRef.current && recognitionRef.current) {
      setVoiceReady(false); setInputText(''); inputTextRef.current = '';
      const timer = setTimeout(() => {
        try {
          recognitionRef.current.start();
          setIsListening(true); isListeningRef.current = true;
          setActiveSpeaker(user.name);
          startWaveform();
        } catch (err) { console.warn('Auto-listen:', err.message); }
      }, 700);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTurn?.name, startWaveform]);

  // ── WebRTC Setup ──
  const createPeer = useCallback((peerId) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    peersRef.current[peerId] = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc_ice_candidate', { target: peerId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      if (!document.getElementById(`audio-${peerId}`)) {
        const audio = document.createElement('audio');
        audio.id = `audio-${peerId}`;
        audio.srcObject = event.streams[0];
        audio.autoplay = true;
        document.body.appendChild(audio);
      }
    };

    return pc;
  }, []);

  useEffect(() => {
    // Setup continuous active mic stream once for WebRTC calling
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      localStreamRef.current = stream;
    }).catch(err => console.warn('Mic access denied for group call:', err));

    return () => {
      Object.values(peersRef.current).forEach(pc => pc.close());
      peersRef.current = {};
      [...document.querySelectorAll('audio[id^="audio-"]')].forEach(el => el.remove());
    };
  }, []);


  const toggleListening = () => {
    if (!recognitionRef.current) { alert('Speech Recognition not supported in this browser.'); return; }
    if (isListeningRef.current) {
      recognitionRef.current.stop(); stopWaveform();
    } else {
      setVoiceReady(false); setInputText(''); inputTextRef.current = '';
      try {
        recognitionRef.current.start();
        setIsListening(true); isListeningRef.current = true;
        startWaveform();
      } catch (err) { console.warn('Toggle listen:', err.message); }
    }
  };

  const handleDoneSpeaking = () => {
    if (isListeningRef.current && recognitionRef.current) recognitionRef.current.stop();
    else stopWaveform();
  };

  const handleVoiceSend = (text) => {
    if (!text?.trim()) return;
    socket.emit('send_message', { roomCode: roomId, senderName: userRef.current?.name || 'You', content: text });
    setInputText(''); inputTextRef.current = '';
  };

  const handlePassTurn = (targetId = null) => {
    if (targetId) {
      // Explicit target pass
      socket.emit('pass_turn', { roomCode: roomId, targetId: targetId });
      setVoiceReady(false);
      return;
    }
    const text = inputTextRef.current.trim();
    if (!text) return;
    handleVoiceSend(text);
    setVoiceReady(false);
  };

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    if (isListeningRef.current) try { recognitionRef.current.stop(); } catch (err) {}
    socket.emit('send_message', { roomCode: roomId, senderName: user?.name || 'You', content: inputText });
    setInputText(''); inputTextRef.current = '';
  };

  // ── Socket Setup ──
  useEffect(() => {
    if (!user) return;

    let localCleanup = false;

    // 1. Get mic access first so WebRTC streams are ready BEFORE we emit join_room
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      if (localCleanup) return;
      localStreamRef.current = stream;
      
      // Initial participants
      const count = botCount || 3;
      setParticipants([
        { id: user?._id || 'me', name: user?.name || 'You', isMe: true, isRobot: false, botIndex: -1 },
        ...DEFAULT_BOT_METAS.slice(0, count).map((meta, i) => ({
          id: `ai-${i}`, name: meta.codename, isMe: false, isRobot: true, botIndex: i
        }))
      ]);

      // 2. Join room only after mic is active
      socket.emit('join_room', { roomCode: roomId, userName: user?.name || 'You' });
    }).catch(err => {
      console.warn('Mic access denied for group call:', err);
      // Still join the room even if mic is denied
      socket.emit('join_room', { roomCode: roomId, userName: user?.name || 'You' });
    });

    socket.on('receive_message', (data) => {
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        senderName: data.senderName,
        content: data.content,
        type: data.isRobot ? 'ai' : 'user',
        isSummary: data.isSummary || false,
        timestamp: data.timestamp,
        persona: data.persona,
        botIndex: data.botIndex || 0,
      }]);
      if (data.isRobot) setIsTyping(false);
      if (data.senderName !== userRef.current?.name) {
        speakMessage(data.content, data.senderName, data.botIndex || 0);
        if (!isVisualModeRef.current) {
          setActiveSpeaker(data.senderName);
          setTimeout(() => setActiveSpeaker(null), Math.max(3000, data.content.length * 50));
        }
      }
    });

    socket.on('bot_typing', () => setIsTyping(true));
    socket.on('turn_update', (data) => setCurrentTurn(data.currentTurn));

    socket.on('room_data', (data) => {
      if (data.currentTurn) setCurrentTurn(data.currentTurn);
    });

    socket.on('user_joined', async (data) => {
      if (data.userName === user?.name) return;
      setParticipants(prev => {
        if (prev.find(p => p.name === data.userName)) return prev;
        return [...prev, { id: data.userId, name: data.userName, isMe: false, isRobot: false, botIndex: -1 }];
      });
      setMessages(prev => [
        ...prev,
        { id: Date.now() + Math.random(), senderName: 'System', content: `${data.userName} joined the discussion.`, type: 'system' }
      ]);

      // WebRTC: Caller creates offer for new user
      if (localStreamRef.current) {
        const pc = createPeer(data.userId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc_offer', { target: data.userId, sdp: offer });
      }
    });

    socket.on('webrtc_offer', async (data) => {
      if (localStreamRef.current) {
        const pc = createPeer(data.sender);
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc_answer', { target: data.sender, sdp: answer });
      }
    });

    socket.on('webrtc_answer', async (data) => {
      const pc = peersRef.current[data.sender];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
    });

    socket.on('webrtc_ice_candidate', async (data) => {
      const pc = peersRef.current[data.sender];
      if (pc) await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    });

    return () => {
      localCleanup = true;
      socket.off('receive_message');
      socket.off('room_data');
      socket.off('user_joined');
      socket.off('turn_update');
      socket.off('bot_typing');
      socket.off('webrtc_offer');
      socket.off('webrtc_answer');
      socket.off('webrtc_ice_candidate');
    };
  }, [roomId, user, botCount, speakMessage, createPeer]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const formatMsgTime = (d) => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  const sessionStats = {
    turns: messages.filter(m => m.senderName === user?.name).length,
    total: messages.filter(m => m.type !== 'system').length,
    duration: Math.floor((900 - timeLeft) / 60),
    score: Math.min(95, 60 + messages.filter(m => m.senderName === user?.name).length * 5),
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Render ──
  return (
    <div className="room-container">

      {/* ── Session Summary Modal ── */}
      {sessionEndModal && (
        <div className="modal-overlay" onClick={() => setSessionEndModal(false)}>
          <div className="session-summary-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSessionEndModal(false)}><X size={20} /></button>
            <div className="ssm-header">
              <div className="ssm-icon"><Sparkles size={26} /></div>
              <h2>Session Complete</h2>
              <p>Here's how your discussion went on <strong>{topic}</strong></p>
            </div>
            <div className="ssm-stats">
              {[
                { val: `${sessionStats.score}%`, label: 'Engagement' },
                { val: sessionStats.turns, label: 'Your Turns' },
                { val: `${sessionStats.duration}m`, label: 'Duration' },
                { val: sessionStats.total, label: 'Messages' },
              ].map(s => (
                <div key={s.label} className="ssm-stat">
                  <div className="ssm-stat-val">{s.val}</div>
                  <div className="ssm-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="ssm-badges">
              {sessionStats.turns >= 1  && <div className="ssm-badge"><CheckCircle2 size={13}/> Active Participant</div>}
              {sessionStats.score >= 75 && <div className="ssm-badge gold"><Star size={13}/> Top Contributor</div>}
              {sessionStats.duration >= 4 && <div className="ssm-badge blue"><Zap size={13}/> Marathon Debater</div>}
            </div>
            <div className="ssm-actions">
              <button className="ssm-btn-secondary" onClick={() => { setSessionEndModal(false); navigate('/dashboard'); }}>
                Back to Dashboard
              </button>
              <button className="ssm-btn-primary" onClick={() => { setSessionEndModal(false); navigate('/room/setup'); }}>
                New Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Nav ── */}
      <nav className="room-nav">
        <div className="nav-left">
          <button onClick={() => navigate('/dashboard')} className="btn-icon-bg"><ChevronLeft size={20}/></button>
          <div className="room-info">
            <h1>{topic}</h1>
            <div className="room-meta-row">
              <button className="room-code-chip" onClick={copyRoomCode} title="Copy room code">
                {copied ? <CheckCircle2 size={12} style={{color:'#10b981'}}/> : null}
                {copied ? 'Copied!' : roomId}
              </button>
              <span className="dot-sep"/>
              <span className="timer-chip"><Clock size={12}/>{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>
        <div className="nav-right">
          <button
            className={`nav-btn ${isVisualMode ? 'nav-btn-active' : ''}`}
            onClick={() => setIsVisualMode(v => !v)}
          >
            <Sparkles size={15}/> {isVisualMode ? 'Chat' : 'Visual'}
          </button>
          <button className="nav-btn" onClick={copyRoomCode}>
            <Users size={15}/> Invite
          </button>
          <button className="nav-btn nav-btn-danger" onClick={() => setSessionEndModal(true)}>
            <PhoneOff size={15}/> End
          </button>
          <button className="btn-icon-bg"><Settings size={17}/></button>
        </div>
      </nav>

      {/* ── Body ── */}
      <div className="room-layout">

        {/* ════ VISUAL MODE ════ */}
        {isVisualMode && (
          <div className="visual-area">
            {/* Ambient BG meshes */}
            <div className="va-mesh va-mesh-1"/>
            <div className="va-mesh va-mesh-2"/>
            <div className="va-mesh va-mesh-3"/>

            {/* Avatar grid */}
            <div className="va-avatars-grid">
              {participants.map((p, i) => {
                const meta = p.isRobot ? getBotMeta(p.name, p.botIndex) : null;
                const isSpeaking = activeSpeaker === p.name || (p.isMe && isListening);
                const isOnTurn = currentTurn?.name === p.name || (p.isMe && currentTurn?.name === user?.name);
                return (
                  <div
                    key={p.id}
                    className={`va-avatar-card ${isSpeaking ? 'va-speaking' : ''} ${isOnTurn ? 'va-on-turn' : ''}`}
                    style={p.isRobot ? {
                      '--card-color': meta.color,
                      '--card-glow': meta.glow,
                    } : {
                      '--card-color': '#10b981',
                      '--card-glow': 'rgba(16,185,129,0.4)',
                    }}
                  >
                    {/* Glow ring */}
                    <div className="va-glow-ring"/>

                    {/* Avatar face */}
                    {p.isRobot ? (
                      <div className="va-face va-face-bot" style={{ background: meta.gradient }}>
                        <span className="va-bot-icon">{meta.icon}</span>
                      </div>
                    ) : (
                      <div className="va-face va-face-user">
                        {(p.name || 'Y').charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Voice bars */}
                    {isSpeaking && (
                      <div className="va-voice-bars">
                        <span/><span/><span/><span/><span/>
                      </div>
                    )}

                    {/* Name plate */}
                    <div className="va-nameplate">
                      {p.isRobot ? (
                        <>
                          <span className="va-codename" style={{ color: meta.color }}>{meta.codename}</span>
                          <span className="va-role">{meta.role}</span>
                        </>
                      ) : (
                        <>
                          <span className="va-codename" style={{ color:'#10b981' }}>{p.isMe ? 'YOU' : p.name.toUpperCase()}</span>
                          <span className="va-role">Human</span>
                        </>
                      )}
                    </div>

                    {/* Turn badge */}
                    {isOnTurn && <div className="va-turn-badge">🎙 Speaking</div>}
                  </div>
                );
              })}
            </div>

            {/* Topic plaque */}
            <div className="va-topic-badge"><Sparkles size={14}/> {topic}</div>

            {/* Turn banner */}
            {currentTurn && (
              <div className="va-turn-banner">
                {currentTurn.name === user?.name
                  ? '🎙️ YOUR TURN — Speak now'
                  : `${getBotMeta(currentTurn.name, 0).codename} is speaking…`}
              </div>
            )}

            {/* Waveform overlay when mic is active */}
            {isListening && (
              <div className="va-waveform-bar">
                <Mic size={16} style={{ color:'#ef4444', flexShrink: 0 }} />
                <canvas ref={canvasVisualRef} className="va-waveform-canvas" width={280} height={44}/>
                <button className="va-done-btn" onClick={handleDoneSpeaking}>
                  <MicOff size={15}/> Done
                </button>
                {voiceReady && (
                  <button className="va-pass-btn" onClick={handlePassTurn}>
                    <ArrowRightCircle size={15}/> Pass Turn
                  </button>
                )}
              </div>
            )}

            {/* Subtitle bar */}
            {liveSubtitle && (
              <div className="va-subtitle-bar">
                <Volume2 size={14} style={{ color:'#818cf8', flexShrink:0 }}/>
                <span className="va-subtitle-speaker">{activeSpeaker}</span>
                <span className="va-subtitle-text">{liveSubtitle}</span>
              </div>
            )}
          </div>
        )}

        {/* ════ CHAT MODE ════ */}
        {!isVisualMode && (
          <section className="chat-area">
            <div className="messages-list">
              {messages.map(m => {
                const meta = m.type === 'ai' ? getBotMeta(m.senderName, m.botIndex || 0) : null;
                const isOwn = m.senderName === user?.name;
                if (m.type === 'system') {
                  return (
                    <div key={m.id} className="msg-system">
                      <span>{m.content}</span>
                    </div>
                  );
                }
                if (m.isSummary) {
                  return (
                    <div key={m.id} className="msg-summary-card">
                      <div className="msg-summary-header"><BarChart2 size={14}/> AI MODERATOR SUMMARY</div>
                      <div className="msg-summary-body">{m.content}</div>
                    </div>
                  );
                }
                return (
                  <div key={m.id} className={`msg-row ${isOwn ? 'msg-own' : ''} ${m.type === 'ai' ? 'msg-bot' : ''}`}>
                    {/* Avatar */}
                    {!isOwn && (
                      <div
                        className="msg-avatar"
                        style={m.type === 'ai' ? { background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}30` } : {}}
                      >
                        {m.type === 'ai' ? meta.icon : m.senderName.charAt(0)}
                      </div>
                    )}
                    <div className="msg-body">
                      {/* Header */}
                      <div className={`msg-header ${isOwn ? 'msg-header-own' : ''}`}>
                        {m.type === 'ai' && (
                          <span className="msg-codename" style={{ color: meta.color }}>{meta.codename}</span>
                        )}
                        <span className="msg-sender">{isOwn ? 'You' : m.senderName}</span>
                        <span className="msg-time">{formatMsgTime(m.timestamp)}</span>
                      </div>
                      {/* Bubble */}
                      <div
                        className="msg-bubble"
                        style={m.type === 'ai' ? {
                          borderColor: `${meta.color}25`,
                          boxShadow: `0 0 16px ${meta.glow}50`,
                        } : {}}
                      >
                        {m.content}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div className="msg-row msg-bot">
                  <div className="msg-avatar" style={{ background: '#3b82f618', color: '#3b82f6', border: '1px solid #3b82f630' }}>⬡</div>
                  <div className="msg-body">
                    <div className="typing-dots"><span/><span/><span/></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef}/>
            </div>

            {/* Always visible Universal Input Area */}
            <form className="chat-input-area" onSubmit={handleSend} style={{ borderTop: '1px solid var(--border)', padding: '1rem', background: 'var(--bg-surface)' }}>
              <button 
                type="button" 
                onClick={toggleListening} 
                className={`btn-icon-bg ${isListening ? 'recording-pulse' : ''}`} 
                style={{ marginRight: '0.5rem', color: isListening ? '#ef4444' : '#64748b' }}
              >
                {isListening ? <Mic size={18} /> : <MicOff size={18} />}
              </button>
              <input type="text" className="chat-input" placeholder="Jump into the discussion anytime..." value={inputText}
                onChange={e => { setInputText(e.target.value); inputTextRef.current = e.target.value; }}/>
              <button type="submit" className="chat-send-btn" disabled={!inputText.trim()}><Send size={18}/></button>
            </form>
          </section>
        )}

        {/* ── Sidebar ── */}
        <aside className="room-sidebar">
          <div className="sidebar-section">
            <div className="sb-header">
              <h3>Participants</h3>
              <span className="sb-count">{participants.length}</span>
            </div>
            <div className="participant-list">
              {participants.map((p, i) => {
                const meta = p.isRobot ? getBotMeta(p.name, p.botIndex >= 0 ? p.botIndex : i) : null;
                const isSpeaking = activeSpeaker === p.name || (p.isMe && isListening);
                const isOnTurn = currentTurn
                  ? (p.isMe ? currentTurn.name === user?.name : currentTurn.name === p.name)
                  : false;
                return (
                  <div
                    key={p.id}
                    className={`p-item ${isSpeaking ? 'p-speaking' : ''} ${isOnTurn ? 'p-on-turn' : ''}`}
                    style={p.isRobot ? { '--p-color': meta.color, '--p-glow': meta.glow } : { '--p-color': '#10b981', '--p-glow': 'rgba(16,185,129,0.3)' }}
                  >
                    {p.isRobot ? (
                      <div className="p-avatar p-avatar-bot" style={{ background: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}35` }}>
                        {meta.icon}
                      </div>
                    ) : (
                      <div className="p-avatar p-avatar-user">{(p.name || 'Y').charAt(0).toUpperCase()}</div>
                    )}
                    <div className="p-info">
                      <span className="p-name">{p.isRobot ? meta.codename : (p.isMe ? `${p.name} (You)` : p.name)}</span>
                      <span className="p-status" style={{ color: isSpeaking ? '#10b981' : (p.isRobot ? meta.color : '#64748b') }}>
                        {isSpeaking ? '● Speaking' : p.isRobot ? meta.role : 'Online'}
                      </span>
                    </div>
                    
                    {/* Pass Turn Action */}
                    {!p.isMe && (
                      <button 
                        className="p-pass-btn" 
                        title={`Hand the floor to ${p.isRobot ? meta.codename : p.name}`}
                        onClick={() => handlePassTurn(p.id)}
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '0.2rem 0.4rem', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem', marginLeft: 'auto' }}
                      >
                        <Mic size={12}/> Pass
                      </button>
                    )}
                    
                    {isOnTurn && !p.isMe && <div className="p-turn-dot"/>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sb-header">
              <h3>Session Score</h3>
              <Sparkles size={14} style={{ color: 'var(--nova)' }}/>
            </div>
            <div className="score-card">
              <div className="score-big">{sessionStats.score}<span>%</span></div>
              <div className="score-bar-track">
                <div className="score-bar-fill" style={{ width: `${sessionStats.score}%` }}/>
              </div>
              <div className="score-stats">
                <div className="score-stat-item"><MessageSquare size={11}/>{sessionStats.turns} turns</div>
                <div className="score-stat-item"><Clock size={11}/>{sessionStats.duration}m</div>
              </div>
            </div>
          </div>

          <div className="sb-footer">
            <button className="sb-end-btn" onClick={() => setSessionEndModal(true)}>
              <PhoneOff size={15}/> End & Review
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DiscussionRoom;
