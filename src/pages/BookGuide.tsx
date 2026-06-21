import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { GUIDES } from '../data/seed'
import { MapPin, CheckCircle, ArrowLeft, Clock, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import PaymentStep from '../components/PaymentStep'

export default function BookGuide() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const guide = GUIDES.find(g => g.id === id)

  const [form, setForm] = useState({ date: '', hours: 2, notes: '' })
  const [loading, setLoading] = useState(false)

  if (!guide) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Playfair Display,serif' }}>Guide not found</h2>
        <Link to="/guides" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>← Back to Guides</Link>
      </div>
    </div>
  )

  const total = guide.price_per_hour * form.hours

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.date) { toast.error('Please select a date'); return }
    if (!user) { toast.error('Please log in to book a guide.'); navigate('/login'); return }
    setLoading(true)
    const { error } = await supabase.from('bookings').insert({
      traveller_id: user.id,
      type: 'guide',
      guide_id: guide.id,
      city: guide.city,
      booking_date: form.date,
      hours: form.hours,
      amount: total,
      notes: form.notes || null,
      payment_method: 'upi',
      payment_status: 'pending',
    })
    setLoading(false)
    if (error) {
      toast.error('Could not complete your booking. Please try again.')
      return
    }
    toast.success('🎉 Booking confirmed! Your guide will contact you within 2 hours.')
    navigate('/dashboard')
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="page" style={{ background: 'var(--warm)' }}>
      <div className="container" style={{ padding: '2.5rem 2rem', maxWidth: 900 }}>
        <Link to="/guides" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--muted)', textDecoration: 'none', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
          <ArrowLeft size={14} /> Back to Guides
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
          {/* Guide Info */}
          <div>
            <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1.2rem', marginBottom: '1.5rem' }}>
                <img src={guide.avatar_url} alt={guide.name} style={{ width: 80, height: 80, borderRadius: '50%' }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.5rem', fontWeight: 900 }}>{guide.name}</h1>
                    <CheckCircle size={18} color="var(--sage)" />
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', margin: '0.3rem 0' }}><MapPin size={12} />{guide.city}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ color: '#FFB800' }}>{'★'.repeat(Math.round(guide.rating))}</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{guide.rating} · {guide.reviews} reviews · {guide.trips_completed} trips</span>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: '#6B4A3A', marginBottom: '1.5rem' }}>{guide.bio}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--earth)', marginBottom: '0.5rem' }}>Specialties</div>
                  {guide.specialties.map(s => <div key={s} style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>• {s}</div>)}
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--earth)', marginBottom: '0.5rem' }}>Languages</div>
                  {guide.languages.map(l => <div key={l} style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>• {l}</div>)}
                </div>
              </div>
            </div>

            {/* What to expect */}
            <div className="card" style={{ padding: '1.6rem' }}>
              <h3 style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, marginBottom: '1rem' }}>What to Expect</h3>
              {[
                { icon: '✓', text: 'Guide contacts you within 2 hours of booking confirmation' },
                { icon: '✓', text: 'Meeting point shared via WhatsApp before your trip' },
                { icon: '✓', text: 'Free cancellation up to 24 hours before' },
                { icon: '✓', text: '24/7 SafeShe support throughout your experience' },
              ].map(item => (
                <div key={item.text} style={{ display: 'flex', gap: '0.7rem', marginBottom: '0.7rem' }}>
                  <span style={{ color: 'var(--sage)', fontWeight: 700, flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.5 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Booking Form */}
          <div className="card" style={{ padding: '1.8rem', position: 'sticky', top: 90 }}>
            <h2 style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, marginBottom: '0.3rem' }}>Book {guide.name}</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>₹{guide.price_per_hour}/hour · Instant confirmation</p>

            <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="form-group">
                <label>Trip Date</label>
                <input type="date" min={today} value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Duration</label>
                <select value={form.hours} onChange={e => setForm(f => ({ ...f, hours: Number(e.target.value) }))}>
                  {[1,2,3,4,5,6,7,8].map(h => <option key={h} value={h}>{h} hour{h > 1 ? 's' : ''} — ₹{guide.price_per_hour * h}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Special Requests (optional)</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any specific places you'd like to visit, accessibility needs, etc."
                  rows={3} style={{ resize: 'vertical' }} />
              </div>

              <PaymentStep
                amount={total + Math.round(total * 0.1)}
                note={`SafeShe guide booking — ${guide.name}`}
                txnRef={`G-${guide.id}-${Date.now()}`}
              />

              {/* Summary */}
              <div style={{ background: 'var(--warm)', borderRadius: 12, padding: '1rem', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--muted)' }}>₹{guide.price_per_hour} × {form.hours} hours</span>
                  <span>₹{total}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--muted)' }}>SafeShe service fee</span>
                  <span>₹{Math.round(total * 0.1)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, paddingTop: '0.6rem', borderTop: '1px solid var(--border)', marginTop: '0.4rem' }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--rose)' }}>₹{total + Math.round(total * 0.1)}</span>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? 'Confirming Booking...' : 'Confirm Booking →'}
              </button>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
                Free cancellation up to 24 hours before.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
