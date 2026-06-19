import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, type Profile, type UserRole } from '../lib/supabase'

/**
 * SafeShe Auth — Phone + OTP only.
 *
 * Flow:
 *  1. requestOtp(phone)        -> supabase.auth.signInWithOtp({ phone })
 *  2. verifyOtp(phone, token)  -> supabase.auth.verifyOtp({ phone, token, type: 'sms' })
 *  3. After verification:
 *       - If a profiles row exists for this user -> session restored, role known.
 *       - If NOT -> caller must complete registration (completeRegistration)
 *         which creates the profiles row with the chosen role (role-locked).
 *
 * "Not found" handling:
 *  - loginExistingUser(phone) checks `profiles` for that phone BEFORE sending an OTP
 *    for the LOGIN flow. If no profile exists, we surface a clear
 *    "No account found" error instead of silently creating one or sending an OTP
 *    that leads nowhere.
 *  - Role lock: if a phone is already registered under a different role than the
 *    portal the user is trying to use, we return a ROLE_CONFLICT error with the
 *    existing role so the UI can redirect.
 */

export type AuthErrorCode =
  | 'INVALID_PHONE'
  | 'NOT_FOUND'
  | 'ROLE_CONFLICT'
  | 'OTP_SEND_FAILED'
  | 'OTP_INVALID'
  | 'NETWORK_ERROR'
  | 'UNKNOWN'

