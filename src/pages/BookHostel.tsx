import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { HOSTELS } from '../data/seed'
import { MapPin, CheckCircle, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import PaymentStep, { type PaymentMethod } from '../components/PaymentStep'

export default function BookHostel() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const hostel = HOSTELS.find(h => h.id === id)

  const [form, setForm] = useState({ checkIn: '', checkOut: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi')
  const [upiConfirmed, setUpiConfirmed] = useState(false)

  if (!hostel) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Playfair Display,serif' }}>Property not found</h2>
        <Link to="/hostels" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>← Back to Stays</Link>
      </div>
    </div>
  )

  const nights = form.checkIn && form.checkOut
    ? Math.max(0, Math.ceil((new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) / 86400000))
    : 0
  const total = hostel.price_per_night * (nights || 1)
  const today = new Date().toISOString().split('T')[0]

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.checkIn || !form.checkOut) { toast.error('Please select check-in and check-out dates'); return }
    if (nights < 1) { toast.error('Check-out must be after check-in'); return }
    if (!user) { toast.error('Please log in to book a stay.'); navigate('/login'); return }
    if (paymentMethod === 'upi' && !upiConfirmed) { toast.error('Please confirm your UPI payment, or switch to cash.'); return }
    setLoading(true)
    const { error } = await supabase.from('bookings').insert({
      traveller_id: user.id,
      type: 'hostel',
      hostel_id: hostel.id,
      city: hostel.city,
      booking_date: form.checkIn,
      amount: total,
      notes: `Check-in: ${form.checkIn}, Check-out: ${form.checkOut}. ${form.notes}`.trim(),
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'upi' ? 'paid' : 'pending',
    })
    setLoading(false)
    if (error) { toast.error('Could not complete your booking. Please try again.'); return }
    toast.success('🏠 Hostel booked! Confirmation sent to your mobile.')
    setTimeout(() => navigate('/dashboard'), 1500)
  }

  return (
    <div className="page" style={{ background: 'var(--warm)' }}>
      <div className="container" style={{ padding: '2.5rem 2rem', maxWidth: 900 }}>
        <Link to="/hostels" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--muted)', textDecoration: 'none', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
          <ArrowLeft size={14} /> Back to Stays
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'start' }}>
          {/* Hostel Info */}
          <div>
            <div className="card" style={{ overflow: 'hidden', marginBottom: '1.5rem' }}>
              <div style={{ height: 240, background: `url(${hostel.image_url}) center/cover`, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: '0.4rem' }}>
                  {hostel.women_only && <span className="badge badge-rose">♀ Women Only</span>}
                  {hostel.verified && <span className="badge badge-sage">✓ SafeStay Verified</span>}
                </div>
              </div>
              <div style={{ padding: '1.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.5rem', fontWeight: 900 }}>{hostel.name}</h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ color: '#FFB800' }}>★</span>
                    <strong>{hostel.rating}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>({hostel.reviews})</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1.2rem' }}>
                  <MapPin size={12} />{hostel.address}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                  {hostel.amenities.map(a => <span key={a} className="badge badge-sand">{a}</span>)}
                </div>
                <div style={{ display: 'flex', gap: '2rem', padding: '1rem', background: 'var(--warm)', borderRadius: 12 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: 'var(--rose)', fontSize: '1.2rem' }}>₹{hostel.price_per_night}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>per night</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{hostel.available_rooms}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>rooms left</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.2rem', color: hostel.women_only ? 'var(--rose)' : 'var(--sage)' }}>
                      {hostel.women_only ? '♀ Only' : 'Mixed'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>guest type</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.6rem' }}>
              <h3 style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, marginBottom: '1rem' }}>SafeStay Guarantee</h3>
              {[
                'Physical property inspection by our team',
                'Background-checked staff members',
                '24/7 CCTV in common areas',
                'Emergency contact with local SafeShe team',
                'Free SafeShe SOS button during your stay',
              ].map(item => (
                <div key={item} style={{ display: 'flex', gap: '0.7rem', marginBottom: '0.6rem', alignItems: 'flex-start' }}>
                  <CheckCircle size={15} color="var(--sage)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Booking Form */}
          <div className="card" style={{ padding: '1.8rem', position: 'sticky', top: 90 }}>
            <h2 style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, marginBottom: '0.3rem' }}>Reserve Your Room</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>₹{hostel.price_per_night}/night · Free cancellation</p>

            <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div className="form-group">
                  <label>Check-in</label>
                  <input type="date" min={today} value={form.checkIn}
                    onChange={e => setForm(f => ({ ...f, checkIn: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Check-out</label>
                  <input type="date" min={form.checkIn || today} value={form.checkOut}
                    onChange={e => setForm(f => ({ ...f, checkOut: e.target.value }))} required />
                </div>
              </div>
              <div className="form-group">
                <label>Special Requests (optional)</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Early check-in, dietary needs, accessibility requirements..."
                  rows={3} style={{ resize: 'vertical' }} />
              </div>

              <PaymentStep
                amount={total}
                note={`SafeShe stay — ${hostel.name}`}
                txnRef={`H-${hostel.id}-${Date.now()}`}
                method={paymentMethod}
                onMethodChange={setPaymentMethod}
                upiConfirmed={upiConfirmed}
                onUpiConfirmedChange={setUpiConfirmed}
              />

              {nights > 0 && (
                <div style={{ background: 'var(--warm)', borderRadius: 12, padding: '1rem', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--muted)' }}>₹{hostel.price_per_night} × {nights} night{nights > 1 ? 's' : ''}</span>
                    <span>₹{hostel.price_per_night * nights}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--muted)' }}>SafeStay verification fee</span>
                    <span>₹0</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, paddingTop: '0.6rem', borderTop: '1px solid var(--border)', marginTop: '0.4rem' }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--rose)' }}>₹{hostel.price_per_night * nights}</span>
                  </div>
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? 'Confirming...' : 'Confirm Reservation →'}
              </button>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
                Free cancellation up to 48 hours before check-in.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
