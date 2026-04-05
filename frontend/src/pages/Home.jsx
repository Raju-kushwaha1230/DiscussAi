import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Sparkles, MessageSquare, Shield, Rocket, Cpu, Users, ChevronRight } from 'lucide-react';

const Home = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const handleMouseMove = (e) => {
    // Simple parallax/spotlight effect for bento cards
    document.querySelectorAll('.bento-card').forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  };

  return (
    <div className="min-h-screen" onMouseMove={handleMouseMove}>
      
      {/* ── Navigation (Premium) ── */}
      <nav className={`navbar-premium ${scrolled ? 'navbar-scrolled' : ''}`}>
        <Link to="/" className="logo">
          <div className="logo-icon">
            <Bot size={20} />
          </div>
          <span className="logo-text">Discuss<span className="text-gradient">AI</span></span>
        </Link>
        
        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#how-it-works" className="nav-link">How it Works</a>
          <a href="#pricing" className="nav-link">Pricing</a>
        </div>
        
        <div className="nav-actions">
          <Link to="/login" className="btn-secondary hidden sm:inline-flex">Sign In</Link>
          <Link to="/register" className="btn-premium">
            Get Started <ChevronRight size={16} />
          </Link>
        </div>
      </nav>

      {/* ── Hero Asymmetric ── */}
      <section className="hero-wrapper">
        <div className="mesh-bg mesh-1 animate-float-slow" />
        <div className="mesh-bg mesh-2 animate-float-slow" style={{ animationDelay: '-5s' }} />

        <div className="hero-content animate-slide-up-delay">
          <div className="hero-pill">
            <Sparkles size={14} style={{ color: '#a5b4fc' }} />
            <span>DiscussAI version 2.0 is live</span>
          </div>
          
          <h1 className="hero-headline">
            Master Every Debate with <span className="text-gradient-primary">AI Brilliance.</span>
          </h1>
          
          <p className="hero-description text-balance">
            Elevate your communication skills. Practice with highly realistic AI personas that challenge your arguments, refine your logic, and prepare you for the real world.
          </p>
          
          <div className="hero-ctas">
            <Link to="/register" className="btn-premium" style={{padding: '1rem 2rem', fontSize: '1.05rem'}}>
              Start Practicing Free
            </Link>
            <a href="#how-it-works" className="btn-secondary" style={{padding: '1rem 2rem', fontSize: '1.05rem'}}>
              See how it works
            </a>
          </div>

          <div className="hero-users">
             <div className="user-avatars">
                {[1,2,3].map(i => (
                  <div key={i} className="avatar-sm">U{i}</div>
                ))}
             </div>
             <div style={{fontSize: '0.875rem', color: '#94a3b8', fontWeight: 500}}>Join <span style={{color: '#e2e8f0'}}>10,000+</span> professionals.</div>
          </div>
        </div>
        
        {/* Floating 3D Elements Right Side */}
        <div className="hero-visual animate-fade">
           <div className="visual-center animate-pulse-glow">
             <Bot size={80} className="text-indigo-400 opacity-80" />
           </div>
           
           <div className="floating-panel panel-1 animate-float glow-border">
             <div className="panel-header">
               <div className="icon-circle"><Cpu size={14}/></div>
               <div>
                 <div className="panel-title">System prompt</div>
                 <div className="panel-subtitle">Processing argument...</div>
               </div>
             </div>
             <div className="progress-track">
               <div className="progress-fill"></div>
             </div>
           </div>

           <div className="floating-panel panel-2 animate-float glow-border" style={{ animationDelay: '-2s' }}>
             <p className="panel-text">
               "Your point on latency is valid, but have you considered the edge computing costs?"
             </p>
             <div className="panel-footer">
                <span className="tag-pill">Counter-argument</span>
             </div>
           </div>

           <div className="floating-panel panel-3 animate-float overflow-hidden glow-border" style={{ animationDelay: '-4s' }}>
             <div className="panel-overlay" />
             <div className="panel-bottom">
                <div>
                   <div className="metric-title">Logic Score</div>
                   <div className="metric-value">94%</div>
                </div>
                <Sparkles size={20} style={{ color: '#a78bfa', marginBottom: '0.25rem' }} />
             </div>
           </div>
        </div>
      </section>

      {/* ── Deep Dive Layer Overlaps ── */}
      <section className="deep-dive-section" id="how-it-works">
         <div className="deep-dive-container reveal">
            <div className="layer-stack">
               <div className="layer layer-back">
                  <div className="w-12 h-12 bg-white/5 rounded-xl mb-4" />
                  <div className="space-y-3">
                     <div className="h-3 w-3/4 bg-white/5 rounded" />
                     <div className="h-3 w-1/2 bg-white/5 rounded" />
                  </div>
               </div>
               <div className="layer layer-mid">
                  <div className="flex items-center gap-4 mb-6">
                     <div className="w-10 h-10 rounded-full bg-indigo-500/20" />
                     <div>
                        <div className="h-4 w-24 bg-white/10 rounded mb-2" />
                        <div className="h-3 w-16 bg-white/5 rounded" />
                     </div>
                  </div>
                  <div className="h-24 w-full bg-white/5 rounded-lg" />
               </div>
               <div className="layer layer-front">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><Bot size={16}/></div>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#e2e8f0' }}>AI Moderator</span>
                     </div>
                     <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8', background: 'rgba(99,102,241,0.1)', padding: '0.25rem 0.5rem', borderRadius: '9999px', border: '1px solid rgba(99,102,241,0.2)' }}>Analyzing</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                     Your argument structure is sound, but lacks empirical evidence. Consider adding a citation regarding the Q3 adoption rates to strengthen your premise.
                  </p>
               </div>
            </div>
            
            <div style={{ flex: 1, maxWidth: '32rem' }}>
               <div className="hero-pill" style={{ marginBottom: '1rem' }}><Shield size={14} style={{ color: '#a5b4fc' }}/> Advanced Architecture</div>
               <h2 className="hero-headline" style={{fontSize: 'clamp(2rem, 4vw, 3.5rem)', marginBottom: '1rem'}}>Deep Layered Feedback.</h2>
               <p className="deep-dive-text">
                  Unlike simple chatbots, DiscussAI uses a multi-agent system. One agent argues with you, another evaluates your logic in real-time, and a third moderates the flow.
               </p>
               <ul className="deep-dive-list">
                  {[
                    ['Real-time logical fallacy detection'],
                    ['Dynamic persona switching (Aggressive vs Passive)'],
                    ['Post-session comprehensive analytical reports']
                  ].map((text, i) => (
                    <li key={i} className="list-item-premium">
                       <div className="check-icon">✓</div>
                       {text}
                    </li>
                  ))}
               </ul>
            </div>
         </div>
      </section>

      {/* ── Features Bento Grid ── */}
      <section className="bento-section" id="features">
        <div className="bento-header reveal">
          <h2 className="hero-headline" style={{fontSize: 'clamp(2.5rem, 5vw, 4rem)'}}>Everything you need to <span className="text-gradient">Dominate.</span></h2>
          <p className="text-lg text-slate-400">A complete toolkit designed to turn you from a passive participant into a commanding presence in any room.</p>
        </div>

        <div className="bento-grid">
          {/* Main Focus Card */}
          <div className="bento-card bento-focus group glow-border reveal stagger-1 hover-lift">
            <div className="bento-icon text-indigo-400 bg-indigo-500/10 border-indigo-500/20"><MessageSquare size={24} /></div>
            <div className="bento-content">
              <h3 className="bento-title">Uncapped Conversations</h3>
              <p className="bento-desc max-w-sm">Engage in long-form, multi-threaded debates. The AI retains context for hours, allowing for deeply nuanced discussions that surface your weak points.</p>
            </div>
            <div className="bento-graphic bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
          </div>

          /* Horizontal span */
          <div className="bento-card bento-horizontal group border-t-cyan-500/30 reveal stagger-2 hover-lift">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
               <div className="bento-icon m-0" style={{ color: '#22d3ee', background: 'rgba(6,182,212,0.1)', borderColor: 'rgba(6,182,212,0.2)' }}><Rocket size={20} /></div>
               <div style={{ padding: '0.25rem 0.75rem', background: 'rgba(6,182,212,0.1)', color: '#22d3ee', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: '9999px', border: '1px solid rgba(6,182,212,0.2)' }}>Lightning Fast</div>
            </div>
            <div>
              <h3 className="bento-title">Sub-second Latency</h3>
              <p className="bento-desc">Optimized streaming responses make it feel like you are talking to a real human. No awkward pauses.</p>
            </div>
          </div>

          /* Standard blocks */
          <div className="bento-card bento-small group reveal stagger-3 hover-lift">
            <div className="bento-icon text-violet-400 bg-violet-500/10 border-violet-500/20"><Cpu size={20} /></div>
            <div className="bento-content">
              <h3 className="bento-title">Custom Models</h3>
              <p className="bento-desc text-sm">Fine-tuned specifically for argumentation.</p>
            </div>
          </div>

          <div className="bento-card bento-small group reveal stagger-4 hover-lift">
            <div className="bento-icon text-rose-400 bg-rose-500/10 border-rose-500/20"><Users size={20} /></div>
            <div className="bento-content">
              <h3 className="bento-title">Group Mode</h3>
              <p className="bento-desc text-sm">Simulate 4-way completely chaotic discussions.</p>
            </div>
          </div>
          
          /* Vertical Span */
          <div className="bento-card bento-vertical group border-l-indigo-500/30 reveal stagger-2 hover-lift">
            <div className="bento-content bento-content-top">
              <h3 className="bento-title" style={{fontSize: '1.75rem'}}>Analytics Dashboard</h3>
              <p className="bento-desc">Track your interruption rate, vocabulary diversity, and logical consistency over time.</p>
            </div>
            <div style={{ marginTop: 'auto', height: '8rem', width: '100%', borderRadius: '0.5rem', background: 'linear-gradient(to top, rgba(99,102,241,0.2), transparent)', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
               {/* Faux graph line */}
               <svg style={{ position: 'absolute', bottom: 0, width: '100%', height: '100%' }} preserveAspectRatio="none" viewBox="0 0 100 100">
                  <path d="M0 100 Q 20 80, 40 50 T 80 40 T 100 10" fill="none" stroke="rgba(99,102,241,0.5)" strokeWidth="3" />
                  <path d="M0 100 Q 20 80, 40 50 T 80 40 T 100 10 L 100 100 Z" fill="url(#grad)" />
                  <defs>
                    <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="rgba(99,102,241,0.2)"/>
                      <stop offset="100%" stopColor="rgba(99,102,241,0)"/>
                    </linearGradient>
                  </defs>
               </svg>
            </div>
          </div>

        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer-premium">
        <div className="footer-grid">
          <div>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', textDecoration: 'none' }}>
              <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><Bot size={18} /></div>
              <span style={{ fontWeight: 900, fontSize: '1.25rem', color: 'white', fontFamily: 'Outfit, sans-serif' }}>Discuss<span className="text-gradient">AI</span></span>
            </Link>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', maxWidth: '20rem', lineHeight: 1.6 }}>
              The professional standard for AI-assisted communication and debate practice.
            </p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
             <h4 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'white', marginBottom: '0.5rem', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.875rem' }}>Product</h4>
             <a href="#" className="nav-link">Features</a>
             <a href="#" className="nav-link">Pricing</a>
             <a href="#" className="nav-link">Enterprise</a>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
             <h4 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'white', marginBottom: '0.5rem', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.875rem' }}>Company</h4>
             <a href="#" className="nav-link">About</a>
             <a href="#" className="nav-link">Blog</a>
             <a href="#" className="nav-link">Careers</a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} DiscussAI Inc. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href="#" className="nav-link">Privacy</a>
            <a href="#" className="nav-link">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;