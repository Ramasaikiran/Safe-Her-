import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Shield, Home, Search, BedDouble, LayoutDashboard, LogOut, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const dashboardPath = profile?.role === 'guide' ? '/guide-dashboard' : '/dashboard'

  const handleSignOut = async () => {
    await signOut()
    toast.success('You have been signed out safely.')
    navigate('/')
  }

  const active = (path: string) => pathname === path

  // Simple nav links — plain words, no jargon
  const navLinks = [
    { to: '/guides',  label: 'Find a Guide',  icon: <Search size={17} /> },
    { to: '/hostels', label: 'Safe Stays',     icon: <BedDouble size={17} /> },
    { to: '/sos',     label: 'SOS',            icon: <AlertTriangle size={17} />, danger: true },
  ]

  return (
    <>
      {/* ── DESKTOP TOP NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: 'rgba(251,247,244,0.97)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(196,154,114,0.18)',
        height: 68, display: 'flex', alignItems: 'center',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>

          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Shield size={22} color="var(--rose)" strokeWidth={2.5} />
            <span style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.45rem', fontWeight: 900, color: 'var(--rose)' }}>
              Safe<span style={{ color: 'var(--earth)' }}>She</span>
            </span>
          </Link>

          {/* Centre links */}
          <ul style={{ listStyle: 'none', display: 'flex', gap: '0.2rem', alignItems: 'center' }} className="desktop-only">
            {navLinks.map(l => (
              <li key={l.to}>
                <Link to={l.to} style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.5rem 1.1rem', borderRadius: 50,
                  fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none',
                  background: l.danger
                    ? active(l.to) ? 'var(--rose)' : 'var(--blush)'
                    : active(l.to) ? 'var(--blush)' : 'transparent',
                  color: l.danger ? active(l.to) ? 'white' : 'var(--rose)' : active(l.to) ? 'var(--rose)' : 'var(--earth)',
                  transition: 'all 0.2s',
                }}>
                  {l.icon} {l.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right — auth actions */}
          <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'center' }} className="desktop-only">
            {user ? (
              <>
                <Link to={dashboardPath} style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.5rem 1.2rem', borderRadius: 50,
                  background: active(dashboardPath) ? 'var(--blush)' : 'transparent',
                  color: active(dashboardPath) ? 'var(--rose)' : 'var(--earth)',
                  fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none',
                  border: '1.5px solid var(--border)',
                }}>
                  <LayoutDashboard size={15} /> My Dashboard
                </Link>
                <button onClick={handleSignOut} style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--muted)', fontSize: '0.88rem',
                  fontFamily: 'DM Sans,sans-serif', fontWeight: 500,
                  padding: '0.4rem 0.6rem', borderRadius: 8,
                }}>
                  <LogOut size={15} /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={{
                  padding: '0.5rem 1.2rem', borderRadius: 50,
                  fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none',
                  color: 'var(--earth)', border: '1.5px solid var(--border)',
                }}>Sign In</Link>
                <Link to="/register" className="btn-primary" style={{ padding: '0.5rem 1.4rem', fontSize: '0.9rem' }}>
                  Join Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── MOBILE BOTTOM TAB BAR ── */}
      <nav className="mobile-only" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
        background: 'white', borderTop: '1px solid rgba(196,154,114,0.18)',
        display: 'flex', alignItems: 'stretch',
        boxShadow: '0 -4px 24px rgba(61,35,20,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {[
          { to: '/',          label: 'Home',      icon: <Home size={20} /> },
          { to: '/guides',    label: 'Guides',    icon: <Search size={20} /> },
          { to: '/sos',       label: 'SOS',       icon: <AlertTriangle size={20} />, danger: true },
          { to: '/hostels',   label: 'Stays',     icon: <BedDouble size={20} /> },
          { to: user ? dashboardPath : '/login', label: user ? 'Me' : 'Sign In', icon: <LayoutDashboard size={20} /> },
        ].map(t => (
          <Link key={t.to} to={t.to} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: '0.25rem', padding: '0.6rem 0.2rem',
            textDecoration: 'none',
            background: t.danger ? active(t.to) ? 'var(--rose)' : 'transparent' : 'transparent',
            color: t.danger ? active(t.to) ? 'white' : 'var(--rose)' : active(t.to) ? 'var(--rose)' : 'var(--muted)',
            borderTop: active(t.to) && !t.danger ? '2px solid var(--rose)' : '2px solid transparent',
          }}>
            {t.icon}
            <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>{t.label}</span>
          </Link>
        ))}
      </nav>

      <style>{`
        .desktop-only { display: flex !important; }
        .mobile-only  { display: none !important; }
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .mobile-only  { display: flex !important; }
          .page { padding-bottom: calc(64px + env(safe-area-inset-bottom)) !important; }
        }
      `}</style>
    </>
  )
}
