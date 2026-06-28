import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

type Step = 'email' | 'otp' | 'password'

export default function ResetPassword() {
  const { requestPasswordReset, updatePassword } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // Step 1 — Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await requestPasswordReset(email)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('OTP sent to your email.')
    setStep('otp')
  }

  // Step 2 — Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length < 6) { toast.error('Enter the 6-digit OTP from your email.'); return }
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp.trim(),
      type: 'recovery',
    })
    setLoading(false)
    if (error) { toast.error('Invalid or expired OTP. Please try again.'); return }
    toast.success('OTP verified ✓')
    setStep('password')
  }

  // Step 3 — Set new password
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { toast.error('Password must be at least 8 characters.'); return }
    if (!/[^A-Za-z0-9]/.test(password)) { toast.error('Include at least one special character (e.g. ! @ # $).'); return }
    if (password !== confirmPassword) { toast.error('Passwords do not match.'); return }
    setLoading(true)
    const { error } = await updatePassword(password)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Password updated 🌸')
    navigate('/login')
  }

  const STEPS = ['Email', 'Verify OTP', 'New Password']

  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <div className="auth-hero-mark">
          <Shield size={26} color="var(--night)" />
          <span style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--night)' }}>SafeShe</span>
        </div>
        <p className="auth-hero-quote">"A fresh start is always possible."</p>
      </div>

      <div className="auth-panel">
        <div className="auth-card fade-up">

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.8rem' }}>
            {STEPS.map((s, i) => {
              const stepKey = (['email','otp','password'] as Step[])[i]
              const done = ['email','otp','password'].indexOf(step) > i
              const active = step === stepKey
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: i < 2 ? 1 : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', fontSize: '0.68rem', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: done ? 'var(--sage)' : active ? 'var(--rose)' : 'var(--border)',
                      color: done || active ? 'white' : 'var(--muted)',
                    }}>
                      {done ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: active ? 700 : 400, color: active ? 'var(--night)' : 'var(--muted)', whiteSpace: 'nowrap' }}>{s}</span>
                  </div>
                  {i < 2 && <div style={{ flex: 1, height: 1, background: done ? 'var(--sage)' : 'var(--border)', borderRadius: 1 }} />}
                </div>
              )
            })}
          </div>

          {/* Step 1 — Email */}
          {step === 'email' && (
            <>
              <p className="auth-eyebrow">Forgot password</p>
              <h1 className="auth-title">Reset your password</h1>
              <p className="auth-sub" style={{ marginTop: '0.4rem', marginBottom: '1.6rem' }}>
                Enter your email and we'll send a 6-digit OTP.
              </p>
              <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label>Email address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                    <input type="email" placeholder="you@email.com" value={email}
                      onChange={e => setEmail(e.target.value)} required
                      style={{ paddingLeft: '2.6rem' }} />
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                  {loading ? 'Sending…' : 'Send OTP'}
                </button>
              </form>
            </>
          )}

          {/* Step 2 — OTP */}
          {step === 'otp' && (
            <>
              <p className="auth-eyebrow">Check your email</p>
              <h1 className="auth-title">Enter the OTP</h1>
              <p className="auth-sub" style={{ marginTop: '0.4rem', marginBottom: '1.6rem' }}>
                We sent a 6-digit code to <strong>{email}</strong>. Check your inbox (and spam folder).
              </p>
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label>6-digit OTP</label>
                  <input
                    type="text" inputMode="numeric" maxLength={6}
                    placeholder="_ _ _ _ _ _"
                    value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    style={{ letterSpacing: '0.35em', fontSize: '1.5rem', textAlign: 'center', fontWeight: 800 }}
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={loading || otp.length < 6} style={{ width: '100%', justifyContent: 'center' }}>
                  {loading ? 'Verifying…' : 'Verify OTP'}
                </button>
                <button type="button" onClick={() => { setStep('email'); setOtp('') }}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
                  ← Wrong email? Go back
                </button>
              </form>
            </>
          )}

          {/* Step 3 — New password */}
          {step === 'password' && (
            <>
              <p className="auth-eyebrow">Almost done</p>
              <h1 className="auth-title">Set a new password</h1>
              <p className="auth-sub" style={{ marginTop: '0.4rem', marginBottom: '1.6rem' }}>
                Choose something strong you haven't used before.
              </p>
              <form onSubmit={handleSetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label>New password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                    <input type={showPassword ? 'text' : 'password'} placeholder="At least 8 characters"
                      value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                      style={{ paddingLeft: '2.6rem', paddingRight: '2.6rem' }} />
                    <button type="button" onClick={() => setShowPassword(s => !s)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex' }}>
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.3rem' }}>
                    8+ characters, include one special character (! @ # $).
                  </p>
                </div>
                <div className="form-group">
                  <label>Confirm new password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                    <input type={showPassword ? 'text' : 'password'} placeholder="Re-enter password"
                      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                      style={{ paddingLeft: '2.6rem' }} />
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--rose)', marginTop: '0.3rem' }}>Passwords don't match.</p>
                  )}
                </div>
                <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </>
          )}

          <div style={{ textAlign: 'center', marginTop: '1.6rem', paddingTop: '1.2rem', borderTop: '1px solid var(--border)' }}>
            <Link to="/login" style={{ fontSize: '0.88rem', color: 'var(--muted)', textDecoration: 'none' }}>
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
