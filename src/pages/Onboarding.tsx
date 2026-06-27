import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Shield } from 'lucide-react'
import toast from 'react-hot-toast'

// Steps 2 & 3 removed — hobbies, interests, destinations, languages, bio, avatar
// Users go straight to dashboard after email verification + basic details in Register.
// This page now just marks onboarding_completed = true and redirects.

export default function Onboarding() {
  const { profile, updateProfile } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const finish = async () => {
      const { error } = await updateProfile({ onboarding_completed: true })
      if (error) {
        toast.error('Something went wrong. Please try again.')
        return
      }
      navigate('/dashboard', { replace: true })
    }
    if (profile && !profile.onboarding_completed) finish()
    else if (profile?.onboarding_completed) navigate('/dashboard', { replace: true })
  }, [profile])

  return (
    <div className="onboard-shell">
      <div className="onboard-card fade-up" style={{ textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--dawn-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.4rem' }}>
          <Shield size={30} color="var(--night)" />
        </div>
        <h1 className="auth-title" style={{ marginBottom: '0.6rem' }}>
          Welcome to SafeShe, {profile?.full_name?.split(' ')[0] || 'traveller'} 🌸
        </h1>
        <p className="auth-sub">Setting up your account…</p>
      </div>
    </div>
  )
}
