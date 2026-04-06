import { Link, useNavigate } from 'react-router-dom';
import { 
  Bot, Search, Plus, Users, History, Settings, LogOut,
  MessageSquare, Cpu, Sparkles, ChevronRight, User,
  Globe, Zap, TrendingUp, Clock, Star, X, Copy,
  CheckCircle2, Mic, BarChart2, ArrowUpRight, Bell
} from 'lucide-react';
import './Dashboard.css';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_BACKEND_URL);

const Dashboard = () => {
  const { logout, user, aiPreferences, updateAiPreferences } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [rooms, setRooms] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const joinInputRef = useRef(null);

  const stats = [
    { label: 'Sessions', value: history.length || 0, icon: <MessageSquare size={16}/>, color: 'var(--primary)' },
    { label: 'AI Replies', value: (history.length * 12) || 0, icon: <Bot size={16}/>, color: 'var(--nova)' },
    { label: 'Avg Score', value: '88%', icon: <TrendingUp size={16}/>, color: 'var(--success)' },
    { label: 'Minutes', value: (history.length * 15) || 0, icon: <Clock size={16}/>, color: 'var(--voss)' },
  ];

  useEffect(() => {
    const fetchPublicRooms = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/rooms/public`);
        const data = await res.json();
        setRooms(data);
      } catch (err) { console.error("Error fetching rooms:", err); }
      finally { setLoading(false); }
    };

    const fetchHistory = async () => {
      if (!user?._id) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/rooms/history/${user._id}`);
        const data = await res.json();
        setHistory(data);
      } catch (err) { console.error("Error fetching history:", err); }
    };

    fetchPublicRooms();
    fetchHistory();

    socket.on('connect', () => socket.emit('join_dashboard'));
    if (socket.connected) socket.emit('join_dashboard');
    socket.on('new_room', (newRoom) => setRooms(prev => [newRoom, ...prev]));
    socket.on('room_update', (data) => {
      setRooms(prev => prev.map(room =>
        room.roomCode === data.roomCode ? { ...room, participantCount: data.participantCount } : room
      ));
    });

    return () => { socket.off('new_room'); socket.off('room_update'); };
  }, [user?._id]);

  useEffect(() => {
    if (joinModalOpen && joinInputRef.current) {
      setTimeout(() => joinInputRef.current?.focus(), 100);
    }
  }, [joinModalOpen]);

  const handleJoinRoom = async (code) => {
    const roomCode = code || joinCode;
    if (!roomCode.trim()) return;
    setJoinLoading(true);
    setJoinError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: roomCode.trim(), userId: user?._id })
      });
      const data = await res.json();
      if (data.roomCode) {
        setJoinModalOpen(false);
        navigate(`/room/${data.roomCode}`);
      } else {
        setJoinError(data.message || "Room not found. Check the code and try again.");
      }
    } catch (err) {
      setJoinError("Connection error. Please try again.");
    } finally { setJoinLoading(false); }
  };

  const BOT_PERSONAS = [
    { name: 'AXIOM', role: 'Logic Analyst', color: 'var(--axiom)', bg: 'rgba(59,130,246,0.12)' },
    { name: 'NOVA', role: 'Creative Visionary', color: 'var(--nova)', bg: 'rgba(168,85,247,0.12)' },
    { name: 'VOSS', role: 'Critical Skeptic', color: 'var(--voss)', bg: 'rgba(245,158,11,0.12)' },
  ];

  const filteredRooms = rooms.filter(r =>
    searchQuery === '' || r.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderHome = () => (
    <>
      {/* Stats Bar */}
      <div className="stats-bar animate-slide-up">
        {stats.map((s, i) => (
          <div key={i} className="stat-card" style={{ '--stat-color': s.color }}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-body">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="welcome-section animate-slide-up">
        <h1 className="display-font">
          Welcome back, <span className="text-gradient">{user?.name}</span>
        </h1>
        <p className="text-muted">Your AI debate panel is ready. What are we arguing about today?</p>
      </div>

      <div className="quick-actions-row">
        <div className="action-card glow-border hover-lift" onClick={() => navigate('/room/setup')}>
          <div className="action-icon plus"><Plus size={22} /></div>
          <div className="action-info">
            <h3>Create New Room</h3>
            <p>Launch a fresh debate with custom AI personas.</p>
          </div>
          <ChevronRight className="action-arrow" />
        </div>
        <div className="action-card glow-border hover-lift" onClick={() => setJoinModalOpen(true)}>
          <div className="action-icon join"><Users size={22} /></div>
          <div className="action-info">
            <h3>Join via Room Code</h3>
            <p>Enter a unique code to join any live session.</p>
          </div>
          <ChevronRight className="action-arrow" />
        </div>
      </div>

      {/* AI Robots Preview */}
      <section className="personas-section">
        <div className="section-header">
          <h2>Your AI Panel</h2>
          <span className="section-badge">3 Experts Ready</span>
        </div>
        <div className="personas-row">
          {BOT_PERSONAS.map(bot => (
            <div key={bot.name} className="persona-preview-card" style={{ '--bot-color': bot.color, '--bot-bg': bot.bg }}>
              <div className="persona-avatar-lg" style={{ background: bot.bg, color: bot.color }}>
                {bot.name[0]}
              </div>
              <div className="persona-info">
                <div className="persona-name" style={{ color: bot.color }}>{bot.name}</div>
                <div className="persona-role">{bot.role}</div>
              </div>
              <div className="persona-status">
                <span className="online-dot" />
                <span>Ready</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rooms-section">
        <div className="section-header">
          <h2>Live Discussions</h2>
          <button className="text-link" onClick={() => setActiveTab('community')}>
            View All <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="rooms-grid">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="room-card skeleton" />)
          ) : rooms.length === 0 ? (
            <div className="empty-state">
              <MessageSquare size={32} opacity={0.3} />
              <p>No public rooms active. Create one to start!</p>
            </div>
          ) : (
            rooms.slice(0, 4).map(room => (
              <RoomCard key={room.roomCode} room={room} onJoin={handleJoinRoom} />
            ))
          )}
        </div>
      </section>

      {/* Usage Quota */}
      <div className="quota-banner glow-border">
        <div className="quota-info">
          <Zap size={16} style={{ color: 'var(--warning)' }} />
          <span><strong>{history.length}</strong> of 10 sessions used this month</span>
        </div>
        <div className="quota-bar-track">
          <div className="quota-bar-fill" style={{ width: `${Math.min((history.length / 10) * 100, 100)}%` }} />
        </div>
        <button className="btn-upgrade">Upgrade to Pro ↗</button>
      </div>
    </>
  );

  const renderHistory = () => (
    <div className="history-view animate-slide-up">
      <div className="section-header">
        <div>
          <h1>Discussion History</h1>
          <p className="text-muted">Review your past collaborative sessions.</p>
        </div>
      </div>
      <div className="history-list">
        {history.length === 0 ? (
          <div className="empty-state vertical">
            <History size={40} opacity={0.2} />
            <p>No past discussions found. Create your first room!</p>
            <button className="btn-primary-sm" onClick={() => navigate('/room/setup')}>Create Room</button>
          </div>
        ) : (
          history.map(room => (
            <div key={room._id} className="history-item glow-border hover-lift" onClick={() => navigate(`/room/${room.roomCode}`)}>
              <div className="history-icon"><History size={18} /></div>
              <div className="history-detail">
                <h3>{room.name}</h3>
                <p>{new Date(room.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} &nbsp;·&nbsp; {room.participants?.length || 0} Participants</p>
              </div>
              <div className="history-score">
                <Star size={12} style={{ color: 'var(--voss)' }} />
                <span>88%</span>
              </div>
              <ChevronRight size={18} className="history-arrow" />
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderCommunity = () => (
    <div className="community-view animate-slide-up">
      <div className="section-header">
        <div>
          <h1>Community Board</h1>
          <p className="text-muted">Discover and join public discussions happening right now.</p>
        </div>
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search topics..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="rooms-grid">
        {filteredRooms.length === 0 ? (
          <div className="empty-state">No rooms match your search.</div>
        ) : (
          filteredRooms.map(room => (
            <RoomCard key={room.roomCode} room={room} onJoin={handleJoinRoom} />
          ))
        )}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="settings-view animate-slide-up">
      <div className="section-header">
        <div>
          <h1>Settings</h1>
          <p className="text-muted">Manage your profile and platform preferences.</p>
        </div>
      </div>
      <div className="settings-grid">
        <div className="settings-card glow-border">
          <h3>Profile</h3>
          <div className="profile-avatar-row">
            <div className="profile-avatar-lg">{user?.name?.charAt(0)}</div>
            <div>
              <div className="profile-name">{user?.name}</div>
              <div className="text-muted" style={{ fontSize: '0.85rem' }}>{user?.email}</div>
              <span className="plan-badge">Pro Member</span>
            </div>
          </div>
          <div className="settings-form">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" defaultValue={user?.name} readOnly />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="text" defaultValue={user?.email} readOnly />
            </div>
          </div>
        </div>
        <div className="settings-card glow-border">
          <h3>AI Configuration</h3>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>Default settings for all your created rooms.</p>
          <div className="config-item">
            <div className="config-label"><Sparkles size={14} /> AI Complexity</div>
            <div className="config-options">
              {['Standard', 'Advanced', 'Expert'].map(opt => (
                <button key={opt}
                  className={`opt-btn ${aiPreferences.complexity === opt.toLowerCase() ? 'active' : ''}`}
                  onClick={() => updateAiPreferences({ complexity: opt.toLowerCase() })}
                >{opt}</button>
              ))}
            </div>
          </div>
          <div className="config-item" style={{ marginTop: '1.25rem' }}>
            <div className="config-label"><Cpu size={14} /> Reasoning Engine</div>
            <div className="config-options">
              {['Nuance-1', 'Logic-Pro', 'Discuss-Alpha'].map(opt => (
                <button key={opt}
                  className={`opt-btn ${aiPreferences.engine === opt.toLowerCase() ? 'active' : ''}`}
                  onClick={() => updateAiPreferences({ engine: opt.toLowerCase() })}
                >{opt}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="settings-card glow-border">
          <h3>Subscription</h3>
          <div className="plan-display">
            <div className="plan-name">Pro Plan</div>
            <div className="plan-features">
              <div className="plan-feature"><CheckCircle2 size={14} /> Unlimited sessions</div>
              <div className="plan-feature"><CheckCircle2 size={14} /> All 3 AI personas</div>
              <div className="plan-feature"><CheckCircle2 size={14} /> Session summaries</div>
              <div className="plan-feature"><CheckCircle2 size={14} /> History export</div>
            </div>
            <button className="btn-upgrade" style={{ marginTop: '1rem' }}>Manage Subscription</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">

      {/* ── Join Room Modal ── */}
      {joinModalOpen && (
        <div className="modal-overlay" onClick={() => setJoinModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Join a Room</h2>
                <p>Enter the 6-character room code shared by the host.</p>
              </div>
              <button className="modal-close" onClick={() => setJoinModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="code-input-wrap">
                <input
                  ref={joinInputRef}
                  type="text"
                  placeholder="e.g. ABCD12"
                  value={joinCode}
                  onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleJoinRoom()}
                  maxLength={8}
                  className="code-input"
                />
              </div>
              {joinError && <div className="join-error">{joinError}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary-large" onClick={() => setJoinModalOpen(false)}>Cancel</button>
              <button
                className="btn-primary-large"
                onClick={() => handleJoinRoom()}
                disabled={joinLoading || !joinCode.trim()}
              >
                {joinLoading ? 'Joining…' : 'Join Room'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <Link to="/" className="logo">
            <div className="logo-icon"><Bot size={18} /></div>
            <span className="logo-text">Discuss<span className="text-gradient">AI</span></span>
          </Link>
        </div>

        <nav className="sidebar-nav">
          {[
            { id: 'home', icon: <BarChart2 size={19} />, label: 'Dashboard' },
            { id: 'history', icon: <History size={19} />, label: 'History' },
            { id: 'community', icon: <Globe size={19} />, label: 'Community' },
            { id: 'settings', icon: <Settings size={19} />, label: 'Settings' },
          ].map(nav => (
            <button
              key={nav.id}
              className={`nav-item ${activeTab === nav.id ? 'active' : ''}`}
              onClick={() => setActiveTab(nav.id)}
            >
              {nav.icon}
              <span>{nav.label}</span>
              {nav.id === 'community' && rooms.length > 0 && (
                <span className="nav-badge">{rooms.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">{user?.name?.charAt(0)}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-plan">Pro Member</div>
            </div>
            <button onClick={logout} className="logout-btn"><LogOut size={17} /></button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search rooms, topics, history…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="header-actions">
            <button className="btn-icon circle"><Bell size={17} /></button>
            <div className="header-avatar">{user?.name?.charAt(0)}</div>
          </div>
        </header>

        <div className="dashboard-content">
          {activeTab === 'home' && renderHome()}
          {activeTab === 'history' && renderHistory()}
          {activeTab === 'community' && renderCommunity()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </main>
    </div>
  );
};

// Shared Room Card component
const RoomCard = ({ room, onJoin }) => (
  <div className="room-card glow-border hover-lift">
    <div className="room-card-header">
      <div className="room-icon"><MessageSquare size={16} /></div>
      <span className="status-badge live">
        <span className="live-dot" /> Live
      </span>
    </div>
    <div className="room-body">
      <h3 className="room-title">{room.name}</h3>
      <p className="room-topic">{room.type}</p>
      <div className="room-bots-row">
        {['AXIOM', 'NOVA', 'VOSS'].map(bot => (
          <span key={bot} className={`bot-chip bot-${bot.toLowerCase()}`}>{bot}</span>
        ))}
      </div>
    </div>
    <div className="room-footer">
      <div className="room-meta">
        <div className="meta-item"><Users size={13} /> {room.participantCount || room.participants?.length || 0}</div>
        <div className="meta-item"><Globe size={13} /> Public</div>
      </div>
      <button className="btn-primary-sm" onClick={() => onJoin(room.roomCode)}>
        Join <ArrowUpRight size={13} />
      </button>
    </div>
  </div>
);

export default Dashboard;
