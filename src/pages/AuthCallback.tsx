import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

/**
 * Lands here after Google OAuth redirect. Supabase's detectSessionInUrl
 * already parses the session; we just wait for it, then route based on
 * whether a profile row exists yet.
 */
export default function AuthCallback() {
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()

  useEffect(() => {
    let cancelled = false

    const finish = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return

      if (!session?.user) {
        toast.error('Sign-in did not complete. Please try again.')
        navigate('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, onboarding_completed')
        .eq('id', session.user.id)
        .maybeSingle()

      if (!profile) {
        // First time via Google — create a minimal profile, then onboard.
        const { error } = await supabase.from('profiles').insert({
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'New traveller',
          phone: session.user.user_metadata?.phone || null,
          avatar_url: session.user.user_metadata?.avatar_url || null,
        })
        if (error) {
          toast.error('Could not finish setting up your account.')
          navigate('/login')
          return
        }
        await refreshProfile()
        navigate('/onboarding')
        return
      }

      await refreshProfile()
      navigate(profile.onboarding_completed ? '/dashboard' : '/onboarding')
    }

    finish()
    return () => { cancelled = true }
  }, [navigate, refreshProfile])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--cream)', flexDirection: 'column', gap: '1rem' }}>
      <div className="horizon-bar" style={{ width: 220 }}>
        <div className="horizon-bar-fill" style={{ width: '70%' }} />
      </div>
      <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.92rem' }}>Signing you in…</p>
    </div>
  )
}
