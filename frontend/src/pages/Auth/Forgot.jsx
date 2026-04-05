import { Link } from 'react-router-dom';
import { Loader2, Mail, ArrowLeft, Zap, Sparkles } from 'lucide-react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const Forgot = () => {
  const [sent, setSent] = useState(false);

  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Enter a valid email address.')
      .required('Email is required.'),
  });

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      // Simulate API call
      await new Promise((r) => setTimeout(r, 1500));
      setSent(true);
    },
  });

  return (
    <div className="auth-page">
      {/* ── Left brand panel (md+) ── */}
      <div className="auth-left">
        <div className="hero-blob blob-1 animate-float-slow" style={{top: '-8rem', left: '-8rem', opacity: 0.2}} />
        <div className="hero-blob blob-3 animate-float-slow" style={{bottom: '-10rem', right: '-8rem', opacity: 0.15, animationDelay: '-5s'}} />

        <div className="animate-float glow-border" style={{
          position: 'relative', zIndex: 10, width: '7.5rem', height: '7.5rem', borderRadius: '2rem',
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem',
          marginBottom: '3rem', boxShadow: '0 30px 60px rgba(99, 102, 241, 0.4)', border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          💡
        </div>

        <div className="relative z-10 text-center" style={{maxWidth: '380px', padding: '0 2rem'}}>
          <h2 className="auth-title">
            Lost your <span className="gradient-text">Access</span>?
          </h2>
          <p className="auth-sub" style={{marginTop: '1rem', fontSize: '1rem'}}>
            It happens to the best of us. Just enter your email and we'll get you back in.
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-right">
        <div className="hero-blob blob-2 animate-float-slow" style={{top: '15%', right: '15%', opacity: 0.04}} />

        <div className="auth-card animate-slide-right glow-border" style={{background: 'var(--bg-surface)', padding: '2.5rem', borderRadius: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'}}>
          {/* Logo mobile */}
          <Link to="/" className="logo-mobile logo">
            <div className="logo-icon">💬</div>
            <span className="logo-text">Discuss<span className="gradient-text">AI</span></span>
          </Link>

          {sent ? (
            <div className="animate-fade-in text-center">
               <div style={{
                width: '5rem', height: '5rem', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: '#22c55e', border: '2px solid rgba(34, 197, 94, 0.2)'
              }}>
                <Mail size={36} />
              </div>
              <h1 className="auth-title">Check Inbox</h1>
              <p className="auth-sub" style={{marginTop: '0.75rem'}}>
                A recovery link has been sent to <strong style={{color: '#f8fafc'}}>{email}</strong>.
              </p>
              <button onClick={() => setSent(false)} className="social-btn" style={{width: '100%', marginTop: '1.5rem'}}>
                Try another email
              </button>
              <p style={{marginTop: '2.5rem', textAlign: 'center'}}>
                <Link to="/login" className="auth-link" style={{display: 'inline-flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.95rem'}}>
                  <ArrowLeft size={18} /> Back to Login
                </Link>
              </p>
            </div>
          ) : (
            <>
              <h1 className="auth-title">Forgot Password?</h1>
              <p className="auth-sub">
                Enter your email address and we'll send you a link to reset your account.
              </p>

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

                <button type="submit" disabled={formik.isSubmitting} className="btn-primary btn-large" style={{width: '100%', border: 'none', cursor: 'pointer', marginTop: '1rem'}}>
                  {formik.isSubmitting ? <Loader2 size={18} className="spin" /> : 'Send Recovery Link'}
                </button>

                <p style={{marginTop: '2rem', textAlign: 'center'}}>
                  <Link to="/login" className="auth-link" style={{display: 'inline-flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.95rem'}}>
                    <ArrowLeft size={18} /> Back to Login
                  </Link>
                </p>
              </form>
            </>
          )}

          <p style={{marginTop: '3.5rem', textAlign: 'center'}}>
             <Link to="/" className="auth-link" style={{display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem'}}>
               <ArrowLeft size={16} /> Back to Homepage
             </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Forgot;