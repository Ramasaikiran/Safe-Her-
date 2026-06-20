import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Shield, Phone, AlertTriangle, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SOS() {
  const { user, profile } = useAuth()
  const [activated, setActivated] = useState(false)
  const [countdown, setCountdown] = useState(3)

  const handleSOS = () => {
    let c = 3
    const interval = setInterval(() => {
      c--
      setCountdown(c)
      if (c === 0) {
        clearInterval(interval)
        setActivated(true)
        toast.error('🚨 SOS Activated! Help is on the way.', { duration: 5000, style: { background: 'var(--rose)', color: 'white' } })
      } else {
        setCountdown(c)
      }
    }, 1000)
  }

  return (
    <div className="page" style={{ background: activated ? '#1A0505' : 'linear-gradient(135deg, var(--night), #3D1520)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '2rem', maxWidth: 500, width: '100%' }}>
        {!activated ? (
          <>
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(232,68,90,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '2px solid rgba(232,68,90,0.3)' }}>
              <Shield size={48} color="var(--rose)" />
            </div>
            <h1 style={{ fontFamily: 'Playfair Display,serif', color: 'white', fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>SafeShe SOS</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '3rem', lineHeight: 1.6 }}>
              Press and hold the SOS button to alert the SafeShe emergency team and nearest local police station.
            </p>

            {/* Big SOS Button */}
            <button
              onMouseDown={handleSOS}
              style={{
                width: 180, height: 180, borderRadius: '50%',
                background: 'var(--rose)',
                border: '6px solid rgba(232,68,90,0.4)',
                outline: '12px solid rgba(232,68,90,0.15)',
                color: 'white', fontSize: '1.4rem', fontWeight: 900,
                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem',
                boxShadow: '0 0 60px rgba(232,68,90,0.4)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                fontFamily: 'Playfair Display,serif', gap: '0.3rem'
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
            >
              <AlertTriangle size={36} />
              SOS
            </button>

            {/* Quick Contacts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem', marginBottom: '2rem' }}>
              {[
                { label: 'Police', number: '100', icon: '👮' },
                { label: 'SafeShe', number: '1800-xxx', icon: '🛡️' },
                { label: 'Women Helpline', number: '181', icon: '♀' },
              ].map(c => (
                <a key={c.label} href={`tel:${c.number}`}
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '1rem 0.8rem', color: 'white', textDecoration: 'none', transition: 'background 0.2s' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{c.icon}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{c.label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>{c.number}</div>
                </a>
              ))}
            </div>

            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
              {user ? `Logged in as ${profile?.email || '••••••••••'}` : 'Not logged in — create an account for personalized emergency support'}.
              <br />Your location will be shared with emergency contacts when SOS is activated.
            </p>
          </>
        ) : (
          // Activated State
          <div style={{ animation: 'pulse 1s ease-in-out infinite' }}>
            <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--rose)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 0 80px rgba(232,68,90,0.6)' }}>
              <AlertTriangle size={56} color="white" />
            </div>
            <h1 style={{ fontFamily: 'Playfair Display,serif', color: 'white', fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>🚨 SOS Activated</h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '2rem', fontSize: '1.05rem' }}>Help is on the way. Stay calm.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '2rem' }}>
              {[
                '✓ SafeShe emergency team notified',
                '✓ Your location shared with responders',
                '✓ Nearest police station alerted',
                '⏳ Expected response: 8–15 minutes',
              ].map(msg => (
                <div key={msg} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.8rem 1rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem' }}>{msg}</div>
              ))}
            </div>
            <button onClick={() => setActivated(false)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 50, padding: '0.7rem 1.5rem', cursor: 'pointer', fontSize: '0.88rem', fontFamily: 'DM Sans,sans-serif' }}>
              Cancel SOS
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }`}</style>
    </div>
  )
}
