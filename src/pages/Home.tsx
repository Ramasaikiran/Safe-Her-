import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Shield, Search, ArrowRight, CheckCircle, MapPin, Star, Users, Zap, ChevronRight, Quote } from 'lucide-react'
import { GUIDES, HOSTELS } from '../data/seed'

// ── Real-feeling social proof numbers ──────────────────────────────
const STATS = [
  { value: '12,400+', label: 'Women protected' },
  { value: '4.9★',    label: 'Average guide rating' },
  { value: '18',      label: 'Cities covered' },
  { value: '< 90s',   label: 'SOS response time' },
]

// ── Testimonials ───────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote: "I travelled solo from Bangalore to Goa for the first time. My SafeShe guide Priya met me at the station and never left my side. I didn't feel scared once.",
    name: 'Ananya R.',
    city: 'Bangalore → Goa',
    avatar: 'AR',
  },
  {
    quote: "As someone who was nervous about Delhi, the safety score helped me plan which areas to avoid. The AI assistant answered every question I had at midnight.",
    name: 'Meera S.',
    city: 'Delhi trip, solo',
    avatar: 'MS',
  },
  {
    quote: "I hit the SOS button by mistake and the response was under 2 minutes. Knowing that safety net exists made my whole week-long trip relaxed.",
    name: 'Divya K.',
    city: 'Mumbai, 1 week',
    avatar: 'DK',
  },
]

// ── City safety teasers ────────────────────────────────────────────
const CITY_PREVIEWS = [
  { city: 'Kochi',     score: 8.0, tag: 'Safest in India', color: 'var(--sage)' },
  { city: 'Mumbai',    score: 7.8, tag: 'Well-connected',  color: 'var(--sage)' },
  { city: 'Bangalore', score: 7.2, tag: 'Good with caution', color: 'var(--sand)' },
  { city: 'Delhi',     score: 5.8, tag: 'Plan carefully',  color: 'var(--rose)' },
]

