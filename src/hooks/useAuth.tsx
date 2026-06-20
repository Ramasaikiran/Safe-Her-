import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, type Profile, type UserRole } from '../lib/supabase'

/**
 * SafeShe Auth — Email + password, with a 6-digit OTP step to confirm
 * the email address at signup. Google is a second path that skips both.
 *
 * Flow:
 *  SIGNUP: signupWithPassword(email, password) -> supabase.auth.signUp()
 *          sends a 6-digit confirmation code.
 *          verifySignupOtp(email, code, type:'signup') confirms the email.
 *          completeRegistration() then creates the profiles row.
 *  LOGIN:  loginWithPassword(email, password) -> checks profiles for the
 *          email FIRST (real "account not found" check, not a generic
 *          Supabase rejection) then supabase.auth.signInWithPassword().
 *
 * Google OAuth:
 *  loginWithGoogle() calls supabase.auth.signInWithOAuth({ provider: 'google' }).
 *  Requires the Google provider enabled in Supabase Auth settings with a
 *  Google Cloud OAuth client — that's dashboard config, not code.
 */

export type AuthErrorCode =
  | 'INVALID_EMAIL'
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'INVALID_CREDENTIALS'
  | 'WEAK_PASSWORD'
  | 'OTP_SEND_FAILED'
  | 'OTP_INVALID'
  | 'NETWORK_ERROR'
  | 'UNKNOWN'

