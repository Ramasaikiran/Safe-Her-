import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import OtpInput from '../components/OtpInput'
import { Shield, Mail, ArrowLeft, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

type Step = 'email' | 'otp'

/**
 * Login — email + OTP, with Google as a second path.
 *
 * "Not found" UX:
 *  - If the entered email has no matching account, a blocking popup
 *    ("No account found") appears instead of silently sending an OTP.
 *    The user is offered a direct link to Register.
 */
export default function Login() {
  const { loginRequestOtp, verifyOtp, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [otpError, setOtpError] = useState(false)
  const [resetKey, setResetKey] = useState(0)

  const [notFoundOpen, setNotFoundOpen] = useState(false)
  const [notFoundMsg, setNotFoundMsg] = useState('')

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Enter a valid email address.')
      return
    }
    setLoading(true)
    const { error } = await loginRequestOtp(email)
    setLoading(false)

    if (error) {
      if (error.code === 'NOT_FOUND') {
        setNotFoundMsg(error.message)
        setNotFoundOpen(true)
        return
      }
      toast.error(error.message)
      return
    }

    toast.success(`Code sent to ${email}`)
    setStep('otp')
  }

  const handleVerify = async (code: string) => {
    setLoading(true)
    setOtpError(false)
    const { error } = await verifyOtp(email, code)
    setLoading(false)

    if (error) {
      setOtpError(true)
      setResetKey(k => k + 1)
      toast.error(error.message)
      return
    }

    toast.success('Welcome back 🌸')
    navigate('/dashboard')
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    const { error } = await loginWithGoogle()
    if (error) {
      setGoogleLoading(false)
      toast.error(error.message)
    }
    // on success, Supabase redirects away — no further state needed here
  }

  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <div className="auth-hero-mark">
          <Shield size={26} color="var(--night)" />
          <span style={{ fontFamily: 'Fraunces,serif', fontSize: '1.5rem', fontWeight: 600, color: 'var(--night)' }}>SafeShe</span>
        </div>
        <p className="auth-hero-quote">"The safest journeys start with the people who've already walked the road."</p>
        <div className="auth-hero-foot">
          <span>12,000+ travellers</span>
          <span>800+ verified guides</span>
          <span>24/7 SOS network</span>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-card fade-up">
          <div style={{ marginBottom: '1.6rem' }}>
            <p className="auth-eyebrow">Sign in</p>
            <h1 className="auth-title">{step === 'email' ? 'Welcome back' : 'Check your inbox'}</h1>
            <p className="auth-sub" style={{ marginTop: '0.4rem' }}>
              {step === 'email' ? 'Sign in with your email — no password needed.' : `Enter the 6-digit code sent to ${email}`}
            </p>
          </div>

          {step === 'email' ? (
            <>
              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div className="form-group">
                  <label>Email address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                    <input
                      type="email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      style={{ paddingLeft: '2.6rem' }}
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                  {loading ? 'Sending code…' : 'Continue with email'}
                </button>
              </form>

              <div className="auth-divider"><span>or</span></div>

              <button type="button" onClick={handleGoogle} disabled={googleLoading} className="btn-google">
                <GoogleIcon />
                {googleLoading ? 'Connecting…' : 'Continue with Google'}
              </button>

              <div style={{ marginTop: '1.4rem', display: 'flex', justifyContent: 'center' }}>
                <span className="auth-trust-row"><ShieldCheck size={14} /> No passwords. No spam. Ever.</span>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <OtpInput length={6} onComplete={handleVerify} error={otpError} disabled={loading} resetKey={resetKey} />
              <button
                type="button"
                onClick={() => { setStep('email'); setOtpError(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.6rem' }}
              >
                <ArrowLeft size={14} /> Use a different email
              </button>
              {loading && <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.8rem' }}>Verifying…</p>}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '1.6rem', paddingTop: '1.6rem', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
              New to SafeShe?{' '}
              <Link to="/register" style={{ color: 'var(--rose)', fontWeight: 600, textDecoration: 'none' }}>Create account →</Link>
            </p>
          </div>
        </div>
      </div>

      {notFoundOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(26,15,10,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="card scale-in" style={{ maxWidth: 380, width: '100%', padding: '2rem', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--blush)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', margin: '0 auto 1rem' }}>✉️</div>
            <h3 style={{ fontFamily: 'Fraunces,serif', fontSize: '1.2rem', fontWeight: 600, color: 'var(--night)', marginBottom: '0.5rem' }}>No account found</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>{notFoundMsg}</p>
            <div style={{ display: 'flex', gap: '0.7rem' }}>
              <button onClick={() => setNotFoundOpen(false)} className="btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Try another email</button>
              <button onClick={() => navigate('/register')} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Sign Up</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59A8.96 8.96 0 0 0 9 0 9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
    </svg>
  )
}