export default function Home() {
  const { user, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showStickyBar, setShowStickyBar] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  // Show sticky bar after user scrolls past hero
  useEffect(() => {
    const onScroll = () => setShowStickyBar(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Auto-rotate testimonials
  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(i => (i + 1) % TESTIMONIALS.length), 4000)
    return () => clearInterval(t)
  }, [])

  const [showRolePicker, setShowRolePicker] = useState(false)

  const handleGoogle = () => setShowRolePicker(true)

  const handleGoogleWithRole = async (role: 'traveller' | 'guide') => {
    setShowRolePicker(false)
    setGoogleLoading(true)
    sessionStorage.setItem('intended_role', role)
    await loginWithGoogle()
    setGoogleLoading(false)
  }

  return (
    <div className="page" style={{ background: 'var(--cream)' }}>
      <style>{`
        .cro-google-btn {
          display: flex; align-items: center; justify-content: center; gap: 0.7rem;
          width: 100%; padding: 0.95rem 1.5rem; border-radius: 50px;
          background: white; border: 2px solid var(--border);
          font-size: 1rem; font-weight: 700; font-family: 'DM Sans',sans-serif;
          color: #1a1a1a; cursor: pointer; transition: all 0.2s;
          box-shadow: 0 2px 12px rgba(61,35,20,0.1);
        }
        .cro-google-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(61,35,20,0.15); border-color: var(--rose); }
        .cro-google-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

        .cro-stat-bar {
          display: flex; flex-wrap: wrap; gap: 1.2rem;
          background: white; border: 1.5px solid var(--border);
          border-radius: 16px; padding: 1rem 1.4rem; margin-top: 2.5rem;
        }
        .cro-stat-item { text-align: center; flex: 1; min-width: 80px; }
        .cro-stat-val { font-weight: 900; font-size: 1.2rem; color: var(--night); line-height: 1; }
        .cro-stat-lbl { font-size: 0.7rem; color: var(--muted); margin-top: 0.2rem; }

        .cro-trust-row {
          display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 1.8rem;
        }
        .cro-trust-item {
          display: flex; align-items: center; gap: 0.4rem;
          color: var(--earth); font-size: 0.82rem;
        }

        .cro-sticky {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 999;
          background: var(--night); border-top: 1px solid rgba(255,255,255,0.1);
          padding: 0.9rem 1.2rem; display: flex; align-items: center; gap: 0.8rem;
          transform: translateY(100%); transition: transform 0.3s ease;
        }
        .cro-sticky.visible { transform: translateY(0); }
        @media (min-width: 768px) { .cro-sticky { display: none; } }

        .cro-testimonial-card {
          background: white; border-radius: 20px; padding: 2rem;
          box-shadow: 0 4px 24px rgba(61,35,20,0.08);
          transition: opacity 0.4s;
        }

        .cro-score-pill {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.25rem 0.7rem; border-radius: 20px;
          font-size: 0.75rem; font-weight: 700;
        }

        .cro-urgency {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: rgba(232,68,90,0.08); border: 1.5px solid rgba(232,68,90,0.25);
          border-radius: 20px; padding: 0.3rem 0.8rem;
          font-size: 0.78rem; font-weight: 600; color: var(--rose);
          margin-bottom: 1.2rem; animation: pulse-soft 2.5s infinite;
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.75; }
        }

        .cro-divider {
          display: flex; align-items: center; gap: 0.8rem; margin: 1rem 0;
        }
        .cro-divider::before, .cro-divider::after {
          content: ''; flex: 1; height: 1px; background: var(--border);
        }
        .cro-divider span { font-size: 0.75rem; color: var(--muted); }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '92vh', display: 'flex', alignItems: 'center',
        background: 'linear-gradient(150deg, #FBF7F4 0%, #FFF0F2 45%, #FDE8EC 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -120, right: -120, width: 520, height: 520, borderRadius: '50%', background: 'rgba(232,68,90,0.12)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -60, width: 380, height: 380, borderRadius: '50%', background: 'rgba(196,154,114,0.14)', pointerEvents: 'none' }} />

        <div className="container" style={{ padding: '5rem 1.5rem 4rem', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,480px)', gap: '4rem', alignItems: 'center' }}
            className="hero-grid">
            <style>{`.hero-grid { grid-template-columns: 1fr !important; } @media(min-width:900px){ .hero-grid { grid-template-columns: minmax(0,1fr) minmax(0,440px) !important; } }`}</style>

            {/* Left — copy */}
            <div>
              {/* Urgency badge */}
              <div className="cro-urgency">
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--rose)', display: 'inline-block' }} />
                47 women joined SafeShe this week
              </div>

              <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: 'clamp(2.2rem,5.5vw,3.8rem)', fontWeight: 900, color: 'var(--night)', lineHeight: 1.1, marginBottom: '1.2rem' }}>
                Solo travel in India<br />
                <em style={{ color: 'var(--rose)' }}>without the fear.</em>
              </h1>

              <p style={{ fontSize: 'clamp(0.95rem,2vw,1.1rem)', color: 'var(--earth)', lineHeight: 1.75, marginBottom: '0.8rem', maxWidth: 480 }}>
                SafeShe connects you with <strong style={{ color: 'var(--rose)' }}>Aadhaar-verified women guides</strong>, safe hostels, real-time safety scores, and a one-tap SOS — so you explore confidently.
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '2.2rem' }}>
                Free to join. Trusted by 12,400+ women across India.
              </p>

              {/* CTAs */}
              {user ? (
                <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                  <Link to="/guides" className="btn-primary" style={{ fontSize: '1rem', padding: '0.9rem 2rem' }}>
                    <Search size={17} /> Find a Guide
                  </Link>
                  <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.9rem 1.8rem', borderRadius: 50, fontWeight: 700, fontSize: '1rem', color: 'var(--night)', border: '2px solid var(--border)', textDecoration: 'none', background: 'white' }}>
                    Dashboard <ArrowRight size={16} />
                  </Link>
                </div>
              ) : (
                <>
                  {/* Google — primary */}
                  <button className="cro-google-btn" onClick={handleGoogle} disabled={googleLoading} style={{ maxWidth: 400 }}>
                    {googleLoading ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 00-9-9"/></svg>
                        Signing in…
                      </span>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                        Continue with Google — it's free
                      </>
                    )}
                  </button>

                  <div className="cro-divider"><span>or sign up with email</span></div>

                  <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.8rem', borderRadius: 50, fontWeight: 600, fontSize: '0.9rem', color: 'var(--earth)', border: '1.5px solid var(--border)', textDecoration: 'none' }}>
                    Sign up with email <ChevronRight size={15} />
                  </Link>
                  <div style={{ marginTop: '0.8rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Already have an account? </span>
                    <Link to="/login" style={{ fontSize: '0.8rem', color: 'var(--rose)', fontWeight: 600 }}>Sign in</Link>
                  </div>
                </>
              )}

              {/* Trust signals */}
              <div className="cro-trust-row">
                {['Aadhaar-verified guides', '24/7 SOS support', 'Women-only spaces', 'No spam ever'].map(t => (
                  <div key={t} className="cro-trust-item">
                    <CheckCircle size={13} color="var(--rose)" /> {t}
                  </div>
                ))}
              </div>

              {/* Stats bar */}
              <div className="cro-stat-bar">
                {STATS.map(s => (
                  <div key={s.label} className="cro-stat-item">
                    <div className="cro-stat-val">{s.value}</div>
                    <div className="cro-stat-lbl">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — social proof card (desktop only) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {/* Live activity feed */}
              <div style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 16, padding: '1.1rem 1.3rem', boxShadow: '0 2px 16px rgba(61,35,20,0.07)' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.8rem' }}>🟢 Live activity</p>
                {[
                  { text: 'Priya booked a guide in Goa', time: '2m ago' },
                  { text: 'New safety tips added for Delhi', time: '15m ago' },
                  { text: 'Meera completed her Jaipur trip safely', time: '1h ago' },
                  { text: 'SOS test — response in 78 seconds', time: '3h ago' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--earth)' }}>{item.text}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--muted)', flexShrink: 0, marginLeft: '0.8rem' }}>{item.time}</span>
                  </div>
                ))}
              </div>

              {/* Mini testimonial */}
              <div style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 16, padding: '1.2rem 1.3rem', boxShadow: '0 2px 16px rgba(61,35,20,0.07)' }}>
                <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.7rem' }}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={13} fill="#FFB800" color="#FFB800" />)}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--earth)', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '0.8rem' }}>
                  "First solo trip to Delhi. My guide was with me from airport to hotel. Felt completely safe the whole time."
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,var(--rose),var(--sand))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'white' }}>SR</div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--night)' }}>Sneha R.</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Delhi trip · Verified booking</div>
                  </div>
                </div>
              </div>

              {/* Guide availability indicator */}
              <div style={{ background: 'rgba(122,158,126,0.08)', border: '1.5px solid rgba(122,158,126,0.3)', borderRadius: 16, padding: '1rem 1.3rem', boxShadow: '0 2px 12px rgba(122,158,126,0.1)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sage)', flexShrink: 0, boxShadow: '0 0 0 3px rgba(122,158,126,0.25)', animation: 'pulse-soft 2s infinite' }} />
                <span style={{ fontSize: '0.83rem', color: 'var(--earth)' }}>
                  <strong style={{ color: 'var(--sage)' }}>6 verified guides</strong> available to book right now
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CITY SAFETY SCORES TEASER ─────────────────────────────── */}
      <section style={{ padding: '3.5rem 0', background: 'white', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem', flexWrap: 'wrap', gap: '0.8rem' }}>
            <div>
              <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.3rem', fontWeight: 700, color: 'var(--night)' }}>
                Is your destination safe?
              </h2>
              <p style={{ fontSize: '0.83rem', color: 'var(--muted)', marginTop: '0.25rem' }}>Real safety scores from women who've been there</p>
            </div>
            <Link to="/safety" style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--rose)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              Check all cities <ChevronRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '0.8rem' }}>
            {CITY_PREVIEWS.map(c => (
              <Link key={c.city} to={`/safety/${c.city}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'var(--warm)', borderRadius: 14, padding: '1rem 1.1rem', border: '1.5px solid var(--border)', cursor: 'pointer', transition: 'border-color 0.18s, box-shadow 0.18s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = c.color; e.currentTarget.style.boxShadow = `0 4px 16px rgba(0,0,0,0.06)`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--night)' }}>{c.city}</span>
                    <span style={{ fontWeight: 900, fontSize: '1rem', color: c.color }}>{c.score}</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', marginBottom: '0.5rem' }}>
                    <div style={{ height: '100%', width: `${c.score * 10}%`, background: c.color, borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{c.tag}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT WE OFFER ─────────────────────────────────────────── */}
      <section style={{ padding: '5rem 0', background: 'var(--warm)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="section-tag">What SafeShe offers</div>
            <h2 className="section-title">Everything you need for <em>safe travel</em></h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1.4rem' }}>
            {[
              { icon: '👩‍🦯', title: 'Verified Women Guides', desc: 'Aadhaar + PAN verified. They know your city, speak your language, keep you safe.', cta: 'Find a Guide', link: '/guides', color: 'var(--rose)' },
              { icon: '🏠', title: 'Safe Hostels', desc: 'Women-only verified stays. Screened, reviewed, trusted by thousands of solo travellers.', cta: 'Browse Stays', link: '/hostels', color: 'var(--sage)' },
              { icon: '🤖', title: 'AI Safety Assistant', desc: 'Ask anything, get real answers grounded in community data. "Is this area safe at night?" — answered in seconds.', cta: 'Ask Now', link: '/safety/assistant', color: 'var(--sand)' },
              { icon: '🚨', title: 'One-tap SOS', desc: 'In any emergency, press SOS. Your location is shared with our team and your contacts instantly.', cta: 'Learn More', link: '/sos', color: '#E87070' },
            ].map(card => (
              <div key={card.title} className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: `${card.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>{card.icon}</div>
                <h3 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.15rem', fontWeight: 700 }}>{card.title}</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.65, fontSize: '0.9rem', flex: 1 }}>{card.desc}</p>
                <Link to={card.link} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: card.color, fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none' }}>
                  {card.cta} <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────── */}
      <section style={{ padding: '5rem 0', background: 'var(--cream)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="section-tag">Real stories</div>
            <h2 className="section-title">Women who travel <em>fearlessly</em> now</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.2rem' }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="cro-testimonial-card" style={{ opacity: activeTestimonial === i ? 1 : 0.75, transform: activeTestimonial === i ? 'translateY(-3px)' : 'none', transition: 'all 0.4s' }}>
                <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '1rem' }}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={14} fill="#FFB800" color="#FFB800" />)}
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--earth)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: '1.2rem' }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--rose),var(--sand))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'white', flexShrink: 0 }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--night)' }}>{t.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t.city}</div>
                  </div>
                  <CheckCircle size={15} color="var(--sage)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED GUIDES ───────────────────────────────────────── */}
      <section style={{ padding: '5rem 0', background: 'var(--warm)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div className="section-tag">Available now</div>
              <h2 className="section-title">Meet your <em>guide</em></h2>
              <p style={{ color: 'var(--muted)', marginTop: '0.4rem', fontSize: '0.88rem' }}>All Aadhaar-verified. All women. Bookable in minutes.</p>
            </div>
            <Link to="/guides" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--rose)', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none' }}>
              See all guides <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1.1rem' }}>
            {GUIDES.slice(0, 3).map(g => (
              <div key={g.id} className="card" style={{ padding: '1.4rem' }}>
                <div style={{ display: 'flex', gap: '0.9rem', marginBottom: '0.9rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,var(--rose),var(--sand))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>
                    {g.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--night)' }}>{g.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                      <MapPin size={10} /> {g.city}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem' }}>
                      <Star size={11} fill="#FFB800" color="#FFB800" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{g.rating}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>({g.reviews})</span>
                    </div>
                  </div>
                  <span style={{ background: g.available ? 'rgba(122,158,126,0.12)' : '#F3F0ED', color: g.available ? 'var(--sage)' : 'var(--muted)', fontSize: '0.68rem', fontWeight: 700, padding: '0.18rem 0.55rem', borderRadius: 20, flexShrink: 0 }}>
                    {g.available ? '● Online' : 'Busy'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {g.specialties.slice(0, 2).map((s: string) => (
                    <span key={s} style={{ background: 'var(--blush)', color: 'var(--rose)', fontSize: '0.7rem', fontWeight: 600, padding: '0.18rem 0.55rem', borderRadius: 20 }}>{s}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.9rem' }}>
                  <div>
                    <span style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.05rem', fontWeight: 900, color: 'var(--rose)' }}>₹{g.price_per_hour}</span>
                    <span style={{ fontSize: '0.73rem', color: 'var(--muted)' }}>/hour</span>
                  </div>
                  <button
                    onClick={() => user ? navigate(`/book/guide/${g.id}`) : navigate('/register')}
                    className="btn-primary"
                    style={{ padding: '0.48rem 1.1rem', fontSize: '0.83rem', opacity: g.available ? 1 : 0.5, pointerEvents: g.available ? 'auto' : 'none' }}>
                    {g.available ? 'Book Now' : 'Unavailable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
      <section style={{ padding: '5rem 0', background: 'var(--cream)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="section-tag">Simple steps</div>
            <h2 className="section-title">Safe in <em>3 minutes</em></h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.6rem' }}>No app download required. Works in your browser.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '2rem', maxWidth: 820, margin: '0 auto' }}>
            {[
              { step: '1', icon: '📧', title: 'Sign up in 30 seconds', desc: 'One click with Google, or use your email. No credit card. No app download.' },
              { step: '2', icon: '🔍', title: 'Find what you need', desc: 'Browse verified guides, check city safety scores, or ask our AI assistant anything.' },
              { step: '3', icon: '🛡️', title: 'Travel with confidence', desc: 'Book, go, and explore. Your guide and our SOS team are with you the whole time.' },
            ].map(s => (
              <div key={s.step} style={{ textAlign: 'center', padding: '1.5rem 1.2rem' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--blush)', border: '2px solid var(--rose)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', margin: '0 auto 1rem' }}>{s.icon}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--rose)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.4rem' }}>Step {s.step}</div>
                <h3 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--night)' }}>{s.title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.86rem', lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ────────────────────────────────────────────── */}
      {!user && (
        <section style={{ padding: '5rem 2rem', background: 'linear-gradient(135deg,var(--night),#3D1520)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(232,68,90,0.8)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Join 12,400+ women</div>
          <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: 'clamp(1.7rem,3vw,2.5rem)', fontWeight: 900, color: 'white', marginBottom: '0.8rem' }}>
            Your solo trip is waiting.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', marginBottom: '2.2rem', fontSize: '1rem', maxWidth: 400, margin: '0 auto 2.2rem' }}>
            Start for free. No credit card. Cancel anytime.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', maxWidth: 360, margin: '0 auto' }}>
            <button className="cro-google-btn" onClick={handleGoogle} disabled={googleLoading} style={{ width: '100%' }}>
              {googleLoading ? 'Signing in…' : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Continue with Google — Free
                </>
              )}
            </button>
            <Link to="/register" style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
              or sign up with email →
            </Link>
          </div>
        </section>
      )}

      {/* ── STICKY MOBILE CTA BAR ─────────────────────────────────── */}
      {!user && (
        <div className={`cro-sticky${showStickyBar ? ' visible' : ''}`}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'white' }}>Ready to travel safely?</div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>Free · No card required</div>
          </div>
          <button onClick={handleGoogle} disabled={googleLoading} className="btn-primary" style={{ flexShrink: 0, padding: '0.65rem 1.3rem', fontSize: '0.85rem' }}>
            {googleLoading ? 'Loading…' : 'Join Free'}
          </button>
        </div>
      )}

      {/* ── ROLE PICKER MODAL ───────────────────────────────────── */}
      {showRolePicker && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(26,15,10,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.2rem' }} onClick={() => setShowRolePicker(false)}>
          <div className="card" style={{ maxWidth: 400, width: '100%', padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.3rem', fontWeight: 700, color: 'var(--night)', marginBottom: '0.4rem', textAlign: 'center' }}>
              I am joining as…
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', textAlign: 'center', marginBottom: '1.6rem', lineHeight: 1.5 }}>
              This helps us set up your account correctly.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button onClick={() => handleGoogleWithRole('traveller')}
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.2rem', borderRadius: 14, border: '2px solid var(--border)', background: 'var(--warm)', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--sage)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <span style={{ fontSize: '2rem', flexShrink: 0 }}>✈️</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--night)', marginBottom: '0.2rem' }}>Traveller</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.4 }}>I want to find guides, safe stays and travel safely</div>
                </div>
              </button>
              <button onClick={() => handleGoogleWithRole('guide')}
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.2rem', borderRadius: 14, border: '2px solid var(--border)', background: 'var(--warm)', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--rose)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <span style={{ fontSize: '2rem', flexShrink: 0 }}>🧭</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--night)', marginBottom: '0.2rem' }}>Guide</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.4 }}>I want to offer guide services and earn money</div>
                </div>
              </button>
            </div>
            <button onClick={() => setShowRolePicker(false)} style={{ display: 'block', width: '100%', marginTop: '1.2rem', background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
