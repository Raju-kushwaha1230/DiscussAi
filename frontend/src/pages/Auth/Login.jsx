import { Eye, EyeOff, Loader2, Zap, ArrowLeft, CheckCircle2, LogIn, Bot } from 'lucide-react';
import { FaGithub, FaGoogle } from 'react-icons/fa';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../context/AuthContext';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

const Login = () => {
  const navigate = useNavigate();
  const { login, handleGoogleLogin } = useAuth();
  const [showPwd, setShowPwd] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      setApiError('');
      const result = await handleGoogleLogin(tokenResponse.access_token);
      setIsGoogleLoading(false);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setApiError(result.message || 'Google login failed');
      }
    },
    onError: errorResponse => {
      setIsGoogleLoading(false);
      setApiError('Google login was cancelled or failed.');
    }
  });

  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Enter a valid email address.')
      .required('Email is required.'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters.')
      .required('Password is required.'),
  });

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      remember: true,
    },
    validationSchema,
    onSubmit: async (values) => {
      setApiError('');
      const result = await login(values.email, values.password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setApiError(result.message || 'Invalid email or password');
      }
    },
  });

  return (
    <div className="auth-page">
      <Helmet>
        <title>Sign In | DiscussAI</title>
        <meta name="description" content="Access your DiscussAI account and continue mastering your communication skills with AI experts." />
      </Helmet>
      {/* ── Left brand panel (md+) ── */}
      <div className="auth-left">
        <div className="hero-blob blob-1 animate-float-slow" style={{top: '-8rem', left: '-8rem', opacity: 0.2}} />
        <div className="hero-blob blob-2 animate-float-slow" style={{bottom: '-10rem', right: '-8rem', opacity: 0.2, animationDelay: '-5s'}} />

        {/* Floating icon */}
        <div className="animate-float glow-border" style={{
          position: 'relative', zIndex: 10, width: '7.5rem', height: '7.5rem', borderRadius: '2rem',
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '3rem', boxShadow: '0 30px 60px rgba(99, 102, 241, 0.4)', border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <Bot size={48} color="white" />
        </div>

        <div className="relative z-10 text-center" style={{maxWidth: '380px', padding: '0 2rem'}}>
          <h2 className="auth-title">
            Welcome back to <span className="gradient-text">DiscussAI</span>
          </h2>
          <p className="auth-sub" style={{marginTop: '1rem', fontSize: '1rem'}}>
            Your AI peers are waiting for another round of debate. Jump right back in!
          </p>

          {/* Testimonial */}
          <div className="feature-card" style={{padding: '1.75rem', marginTop: '3rem', textAlign: 'left', position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.03)'}}>
            <div className="hero-blob" style={{top: 0, right: 0, width: '10rem', height: '10rem', background: 'var(--primary)', opacity: 0.08, filter: 'blur(50px)'}} />
            <p style={{color: 'rgba(226, 232, 240, 0.95)', fontSize: '0.95rem', lineHeight: 1.8, fontStyle: 'italic', position: 'relative', zIndex: 10}}>
              "The AI responses are incredibly high-quality. It really helps me sharpen my arguments before real-world discussions."
            </p>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', position: 'relative', zIndex: 10}}>
              <div style={{
                width: '2.75rem', height: '2.75rem', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem', color: 'white', border: '2px solid rgba(255,255,255,0.1)'
              }}>
                R
              </div>
              <div>
                <div style={{fontWeight: 800, fontSize: '0.95rem', color: '#f8fafc'}}>Riya Sharma</div>
                <div style={{fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.125rem'}}>Senior Developer</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-right">
        <div className="hero-blob blob-1 animate-float-slow" style={{top: '10%', right: '10%', opacity: 0.04}} />

        <div className="auth-card animate-slide-right glow-border" style={{background: 'var(--bg-surface)', padding: '2.5rem', borderRadius: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'}}>
          {/* Logo mobile */}
          <Link to="/" className="logo-mobile logo">
            <div className="logo-icon"><Bot size={18} /></div>
            <span className="logo-text">Discuss<span className="gradient-text">AI</span></span>
          </Link>

          <h1 className="auth-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <LogIn size={24} style={{ color: 'var(--primary)' }} /> Sign In
          </h1>
          <p className="auth-sub">
             Enter your credentials to access your account. <Link to="/register" className="auth-link">Need an account?</Link>
          </p>

          {apiError && (
            <div className="form-error-msg" style={{ marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <Zap size={14} /> {apiError}
            </div>
          )}

          <form onSubmit={formik.handleSubmit} noValidate className="auth-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="john@example.com" 
                value={formik.values.email} 
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`auth-input ${formik.touched.email && formik.errors.email ? 'auth-input-error' : ''}`} 
              />
              {formik.touched.email && formik.errors.email && <p className="form-error-msg"><Zap size={12} /> {formik.errors.email}</p>}
            </div>

            <div className="form-group">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem'}}>
                <label htmlFor="password" className="form-label" style={{marginBottom: 0}}>Password</label>
                <Link to="/forget-password" title="Recover password" style={{fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none'}}>
                   Forgot Password?
                </Link>
              </div>
              <div className="auth-input-container">
                <input 
                  id="password" 
                  name="password" 
                  type={showPwd ? 'text' : 'password'} 
                  placeholder="••••••••"
                  value={formik.values.password} 
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`auth-input ${formik.touched.password && formik.errors.password ? 'auth-input-error' : ''}`} 
                  style={{paddingRight: '3.5rem'}} 
                />
                <button type="button" onClick={() => setShowPwd((p) => !p)} className="input-icon-btn">
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {formik.touched.password && formik.errors.password && <p className="form-error-msg"><Zap size={12} /> {formik.errors.password}</p>}
            </div>

            <div className="auth-footer-links" style={{marginTop: '0.5rem'}}>
               <div className="auth-checkbox-group" onClick={() => formik.setFieldValue('remember', !formik.values.remember)}>
                  <input type="checkbox" checked={formik.values.remember} readOnly className="auth-checkbox" />
                  <span style={{fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500}}>Remember me</span>
               </div>
            </div>

            <button type="submit" disabled={formik.isSubmitting} className="btn-primary btn-large" style={{width: '100%', border: 'none', cursor: 'pointer', marginTop: '1rem'}}>
              {formik.isSubmitting ? <Loader2 size={18} className="spin" /> : <span className="btn-premium" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}><LogIn size={18} /> Continue to Dashboard</span>}
            </button>
          </form>

          <div className="auth-divider">
            <div className="divider-line" />
            Social Sign In
            <div className="divider-line" />
          </div>

          <div className="social-group">
            <button type="button" className="social-btn" onClick={() => googleLogin()} disabled={isGoogleLoading}>
                <span className="social-icon">
                  {isGoogleLoading ? <Loader2 size={16} className="spin" /> : <FaGoogle color="#4285F4" />}
                </span>
                Google
            </button>
            <button type="button" className="social-btn">
                <span className="social-icon">
                  <FaGithub color="white" />
                </span>
                GitHub
            </button>
          </div>

          
        </div>
      </div>
    </div>
  );
};

export default Login;