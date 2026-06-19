import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import OtpInput from '../components/OtpInput'
import { Shield, Phone, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

type Step = 'phone' | 'otp'

/**
 * Login — phone + OTP only (no email).
 *
 * "Not found" UX requirement:
 *  - If the entered phone number has no matching account, we show a
 *    blocking popup ("No account found") instead of silently sending
 *    an OTP or creating an account. The user is offered a direct link
 *    to Register.
 *  - If the phone belongs to a different role (guide vs traveller),
 *    we show that explicitly too.
 */
export default function Login() {
  const { loginRequestOtp, verifyOtp } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpError, setOtpError] = useState(false)
  const [resetKey, setResetKey] = useState(0)

  // Blocking "not found" popup state
  const [notFoundOpen, setNotFoundOpen] = useState(false)
  const [notFoundMsg, setNotFoundMsg] = useState('')

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\d{10}$/.test(phone)) {
      toast.error('Enter a valid 10-digit mobile number.')
      return
    }
    setLoading(true)
    const { error } = await loginRequestOtp(phone, 'traveller')
    setLoading(false)

    if (error) {
      if (error.code === 'NOT_FOUND') {
        setNotFoundMsg(error.message)
        setNotFoundOpen(true)
        return
      }
      if (error.code === 'ROLE_CONFLICT') {
        toast.error(error.message)
        return
      }
      toast.error(error.message)
      return
    }

    toast.success(`OTP sent to +91 ${phone}`)
    setStep('otp')
  }

  const handleVerify = async (code: string) => {
    setLoading(true)
    setOtpError(false)
    const { error } = await verifyOtp(phone, code)
    setLoading(false)

    if (error) {
      setOtpError(true)
      setResetKey(k => k + 1)
      toast.error(error.message)
      return
    }

    toast.success('Welcome back! 🌸')
    navigate('/dashboard')
  }

  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, var(--cream) 60%, var(--blush))' }}>
      <div className="card fade-up" style={{ width: '100%', maxWidth: 420, padding: '2.5rem', margin: '1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Shield size={24} color="var(--rose)" />
            <span style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.6rem', fontWeight: 900, color: 'var(--rose)' }}>Safe<span style={{ color: 'var(--earth)' }}>She</span></span>
          </div>
          <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--night)' }}>Welcome back</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--muted)', marginTop: '0.3rem' }}>
            {step === 'phone' ? 'Sign in with your mobile number' : `Enter the OTP sent to +91 ${phone}`}
          </p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div className="form-group">
              <label>Mobile Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                <span style={{ position: 'absolute', left: 38, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontWeight: 600, fontSize: '0.88rem' }}>+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="98765 43210"
                  value={phone}
                  maxLength={10}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                  style={{ paddingLeft: '4.2rem' }}
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.3rem' }}>We'll send a 4-digit OTP via SMS.</p>
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Sending OTP…' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <OtpInput length={4} onComplete={handleVerify} error={otpError} disabled={loading} resetKey={resetKey} />
            <button
              type="button"
              onClick={() => { setStep('phone'); setOtpError(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.5rem' }}
            >
              <ArrowLeft size={14} /> Change number
            </button>
            {loading && <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.8rem' }}>Verifying…</p>}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
            New to SafeShe?{' '}
            <Link to="/register" style={{ color: 'var(--rose)', fontWeight: 600, textDecoration: 'none' }}>Create account →</Link>
          </p>
        </div>
      </div>

      {/* "Not found" blocking popup */}
      {notFoundOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(26,15,10,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="card" style={{ maxWidth: 380, width: '100%', padding: '2rem', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--blush)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', margin: '0 auto 1rem' }}>📵</div>
            <h3 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.2rem', fontWeight: 800, color: 'var(--night)', marginBottom: '0.5rem' }}>No account found</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>{notFoundMsg}</p>
            <div style={{ display: 'flex', gap: '0.7rem' }}>
              <button onClick={() => setNotFoundOpen(false)} className="btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Try another number</button>
              <button onClick={() => navigate('/register')} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Sign Up</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
