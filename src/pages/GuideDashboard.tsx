import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import {
  Compass, Star, Briefcase, IndianRupee, LogOut, Phone, Calendar,
  CheckCircle2, Clock, MapPin, ShieldCheck, AlertTriangle, Loader2,
  Eye, EyeOff, TrendingUp, User, Settings, ToggleLeft, ToggleRight,
  ChevronDown, ChevronUp, Wallet, Bell, Check, X
} from 'lucide-react'
import toast from 'react-hot-toast'

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'Gujarati', 'Punjabi', 'Konkani', 'Rajasthani']
const SPECIALTIES = ['Heritage Walks', 'Food Tours', 'Night Markets', 'Beach Safety', 'Local Culture', 'Photography Spots', 'Shopping', 'Trekking', 'Nightlife']

type Tab = 'overview' | 'trips' | 'profile' | 'kyc'

interface GuideProfileRow {
  id: string; status: string; rating: number; reviews_count: number
  trips_count: number; hourly_rate: number; city: string | null
  languages: string[]; specialties: string[]; bio: string | null
  kyc_status: 'not_started' | 'pending' | 'verified' | 'failed'
  kyc_verified_name: string | null; kyc_photo_url: string | null
  kyc_aadhaar_last4: string | null; is_available?: boolean
}

interface TripBooking {
  id: string; traveller_id: string; booking_date: string
  hours: number | null; amount: number; status: string
  payment_status: string; notes: string | null; created_at: string
}

interface TravellerInfo { full_name: string; phone: string | null }

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  pending:   { color: 'var(--sand)',  bg: 'rgba(212,165,116,0.12)' },
  confirmed: { color: 'var(--sage)',  bg: 'rgba(122,158,126,0.12)' },
  completed: { color: 'var(--earth)', bg: 'var(--warm)' },
  cancelled: { color: 'var(--muted)', bg: '#F3F0ED' },
}

const KYC_INFO: Record<string, { label: string; color: string; bg: string }> = {
  not_started: { label: 'Not verified',                    color: 'var(--muted)', bg: '#F3F0ED' },
  pending:     { label: 'OTP sent — awaiting verification', color: 'var(--sand)',  bg: 'rgba(212,165,116,0.12)' },
  verified:    { label: 'Aadhaar verified ✓',              color: 'var(--sage)',  bg: 'rgba(122,158,126,0.12)' },
  failed:      { label: 'Verification failed',             color: 'var(--rose)',  bg: 'var(--blush)' },
}

