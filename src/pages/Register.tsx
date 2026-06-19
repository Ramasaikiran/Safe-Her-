import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import OtpInput from '../components/OtpInput'
import { INDIAN_CITIES } from '../lib/cities'
import { Shield, Phone, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

type Step = 'phone' | 'otp' | 'profile'

/**
 * Register — phone + OTP only (no email field anywhere).
 *
 * Steps:
 *  1. phone   -> enter 10-digit mobile number, request OTP
 *  2. otp     -> verify 4-digit SMS code
 *  3. profile -> new users only: full name + city, then create profile row (role = traveller)
 *
 * If the phone is already registered with the SAME role, signupRequestOtp returns
 * NOT_FOUND with a "log in instead" message — we surface that and link to /login.
 * If registered under a DIFFERENT role, we surface ROLE_CONFLICT.
 */
export default function Register() {
  const { signupRequestOtp, verifyOtp, completeRegistration } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpError, setOtpError] = useState(false)
  const [resetKey, setResetKey] = useState(0)

  const [fullName, setFullName] = useState('')
  const [city, setCity] = useState('')

  const [existsOpen, setExistsOpen] = useState(false)
  const [existsMsg, setExistsMsg] = useState('')

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\d{10}$/.test(phone)) {
      toast.error('Enter a valid 10-digit mobile number.')
      return
    }
    setLoading(true)
    const { error } = await signupRequestOtp(phone, 'traveller')
    setLoading(false)

    if (error) {
      if (error.code === 'NOT_FOUND') {
        // "An account with this number already exists. Please log in instead."
        setExistsMsg(error.message)
        setExistsOpen(true)
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
    const { error, isNewUser } = await verifyOtp(phone, code)
    setLoading(false)

    if (error) {
      setOtpError(true)
      setResetKey(k => k + 1)
      toast.error(error.message)
      return
    }

    if (isNewUser) {
      toast.success('Number verified ✓')
      setStep('profile')
    } else {
      // Edge case: account existed already (race condition) — log straight in
      toast.success('Welcome back! 🌸')
      navigate('/dashboard')
    }
  }

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) { toast.error('Please enter your name.'); return }
    if (!city) { toast.error('Please select your city.'); return }

    setLoading(true)
    const { error } = await completeRegistration({ full_name: fullName.trim(), role: 'traveller', city })
    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Account created! Welcome to SafeShe 🌸')
    navigate('/dashboard')
  }

  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, var(--cream) 60%, var(--blush))' }}>
      <div className="card fade-up" style={{ width: '100%', maxWidth: 440, padding: '2.5rem', margin: '1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Shield size={24} color="var(--rose)" />
            <span style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.6rem', fontWeight: 900, color: 'var(--rose)' }}>Safe<span style={{ color: 'var(--earth)' }}>She</span></span>
          </div>
          <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--night)' }}>
            {step === 'profile' ? 'Complete your profile' : 'Create your account'}
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--muted)', marginTop: '0.3rem' }}>
            {step === 'phone' && 'Free forever. Travel safe today.'}
            {step === 'otp' && `Enter the OTP sent to +91 ${phone}`}
            {step === 'profile' && `+91 ${phone} · Verified ✓`}
          </p>
        </div>

        {step === 'phone' && (
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
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.3rem' }}>We'll send a 4-digit OTP via SMS. No email required.</p>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', lineHeight: 1.5 }}>
              By signing up you agree to our <span style={{ color: 'var(--rose)', cursor: 'pointer' }}>Terms</span> and <span style={{ color: 'var(--rose)', cursor: 'pointer' }}>Privacy Policy</span>.
            </p>
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Sending OTP…' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
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

        {step === 'profile' && (
          <form onSubmit={handleCompleteProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" placeholder="Sanya Kapoor" value={fullName}
                onChange={e => setFullName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Your City</label>
              <select value={city} onChange={e => setCity(e.target.value)} required>
                <option value="">Select your city</option>
                {INDIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>
        )}

        {step === 'phone' && (
          <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--rose)', fontWeight: 600, textDecoration: 'none' }}>Sign in →</Link>
            </p>
          </div>
        )}
      </div>

      {/* "Account already exists" blocking popup */}
      {existsOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(26,15,10,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="card" style={{ maxWidth: 380, width: '100%', padding: '2rem', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--sage-l)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', margin: '0 auto 1rem' }}>✓</div>
            <h3 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.2rem', fontWeight: 800, color: 'var(--night)', marginBottom: '0.5rem' }}>Account already exists</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>{existsMsg}</p>
            <div style={{ display: 'flex', gap: '0.7rem' }}>
              <button onClick={() => setExistsOpen(false)} className="btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Try another number</button>
              <button onClick={() => navigate('/login')} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Log In</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
