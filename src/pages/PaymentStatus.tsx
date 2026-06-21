import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react'

type Status = 'checking' | 'paid' | 'failed' | 'timeout' | 'not_found'

interface BookingRow {
  id: string
  amount: number
  type: string
  status: string
  payment_status: 'pending' | 'paid' | 'failed'
}

const POLL_MS = 2500
const TIMEOUT_MS = 90000 // 90s -- Razorpay webhooks land in seconds normally

/**
 * The only page in the app that says "Payment successful" -- and it
 * only says that once `payment_status` on the booking has actually
 * been flipped to 'paid' by the razorpay-webhook function. Checkout's
 * client-side success callback just lands you here; this page does the
 * real waiting and checking.
 */
export default function PaymentStatus() {
  const { bookingId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('checking')
  const [booking, setBooking] = useState<BookingRow | null>(null)
  const startedAt = useRef(Date.now())

  const check = useCallback(async () => {
    if (!bookingId) return
    const { data, error } = await supabase
      .from('bookings')
      .select('id, amount, type, status, payment_status')
      .eq('id', bookingId)
      .maybeSingle()

    if (error || !data) {
      setStatus('not_found')
      return
    }
    setBooking(data as BookingRow)

    if (data.payment_status === 'paid') {
      setStatus('paid')
    } else if (data.payment_status === 'failed') {
      setStatus('failed')
    } else if (Date.now() - startedAt.current > TIMEOUT_MS) {
      setStatus('timeout')
    } else {
      setStatus('checking')
    }
  }, [bookingId])

  useEffect(() => {
    check()
    const interval = setInterval(check, POLL_MS)
    return () => clearInterval(interval)
  }, [check])

  if (!user) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
        <p style={{ color: 'var(--muted)' }}>Please log in to see your payment status.</p>
        <button className="btn-primary" onClick={() => navigate('/login')}>Log in</button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="card" style={{ maxWidth: 420, width: '100%', padding: '2.4rem', textAlign: 'center' }}>
        {status === 'checking' && (
          <>
            <Loader2 size={42} className="spin" color="var(--rose)" style={{ marginBottom: '1.2rem' }} />
            <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.3rem', marginBottom: '0.5rem' }}>Confirming your payment…</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>This usually takes a few seconds. Don't close this page.</p>
          </>
        )}

        {status === 'paid' && (
          <>
            <CheckCircle2 size={48} color="var(--sage)" style={{ marginBottom: '1.2rem' }} />
            <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.3rem', marginBottom: '0.5rem' }}>Payment successful</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.6rem' }}>
              {booking ? `₹${booking.amount.toLocaleString('en-IN')} received. Your booking is confirmed.` : 'Your booking is confirmed.'}
            </p>
            <Link to="/dashboard" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Go to Dashboard</Link>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle size={48} color="var(--rose)" style={{ marginBottom: '1.2rem' }} />
            <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.3rem', marginBottom: '0.5rem' }}>Payment not done</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.6rem' }}>
              Your payment didn't go through. Your booking is still on hold — you can try paying again from your dashboard.
            </p>
            <Link to="/dashboard" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Back to Dashboard</Link>
          </>
        )}

        {status === 'timeout' && (
          <>
            <RefreshCw size={42} color="var(--muted)" style={{ marginBottom: '1.2rem' }} />
            <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.3rem', marginBottom: '0.5rem' }}>Still confirming</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.6rem' }}>
              This is taking longer than usual. If money left your account, it'll reflect here shortly — check your dashboard in a few minutes.
            </p>
            <button className="btn-outline" onClick={() => { startedAt.current = Date.now(); setStatus('checking'); check() }} style={{ width: '100%', justifyContent: 'center', marginBottom: '0.7rem' }}>
              Check again
            </button>
            <Link to="/dashboard" style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Back to Dashboard</Link>
          </>
        )}

        {status === 'not_found' && (
          <>
            <XCircle size={48} color="var(--muted)" style={{ marginBottom: '1.2rem' }} />
            <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.3rem', marginBottom: '0.5rem' }}>Booking not found</h2>
            <Link to="/dashboard" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Go to Dashboard</Link>
          </>
        )}
      </div>
    </div>
  )
}