function StatCard({ icon, value, label, sub, accent }: { icon: React.ReactNode; value: string; label: string; sub?: string; accent?: string }) {
  return (
    <div className="card" style={{ padding: '1.1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: accent ? `${accent}18` : 'var(--warm)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.2rem' }}>{icon}</div>
      <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--night)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.68rem', color: 'var(--muted)', opacity: 0.8 }}>{sub}</div>}
    </div>
  )
}

function TripCard({ trip, traveller, onMarkCompleted }: { trip: TripBooking; traveller?: TravellerInfo; onMarkCompleted: (id: string) => void }) {
  const st = STATUS_STYLE[trip.status] || STATUS_STYLE.pending
  return (
    <div className="card" style={{ padding: '1.1rem 1.2rem', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--night)', marginBottom: '0.25rem' }}>{traveller?.full_name || 'Traveller'}</div>
          {traveller?.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
              <Phone size={11} /> {traveller.phone}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
            <Calendar size={11} />
            {new Date(trip.booking_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            {trip.hours ? ` · ${trip.hours}h` : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontWeight: 800, color: 'var(--rose)', fontSize: '1.05rem' }}>₹{trip.amount.toLocaleString('en-IN')}</div>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: st.color, background: st.bg, padding: '0.18rem 0.55rem', borderRadius: 20, textTransform: 'capitalize', display: 'inline-block', marginTop: '0.3rem' }}>
            {trip.status}
          </span>
        </div>
      </div>
      {trip.notes && <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.55rem', lineHeight: 1.5, borderTop: '1px solid var(--border)', paddingTop: '0.55rem' }}>{trip.notes}</p>}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
        {trip.status === 'confirmed' && (
          <button onClick={() => onMarkCompleted(trip.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(122,158,126,0.12)', border: 'none', borderRadius: 8, padding: '0.4rem 0.85rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--sage)', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
            <CheckCircle2 size={13} /> Mark completed
          </button>
        )}
        {trip.status === 'pending' && (
          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Clock size={12} /> Waiting on payment…
          </p>
        )}
      </div>
    </div>
  )
}

export default function GuideDashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const [guideProfile, setGuideProfile] = useState<GuideProfileRow | null>(null)
  const [trips, setTrips] = useState<TripBooking[]>([])
  const [travellers, setTravellers] = useState<Record<string, TravellerInfo>>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [tripFilter, setTripFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all')

  // editable profile fields
  const [hourlyRate, setHourlyRate] = useState(99)
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')
  const [languages, setLanguages] = useState<string[]>([])
  const [specialties, setSpecialties] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [isAvailable, setIsAvailable] = useState(true)
  const [togglingAvail, setTogglingAvail] = useState(false)

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
      setIsAvailable(gp.is_available !== false)
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

  const handleToggleAvailability = async () => {
    if (!user) return
    setTogglingAvail(true)
    const next = !isAvailable
    const { error } = await supabase.from('guide_profiles').update({ is_available: next }).eq('id', user.id)
    setTogglingAvail(false)
    if (error) { toast.error('Could not update availability.'); return }
    setIsAvailable(next)
    toast.success(next ? 'You are now accepting bookings' : 'You are now offline')
  }

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

  // KYC
  const handleKycInitiate = async () => {
    const num = aadhaarInput.replace(/\s/g, '')
    if (!/^\d{12}$/.test(num)) { toast.error('Enter a valid 12-digit Aadhaar number.'); return }
    setKycLoading(true)
    const { data, error } = await supabase.functions.invoke('aadhaar-ekyc-initiate', { body: { aadhaar_number: num } })
    setKycLoading(false)
    if (error || !data?.ok) { toast.error(data?.error || 'Could not send OTP. Please try again.'); return }
    setKycReferenceId(data.reference_id)
    setKycStep('otp')
    toast.success('OTP sent to your Aadhaar-linked mobile number.')
  }

  const handleKycVerify = async () => {
    if (kycOtp.length < 6) { toast.error('Enter the 6-digit OTP.'); return }
    setKycLoading(true)
    const { data, error } = await supabase.functions.invoke('aadhaar-ekyc-verify', { body: { otp: kycOtp, reference_id: kycReferenceId } })
    setKycLoading(false)
    if (error || !data?.ok) { toast.error(data?.error || 'Verification failed. Please try again.'); return }
    toast.success(`Aadhaar verified${data.verified_name ? ` as ${data.verified_name}` : ''} ✓`)
    setKycStep('input'); setAadhaarInput(''); setKycOtp('')
    loadData()
  }

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
  const totalEarnings = trips.filter(t => t.status === 'completed').reduce((s, t) => s + t.amount, 0)
  const pendingCount = trips.filter(t => t.status === 'pending').length
  const confirmedCount = trips.filter(t => t.status === 'confirmed').length
  const filteredTrips = tripFilter === 'all' ? trips : trips.filter(t => t.status === tripFilter)

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview',  icon: <TrendingUp size={15} /> },
    { key: 'trips',    label: `Trips${pendingCount > 0 ? ` (${pendingCount})` : ''}`, icon: <Briefcase size={15} /> },
    { key: 'profile',  label: 'Profile',   icon: <User size={15} /> },
    { key: 'kyc',      label: 'Identity',  icon: <ShieldCheck size={15} /> },
  ]

  return (
    <div className="page" style={{ background: 'var(--warm)', paddingTop: '5rem' }}>
      <style>{`
        .gd-shell {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 1.2rem 4rem;
        }
        @media (min-width: 640px) { .gd-shell { padding: 0 2rem 4rem; } }

        .gd-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.4rem;
          flex-wrap: wrap;
        }

        .gd-tabs {
          display: flex;
          gap: 0.3rem;
          border-bottom: 2px solid var(--border);
          margin-bottom: 1.6rem;
          overflow-x: auto;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .gd-tabs::-webkit-scrollbar { display: none; }

        .gd-tab {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.65rem 1rem;
          font-size: 0.85rem;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          color: var(--muted);
          background: none;
          border: none;
          border-bottom: 2.5px solid transparent;
          cursor: pointer;
          transition: all 0.18s;
          white-space: nowrap;
          margin-bottom: -2px;
        }
        .gd-tab:hover { color: var(--earth); }
        .gd-tab.active { color: var(--rose); border-bottom-color: var(--rose); }

        .gd-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
          margin-bottom: 1.6rem;
        }
        @media (min-width: 560px) {
          .gd-stats-grid { grid-template-columns: repeat(4, 1fr); }
        }

        .gd-trip-filter {
          display: flex;
          gap: 0.4rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }
        .gd-filter-btn {
          padding: 0.4rem 0.9rem;
          border-radius: 50px;
          font-size: 0.78rem;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          border: 1.5px solid var(--border);
          background: white;
          color: var(--muted);
          cursor: pointer;
          transition: all 0.16s;
        }
        .gd-filter-btn.active {
          background: var(--rose);
          border-color: var(--rose);
          color: white;
        }

        .gd-avail-toggle {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: white;
          border: 1.5px solid var(--border);
          border-radius: 14px;
          padding: 0.85rem 1.1rem;
          margin-bottom: 1.4rem;
          cursor: pointer;
          transition: border-color 0.2s;
          width: 100%;
          font-family: 'DM Sans', sans-serif;
        }
        .gd-avail-toggle:hover { border-color: var(--sand); }
        .gd-avail-toggle:disabled { opacity: 0.6; cursor: not-allowed; }

        .gd-section-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--night);
          margin-bottom: 0.9rem;
        }

        .gd-earnings-bar {
          background: var(--dawn-gradient);
          border-radius: 18px;
          padding: 1.4rem;
          margin-bottom: 1.4rem;
          position: relative;
          overflow: hidden;
        }
        .gd-earnings-bar::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 85% 50%, rgba(255,255,255,0.22), transparent 55%);
        }
      `}</style>

      <div className="gd-shell">

        {/* Header */}
        <div className="gd-header">
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sage)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
              <Compass size={13} /> Guide Dashboard
            </p>
            <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: 'clamp(1.35rem,3.5vw,1.7rem)', fontWeight: 700, color: 'var(--night)', lineHeight: 1.2 }}>
              Welcome back, {profile?.full_name?.split(' ')[0] || 'there'} 👋
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            <span style={{
              fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.7rem', borderRadius: 20,
              textTransform: 'capitalize',
              color: guideProfile?.status === 'active' ? 'var(--sage)' : 'var(--rose)',
              background: guideProfile?.status === 'active' ? 'rgba(122,158,126,0.12)' : 'var(--blush)',
            }}>{guideProfile?.status || 'unknown'}</span>
            <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.82rem', fontFamily: 'DM Sans,sans-serif', padding: '0.4rem 0.6rem', borderRadius: 8 }}>
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="gd-tabs">
          {TABS.map(t => (
            <button key={t.key} className={`gd-tab${activeTab === t.key ? ' active' : ''}`} onClick={() => setActiveTab(t.key)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ───────────────────────────────────── */}
        {activeTab === 'overview' && (
          <>
            {/* Earnings hero */}
            <div className="gd-earnings-bar">
              <div style={{ position: 'relative', zIndex: 1 }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--night)', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Total earnings</p>
                <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 'clamp(1.8rem,5vw,2.4rem)', fontWeight: 900, color: 'var(--night)', lineHeight: 1 }}>
                  ₹{totalEarnings.toLocaleString('en-IN')}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--night)', opacity: 0.65, marginTop: '0.35rem' }}>
                  From {trips.filter(t => t.status === 'completed').length} completed trips
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="gd-stats-grid">
              <StatCard icon={<Star size={16} color="var(--sand)" />} value={guideProfile?.rating?.toFixed(1) || '—'} label="Rating" sub={`${guideProfile?.reviews_count || 0} reviews`} accent="#C49A72" />
              <StatCard icon={<Briefcase size={16} color="var(--sage)" />} value={String(guideProfile?.trips_count || 0)} label="Trips done" accent="#7A9E7E" />
              <StatCard icon={<Clock size={16} color="var(--sand)" />} value={String(pendingCount)} label="Pending" sub="awaiting payment" accent="#C49A72" />
              <StatCard icon={<CheckCircle2 size={16} color="var(--sage)" />} value={String(confirmedCount)} label="Confirmed" sub="upcoming" accent="#7A9E7E" />
            </div>

            {/* Availability toggle */}
            <button className="gd-avail-toggle" onClick={handleToggleAvailability} disabled={togglingAvail}>
              {togglingAvail ? <Loader2 size={18} className="spin" color="var(--muted)" /> : isAvailable ? <ToggleRight size={22} color="var(--sage)" /> : <ToggleLeft size={22} color="var(--muted)" />}
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--night)' }}>
                  {isAvailable ? 'Accepting bookings' : 'Not available'}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>
                  {isAvailable ? 'Travellers can book you right now' : 'Toggle on to start receiving bookings'}
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isAvailable ? 'var(--sage)' : 'var(--muted)', background: isAvailable ? 'rgba(122,158,126,0.12)' : '#F3F0ED', padding: '0.2rem 0.55rem', borderRadius: 20 }}>
                {isAvailable ? 'Online' : 'Offline'}
              </span>
            </button>

            {/* KYC alert if not verified */}
            {guideProfile?.kyc_status !== 'verified' && (
              <button onClick={() => setActiveTab('kyc')} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                <div style={{ background: 'var(--blush)', border: '1.5px solid rgba(232,68,90,0.2)', borderRadius: 14, padding: '0.9rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1.2rem' }}>
                  <AlertTriangle size={16} color="var(--rose)" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--rose)' }}>Identity not verified</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Complete Aadhaar e-KYC to unlock all features → tap to verify</div>
                  </div>
                </div>
              </button>
            )}

            {/* Recent trips preview */}
            {trips.length > 0 && (
              <>
                <h2 className="gd-section-title">Recent trips</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginBottom: '0.8rem' }}>
                  {trips.slice(0, 3).map(t => (
                    <TripCard key={t.id} trip={t} traveller={travellers[t.traveller_id]} onMarkCompleted={markCompleted} />
                  ))}
                </div>
                {trips.length > 3 && (
                  <button onClick={() => setActiveTab('trips')} style={{ fontSize: '0.82rem', color: 'var(--rose)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', padding: '0.3rem 0' }}>
                    View all {trips.length} trips →
                  </button>
                )}
              </>
            )}
          </>
        )}

        {/* ── TRIPS TAB ──────────────────────────────────────── */}
        {activeTab === 'trips' && (
          <>
            <h2 className="gd-section-title">Your trips</h2>

            {/* Filter pills */}
            <div className="gd-trip-filter">
              {(['all', 'pending', 'confirmed', 'completed'] as const).map(f => (
                <button key={f} className={`gd-filter-btn${tripFilter === f ? ' active' : ''}`} onClick={() => setTripFilter(f)}>
                  {f === 'all' ? `All (${trips.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${trips.filter(t => t.status === f).length})`}
                </button>
              ))}
            </div>

            {filteredTrips.length === 0 ? (
              <div className="card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--muted)' }}>
                {tripFilter === 'all' ? 'No bookings yet. Travellers will show up here once they book.' : `No ${tripFilter} trips.`}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredTrips.map(t => (
                  <TripCard key={t.id} trip={t} traveller={travellers[t.traveller_id]} onMarkCompleted={markCompleted} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── PROFILE TAB ────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <>
            <h2 className="gd-section-title">Your guide profile</h2>
            <div className="card" style={{ padding: '1.5rem' }}>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>City you live in</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Bangalore" style={{ paddingLeft: '2.4rem' }} />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.3rem' }}>Travellers searching this city will find you.</p>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Hourly rate (₹)</label>
                <div style={{ position: 'relative' }}>
                  <IndianRupee size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input type="number" min={0} value={hourlyRate} onChange={e => setHourlyRate(Number(e.target.value))} style={{ paddingLeft: '2.4rem' }} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Bio <span style={{ fontWeight: 400, color: 'var(--muted)' }}>({bio.length}/300)</span></label>
                <textarea rows={4} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell travellers about yourself…" maxLength={300} />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Languages you speak</label>
                <div className="chip-grid">
                  {LANGUAGES.map(l => (
                    <button key={l} type="button" className={`chip ${languages.includes(l) ? 'selected' : ''}`} onClick={() => toggle(languages, setLanguages, l)}>{l}</button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.4rem' }}>
                <label>Specialties</label>
                <div className="chip-grid">
                  {SPECIALTIES.map(s => (
                    <button key={s} type="button" className={`chip ${specialties.includes(s) ? 'selected' : ''}`} onClick={() => toggle(specialties, setSpecialties, s)}>{s}</button>
                  ))}
                </div>
              </div>

              <button onClick={handleSaveProfile} disabled={saving} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                {saving ? <><Loader2 size={14} className="spin" /> Saving…</> : 'Save profile'}
              </button>
            </div>
          </>
        )}

        {/* ── KYC TAB ────────────────────────────────────────── */}
        {activeTab === 'kyc' && (
          <>
            <h2 className="gd-section-title">Identity verification</h2>
            <div className="card" style={{ padding: '1.5rem' }}>

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
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', background: 'rgba(122,158,126,0.08)', borderRadius: 12, padding: '1rem' }}>
                  {guideProfile.kyc_photo_url && (
                    <img src={guideProfile.kyc_photo_url} alt="KYC photo" style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover', border: '2px solid rgba(122,158,126,0.3)' }} />
                  )}
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--night)' }}>{guideProfile.kyc_verified_name || profile?.full_name}</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--sage)' }}>✓ Verified via Aadhaar e-KYC</p>
                  </div>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '1.2rem' }}>
                    Verify your identity with Aadhaar. An OTP is sent to your Aadhaar-linked mobile. Only the last 4 digits are stored — never the full number.
                  </p>

                  {kycStep === 'input' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Aadhaar number</label>
                        <div style={{ position: 'relative' }}>
                          <ShieldCheck size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                          <input
                            type={showAadhaar ? 'text' : 'password'}
                            inputMode="numeric" maxLength={12}
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Enter OTP sent to your Aadhaar-linked mobile</label>
                        <input
                          type="text" inputMode="numeric" maxLength={6} placeholder="6-digit OTP"
                          value={kycOtp} onChange={e => setKycOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          style={{ letterSpacing: '0.25em', fontSize: '1.15rem', textAlign: 'center' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.6rem' }}>
                        <button onClick={handleKycVerify} disabled={kycLoading || kycOtp.length < 6}
                          className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {kycLoading ? <><Loader2 size={14} className="spin" /> Verifying…</> : 'Verify OTP'}
                        </button>
                        <button onClick={() => { setKycStep('input'); setKycOtp('') }} className="btn-outline">Back</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  )
}
