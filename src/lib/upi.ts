/**
 * Direct UPI deep-link payments — no payment gateway, no fees, no API
 * keys. Generates a standard `upi://pay` URI that opens GPay/PhonePe/
 * Paytm/BHIM directly on the amount due.
 *
 * IMPORTANT: set PLATFORM_UPI_ID to your real UPI ID (VPA) below before
 * going live — e.g. 'yourname@okaxis' or a business VPA. Until then this
 * uses a placeholder and payments won't reach a real account.
 *
 * Because there's no gateway, SafeShe can't verify a payment landed —
 * the traveller marks "I've paid" themselves after completing it in
 * their UPI app (payment_status on the booking). For real-time payment
 * verification you'd eventually need a gateway (Razorpay/Cashfree UPI
 * intent + webhook), which costs money — this direct-VPA approach is
 * the free path while you're starting out.
 */

export const PLATFORM_UPI_ID = 'safeshe@upi' // TODO: replace with your real UPI ID (VPA)
export const PLATFORM_PAYEE_NAME = 'SafeShe'

export function buildUpiLink(amount: number, note: string, txnRef: string): string {
  const params = new URLSearchParams({
    pa: PLATFORM_UPI_ID,
    pn: PLATFORM_PAYEE_NAME,
    am: amount.toFixed(2),
    cu: 'INR',
    tn: note,
    tr: txnRef,
  })
  return `upi://pay?${params.toString()}`
}

export function buildUpiQrImageUrl(upiLink: string): string {
  // Free, no-key QR rendering service — renders the upi:// link as a
  // scannable QR code client-side (no library, no bundle weight).
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiLink)}`
}

export function isLikelyMobile(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}
