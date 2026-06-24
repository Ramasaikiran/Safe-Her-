import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import {
  Compass, Star, Briefcase, IndianRupee, LogOut, Phone, Calendar,
  CheckCircle2, Clock, MapPin, ShieldCheck, AlertTriangle, Loader2, Eye, EyeOff,
} from 'lucide-react'
import toast from 'react-hot-toast'

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'Gujarati', 'Punjabi', 'Konkani', 'Rajasthani']
const SPECIALTIES = ['Heritage Walks', 'Food Tours', 'Night Markets', 'Beach Safety', 'Local Culture', 'Photography Spots', 'Shopping', 'Trekking', 'Nightlife']

interface GuideProfileRow {
  id: string
  status: string
  rating: number
  reviews_count: number
  trips_count: number
  hourly_rate: number
  city: string | null
  languages: string[]
  specialties: string[]
  bio: string | null
  kyc_status: 'not_started' | 'pending' | 'verified' | 'failed'
  kyc_verified_name: string | null
  kyc_photo_url: string | null
  kyc_aadhaar_last4: string | null
}

interface TripBooking {
  id: string
  traveller_id: string
  booking_date: string
  hours: number | null
  amount: number
  status: string
  payment_status: string
  notes: string | null
  created_at: string
}

interface TravellerInfo { full_name: string; phone: string | null }

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  pending: { color: 'var(--sand)', bg: 'rgba(212,165,116,0.12)' },
  confirmed: { color: 'var(--sage)', bg: 'rgba(122,158,126,0.12)' },
  completed: { color: 'var(--earth)', bg: 'var(--warm)' },
  cancelled: { color: 'var(--muted)', bg: '#F3F0ED' },
}

const KYC_INFO: Record<string, { label: string; color: string; bg: string }> = {
  not_started: { label: 'Not verified', color: 'var(--muted)', bg: '#F3F0ED' },
  pending:     { label: 'OTP sent — awaiting verification', color: 'var(--sand)', bg: 'rgba(212,165,116,0.12)' },
  verified:    { label: 'Aadhaar verified ✓', color: 'var(--sage)', bg: 'rgba(122,158,126,0.12)' },
  failed:      { label: 'Verification failed', color: 'var(--rose)', bg: 'var(--blush)' },
}