export interface AuthError {
  code: AuthErrorCode
  message: string
  meta?: { existingRole?: UserRole }
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  // Login flow (existing users only)
  loginRequestOtp: (phone: string, expectedRole: UserRole) => Promise<{ error: AuthError | null }>
  // Signup flow (new users)
  signupRequestOtp: (phone: string, expectedRole: UserRole) => Promise<{ error: AuthError | null }>
  // Verify OTP for either flow
  verifyOtp: (phone: string, token: string) => Promise<{ error: AuthError | null; isNewUser: boolean }>
  // Complete profile creation for new users (role-locked at this point)
  completeRegistration: (data: {
    full_name: string
    role: UserRole
    city?: string
  }) => Promise<{ error: AuthError | null }>
  resendOtp: (phone: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function toE164(phoneDigits: string): string {
  // India-only for now; phoneDigits should be exactly 10 digits
  return `+91${phoneDigits}`
}

function friendlyAuthError(err: unknown): AuthError {
  const msg = (err as { message?: string })?.message?.toLowerCase() || ''
  if (msg.includes('network') || msg.includes('fetch')) {
    return { code: 'NETWORK_ERROR', message: 'No internet connection. Please check your network and try again.' }
  }
  if (msg.includes('rate limit') || msg.includes('too many')) {
    return { code: 'OTP_SEND_FAILED', message: 'Too many attempts. Please wait a minute before requesting another OTP.' }
  }
  if (msg.includes('invalid') && msg.includes('otp')) {
    return { code: 'OTP_INVALID', message: 'Incorrect OTP. Please check and try again.' }
  }
  if (msg.includes('token') && (msg.includes('expired') || msg.includes('invalid'))) {
    return { code: 'OTP_INVALID', message: 'This OTP has expired or is invalid. Please request a new one.' }
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
   * LOGIN: phone must already belong to a registered profile with matching role.
   * - No profile at all  -> NOT_FOUND ("No account found, please sign up")
   * - Profile exists but role differs -> ROLE_CONFLICT
   * - Otherwise send OTP.
   */
  const loginRequestOtp = useCallback(async (phoneDigits: string, expectedRole: UserRole): Promise<{ error: AuthError | null }> => {
    if (!/^\d{10}$/.test(phoneDigits)) {
      return { error: { code: 'INVALID_PHONE', message: 'Enter a valid 10-digit mobile number.' } }
    }
    const phone = toE164(phoneDigits)

    try {
      const { data: existing, error: lookupErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('phone', phone)
        .maybeSingle()

      if (lookupErr) {
        return { error: friendlyAuthError(lookupErr) }
      }

      if (!existing) {
        return {
          error: {
            code: 'NOT_FOUND',
            message: 'No account found with this phone number. Please sign up first.',
          },
        }
      }

      if (existing.role !== expectedRole) {
        return {
          error: {
            code: 'ROLE_CONFLICT',
            message: `This number is registered as a ${existing.role}. Please use the ${existing.role} login.`,
            meta: { existingRole: existing.role as UserRole },
          },
        }
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: { shouldCreateUser: false },
      })
      if (error) return { error: friendlyAuthError(error) }
      return { error: null }
    } catch (err) {
      return { error: friendlyAuthError(err) }
    }
  }, [])

  /**
   * SIGNUP: phone must NOT already belong to a profile of a *different* role.
   * If a profile with the SAME role already exists, treat this as an existing
   * account and route the user to login instead (no duplicate signups).
   */
  const signupRequestOtp = useCallback(async (phoneDigits: string, expectedRole: UserRole): Promise<{ error: AuthError | null }> => {
    if (!/^\d{10}$/.test(phoneDigits)) {
      return { error: { code: 'INVALID_PHONE', message: 'Enter a valid 10-digit mobile number.' } }
    }
    const phone = toE164(phoneDigits)

    try {
      const { data: existing, error: lookupErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('phone', phone)
        .maybeSingle()

      if (lookupErr) {
        return { error: friendlyAuthError(lookupErr) }
      }

      if (existing) {
        if (existing.role !== expectedRole) {
          return {
            error: {
              code: 'ROLE_CONFLICT',
              message: `This number is already registered as a ${existing.role}. Please use the ${existing.role} login instead.`,
              meta: { existingRole: existing.role as UserRole },
            },
          }
        }
        return {
          error: {
            code: 'NOT_FOUND', // reuse channel: signals "go to login" in UI via a different message
            message: 'An account with this number already exists. Please log in instead.',
          },
        }
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: { shouldCreateUser: true },
      })
      if (error) return { error: friendlyAuthError(error) }
      return { error: null }
    } catch (err) {
      return { error: friendlyAuthError(err) }
    }
  }, [])

  const verifyOtp = useCallback(async (phoneDigits: string, token: string) => {
    const phone = toE164(phoneDigits)
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
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

  const completeRegistration = useCallback(async (regData: { full_name: string; role: UserRole; city?: string }) => {
    if (!user) {
      return { error: { code: 'UNKNOWN', message: 'Session expired. Please verify your phone number again.' } as AuthError }
    }
    const phone = user.phone ? `+${user.phone}` : null
    if (!phone) {
      return { error: { code: 'UNKNOWN', message: 'Phone number missing from session. Please try again.' } as AuthError }
    }

    try {
      const { error } = await supabase.from('profiles').insert({
        id: user.id,
        phone,
        role: regData.role,
        full_name: regData.full_name,
        city: regData.city || null,
      })
      if (error) {
        if (error.code === '23505') {
          return { error: { code: 'ROLE_CONFLICT', message: 'This phone number is already registered.' } as AuthError }
        }
        return { error: friendlyAuthError(error) }
      }

      // If signing up as guide, create the linked guide_profiles row (pending verification)
      if (regData.role === 'guide') {
        const { error: gpErr } = await supabase.from('guide_profiles').insert({
          id: user.id,
          hourly_rate: 99,
          status: 'pending',
        })
        if (gpErr) {
          return { error: friendlyAuthError(gpErr) }
        }
      }

      await loadProfile(user.id)
      return { error: null }
    } catch (err) {
      return { error: friendlyAuthError(err) }
    }
  }, [user, loadProfile])

  const resendOtp = useCallback(async (phoneDigits: string) => {
    const phone = toE164(phoneDigits)
    try {
      const { error } = await supabase.auth.resend({ type: 'sms', phone } as never)
      if (error) {
        // Fall back to signInWithOtp resend semantics
        const { error: err2 } = await supabase.auth.signInWithOtp({ phone })
        if (err2) return { error: friendlyAuthError(err2) }
      }
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
        completeRegistration, resendOtp, signOut, refreshProfile,
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
