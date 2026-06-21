import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Compass, Star, Briefcase, IndianRupee, LogOut, Phone, Calendar, CheckCircle2, Clock, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { INDIAN_CITIES } from '../lib/cities'

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

interface TravellerInfo {
  full_name: string
  phone: string | null
}

export default function GuideDashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const [guideProfile, setGuideProfile] = useState<GuideProfileRow | null>(null)
  const [trips, setTrips] = useState<TripBooking[]>([])
  const [travellers, setTravellers] = useState<Record<string, TravellerInfo>>({})
  const [loading, setLoading] = useState(true)

  const [hourlyRate, setHourlyRate] = useState(99)
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')
  const [languages, setLanguages] = useState<string[]>([])
  const [specialties, setSpecialties] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

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

    const travellerIds = [...new Set(tripList.map(t => t.traveller_id))]
    if (travellerIds.length > 0) {
      const { data: profilesData } = await supabase.from('profiles').select('id, full_name, phone').in('id', travellerIds)
      const map: Record<string, TravellerInfo> = {}
      for (const p of profilesData || []) map[p.id] = { full_name: p.full_name, phone: p.phone }
      setTravellers(map)
    }

    setLoading(false)
  }, [user])

  useEffect(() => { loadData() }, [loadData])

  const toggle = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item])
  }

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from('guide_profiles').update({
      hourly_rate: hourlyRate,
      city: city || null,
      bio: bio.trim() || null,
      languages,
      specialties,
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

  const handleSignOut = async () => {
    await signOut()
    toast.success('You have been signed out safely.')
    navigate('/')
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>Loading your dashboard…</div>
  }

  const statusStyle: Record<string, { color: string; bg: string }> = {
    pending: { color: 'var(--sand)', bg: 'rgba(212,165,116,0.12)' },
    confirmed: { color: 'var(--sage)', bg: 'rgba(122,158,126,0.12)' },
    completed: { color: 'var(--earth)', bg: 'var(--warm)' },
    cancelled: { color: 'var(--muted)', bg: '#F3F0ED' },
  }

  return (
    <div className="page" style={{ background: 'var(--warm)', paddingTop: '5.5rem' }}>
      <div className="container" style={{ maxWidth: 760, paddingBottom: '3rem' }}>
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
            <span style={{
              fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 20, textTransform: 'capitalize',
              color: guideProfile?.status === 'active' ? 'var(--sage)' : 'var(--muted)',
              background: guideProfile?.status === 'active' ? 'rgba(122,158,126,0.12)' : '#F3F0ED',
            }}>
              {guideProfile?.status || 'unknown'}
            </span>
          </div>
        </div>

        {/* Trips */}
        <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.9rem' }}>Your trips</h2>
        {trips.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', marginBottom: '2rem' }}>
            No bookings yet. Travellers who book you will show up here.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '2rem' }}>
            {trips.map(t => {
              const traveller = travellers[t.traveller_id]
              const st = statusStyle[t.status] || statusStyle.pending
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
                  {t.status === 'confirmed' && (
                    <button onClick={() => markCompleted(t.id)} style={{ marginTop: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(122,158,126,0.12)', border: 'none', borderRadius: 8, padding: '0.4rem 0.8rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--sage)', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
                      <CheckCircle2 size={13} /> Mark trip completed
                    </button>
                  )}
                  {t.status === 'pending' && (
                    <p style={{ marginTop: '0.7rem', fontSize: '0.78rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={12} /> Waiting on payment confirmation.
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Editable profile */}
        <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.9rem' }}>Your guide profile</h2>
        <div className="card" style={{ padding: '1.4rem' }}>
          <div className="form-group">
            <label>City you operate in</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <select value={city} onChange={e => setCity(e.target.value)} style={{ paddingLeft: '2.4rem', width: '100%' }}>
                <option value="">Select a city…</option>
                {INDIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {!city && (
              <p style={{ fontSize: '0.75rem', color: 'var(--rose)', marginTop: '0.3rem' }}>
                Set your city so travellers searching there can find and book you.
              </p>
            )}
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
