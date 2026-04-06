import { Eye, EyeOff, Loader2, Cpu, Globe, Briefcase, Zap, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosApi';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

function getStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];
  return { score, label: labels[score] || '', color: colors[score] || '' };
}

const topicPreviews = [
  { icon: <Cpu size={20} />, text: 'AI in Healthcare', color: '#6366f1' },
  { icon: <Globe size={20} />, text: 'Climate Change Debate', color: '#06b6d4' },
  { icon: <Briefcase size={20} />, text: 'Remote Work Culture', color: '#a855f7' },
];

const Register = () => {
 
  const navigate = useNavigate();
  const { register, handleGoogleLogin } = useAuth();
  
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
        setApiError(result.message || 'Google registration failed');
      }
    },
    onError: errorResponse => {
      setIsGoogleLoading(false);
      setApiError('Google registration was cancelled or failed.');
    }
  });

  const validationSchema = Yup.object({
    name: Yup.string().required('Full name is required.'),
    email: Yup.string().email('Enter a valid email address.').required('Email is required.'),
    password: Yup.string().min(8, 'Password must be at least 8 characters.').required('Password is required.'),
    confirm: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords do not match.')
      .required('Please confirm your password.'),
    agreed: Yup.boolean().oneOf([true], 'Agreement required.'),
  });

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirm: '',
      agreed: false,
    },
    validationSchema,
    onSubmit: async (values) => {
      setApiError('');
      try {
        const response = await api.post('/auth/register', {
          name: values.name,
          email: values.email,
          password: values.password
        });
        if (response.data.success) {
          localStorage.setItem('token', response.data.token);
          navigate('/dashboard');
        } else {
          setApiError(response.data.message);
        }
      } catch (error) {
        setApiError(error.response?.data?.message || 'Registration failed. Please try again.');
        console.error(error);
      }
    },
  });

  const strength = getStrength(formik.values.password);

  return (
    <div className="auth-page">
      {/* ── Left brand panel (md+) ── */}
      <div className="auth-left">
        <div className="hero-blob blob-1 animate-float-slow" style={{top: '-8rem', left: '-8rem', opacity: 0.15}} />
        {/* <div className="hero-blob blob-2 animate-float-slow" style={{bottom: '-10rem', right: '-5rem', opacity: 0.2, animationDelay: '-5s'}} />
        <div className="hero-blob blob-3 animate-float-slow" style={{top: '20%', right: '10%', width: '200px', height: '200px', background: 'var(--accent)', opacity: 0.1, animationDelay: '-10s'}} /> */}

        <div className="relative z-10 text-center" style={{maxWidth: '380px'}}>
          {/* Topic preview cards */}
          <div className="animate-float" style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem'}}>
            {topicPreviews.map(({ icon, text, color }, idx) => (
              <div key={text} className={`feature-card delay-${idx + 1} glow-border`} style={{padding: '1.25rem', flexDirection: 'row', alignItems: 'center', gap: '1.25rem', textAlign: 'left', background: 'rgba(255,255,255,0.03)'}}>
                <span className="feature-icon-container" style={{ width: '3rem', height: '3rem', marginBottom: 0, background: `${color}15`, borderColor: `${color}30`, color: color }}>
                  {icon}
                </span>
                <div style={{flex: 1}}>
                   <div style={{fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc'}}>{text}</div>
                   <div style={{fontSize: '0.75rem', color: '#64748b', marginTop: '2px'}}>Join 12 players</div>
                </div>
                <span style={{fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ef4444', background: '#ef444415', padding: '0.35rem 0.65rem', borderRadius: '0.5rem', border: '1px solid #ef444430', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <span className="spin" style={{width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: '#ef4444'}} />
                  Live
                </span>
              </div>
            ))}
          </div>

          <h2 className="auth-title">
            Level up your <span className="gradient-text">Skills</span> with AI
          </h2>
          <p className="auth-sub" style={{marginTop: '1rem', fontSize: '1rem', padding: '0 1rem'}}>
             Practice real-world discussion topics with state-of-the-art AI bots and get instant feedback.
          </p>

          {/* Social Proof */}
          <div style={{marginTop: '3.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem'}}>
             <div style={{display: 'flex', alignItems: 'center', gap: '-10px', marginLeft: '10px'}}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{width: '2.5rem', height: '2.5rem', borderRadius: '50%', border: '3px solid #0d0d1f', background: 'linear-gradient(135deg, #6366f1, #a855f7)', marginLeft: '-12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.75rem'}}>U{i}</div>
                ))}
                <div style={{width: '2.5rem', height: '2.5rem', borderRadius: '50%', border: '3px solid #0d0d1f', background: '#1e1e2e', marginLeft: '-12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.75rem', color: '#94a3b8'}}>+5k</div>
             </div>
             <p style={{fontSize: '0.85rem', color: '#64748b', fontWeight: 600}}>Joined by 5,000+ developers</p>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-right">
        {/* <div className="hero-blob blob-2 animate-float-slow" style={{top: '10%', left: '10%', width: '300px', height: '300px', opacity: 0.03}} /> */}

        <div className="auth-card animate-slide-right glow-border" style={{background: 'var(--bg-surface)', padding: '2.5rem', borderRadius: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'}}>
          {/* Logo mobile */}
          <Link to="/" className="logo-mobile logo">
            <div className="logo-icon">💬</div>
            <span className="logo-text">Discuss<span className="gradient-text">AI</span></span>
          </Link>

          <h1 className="auth-title"  >Create Account</h1>
          <p className="auth-sub">
            Build your skills today. <Link to="/login" className="auth-link">Already have an account?</Link>
          </p>

          {apiError && (
            <div className="form-error-msg" style={{ marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <Zap size={14} /> {apiError}
            </div>
          )}

          <form onSubmit={formik.handleSubmit} noValidate className="auth-form">
            <div className="form-group">
              <label htmlFor="name" className="form-label">Full Name</label>
              <input 
                id="name" 
                name="name" 
                type="text" 
                placeholder="John Doe" 
                value={formik.values.name} 
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`auth-input ${formik.touched.name && formik.errors.name ? 'auth-input-error' : ''}`} 
              />
              {formik.touched.name && formik.errors.name && <p className="form-error-msg"><Zap size={12} /> {formik.errors.name}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="reg-email" className="form-label">Email address</label>
              <input 
                id="reg-email" 
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
              <label htmlFor="reg-password" className="form-label">Password</label>
              <div className="auth-input-container">
                <input 
                  id="reg-password" 
                  name="password" 
                  type={showPwd ? 'text' : 'password'} 
                  placeholder="Min. 8 characters"
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
              
              {formik.values.password.length > 0 && (
                <div style={{marginTop: '0.25rem'}}>
                  <div className="strength-meter">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className="strength-bar"
                        style={{ background: n <= strength.score ? strength.color : undefined }} />
                    ))}
                  </div>
                  <p className="strength-label" style={{ color: strength.color }}>{strength.label}</p>
                </div>
              )}
              {formik.touched.password && formik.errors.password && <p className="form-error-msg"><Zap size={12} /> {formik.errors.password}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="confirm" className="form-label">Confirm Password</label>
              <div className="auth-input-container">
                <input 
                  id="confirm" 
                  name="confirm" 
                  type={showConfirm ? 'text' : 'password'} 
                  placeholder="Repeat password"
                  value={formik.values.confirm} 
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`auth-input ${formik.touched.confirm && formik.errors.confirm ? 'auth-input-error' : ''}`} 
                  style={{paddingRight: '3.5rem'}} 
                />
                <button type="button" onClick={() => setShowConfirm((p) => !p)} className="input-icon-btn">
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {formik.touched.confirm && formik.errors.confirm && <p className="form-error-msg"><Zap size={12} /> {formik.errors.confirm}</p>}
            </div>

            <div style={{paddingTop: '0.5rem'}}>
              <div className="auth-checkbox-group" onClick={() => formik.setFieldValue('agreed', !formik.values.agreed)}>
                 <input type="checkbox" checked={formik.values.agreed} readOnly className="auth-checkbox" />
                 <span style={{fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500, lineHeight: 1.4}}>
                   I agree to the <a href="#" className="auth-link">Terms</a> and <a href="#" className="auth-link">Privacy Policy</a>
                 </span>
              </div>
              {formik.touched.agreed && formik.errors.agreed && <p className="form-error-msg"><Zap size={12} /> {formik.errors.agreed}</p>}
            </div>

            <button type="submit" disabled={formik.isSubmitting} className="btn-primary btn-large" style={{width: '100%', border: 'none', cursor: 'pointer', marginTop: '1rem'}}>
              {formik.isSubmitting ? <Loader2 size={18} className="spin" /> : <span className="btn-premium">Create Account</span>}
            </button>
          </form>

          <div className="auth-divider" style={{marginTop: '1.5rem'}}>
            <div className="divider-line" />
            Social Sign Up
            <div className="divider-line" />
          </div>

          <div className="social-group">
            <button type="button" className="social-btn" onClick={() => googleLogin()} disabled={isGoogleLoading}>
                <span className="social-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
                    {isGoogleLoading ? <Loader2 size={16} className="spin" /> : <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />}
                  </svg>
                </span>
                Google
            </button>
            <button type="button" className="social-btn">
                <span className="social-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                </span>
                GitHub
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;