export default function GuideDashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const [guideProfile, setGuideProfile] = useState<GuideProfileRow | null>(null)
  const [trips, setTrips] = useState<TripBooking[]>([])
  const [travellers, setTravellers] = useState<Record<string, TravellerInfo>>({})
  const [loading, setLoading] = useState(true)

  // editable profile fields
  const [hourlyRate, setHourlyRate] = useState(99)
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')
  const [languages, setLanguages] = useState<string[]>([])
  const [specialties, setSpecialties] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  // KYC
  const [aadhaarInput, setAadhaarInput] = useState('')
  const [showAadhaar, setShowAadhaar] = useState(false)
  const [kycOtp, setKycOtp] = useState('')
  const [kycReferenceId, setKycReferenceId] = useState('')
  const [kycLoading, setKycLoading] = useState(false)
  const [kycStep, setKycStep] = useState<'input' | 'otp'>('input')

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data: gp } = await supabase.from('guide_profiles').select('*').eq('id', user.id).maybeSingle()
    if (gp) {
      setGuideProfile(gp as GuideProfileRow)
      setHourlyRate(gp.hourly_rate)
      setCity(gp.city || '')
      setBio(gp.bio || '')
      setLanguages(gp.languages || [])
      setSpecialties(gp.specialties || [])
    }
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, traveller_id, booking_date, hours, amount, status, payment_status, notes, created_at')
      .eq('guide_id', user.id)
      .order('created_at', { ascending: false })
    const tripList = (bookings || []) as TripBooking[]
    setTrips(tripList)
    const ids = [...new Set(tripList.map(t => t.traveller_id))]
    if (ids.length > 0) {
      const { data: pd } = await supabase.from('profiles').select('id, full_name, phone').in('id', ids)
      const map: Record<string, TravellerInfo> = {}
      for (const p of pd || []) map[p.id] = { full_name: p.full_name, phone: p.phone }
      setTravellers(map)
    }
    setLoading(false)
  }, [user])

  useEffect(() => { loadData() }, [loadData])

  const toggle = (list: string[], setList: (v: string[]) => void, item: string) =>
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item])

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from('guide_profiles').update({
      hourly_rate: hourlyRate, city: city || null,
      bio: bio.trim() || null, languages, specialties,
    }).eq('id', user.id)
    setSaving(false)
    if (error) { toast.error('Could not save your profile.'); return }
    toast.success('Profile updated')
    loadData()
  }

  const markCompleted = async (tripId: string) => {
    const { error } = await supabase.from('bookings').update({ status: 'completed' }).eq('id', tripId)
    if (error) { toast.error('Could not update this trip.'); return }
    toast.success('Marked as completed')
    loadData()
  }

  // ── KYC ─────────────────────────────────────────────────────────────
  const handleKycInitiate = async () => {
    const num = aadhaarInput.replace(/\s/g, '')
    if (!/^\d{12}$/.test(num)) { toast.error('Enter a valid 12-digit Aadhaar number.'); return }
    setKycLoading(true)
    const { data, error } = await supabase.functions.invoke('aadhaar-ekyc-initiate', {
      body: { aadhaar_number: num },
    })
    setKycLoading(false)
    if (error || !data?.ok) {
      toast.error(data?.error || 'Could not send OTP. Please try again.')
      return
    }
    setKycReferenceId(data.reference_id)
    setKycStep('otp')
    toast.success('OTP sent to your Aadhaar-linked mobile number.')
  }

  const handleKycVerify = async () => {
    if (kycOtp.length < 6) { toast.error('Enter the 6-digit OTP.'); return }
    setKycLoading(true)
    const { data, error } = await supabase.functions.invoke('aadhaar-ekyc-verify', {
      body: { otp: kycOtp, reference_id: kycReferenceId },
    })
    setKycLoading(false)
    if (error || !data?.ok) {
      toast.error(data?.error || 'Verification failed. Please try again.')
      return
    }
    toast.success(`Aadhaar verified${data.verified_name ? ` as ${data.verified_name}` : ''} ✓`)
    setKycStep('input')
    setAadhaarInput('')
    setKycOtp('')
    loadData()
  }
  // ────────────────────────────────────────────────────────────────────

  const handleSignOut = async () => {
    await signOut()
    toast.success('You have been signed out safely.')
    navigate('/')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', color: 'var(--muted)' }}>
      <Loader2 size={18} className="spin" /> Loading your dashboard…
    </div>
  )

  const kycInfo = KYC_INFO[guideProfile?.kyc_status || 'not_started']

  return (
    <div className="page" style={{ background: 'var(--warm)', paddingTop: '5.5rem' }}>
      <div className="container" style={{ maxWidth: 760, paddingBottom: '3rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.6rem' }}>
          <div>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sage)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Compass size={14} /> Guide Dashboard
            </p>
            <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.6rem', fontWeight: 700, color: 'var(--night)' }}>
              Welcome, {profile?.full_name?.split(' ')[0] || 'there'}
            </h1>
          </div>
          <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.85rem', fontFamily: 'DM Sans,sans-serif' }}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem', marginBottom: '1.6rem' }}>
          <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
            <Star size={16} color="var(--sand)" style={{ marginBottom: '0.3rem' }} />
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{guideProfile?.rating?.toFixed(1) || '—'}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{guideProfile?.reviews_count || 0} reviews</div>
          </div>
          <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
            <Briefcase size={16} color="var(--sage)" style={{ marginBottom: '0.3rem' }} />
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{guideProfile?.trips_count || 0}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Trips completed</div>
          </div>
          <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 20, textTransform: 'capitalize', color: guideProfile?.status === 'active' ? 'var(--sage)' : 'var(--rose)', background: guideProfile?.status === 'active' ? 'rgba(122,158,126,0.12)' : 'var(--blush)' }}>
              {guideProfile?.status || 'unknown'}
            </span>
            {guideProfile?.status === 'suspended' && (
              <p style={{ fontSize: '0.7rem', color: 'var(--rose)', marginTop: '0.3rem', lineHeight: 1.4 }}>Account suspended due to a report. Contact support.</p>
            )}
          </div>
        </div>

        {/* ── Aadhaar e-KYC ─────────────────────────────────────────── */}
        <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.9rem' }}>
          Identity verification
        </h2>
        <div className="card" style={{ padding: '1.4rem', marginBottom: '1.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <ShieldCheck size={18} color={guideProfile?.kyc_status === 'verified' ? 'var(--sage)' : 'var(--muted)'} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: kycInfo.color, background: kycInfo.bg, padding: '0.22rem 0.7rem', borderRadius: 20 }}>
              {kycInfo.label}
            </span>
            {guideProfile?.kyc_aadhaar_last4 && guideProfile.kyc_status !== 'not_started' && (
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Aadhaar ••••{guideProfile.kyc_aadhaar_last4}</span>
            )}
          </div>

          {guideProfile?.kyc_status === 'verified' ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {guideProfile.kyc_photo_url && (
                <img src={guideProfile.kyc_photo_url} alt="KYC photo" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }} />
              )}
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.92rem' }}>{guideProfile.kyc_verified_name || profile?.full_name}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Verified via Aadhaar e-KYC</p>
              </div>
            </div>
          ) : (
            <>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '1rem' }}>
                Verify your identity with Aadhaar. An OTP will be sent to your Aadhaar-linked mobile. Only the last 4 digits of your number are stored — never the full Aadhaar.
              </p>

              {kycStep === 'input' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Aadhaar number</label>
                    <div style={{ position: 'relative' }}>
                      <ShieldCheck size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                      <input
                        type={showAadhaar ? 'text' : 'password'}
                        inputMode="numeric"
                        maxLength={12}
                        placeholder="12-digit Aadhaar number"
                        value={aadhaarInput}
                        onChange={e => setAadhaarInput(e.target.value.replace(/\D/g, '').slice(0, 12))}
                        style={{ paddingLeft: '2.4rem', paddingRight: '2.6rem', letterSpacing: showAadhaar ? '0.12em' : 'normal' }}
                      />
                      <button type="button" onClick={() => setShowAadhaar(s => !s)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex' }}
                        aria-label={showAadhaar ? 'Hide' : 'Show'}>
                        {showAadhaar ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <button onClick={handleKycInitiate} disabled={kycLoading || aadhaarInput.length < 12}
                    className="btn-primary" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {kycLoading ? <><Loader2 size={14} className="spin" /> Sending OTP…</> : 'Send OTP to verify'}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Enter OTP sent to your Aadhaar-linked mobile</label>
                    <input
                      type="text" inputMode="numeric" maxLength={6} placeholder="6-digit OTP"
                      value={kycOtp} onChange={e => setKycOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      style={{ letterSpacing: '0.2em', fontSize: '1.1rem' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button onClick={handleKycVerify} disabled={kycLoading || kycOtp.length < 6}
                      className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {kycLoading ? <><Loader2 size={14} className="spin" /> Verifying…</> : 'Verify OTP'}
                    </button>
                    <button onClick={() => { setKycStep('input'); setKycOtp('') }} className="btn-outline">
                      Back
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Trips ─────────────────────────────────────────────────── */}
        <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.9rem' }}>Your trips</h2>
        {trips.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', marginBottom: '2rem' }}>
            No bookings yet. Travellers who book you will show up here.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '2rem' }}>
            {trips.map(t => {
              const traveller = travellers[t.traveller_id]
              const st = STATUS_STYLE[t.status] || STATUS_STYLE.pending
              return (
                <div key={t.id} className="card" style={{ padding: '1.1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.6rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{traveller?.full_name || 'Traveller'}</div>
                      {traveller?.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                          <Phone size={12} /> {traveller.phone}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                        <Calendar size={12} /> {new Date(t.booking_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {t.hours ? ` · ${t.hours}h` : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--rose)' }}>₹{t.amount.toLocaleString('en-IN')}</div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: st.color, background: st.bg, padding: '0.18rem 0.6rem', borderRadius: 20, textTransform: 'capitalize', display: 'inline-block', marginTop: '0.3rem' }}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                  {t.notes && <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '0.6rem' }}>{t.notes}</p>}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem', flexWrap: 'wrap' }}>
                    {t.status === 'confirmed' && (
                      <button onClick={() => markCompleted(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(122,158,126,0.12)', border: 'none', borderRadius: 8, padding: '0.4rem 0.8rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--sage)', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
                        <CheckCircle2 size={13} /> Mark completed
                      </button>
                    )}
                    {t.status === 'pending' && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={12} /> Waiting on payment confirmation.
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Editable profile ──────────────────────────────────────── */}
        <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.9rem' }}>Your guide profile</h2>
        <div className="card" style={{ padding: '1.4rem' }}>
          <div className="form-group">
            <label>City you live in</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input
                type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Bangalore"
                style={{ paddingLeft: '2.4rem' }}
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.3rem' }}>
              The city you actually live in — travellers searching here will find you.
            </p>
          </div>
          <div className="form-group">
            <label>Hourly rate (₹)</label>
            <div style={{ position: 'relative' }}>
              <IndianRupee size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input type="number" min={0} value={hourlyRate} onChange={e => setHourlyRate(Number(e.target.value))} style={{ paddingLeft: '2.4rem' }} />
            </div>
          </div>
          <div className="form-group">
            <label>Bio</label>
            <textarea rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell travellers about yourself…" maxLength={300} />
          </div>
          <div className="form-group">
            <label>Languages you speak</label>
            <div className="chip-grid">
              {LANGUAGES.map(l => (
                <button key={l} type="button" className={`chip ${languages.includes(l) ? 'selected' : ''}`} onClick={() => toggle(languages, setLanguages, l)}>{l}</button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Specialties</label>
            <div className="chip-grid">
              {SPECIALTIES.map(s => (
                <button key={s} type="button" className={`chip ${specialties.includes(s) ? 'selected' : ''}`} onClick={() => toggle(specialties, setSpecialties, s)}>{s}</button>
              ))}
            </div>
          </div>
          <button onClick={handleSaveProfile} disabled={saving} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.6rem' }}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </div>
    </div>
  )
}
