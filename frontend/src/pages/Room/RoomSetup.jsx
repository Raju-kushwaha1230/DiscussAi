import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Cpu, Users, Globe, Lock, Sparkles, Zap,
  CheckCircle2, Copy, Plus, Clock, Bot, FlaskConical
} from 'lucide-react';
import './RoomSetup.css';
import { useAuth } from '../../context/AuthContext';

const PREDEFINED_TOPICS = [
  { id: 'antigravity', name: 'Antigravity Lab', icon: '🚀', color: '#6366f1', desc: 'Explore propulsion, zero-g environments & future physics.', featured: true },
  { id: 'tech', name: 'AI & Ethics', icon: '🤖', color: '#8b5cf6', desc: 'Discuss the impact of AGI on society.' },
  { id: 'climate', name: 'Climate Change', icon: '🌍', color: '#06b6d4', desc: 'Strategies for global carbon reduction.' },
  { id: 'society', name: 'Remote Work', icon: '💼', color: '#a855f7', desc: 'Is the office model dead?' },
  { id: 'finance', name: 'Future of DeFi', icon: '⚡', color: '#eab308', desc: 'Decentralized finance vs traditional banking.' },
  { id: 'health', name: 'Future of Medicine', icon: '🧬', color: '#10b981', desc: 'CRISPR, longevity science, and AI diagnostics.' },
];

const BOT_PERSONAS = [
  {
    id: 'axiom', codename: 'AXIOM', name: 'Logic Analyst',
    color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)',
    icon: '⬡', desc: 'Data-driven, cites physics constraints, asks probing questions.',
    traits: ['Analytical', 'Evidence-based', 'Systematic'],
  },
  {
    id: 'nova', codename: 'NOVA', name: 'Creative Visionary',
    color: '#a855f7', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.25)',
    icon: '✦', desc: 'Wildly imaginative, proposes bold ideas, sparks speculation.',
    traits: ['Creative', 'Visionary', 'Speculative'],
  },
  {
    id: 'voss', codename: 'VOSS', name: 'Critical Skeptic',
    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)',
    icon: '◈', desc: 'Challenges assumptions, demands evidence, keeps ideas grounded.',
    traits: ['Skeptical', 'Pragmatic', 'Incisive'],
  },
];

const DURATIONS = [
  { value: 600, label: '10 min', tag: 'Quick' },
  { value: 900, label: '15 min', tag: 'Standard' },
  { value: 1200, label: '20 min', tag: 'Deep' },
  { value: 1800, label: '30 min', tag: 'Extended', pro: true },
];

const RoomSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [topic, setTopic] = useState('');
  const [selectedPersonas, setSelectedPersonas] = useState(['axiom', 'nova', 'voss']);
  const [botCount, setBotCount] = useState(3);
  const [privacy, setPrivacy] = useState('private');
  const [duration, setDuration] = useState(900);
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const togglePersona = (id) => {
    setSelectedPersonas(prev =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter(p => p !== id) : prev) : [...prev, id]
    );
    setBotCount(selectedPersonas.length);
  };

  const createRoom = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: topic,
          host: user?._id,
          type: 'discussion',
          privacy,
        })
      });
      const data = await res.json();
      if (data.roomCode) { setRoomCode(data.roomCode); }
      else { alert(data.message || 'Error creating room'); setStep(2); }
    } catch { alert('Error creating room. Check server status.'); setStep(2); }
    finally { setLoading(false); }
  };

  const goToStep3 = () => { setStep(3); createRoom(); };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = () => {
    navigate(`/room/${roomCode}`, { state: { topic, botCount: selectedPersonas.length, privacy, duration } });
  };

  return (
    <div className="setup-container">
      {/* ── Header ── */}
      <div className="setup-header">
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          <ChevronLeft size={18} /> Dashboard
        </button>

        <div className="step-trail">
          {[{ n: 1, label: 'Topic' }, { n: 2, label: 'AI Panel' }, { n: 3, label: 'Launch' }].map(s => (
            <React.Fragment key={s.n}>
              <div className={`step-pill ${step >= s.n ? 'active' : ''} ${step === s.n ? 'current' : ''}`}>
                <span className="step-num">{step > s.n ? <CheckCircle2 size={13} /> : s.n}</span>
                <span className="step-label">{s.label}</span>
              </div>
              {s.n < 3 && <div className={`step-connector ${step > s.n ? 'done' : ''}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Step Cards ── */}
      <div className="setup-card animate-slide-up">

        {/* ── Step 1: Topic ── */}
        {step === 1 && (
          <div className="setup-step">
            <h1 className="setup-title">Choose a <span className="text-gradient">Topic</span></h1>
            <p className="setup-subtitle">What will your AI panel debate today?</p>

            <div className="topics-grid">
              {PREDEFINED_TOPICS.map(t => (
                <div
                  key={t.id}
                  className={`topic-item hover-lift ${topic === t.name ? 'selected' : ''} ${t.featured ? 'featured' : ''}`}
                  style={{ '--topic-color': t.color }}
                  onClick={() => setTopic(t.name)}
                >
                  {t.featured && <span className="featured-tag">⭐ Featured</span>}
                  <div className="topic-icon-wrap" style={{ background: `${t.color}18`, color: t.color }}>
                    <span style={{ fontSize: '1.4rem' }}>{t.icon}</span>
                  </div>
                  <h3>{t.name}</h3>
                  <p>{t.desc}</p>
                  {topic === t.name && <CheckCircle2 className="topic-check" size={18} style={{ color: t.color }} />}
                </div>
              ))}

              <div
                className={`topic-item custom hover-lift ${topic && !PREDEFINED_TOPICS.some(t => t.name === topic) ? 'selected' : ''}`}
                onClick={() => setTopic(PREDEFINED_TOPICS.some(t => t.name === topic) ? '' : topic)}
              >
                <div className="topic-icon-wrap"><Plus size={20} /></div>
                <h3>Custom Topic</h3>
                <input
                  type="text"
                  placeholder="Type anything…"
                  value={PREDEFINED_TOPICS.some(t => t.name === topic) ? '' : topic}
                  onChange={e => setTopic(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  className="topic-custom-input"
                />
              </div>
            </div>

            <button className="btn-primary-large" disabled={!topic} onClick={() => setStep(2)}>
              Continue to AI Panel <Sparkles size={17} />
            </button>
          </div>
        )}

        {/* ── Step 2: AI Panel ── */}
        {step === 2 && (
          <div className="setup-step">
            <h1 className="setup-title">Configure <span className="text-gradient">AI Panel</span></h1>
            <p className="setup-subtitle">Select which AI experts will join your discussion.</p>

            <div className="personas-select-grid">
              {BOT_PERSONAS.map(bot => (
                <div
                  key={bot.id}
                  className={`persona-select-card ${selectedPersonas.includes(bot.id) ? 'selected' : ''}`}
                  style={{ '--bot-color': bot.color, '--bot-bg': bot.bg, '--bot-border': bot.border }}
                  onClick={() => togglePersona(bot.id)}
                >
                  <div className="psc-header">
                    <div className="psc-avatar" style={{ background: bot.bg, color: bot.color, border: `1.5px solid ${bot.border}` }}>
                      {bot.icon}
                    </div>
                    <div>
                      <div className="psc-codename" style={{ color: bot.color }}>{bot.codename}</div>
                      <div className="psc-role">{bot.name}</div>
                    </div>
                    {selectedPersonas.includes(bot.id) && (
                      <CheckCircle2 size={18} className="psc-check" style={{ color: bot.color }} />
                    )}
                  </div>
                  <p className="psc-desc">{bot.desc}</p>
                  <div className="psc-traits">
                    {bot.traits.map(t => (
                      <span key={t} className="trait-chip" style={{ color: bot.color, background: bot.bg, border: `1px solid ${bot.border}` }}>{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="config-form">
              {/* Duration */}
              <div className="form-item">
                <label><Clock size={15} /> Session Duration</label>
                <div className="duration-grid">
                  {DURATIONS.map(d => (
                    <button
                      key={d.value}
                      className={`duration-btn ${duration === d.value ? 'active' : ''} ${d.pro ? 'pro' : ''}`}
                      onClick={() => setDuration(d.value)}
                    >
                      <span className="duration-time">{d.label}</span>
                      <span className="duration-tag">{d.tag}</span>
                      {d.pro && <span className="pro-chip">Pro</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Privacy */}
              <div className="form-item">
                <label><Globe size={15} /> Room Visibility</label>
                <div className="privacy-toggle-inline">
                  <div className={`privacy-option ${privacy === 'private' ? 'active' : ''}`} onClick={() => setPrivacy('private')}>
                    <Lock size={15} /> <span>Private</span>
                  </div>
                  <div className={`privacy-option ${privacy === 'public' ? 'active' : ''}`} onClick={() => setPrivacy('public')}>
                    <Globe size={15} /> <span>Public</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="btn-group">
              <button className="btn-secondary-large" onClick={() => setStep(1)}>Back</button>
              <button className="btn-primary-large" onClick={goToStep3} disabled={loading}>
                {loading ? <><span className="spinner" /> Creating…</> : <>Next: Launch <Zap size={17} /></>}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Launch ── */}
        {step === 3 && (
          <div className="setup-step">
            <h1 className="setup-title">Ready to <span className="text-gradient">Launch</span></h1>
            <p className="setup-subtitle">Your discussion room is configured. Invite collaborators or go solo.</p>

            <div className="final-config">
              {/* Room Code */}
              <div className="invite-box">
                <div className="invite-label">Room Code</div>
                <div className="code-row">
                  <span className="code-display">{roomCode || '••••••'}</span>
                  <button className="copy-btn" onClick={handleCopyCode} disabled={!roomCode}>
                    {copied ? <CheckCircle2 size={18} style={{ color: '#10b981' }} /> : <Copy size={18} />}
                  </button>
                </div>
                <p className="invite-hint">Share this code with friends to join your room.</p>
              </div>

              {/* Summary */}
              <div className="launch-summary">
                <div className="summary-row"><Sparkles size={15} /><span>{topic}</span></div>
                <div className="summary-row">
                  <Bot size={15} />
                  <span>{selectedPersonas.length} Robots</span>
                  <div className="persona-chips">
                    {selectedPersonas.map(id => {
                      const bot = BOT_PERSONAS.find(b => b.id === id);
                      return <span key={id} className="persona-chip" style={{ color: bot.color, background: bot.bg, border: `1px solid ${bot.border}` }}>{bot.codename}</span>;
                    })}
                  </div>
                </div>
                <div className="summary-row"><Clock size={15} /><span>{Math.floor(duration / 60)} minutes</span></div>
                <div className="summary-row">
                  {privacy === 'public' ? <Globe size={15} /> : <Lock size={15} />}
                  <span>{privacy.charAt(0).toUpperCase() + privacy.slice(1)} Room</span>
                </div>
              </div>
            </div>

            <div className="btn-group">
              <button className="btn-secondary-large" onClick={() => setStep(2)}>Back</button>
              <button className="btn-premium-large" onClick={handleStart} disabled={!roomCode}>
                <FlaskConical size={18} /> Launch Room <Zap size={18} style={{ fill: 'currentColor' }} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomSetup;
