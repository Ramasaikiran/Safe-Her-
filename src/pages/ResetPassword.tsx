import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Shield, Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * Landed on after clicking the link from requestPasswordReset's email.
 * Supabase's detectSessionInUrl picks up the recovery token from the
 * URL automatically and fires a PASSWORD_RECOVERY auth event with a
 * short-lived session — that session (not a password) is what
 * authorizes updatePassword() below.
 */
export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()

  const [ready, setReady] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let resolved = false
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        resolved = true
        setReady(true)
      }
    })
    // Fallback: if the recovery event already fired before this listener
    // attached, a session will already be present.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!resolved && session) setReady(true)
      else if (!resolved) setTimeout(() => { if (!resolved) setInvalid(true) }, 3000)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { toast.error('Password must be at least 8 characters.'); return }
    if (!/[^A-Za-z0-9]/.test(password)) { toast.error('Password must include at least one special character.'); return }
    if (password !== confirmPassword) { toast.error('Passwords do not match.'); return }

    setLoading(true)
    const { error } = await updatePassword(password)
    setLoading(false)
    if (error) { toast.error(error.message); return }

    toast.success('Password updated 🌸')
    navigate('/dashboard')
  }

  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <div className="auth-hero-mark">
          <Shield size={26} color="var(--night)" />
          <span style={{ fontFamily: 'Fraunces,serif', fontSize: '1.5rem', fontWeight: 600, color: 'var(--night)' }}>SafeShe</span>
        </div>
        <p className="auth-hero-quote">"A fresh password, a fresh start."</p>
      </div>

      <div className="auth-panel">
        <div className="auth-card fade-up">
          {invalid ? (
            <div style={{ textAlign: 'center' }}>
              <ShieldAlert size={40} color="var(--rose)" style={{ marginBottom: '1rem' }} />
              <h1 className="auth-title" style={{ marginBottom: '0.5rem' }}>This link has expired</h1>
              <p className="auth-sub" style={{ marginBottom: '1.6rem' }}>Reset links only work for a short time. Request a new one from the login page.</p>
              <Link to="/login" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Back to sign in</Link>
            </div>
          ) : !ready ? (
            <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.9rem' }}>Verifying your link…</p>
          ) : (
            <>
              <div style={{ marginBottom: '1.6rem' }}>
                <p className="auth-eyebrow">Reset password</p>
                <h1 className="auth-title">Set a new password</h1>
                <p className="auth-sub" style={{ marginTop: '0.4rem' }}>Choose something you haven't used before.</p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div className="form-group">
                  <label>New password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'} placeholder="At least 8 characters" value={password}
                      onChange={e => setPassword(e.target.value)} required minLength={8}
                      style={{ paddingLeft: '2.6rem', paddingRight: '2.6rem' }}
                    />
                    <button type="button" onClick={() => setShowPassword(s => !s)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex' }}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.3rem' }}>
                    8+ characters, including one special character (e.g. ! @ # $).
                  </p>
                </div>
                <div className="form-group">
                  <label>Confirm new password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                    <input
                      type={showConfirm ? 'text' : 'password'} placeholder="Re-enter your password" value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)} required minLength={8}
                      style={{ paddingLeft: '2.6rem', paddingRight: '2.6rem' }}
                    />
                    <button type="button" onClick={() => setShowConfirm(s => !s)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex' }}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
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
        </div>
      </div>
    </div>
  )
}
