import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLiveTrip } from '../hooks/useLiveTrip'
import { supabase } from '../lib/supabase'
import { GUIDES, HOSTELS } from '../data/seed'
import {
  Search, BedDouble, AlertTriangle, LogOut, Calendar,
  Phone, Clock, Navigation, Share2, Square, Smartphone, Flag,
  ShieldCheck, MapPin
} from 'lucide-react'
import toast from 'react-hot-toast'
import { payBookingWithUpi } from '../lib/razorpay'

interface Booking {
  id: string; type: string; guide_id: string | null; hostel_id: string | null
  booking_date: string; status: string; amount: number; hours: number | null
  notes: string | null; payment_method: string | null; payment_status: string; created_at: string
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  confirmed: { bg: 'rgba(122,158,126,0.12)', color: 'var(--sage)' },
  pending:   { bg: 'rgba(196,154,114,0.15)', color: 'var(--sand)' },
  cancelled: { bg: '#FEE2E2',                color: '#E87070' },
  completed: { bg: 'rgba(122,158,126,0.12)', color: 'var(--sage)' },
}

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const { tripId, tracking, start, stop } = useLiveTrip(user?.id)
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [reportBooking, setReportBooking] = useState<Booking | null>(null)
  const [reportSubmitting, setReportSubmitting] = useState(false)

  const displayName = profile?.full_name || 'Traveller'
  const firstName   = displayName.split(' ')[0]
  const initials    = displayName.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  useEffect(() => { if (user) fetchBookings() }, [user])

  const fetchBookings = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('bookings').select('*')
      .eq('traveller_id', user!.id).order('created_at', { ascending: false })
    if (error) { toast.error('Could not load your bookings.'); setBookings([]) }
    else setBookings(data || [])
    setLoading(false)
  }

  const cancelBooking = async (id: string) => {
    if (!window.confirm('Cancel this booking?')) return
    const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id)
    if (error) toast.error('Could not cancel. Please try again.')
    else { toast.success('Booking cancelled.'); fetchBookings() }
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

  const handlePayNow = async (b: Booking) => {
    setPayingId(b.id)
    try {
      await payBookingWithUpi({
        bookingId: b.id, name: b.type === 'guide' ? 'Guide booking' : 'Hostel stay',
        description: getLabel(b), prefillEmail: profile?.email,
        prefillContact: profile?.phone || undefined, onDismiss: () => setPayingId(null),
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start payment.')
      setPayingId(null)
    }
  }

  const handleStartTrip = async (bookingId: string) => {
    const id = await start(bookingId)
    if (id) { setActiveBookingId(bookingId); toast.success('Live location sharing started.') }
  }

  const handleShareTrip = async () => {
    if (!tripId) return
    const url = `${window.location.origin}/track/${tripId}`
    const text = `I'm sharing my live location on SafeShe: ${url}`
    if (navigator.share) {
      try { await navigator.share({ title: 'My live location', text, url }) } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied — send it to your family.')
    }
  }

  const handleEndTrip = async () => {
    await stop(); setActiveBookingId(null); toast.success('Live location sharing ended.')
  }

  const handleReport = async (reason: 'different_person' | 'unsafe_behavior' | 'other', details: string) => {
    if (!user || !reportBooking) return
    setReportSubmitting(true)
    const { error } = await supabase.from('guide_reports').insert({
      guide_id: reportBooking.guide_id, reporter_id: user.id,
      booking_id: reportBooking.id, reason, details: details.trim() || null,
    })
    setReportSubmitting(false)
    if (error) { toast.error('Could not submit report.'); return }
    if (reason === 'different_person')
      toast.error('Report submitted. Guide suspended pending review.', { duration: 6000 })
    else toast.success('Report submitted. Our team will review this.')
    setReportBooking(null); fetchBookings()
  }

  const totalSpent = bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + b.amount, 0)
  const confirmedCount = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length

  return (
    <>
    <div className="page" style={{ background: 'var(--warm)' }}>
      <style>{`
        /* ── Shell ── */
        .db-shell { max-width: 900px; margin: 0 auto; padding: 1.5rem 1rem 4rem; }
        @media (min-width: 640px)  { .db-shell { padding: 2rem 1.5rem 4rem; } }
        @media (min-width: 1024px) { .db-shell { padding: 2.5rem 2rem 4rem; } }

        /* ── User card ── */
        .db-user-card { padding: 1.4rem; margin-bottom: 1.2rem; }
        @media (min-width: 640px) { .db-user-card { padding: 1.8rem 2rem; } }

        .db-user-inner {
          display: flex; flex-direction: column; gap: 1rem;
        }
        @media (min-width: 480px) {
          .db-user-inner { flex-direction: row; align-items: center; gap: 1.2rem; }
        }

        .db-user-signout {
          align-self: flex-start;
        }
        @media (min-width: 480px) {
          .db-user-signout { align-self: center; margin-left: auto; flex-shrink: 0; }
        }

        /* ── Stats grid ── */
        .db-stats {
          display: grid; gap: 0.8rem; margin-bottom: 1.2rem;
          grid-template-columns: repeat(3, 1fr);
        }
        .db-stat-card { padding: 1rem 0.8rem; text-align: center; }
        .db-stat-val { font-family: 'Playfair Display',serif; font-size: 1.3rem; font-weight: 900; color: var(--night); line-height: 1; }
        .db-stat-lbl { font-size: 0.7rem; color: var(--muted); margin-top: 0.3rem; line-height: 1.3; }
        @media (min-width: 640px) {
          .db-stat-card { padding: 1.3rem; }
          .db-stat-val { font-size: 1.6rem; }
          .db-stat-lbl { font-size: 0.78rem; }
        }

        /* ── Quick actions ── */
        .db-actions-grid {
          display: grid; gap: 0.65rem;
          grid-template-columns: 1fr;
        }
        @media (min-width: 480px) { .db-actions-grid { grid-template-columns: repeat(3,1fr); } }

        .db-action-btn {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.9rem 1rem; border: none; border-radius: 14px;
          cursor: pointer; text-align: left; width: 100%;
          transition: opacity 0.15s;
        }
        .db-action-btn:hover { opacity: 0.85; }
        .db-action-label { font-weight: 700; font-size: 0.88rem; color: var(--night); }
        .db-action-sub   { font-size: 0.73rem; color: var(--muted); margin-top: 0.1rem; }
        @media (min-width: 640px) {
          .db-action-btn { flex-direction: column; align-items: flex-start; gap: 0.6rem; padding: 1.2rem; }
        }

        /* ── Booking card ── */
        .db-booking {
          display: grid;
          grid-template-columns: 42px 1fr;
          gap: 0.75rem;
          padding: 1rem;
          background: var(--warm);
          border-radius: 14px;
          border: 1px solid var(--border);
        }
        @media (min-width: 640px) {
          .db-booking { padding: 1.1rem 1.2rem; grid-template-columns: 42px 1fr auto; }
        }

        .db-booking-icon {
          width: 42px; height: 42px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.2rem; flex-shrink: 0;
        }

        .db-booking-info { min-width: 0; }
        .db-booking-title {
          font-weight: 600; font-size: 0.92rem; color: var(--night);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          margin-bottom: 0.25rem;
        }
        .db-booking-meta {
          display: flex; flex-wrap: wrap; gap: 0.6rem;
          font-size: 0.78rem; color: var(--muted); margin-bottom: 0.6rem;
        }

        /* Tags row */
        .db-booking-tags {
          display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.7rem;
        }

        /* Buttons row — full width below info on mobile, inline on desktop */
        .db-booking-btns {
          grid-column: 1 / -1;
          display: flex; flex-wrap: wrap; gap: 0.45rem;
          padding-top: 0.6rem; border-top: 1px solid var(--border);
        }
        @media (min-width: 640px) {
          .db-booking-btns {
            grid-column: auto;
            border-top: none; padding-top: 0;
            flex-direction: column; align-items: flex-end;
            justify-content: center; gap: 0.4rem; flex-shrink: 0;
          }
        }

        .db-btn {
          display: inline-flex; align-items: center; gap: 0.3rem;
          border-radius: 8px; font-family: 'DM Sans',sans-serif;
          font-size: 0.78rem; font-weight: 600; cursor: pointer;
          padding: 0.42rem 0.85rem; border: none; white-space: nowrap;
          transition: opacity 0.15s;
        }
        .db-btn:hover { opacity: 0.82; }
        .db-btn-pay     { background: var(--rose);                     color: white; }
        .db-btn-start   { background: rgba(122,158,126,0.12);          color: var(--sage); }
        .db-btn-share   { background: var(--blush);                    color: var(--rose); }
        .db-btn-end     { background: none; border: 1px solid var(--border); color: var(--muted); }
        .db-btn-cancel  { background: none; border: 1px solid var(--border); color: var(--muted); }
        .db-btn-report  { background: none; border: 1px solid var(--rose);   color: var(--rose); }

        /* Amount right-aligned on desktop */
        .db-amount {
          font-weight: 800; font-size: 1rem; color: var(--rose);
        }
      `}</style>

      <div className="db-shell">

        {/* ── USER CARD ── */}
        <div className="card db-user-card" style={{ marginBottom: '1.2rem' }}>
          <div className="db-user-inner">
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,var(--rose),var(--sand))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.2rem', flexShrink: 0 }}>
              {initials || '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: 'clamp(1.2rem,3vw,1.5rem)', fontWeight: 900, color: 'var(--night)', marginBottom: '0.3rem' }}>
                Hi, {firstName}! 👋
              </h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                {profile?.phone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', color: 'var(--muted)' }}>
                    <Phone size={12} /> {profile.phone}
                  </span>
                )}
                {profile?.city && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', color: 'var(--muted)' }}>
                    <MapPin size={12} /> {profile.city}
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', color: 'var(--sage)' }}>
                  <ShieldCheck size={12} /> SafeShe member
                </span>
              </div>
            </div>
            <button onClick={async () => { await signOut(); navigate('/') }} className="db-user-signout"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: '1.5px solid var(--border)', borderRadius: 50, padding: '0.5rem 1.1rem', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.85rem', fontFamily: 'DM Sans,sans-serif', fontWeight: 500, whiteSpace: 'nowrap' }}>
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="db-stats" style={{ marginBottom: '1.2rem' }}>
          {[
            { icon: '📋', value: bookings.length,   label: 'Total Bookings' },
            { icon: '✅', value: confirmedCount,     label: 'Trips Done' },
            { icon: '💳', value: `₹${totalSpent.toLocaleString('en-IN')}`, label: 'Total Spent' },
          ].map(s => (
            <div key={s.label} className="card db-stat-card">
              <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{s.icon}</div>
              <div className="db-stat-val">{s.value}</div>
              <div className="db-stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div className="card" style={{ padding: '1.3rem', marginBottom: '1.2rem' }}>
          <h2 style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: '1.05rem', marginBottom: '1rem' }}>What do you need?</h2>
          <div className="db-actions-grid">
            {[
              { icon: <Search size={20} />,        label: 'Find a Guide',  sub: 'Book a verified guide', link: '/guides',  bg: 'var(--blush)',            color: 'var(--rose)' },
              { icon: <BedDouble size={20} />,     label: 'Book a Stay',   sub: 'Find safe hostels',     link: '/hostels', bg: 'rgba(122,158,126,0.12)', color: 'var(--sage)' },
              { icon: <AlertTriangle size={20} />, label: 'SOS Emergency', sub: 'Get help instantly',    link: '/sos',     bg: '#FEE2E2',                color: '#E87070' },
            ].map(a => (
              <button key={a.label} onClick={() => navigate(a.link)}
                className="db-action-btn" style={{ background: a.bg }}>
                <div style={{ color: a.color, flexShrink: 0 }}>{a.icon}</div>
                <div>
                  <div className="db-action-label">{a.label}</div>
                  <div className="db-action-sub">{a.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── BOOKINGS ── */}
        <div className="card" style={{ padding: '1.3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem', gap: '0.5rem' }}>
            <h2 style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: '1.05rem' }}>Your Bookings</h2>
            {bookings.length > 0 && (
              <span style={{ background: 'var(--blush)', color: 'var(--rose)', fontSize: '0.7rem', fontWeight: 700, padding: '0.18rem 0.65rem', borderRadius: 20, flexShrink: 0 }}>
                {bookings.length} total
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--muted)' }}>Loading your bookings…</div>
          ) : bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <div style={{ fontSize: '2.8rem', marginBottom: '0.8rem' }}>✈️</div>
              <h3 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.05rem', marginBottom: '0.4rem' }}>No bookings yet</h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.4rem', lineHeight: 1.6 }}>
                Book a guide or a safe stay to get started.
              </p>
              <Link to="/guides" className="btn-primary" style={{ fontSize: '0.88rem', padding: '0.6rem 1.4rem' }}>
                Find a Guide →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {bookings.map(b => {
                const st = STATUS_STYLE[b.status] || { bg: '#F3F0ED', color: 'var(--muted)' }
                const isActive = activeBookingId === b.id && tracking
                const isPaid = b.payment_status === 'paid'
                const needsPay = b.payment_status === 'pending' && b.status === 'pending'

                return (
                  <div key={b.id} className="db-booking">

                    {/* Icon */}
                    <div className="db-booking-icon"
                      style={{ background: b.type === 'guide' ? 'var(--blush)' : 'rgba(122,158,126,0.12)' }}>
                      {b.type === 'guide' ? '👩' : '🏠'}
                    </div>

                    {/* Info */}
                    <div className="db-booking-info">
                      <div className="db-booking-title">{getLabel(b)}</div>
                      <div className="db-booking-meta">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar size={11} />
                          {new Date(b.booking_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {b.hours && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={11} /> {b.hours} hrs
                          </span>
                        )}
                        <span style={{ fontWeight: 800, color: 'var(--rose)' }}>
                          ₹{b.amount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Status + payment tags */}
                      <div className="db-booking-tags">
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: st.color, background: st.bg, padding: '0.18rem 0.6rem', borderRadius: 20, textTransform: 'capitalize' }}>
                          {b.status}
                        </span>
                        {b.payment_method === 'upi' && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: isPaid ? 'var(--sage)' : 'var(--sand)', background: isPaid ? 'rgba(122,158,126,0.12)' : 'rgba(196,154,114,0.12)', padding: '0.18rem 0.6rem', borderRadius: 20 }}>
                            UPI {isPaid ? 'paid ✓' : 'pending'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons — below on mobile, right column on desktop */}
                    <div className="db-booking-btns">
                      {needsPay && (
                        <button className="db-btn db-btn-pay" onClick={() => handlePayNow(b)} disabled={payingId === b.id}>
                          <Smartphone size={11} /> {payingId === b.id ? 'Opening…' : 'Pay now'}
                        </button>
                      )}
                      {b.status === 'confirmed' && !isActive && (
                        <button className="db-btn db-btn-start" onClick={() => handleStartTrip(b.id)}>
                          <Navigation size={11} /> Start trip
                        </button>
                      )}
                      {b.status === 'confirmed' && isActive && (
                        <>
                          <button className="db-btn db-btn-share" onClick={handleShareTrip}>
                            <Share2 size={11} /> Share location
                          </button>
                          <button className="db-btn db-btn-end" onClick={handleEndTrip}>
                            <Square size={11} /> End trip
                          </button>
                        </>
                      )}
                      {(b.status === 'confirmed' || b.status === 'pending') && (
                        <button className="db-btn db-btn-cancel" onClick={() => cancelBooking(b.id)}>
                          Cancel
                        </button>
                      )}
                      {b.type === 'guide' && b.guide_id && (b.status === 'confirmed' || b.status === 'completed') && (
                        <button className="db-btn db-btn-report" onClick={() => setReportBooking(b)}>
                          <Flag size={11} /> Report
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

    {/* ── REPORT MODAL ── */}
    {reportBooking && (
      <ReportModal
        onClose={() => setReportBooking(null)}
        onSubmit={handleReport}
        submitting={reportSubmitting}
      />
    )}
    </>
  )
}

// ── Report modal ───────────────────────────────────────────────────
function ReportModal({ onClose, onSubmit, submitting }: {
  onClose: () => void
  onSubmit: (reason: 'different_person' | 'unsafe_behavior' | 'other', details: string) => void
  submitting: boolean
}) {
  const [reason, setReason] = useState<'different_person' | 'unsafe_behavior' | 'other'>('different_person')
  const [details, setDetails] = useState('')

  const REASONS = [
    { value: 'different_person' as const, label: '🚨 Different person showed up', desc: 'The guide who arrived is not the same person shown on the profile. This will immediately suspend the guide.' },
    { value: 'unsafe_behavior' as const, label: '⚠️ Unsafe behaviour', desc: 'The guide behaved in an unsafe or inappropriate way.' },
    { value: 'other' as const, label: '📝 Other issue', desc: 'Something else went wrong with this booking.' },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(26,15,10,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card scale-in" style={{ maxWidth: 440, width: '100%', padding: '1.5rem' }}>
        <style>{`
          @media (min-width: 480px) { .report-card-inner { padding: 2rem !important; } }
        `}</style>
        <h3 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem' }}>Report this guide</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '1.2rem', lineHeight: 1.5 }}>
          Your safety matters. Reports are reviewed promptly.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginBottom: '1.1rem' }}>
          {REASONS.map(r => (
            <button key={r.value} type="button" onClick={() => setReason(r.value)}
              style={{ textAlign: 'left', padding: '0.75rem 0.9rem', borderRadius: 12, cursor: 'pointer', border: `1.5px solid ${reason === r.value ? 'var(--rose)' : 'var(--border)'}`, background: reason === r.value ? 'var(--blush)' : 'white' }}>
              <div style={{ fontWeight: 700, fontSize: '0.86rem', marginBottom: '0.15rem' }}>{r.label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', lineHeight: 1.4 }}>{r.desc}</div>
            </button>
          ))}
        </div>
        <div className="form-group">
          <label>Additional details <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span></label>
          <textarea rows={3} value={details} onChange={e => setDetails(e.target.value)} placeholder="Tell us what happened…" maxLength={500} />
        </div>
        {reason === 'different_person' && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: 'var(--blush)', borderRadius: 10, padding: '0.65rem 0.85rem', marginBottom: '1rem', fontSize: '0.76rem', color: 'var(--rose)', lineHeight: 1.5 }}>
            <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            This will immediately suspend the guide's account pending review. Only submit if you are sure.
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button onClick={onClose} className="btn-outline" style={{ flex: 1, justifyContent: 'center' }} disabled={submitting}>Cancel</button>
          <button onClick={() => onSubmit(reason, details)} disabled={submitting}
            style={{ flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', background: 'var(--rose)', color: 'white', border: 'none', borderRadius: 50, padding: '0.7rem 1.2rem', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
            <Flag size={13} /> {submitting ? 'Submitting…' : 'Submit report'}
          </button>
        </div>
      </div>
    </div>
  )
}
