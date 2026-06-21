import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLiveTrip } from '../hooks/useLiveTrip'
import { supabase } from '../lib/supabase'
import { GUIDES, HOSTELS } from '../data/seed'
import { Search, BedDouble, AlertTriangle, LogOut, Calendar, Phone, Clock, Navigation, Share2, Square, Smartphone } from 'lucide-react'
import toast from 'react-hot-toast'
import { payBookingWithUpi } from '../lib/razorpay'

interface Booking {
  id: string
  type: string
  guide_id: string | null
  hostel_id: string | null
  booking_date: string
  status: string
  amount: number
  hours: number | null
  notes: string | null
  payment_method: string | null
  payment_status: string
  created_at: string
}

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const { tripId, tracking, start, stop } = useLiveTrip(user?.id)
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)

  const displayName  = profile?.full_name || 'Traveller'
  const firstName    = displayName.split(' ')[0]
  const initials     = displayName.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const phone        = profile?.phone || ''
  const joinedDate   = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  useEffect(() => { if (user) fetchBookings() }, [user])

  const fetchBookings = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('traveller_id', user!.id)
      .order('created_at', { ascending: false })
    if (error) {
      toast.error('Could not load your bookings. Please try again.')
      setBookings([])
    } else {
      setBookings(data || [])
    }
    setLoading(false)
  }

  const cancelBooking = async (id: string) => {
    if (!window.confirm('Cancel this booking?')) return
    const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id)
    if (error) {
      toast.error('Could not cancel. Please try again.')
    } else {
      toast.success('Booking cancelled.')
      fetchBookings()
    }
  }

  const getLabel = (b: Booking) => {
    if (b.type === 'guide' && b.guide_id) {
      const g = GUIDES.find(g => g.id === b.guide_id)
      return g ? `Guide: ${g.name}` : 'Guide Booking'
    }
    if (b.type === 'hostel' && b.hostel_id) {
      const h = HOSTELS.find(h => h.id === b.hostel_id)
      return h ? h.name : 'Hostel Booking'
    }
    return 'Booking'
  }

  const statusStyle: Record<string, { bg: string; color: string }> = {
    confirmed: { bg: 'rgba(122,158,126,0.12)', color: 'var(--sage)' },
    pending:   { bg: 'rgba(196,154,114,0.15)', color: 'var(--sand)' },
    cancelled: { bg: '#FEE2E2',                color: '#E87070' },
    completed: { bg: 'rgba(122,158,126,0.12)', color: 'var(--sage)' },
  }

  const handlePayNow = async (b: Booking) => {
    setPayingId(b.id)
    try {
      await payBookingWithUpi({
        bookingId: b.id,
        name: b.type === 'guide' ? 'Guide booking' : 'Hostel stay',
        description: getLabel(b),
        prefillEmail: profile?.email,
        prefillContact: profile?.phone || undefined,
        onDismiss: () => setPayingId(null),
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start payment.')
      setPayingId(null)
    }
  }

  const handleStartTrip = async (bookingId: string) => {
    const id = await start(bookingId)
    if (id) {
      setActiveBookingId(bookingId)
      toast.success('Live location sharing started.')
    }
  }

  const handleShareTrip = async () => {
    if (!tripId) return
    const url = `${window.location.origin}/track/${tripId}`
    const text = `I'm sharing my live location on SafeShe so you can follow my trip: ${url}`
    if (navigator.share) {
      try { await navigator.share({ title: 'My live location', text, url }) } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied — send it to your family.')
    }
  }

  const handleEndTrip = async () => {
    await stop()
    setActiveBookingId(null)
    toast.success('Live location sharing ended.')
  }

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out safely.')
    navigate('/')
  }

  return (
    <div className="page" style={{ background: 'var(--warm)' }}>
      <div className="container" style={{ padding: '2.5rem 2rem', maxWidth: 900 }}>

        {/* ── USER CARD ── */}
        <div className="card" style={{ padding: '1.8rem 2rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,var(--rose),var(--sand))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.3rem', flexShrink: 0 }}>
              {initials || '?'}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.5rem', fontWeight: 900, color: 'var(--night)', marginBottom: '0.25rem' }}>
                Hi, {firstName}! 👋
              </h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.2rem' }}>
                {phone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
                    <Phone size={13} /> {phone}
                  </span>
                )}
                {joinedDate && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
                    <Calendar size={13} /> Member since {joinedDate}
                  </span>
                )}
                {profile?.city && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>📍 {profile.city}</span>
                )}
              </div>
            </div>

            {/* Sign out */}
            <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: '1.5px solid var(--border)', borderRadius: 50, padding: '0.5rem 1.1rem', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.88rem', fontFamily: 'DM Sans,sans-serif', fontWeight: 500 }}>
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Bookings',   value: bookings.length,                                                                       icon: '📋' },
            { label: 'Confirmed Trips',  value: bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length,      icon: '✅' },
            { label: 'Total Spent',      value: `₹${bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + b.amount, 0).toLocaleString('en-IN')}`, icon: '💳' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '1.3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '0.35rem' }}>{s.icon}</div>
              <div style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.6rem', fontWeight: 900, color: 'var(--night)', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.3rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div className="card" style={{ padding: '1.6rem 2rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: '1.15rem', marginBottom: '1.2rem' }}>What do you need?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '0.8rem' }}>
            {[
              { icon: <Search size={20} />,        label: 'Find a Guide',       sub: 'Book a verified guide',  link: '/guides',  bg: 'var(--blush)',                   color: 'var(--rose)' },
              { icon: <BedDouble size={20} />,     label: 'Book a Stay',        sub: 'Find safe hostels',      link: '/hostels', bg: 'rgba(122,158,126,0.12)',        color: 'var(--sage)' },
              { icon: <AlertTriangle size={20} />, label: 'SOS Emergency',      sub: 'Get help instantly',     link: '/sos',     bg: '#FEE2E2',                       color: '#E87070' },
            ].map(a => (
              <button key={a.label} onClick={() => navigate(a.link)} style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', padding: '1rem 1.2rem', background: a.bg, border: 'none', borderRadius: 14, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                <div style={{ color: a.color, flexShrink: 0 }}>{a.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--night)' }}>{a.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.1rem' }}>{a.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── BOOKINGS ── */}
        <div className="card" style={{ padding: '1.6rem 2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.3rem' }}>
            <h2 style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: '1.15rem' }}>Your Bookings</h2>
            {bookings.length > 0 && (
              <span style={{ background: 'var(--blush)', color: 'var(--rose)', fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.7rem', borderRadius: 20 }}>
                {bookings.length} total
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
              Loading your bookings…
            </div>
          ) : bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.8rem' }}>✈️</div>
              <h3 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.1rem', marginBottom: '0.4rem' }}>No bookings yet</h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Your bookings will appear here after you book a guide or a stay.
              </p>
              <Link to="/guides" className="btn-primary" style={{ fontSize: '0.9rem', padding: '0.6rem 1.5rem' }}>
                Find a Guide →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {bookings.map(b => {
                const st = statusStyle[b.status] || { bg: '#F3F0ED', color: 'var(--muted)' }
                return (
                  <div key={b.id} style={{ display: 'flex', gap: '1rem', padding: '1.1rem 1.2rem', background: 'var(--warm)', borderRadius: 14, border: '1px solid var(--border)', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: b.type === 'guide' ? 'var(--blush)' : 'rgba(122,158,126,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                      {b.type === 'guide' ? '👩' : '🏠'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.93rem', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {getLabel(b)}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Calendar size={11} /> {b.booking_date}</span>
                        {b.hours && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={11} /> {b.hours}hrs</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexShrink: 0, flexWrap: 'wrap' }}>
                      <strong style={{ color: 'var(--rose)', fontSize: '0.95rem' }}>₹{b.amount.toLocaleString('en-IN')}</strong>
                      <span style={{ fontSize: '0.73rem', fontWeight: 600, color: st.color, background: st.bg, padding: '0.22rem 0.65rem', borderRadius: 20, textTransform: 'capitalize' }}>
                        {b.status}
                      </span>
                      {b.payment_method === 'upi' && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--sage)', background: 'rgba(122,158,126,0.12)', padding: '0.2rem 0.6rem', borderRadius: 20 }}>
                          UPI {b.payment_status === 'paid' ? 'paid' : 'pending'}
                        </span>
                      )}
                      {b.payment_status === 'pending' && b.status === 'pending' && (
                        <button onClick={() => handlePayNow(b)} disabled={payingId === b.id}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'var(--rose)', border: 'none', borderRadius: 8, padding: '0.3rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', color: 'white', fontFamily: 'DM Sans,sans-serif', fontWeight: 600 }}>
                          <Smartphone size={11} /> {payingId === b.id ? 'Opening…' : 'Pay now'}
                        </button>
                      )}
                      {b.status === 'confirmed' && activeBookingId === b.id && tracking ? (
                        <>
                          <button onClick={handleShareTrip} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'var(--blush)', border: 'none', borderRadius: 8, padding: '0.3rem 0.7rem', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--rose)', fontFamily: 'DM Sans,sans-serif', fontWeight: 600 }}>
                            <Share2 size={12} /> Share location
                          </button>
                          <button onClick={handleEndTrip} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '0.3rem 0.7rem', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--muted)', fontFamily: 'DM Sans,sans-serif' }}>
                            <Square size={11} /> End trip
                          </button>
                        </>
                      ) : b.status === 'confirmed' && !tracking ? (
                        <button onClick={() => handleStartTrip(b.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(122,158,126,0.12)', border: 'none', borderRadius: 8, padding: '0.3rem 0.7rem', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--sage)', fontFamily: 'DM Sans,sans-serif', fontWeight: 600 }}>
                            <Navigation size={11} /> Start trip
                          </button>
                        ) : null}
                      {(b.status === 'confirmed' || b.status === 'pending') && (
                        <button onClick={() => cancelBooking(b.id)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '0.25rem 0.7rem', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--muted)', fontFamily: 'DM Sans,sans-serif' }}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
