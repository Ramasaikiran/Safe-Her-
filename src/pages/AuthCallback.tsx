import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

/**
 * Lands here after Google OAuth redirect.
 * Reads intended_role from sessionStorage (set by Register.tsx before OAuth).
 * Creates profile with the correct role for both travellers and guides.
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

      const u = session.user

      // Read intended role saved before OAuth redirect
      const intendedRole = (sessionStorage.getItem('intended_role') || 'traveller') as 'traveller' | 'guide'
      sessionStorage.removeItem('intended_role')

      // Check if profile already exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('id, role, onboarding_completed')
        .eq('id', u.id)
        .maybeSingle()

      if (existing) {
        // Returning user — just redirect based on their role
        await refreshProfile()
        if (existing.role === 'guide') {
          navigate('/guide-dashboard', { replace: true })
        } else {
          navigate(existing.onboarding_completed ? '/dashboard' : '/onboarding', { replace: true })
        }
        return
      }

      // New Google user — create profile with intended role
      const isGuide = intendedRole === 'guide'

      const { error: profileErr } = await supabase.from('profiles').upsert({
        id: u.id,
        email: u.email,
        full_name: u.user_metadata?.full_name || u.user_metadata?.name || '',
        phone: u.user_metadata?.phone || null,
        avatar_url: u.user_metadata?.avatar_url || null,
        role: intendedRole,
        onboarding_completed: isGuide,
      }, { onConflict: 'id' })

      if (profileErr) {
        toast.error('Could not finish setting up your account. Please try again.')
        navigate('/login', { replace: true })
        return
      }

      // If guide — create guide_profiles row too
      if (isGuide) {
        const { error: gpErr } = await supabase.from('guide_profiles').upsert({
          id: u.id,
          hourly_rate: 99,
          status: 'pending',
          kyc_status: 'not_started',
          city: null,
        }, { onConflict: 'id' })

        if (gpErr) {
          toast.error('Guide profile could not be created. Please contact support.')
          navigate('/login', { replace: true })
          return
        }

        await refreshProfile()
        toast.success('Welcome to SafeShe! Complete your guide profile to start accepting bookings.')
        navigate('/guide-dashboard', { replace: true })
        return
      }

      await refreshProfile()
      navigate('/onboarding', { replace: true })
    }

    finish()
    return () => { cancelled = true }
  }, [navigate, refreshProfile])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--cream)', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--dawn-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🛡️</div>
      <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans,sans-serif', fontSize: '0.92rem' }}>Setting up your account…</p>
    </div>
  )
}
