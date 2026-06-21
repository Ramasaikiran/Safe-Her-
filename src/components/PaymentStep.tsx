import { useState } from 'react'
import { Smartphone, Clock } from 'lucide-react'
import { buildUpiLink, buildUpiQrImageUrl, isLikelyMobile } from '../lib/upi'

/**
 * UPI-only payment step.
 *
 * There's no self-confirm checkbox here on purpose: a raw `upi://pay`
 * link to a personal VPA has no callback to any website — UPI apps
 * don't report back, so there is nothing for this code to honestly
 * verify. The booking is created with payment_status='pending' and
 * stays that way until a real gateway integration (see lib/upi.ts and
 * the project's pending Razorpay/Cashfree setup) can confirm it via
 * webhook. Don't reintroduce a "mark as paid" button here — that would
 * just be the same unverifiable claim with extra steps.
 */
export default function PaymentStep({ amount, note, txnRef }: { amount: number; note: string; txnRef: string }) {
  const [showQr, setShowQr] = useState(false)
  const upiLink = buildUpiLink(amount, note, txnRef)
  const mobile = isLikelyMobile()

  return (
    <div className="form-group">
      <label>Payment — UPI</label>
      <div style={{ background: 'var(--warm)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.1rem' }}>
        {mobile ? (
          <a href={upiLink} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Smartphone size={16} /> Open UPI app to pay ₹{amount.toLocaleString('en-IN')}
          </a>
        ) : (
          <>
            <button type="button" onClick={() => setShowQr(s => !s)} className="btn-outline" style={{ width: '100%', justifyContent: 'center', marginBottom: '0.8rem' }}>
              {showQr ? 'Hide QR code' : `Show QR to pay ₹${amount.toLocaleString('en-IN')}`}
            </button>
            {showQr && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.8rem' }}>
                <img src={buildUpiQrImageUrl(upiLink)} alt="UPI QR code" width={180} height={180} style={{ borderRadius: 10, border: '1px solid var(--border)' }} />
              </div>
            )}
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', textAlign: 'center', marginBottom: '0.8rem' }}>
              Scan with GPay, PhonePe, Paytm, or any UPI app.
            </p>
          </>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--muted)', background: 'rgba(212,165,116,0.12)', padding: '0.7rem 0.85rem', borderRadius: 10 }}>
          <Clock size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Your booking is confirmed once payment is received and verified — this can take a few minutes.</span>
        </div>
      </div>
    </div>
  )
}
