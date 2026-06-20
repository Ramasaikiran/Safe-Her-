import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Mail, Bell } from 'lucide-react'
import toast from 'react-hot-toast'

interface ComingSoonNotifyProps {
  place: string
}

/**
 * Shown when someone filters Guides/Hostels to a city or country SafeShe
 * hasn't launched in yet. Captures interest in the existing `waitlist`
 * table instead of showing an empty, dead-end screen.
 */
export default function ComingSoonNotify({ place }: ComingSoonNotifyProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error('Enter a valid email address.'); return }
    setLoading(true)
    const { error } = await supabase.from('waitlist').insert({ email: email.trim().toLowerCase(), city: place })
    setLoading(false)
    if (error) {
      if (error.code === '23505') {
        setSubmitted(true)
        return
      }
      toast.error('Could not join the waitlist. Please try again.')
      return
    }
    setSubmitted(true)
    toast.success(`We'll let you know when SafeShe reaches ${place}.`)
  }

  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌍</div>
      <h3 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Not in {place} yet</h3>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', maxWidth: 380, margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
        We're expanding city by city, country by country. Leave your email and we'll notify you the moment SafeShe launches in {place}.
      </p>

      {submitted ? (
        <p style={{ color: 'var(--sage)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
          <Bell size={15} /> You're on the list for {place}.
        </p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.6rem', maxWidth: 380, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)}
              style={{ paddingLeft: '2.2rem', padding: '0.65rem 1rem 0.65rem 2.2rem', border: '1.5px solid var(--border)', borderRadius: 50, fontSize: '0.88rem', fontFamily: 'DM Sans,sans-serif', outline: 'none', width: '100%', color: 'var(--earth)' }}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.65rem 1.4rem', fontSize: '0.88rem' }}>
            {loading ? 'Joining…' : 'Notify me'}
          </button>
        </form>
      )}
    </div>
  )
}
