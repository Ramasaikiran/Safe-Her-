import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, type Profile, type UserRole } from '../lib/supabase'

/**
 * SafeShe Auth — Email + OTP, with Google as a second option.
 *
 * Flow:
 *  1. requestOtp(email)        -> supabase.auth.signInWithOtp({ email })
 *  2. verifyOtp(email, token)  -> supabase.auth.verifyOtp({ email, token, type: 'email' })
 *  3. After verification:
 *       - If a profiles row exists -> session restored, straight to app.
 *       - If NOT -> caller must complete registration (completeRegistration),
 *         which creates the profiles row, then routes to onboarding.
 *
 * "Account not found" handling:
 *  - loginRequestOtp(email) checks `profiles` for that email BEFORE sending
 *    an OTP for the LOGIN flow (shouldCreateUser: false). If no profile
 *    exists, we surface a real "No account found" error — Supabase never
 *    silently creates a user or mails an OTP that leads nowhere.
 *  - signupRequestOtp(email) checks the opposite: if a profile already
 *    exists, we tell the user to log in instead.
 *
 * Google OAuth:
 *  - loginWithGoogle() calls supabase.auth.signInWithOAuth({ provider: 'google' }).
 *    Requires the Google provider to be enabled in Supabase Auth settings
 *    (Dashboard → Authentication → Providers → Google) with a Google Cloud
 *    OAuth client ID/secret. This is config on Kiran's side; the code path
 *    works once that's switched on.
 */

export type AuthErrorCode =
  | 'INVALID_EMAIL'
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
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
  loginRequestOtp: (email: string) => Promise<{ error: AuthError | null }>
  signupRequestOtp: (email: string) => Promise<{ error: AuthError | null }>
  verifyOtp: (email: string, token: string) => Promise<{ error: AuthError | null; isNewUser: boolean }>
  completeRegistration: (data: {
    full_name: string
    phone?: string
    role?: UserRole
  }) => Promise<{ error: AuthError | null }>
  resendOtp: (email: string) => Promise<{ error: AuthError | null }>
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
    return { code: 'OTP_SEND_FAILED', message: 'Too many attempts. Please wait a minute before requesting another code.' }
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
   * shouldCreateUser: false means Supabase itself will refuse to mail an
   * OTP for an unknown address — the profiles check below is what gives
   * us a real, immediate "Account not found" message instead of waiting
   * for that rejection.
   */
  const loginRequestOtp = useCallback(async (emailRaw: string): Promise<{ error: AuthError | null }> => {
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

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      })
      if (error) return { error: friendlyAuthError(error) }
      return { error: null }
    } catch (err) {
      return { error: friendlyAuthError(err) }
    }
  }, [])

  /**
   * SIGNUP: if a profile already exists for this email, send them to login
   * instead of issuing a duplicate OTP.
   */
  const signupRequestOtp = useCallback(async (emailRaw: string): Promise<{ error: AuthError | null }> => {
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

      if (existing) {
        return {
          error: {
            code: 'ALREADY_EXISTS',
            message: 'An account with this email already exists. Please log in instead.',
          },
        }
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      })
      if (error) return { error: friendlyAuthError(error) }
      return { error: null }
    } catch (err) {
      return { error: friendlyAuthError(err) }
    }
  }, [])

  const verifyOtp = useCallback(async (emailRaw: string, token: string) => {
    const email = emailRaw.trim().toLowerCase()
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      })
      if (error) return { error: friendlyAuthError(error), isNewUser: false }

      const authedUser = data.user
      if (!authedUser) {
        return { error: { code: 'UNKNOWN', message: 'Verification succeeded but no user was returned.' } as AuthError, isNewUser: false }
      }

      const existingProfile = await loadProfile(authedUser.id)
      return { error: null, isNewUser: !existingProfile }
    } catch (err) {
      return { error: friendlyAuthError(err), isNewUser: false }
    }
  }, [loadProfile])

  const completeRegistration = useCallback(async (regData: { full_name: string; phone?: string; role?: UserRole }) => {
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
        phone: regData.phone?.trim() || null,
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

  const resendOtp = useCallback(async (emailRaw: string) => {
    const email = emailRaw.trim().toLowerCase()
    try {
      const { error } = await supabase.auth.signInWithOtp({ email })
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
        loginRequestOtp, signupRequestOtp, verifyOtp,
        completeRegistration, resendOtp, loginWithGoogle,
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
