import { supabase } from './supabase'

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void }
  }
}

let scriptPromise: Promise<void> | null = null

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not load Razorpay checkout.'))
    document.body.appendChild(script)
  })
  return scriptPromise
}

interface CreateOrderResponse {
  order_id: string
  amount: number
  currency: string
  key_id: string
}

/**
 * Creates a Razorpay order via the create-razorpay-order Edge Function
 * (server-side, holds the secret key) and opens Checkout restricted to
 * UPI. The `paid` / `failed` state on the booking is only ever written
 * by the razorpay-webhook function after Razorpay confirms the payment
 * server-to-server — this function's callbacks just decide where to
 * navigate next, they never set payment status themselves.
 */
export async function payBookingWithUpi(opts: {
  bookingId: string
  name: string
  description: string
  prefillEmail?: string
  prefillContact?: string
  onDismiss: () => void
  onSuccess?: () => void
}): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (!accessToken) throw new Error('You need to be signed in to pay.')

  const { data, error } = await supabase.functions.invoke<CreateOrderResponse>('razorpay-create-order', {
    body: { booking_id: opts.bookingId },
  })
  if (error || !data) {
    throw new Error(error?.message || 'Could not start payment. Please try again.')
  }

  await loadRazorpayScript()

  const rzp = new window.Razorpay({
    key: data.key_id,
    order_id: data.order_id,
    amount: data.amount,
    currency: data.currency,
    name: 'SafeShe',
    description: opts.description,
    prefill: { email: opts.prefillEmail, contact: opts.prefillContact },
    method: { upi: true, card: false, netbanking: false, wallet: false, emi: false, paylater: false },
    theme: { color: '#E8445A' },
    handler: async () => {
      // Razorpay reported success — send confirmation email then navigate
      if (opts.onSuccess) await opts.onSuccess()
      else window.location.href = `/payment-status/${opts.bookingId}`
    },
    modal: { ondismiss: opts.onDismiss },
  })
  rzp.open()
}
