import { useState } from 'react'
import { Smartphone, Banknote, CheckCircle2 } from 'lucide-react'
import { buildUpiLink, buildUpiQrImageUrl, isLikelyMobile } from '../lib/upi'

export type PaymentMethod = 'upi' | 'cash'

interface PaymentStepProps {
  amount: number
  note: string
  txnRef: string
  method: PaymentMethod
  onMethodChange: (m: PaymentMethod) => void
  upiConfirmed: boolean
  onUpiConfirmedChange: (v: boolean) => void
}

/**
 * Payment method picker used on both BookGuide and BookHostel.
 * UPI: opens a upi:// deep link (or shows a QR on desktop), traveller
 * self-confirms once they've paid — there's no gateway to verify this
 * automatically (see lib/upi.ts for why).
 * Cash: pay the guide/property directly, nothing to confirm here.
 */
export default function PaymentStep({ amount, note, txnRef, method, onMethodChange, upiConfirmed, onUpiConfirmedChange }: PaymentStepProps) {
  const [showQr, setShowQr] = useState(false)
  const upiLink = buildUpiLink(amount, note, txnRef)
  const mobile = isLikelyMobile()

  return (
    <div className="form-group">
      <label>Payment method</label>
      <div style={{ display: 'flex', gap: '0.7rem', marginBottom: '0.9rem' }}>
        <button type="button" onClick={() => onMethodChange('upi')}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            padding: '0.7rem', borderRadius: 12, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
            border: `1.5px solid ${method === 'upi' ? 'var(--rose)' : 'var(--border)'}`,
            background: method === 'upi' ? 'var(--blush)' : 'white', color: method === 'upi' ? 'var(--rose)' : 'var(--earth)',
          }}>
          <Smartphone size={16} /> Pay via UPI
        </button>
        <button type="button" onClick={() => onMethodChange('cash')}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            padding: '0.7rem', borderRadius: 12, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
            border: `1.5px solid ${method === 'cash' ? 'var(--sage)' : 'var(--border)'}`,
            background: method === 'cash' ? 'rgba(122,158,126,0.1)' : 'white', color: method === 'cash' ? 'var(--sage)' : 'var(--earth)',
          }}>
          <Banknote size={16} /> Pay in cash
        </button>
      </div>

      {method === 'upi' && (
        <div style={{ background: 'var(--warm)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.1rem' }}>
          {mobile ? (
            <a href={upiLink} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: '0.8rem' }}>
              Open UPI app to pay ₹{amount.toLocaleString('en-IN')}
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
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={upiConfirmed} onChange={e => onUpiConfirmedChange(e.target.checked)} style={{ accentColor: 'var(--rose)', width: 16, height: 16 }} />
            I've completed the UPI payment
          </label>
        </div>
      )}

      {method === 'cash' && (
        <div style={{ background: 'rgba(122,158,126,0.08)', border: '1px solid rgba(122,158,126,0.25)', borderRadius: 14, padding: '1rem', display: 'flex', gap: '0.6rem' }}>
          <CheckCircle2 size={16} color="var(--sage)" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: '0.84rem', color: 'var(--muted)', lineHeight: 1.5 }}>
            Pay directly when you arrive. Your booking is confirmed either way.
          </p>
        </div>
      )}
    </div>
  )
}