export interface AuthError {
  code: AuthErrorCode
  message: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  loginWithPassword: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signupWithPassword: (email: string, password: string) => Promise<{ error: AuthError | null }>
  verifySignupOtp: (email: string, token: string) => Promise<{ error: AuthError | null }>
  completeRegistration: (data: {
    full_name: string
    phone: string
    role?: UserRole
  }) => Promise<{ error: AuthError | null }>
  resendSignupOtp: (email: string) => Promise<{ error: AuthError | null }>
  loginWithGoogle: () => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function friendlyAuthError(err: unknown): AuthError {
  const msg = (err as { message?: string })?.message?.toLowerCase() || ''
  if (msg.includes('network') || msg.includes('fetch')) {
    return { code: 'NETWORK_ERROR', message: 'No internet connection. Please check your network and try again.' }
  }
  if (msg.includes('rate limit') || msg.includes('too many')) {
    return { code: 'OTP_SEND_FAILED', message: 'Too many attempts. Please wait a minute and try again.' }
  }
  if (msg.includes('invalid login credentials')) {
    return { code: 'INVALID_CREDENTIALS', message: 'Incorrect password. Please try again.' }
  }
  if (msg.includes('email not confirmed')) {
    return { code: 'INVALID_CREDENTIALS', message: 'Please verify your email before signing in.' }
  }
  if (msg.includes('password') && (msg.includes('weak') || msg.includes('short') || msg.includes('least'))) {
    return { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters.' }
  }
  if (msg.includes('invalid') && msg.includes('otp')) {
    return { code: 'OTP_INVALID', message: 'Incorrect code. Please check and try again.' }
  }
  if (msg.includes('token') && (msg.includes('expired') || msg.includes('invalid'))) {
    return { code: 'OTP_INVALID', message: 'This code has expired or is invalid. Please request a new one.' }
  }
  return { code: 'UNKNOWN', message: 'Something went wrong. Please try again or contact support.' }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (error) {
      console.error('Failed to load profile:', error.message)
      setProfile(null)
      return null
    }
    setProfile(data as Profile | null)
    return data as Profile | null
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id)
  }, [user, loadProfile])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) await loadProfile(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  /**
   * LOGIN: email must already belong to a registered profile.
   * No profile at all -> NOT_FOUND ("No account found, please sign up").
   * Otherwise attempt the real password sign-in.
   */
  const loginWithPassword = useCallback(async (emailRaw: string, password: string): Promise<{ error: AuthError | null }> => {
    const email = emailRaw.trim().toLowerCase()
    if (!isValidEmail(email)) {
      return { error: { code: 'INVALID_EMAIL', message: 'Enter a valid email address.' } }
    }

    try {
      const { data: existing, error: lookupErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (lookupErr) return { error: friendlyAuthError(lookupErr) }

      if (!existing) {
        return {
          error: {
            code: 'NOT_FOUND',
            message: 'No account found with this email. Please sign up first.',
          },
        }
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: friendlyAuthError(error) }
      return { error: null }
    } catch (err) {
      return { error: friendlyAuthError(err) }
    }
  }, [])

  /**
   * SIGNUP: if a profile already exists for this email, send them to login
   * instead. Otherwise create the auth user with a password — Supabase
   * mails a 6-digit confirmation code automatically.
   */
  const signupWithPassword = useCallback(async (emailRaw: string, password: string): Promise<{ error: AuthError | null }> => {
    const email = emailRaw.trim().toLowerCase()
    if (!isValidEmail(email)) {
      return { error: { code: 'INVALID_EMAIL', message: 'Enter a valid email address.' } }
    }
    if (password.length < 8) {
      return { error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters.' } }
    }

    try {
      const { data: existing, error: lookupErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (lookupErr) return { error: friendlyAuthError(lookupErr) }

      if (existing) {
        return {
          error: {
            code: 'ALREADY_EXISTS',
            message: 'An account with this email already exists. Please log in instead.',
          },
        }
      }

      const { error } = await supabase.auth.signUp({ email, password })
      if (error) return { error: friendlyAuthError(error) }
      return { error: null }
    } catch (err) {
      return { error: friendlyAuthError(err) }
    }
  }, [])

  const verifySignupOtp = useCallback(async (emailRaw: string, token: string) => {
    const email = emailRaw.trim().toLowerCase()
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      })
      if (error) return { error: friendlyAuthError(error) }
      if (!data.user) {
        return { error: { code: 'UNKNOWN', message: 'Verification succeeded but no user was returned.' } as AuthError }
      }
      return { error: null }
    } catch (err) {
      return { error: friendlyAuthError(err) }
    }
  }, [])

  const completeRegistration = useCallback(async (regData: { full_name: string; phone: string; role?: UserRole }) => {
    if (!user) {
      return { error: { code: 'UNKNOWN', message: 'Session expired. Please verify your email again.' } as AuthError }
    }
    const email = user.email
    if (!email) {
      return { error: { code: 'UNKNOWN', message: 'Email missing from session. Please try again.' } as AuthError }
    }

    try {
      const { error } = await supabase.from('profiles').insert({
        id: user.id,
        email,
        phone: regData.phone.trim(),
        role: regData.role || 'traveller',
        full_name: regData.full_name,
      })
      if (error) {
        if (error.code === '23505') {
          return { error: { code: 'ALREADY_EXISTS', message: 'This email is already registered.' } as AuthError }
        }
        return { error: friendlyAuthError(error) }
      }

      if (regData.role === 'guide') {
        const { error: gpErr } = await supabase.from('guide_profiles').insert({
          id: user.id,
          hourly_rate: 99,
          status: 'pending',
        })
        if (gpErr) return { error: friendlyAuthError(gpErr) }
      }

      await loadProfile(user.id)
      return { error: null }
    } catch (err) {
      return { error: friendlyAuthError(err) }
    }
  }, [user, loadProfile])

  const updateProfile = useCallback(async (data: Partial<Profile>) => {
    if (!user) {
      return { error: { code: 'UNKNOWN', message: 'Session expired. Please log in again.' } as AuthError }
    }
    try {
      const { error } = await supabase.from('profiles').update(data).eq('id', user.id)
      if (error) return { error: friendlyAuthError(error) }
      await loadProfile(user.id)
      return { error: null }
    } catch (err) {
      return { error: friendlyAuthError(err) }
    }
  }, [user, loadProfile])

  const resendSignupOtp = useCallback(async (emailRaw: string) => {
    const email = emailRaw.trim().toLowerCase()
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email })
      if (error) return { error: friendlyAuthError(error) }
      return { error: null }
    } catch (err) {
      return { error: friendlyAuthError(err) }
    }
  }, [])

  const loginWithGoogle = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) return { error: friendlyAuthError(error) }
      return { error: null }
    } catch (err) {
      return { error: friendlyAuthError(err) }
    }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user, session, profile, loading,
        loginWithPassword, signupWithPassword, verifySignupOtp,
        completeRegistration, resendSignupOtp, loginWithGoogle,
        signOut, refreshProfile, updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
