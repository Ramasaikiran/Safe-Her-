import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Shield, Search, BedDouble, AlertTriangle, ArrowRight, CheckCircle, MapPin, Star } from 'lucide-react'
import { GUIDES, HOSTELS } from '../data/seed'

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="page" style={{ background: 'var(--cream)' }}>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '88vh', display: 'flex', alignItems: 'center',
        background: 'linear-gradient(160deg, var(--night) 0%, #3D1520 60%, #5C2030 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Soft background circles */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 500, height: 500, borderRadius: '50%', background: 'rgba(232,68,90,0.1)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -60, width: 350, height: 350, borderRadius: '50%', background: 'rgba(196,154,114,0.08)', pointerEvents: 'none' }} />

        <div className="container" style={{ padding: '4rem 2rem', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 600 }} className="fade-up">
            <div className="badge-rose" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(232,68,90,0.15)', color: '#FF9EAA', padding: '0.4rem 1rem', borderRadius: 50, fontSize: '0.8rem', fontWeight: 600, marginBottom: '1.5rem' }}>
              <Shield size={13} /> India's first women-only travel safety network
            </div>

            <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: 'clamp(2.4rem,6vw,4rem)', fontWeight: 900, color: 'white', lineHeight: 1.1, marginBottom: '1.2rem' }}>
              Travel Freely.<br />
              <em style={{ color: 'var(--rose)' }}>Travel Safely.</em>
            </h1>

            <p style={{ fontSize: 'clamp(1rem,2vw,1.15rem)', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: 480 }}>
              Book verified women guides, find safe hostels, and get help instantly when you need it. Built for every solo woman traveller in India.
            </p>

            {/* Primary CTAs */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {user ? (
                <>
                  <Link to="/guides" className="btn-primary" style={{ fontSize: '1rem', padding: '0.9rem 2rem' }}>
                    <Search size={18} /> Find a Guide
                  </Link>
                  <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.9rem 2rem', borderRadius: 50, fontSize: '1rem', fontWeight: 600, color: 'white', border: '2px solid rgba(255,255,255,0.25)', textDecoration: 'none' }}>
                    My Dashboard <ArrowRight size={16} />
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="btn-primary" style={{ fontSize: '1rem', padding: '0.9rem 2rem' }}>
                    Get Started — Free <ArrowRight size={18} />
                  </Link>
                  <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.9rem 2rem', borderRadius: 50, fontSize: '1rem', fontWeight: 600, color: 'white', border: '2px solid rgba(255,255,255,0.25)', textDecoration: 'none' }}>
                    Sign In
                  </Link>
                </>
              )}
            </div>

            {/* Trust badges */}
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
              {['Aadhaar-verified guides', '24/7 SOS support', 'Women-only spaces'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.55)', fontSize: '0.83rem' }}>
                  <CheckCircle size={14} color="var(--rose)" /> {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT CAN YOU DO? — 3 simple cards ── */}
      <section style={{ padding: '5rem 0', background: 'var(--warm)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="section-tag">What SafeShe offers</div>
            <h2 className="section-title">Everything you need for <em>safe travel</em></h2>
            <p style={{ color: 'var(--muted)', marginTop: '0.8rem', maxWidth: 420, margin: '0.8rem auto 0' }}>Three simple things that keep you safe and confident on the road.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.5rem' }}>
            {[
              {
                icon: '👩‍🦯',
                title: 'Women Guides',
                desc: 'Every guide is verified with Aadhaar and PAN. They know your city, speak your language, and keep you safe.',
                cta: 'Find a Guide',
                link: '/guides',
                color: 'var(--rose)',
              },
              {
                icon: '🏠',
                title: 'Safe Hostels',
                desc: 'Women-only verified stays across India. Screened, reviewed, and trusted by thousands of solo travellers.',
                cta: 'Browse Stays',
                link: '/hostels',
                color: 'var(--sage)',
              },
              {
                icon: '🚨',
                title: 'One-tap SOS',
                desc: 'In any emergency, press SOS. Your location is shared with our response team and your emergency contacts instantly.',
                cta: 'Learn About SOS',
                link: '/sos',
                color: '#E87070',
              },
            ].map(card => (
              <div key={card.title} className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>{card.icon}</div>
                <h3 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.25rem', fontWeight: 700 }}>{card.title}</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.65, fontSize: '0.93rem', flex: 1 }}>{card.desc}</p>
                <Link to={card.link} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: card.color, fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
                  {card.cta} <ArrowRight size={15} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED GUIDES ── */}
      <section style={{ padding: '5rem 0', background: 'var(--cream)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div className="section-tag">Trusted guides</div>
              <h2 className="section-title">Meet your <em>guide</em></h2>
              <p style={{ color: 'var(--muted)', marginTop: '0.5rem', fontSize: '0.93rem' }}>All verified. All women. All safe.</p>
            </div>
            <Link to="/guides" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--rose)', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
              See all guides <ArrowRight size={15} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: '1.2rem' }}>
            {GUIDES.slice(0, 3).map(g => (
              <div key={g.id} className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,var(--rose),var(--sand))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}>
                    {g.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{g.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                      <MapPin size={11} /> {g.city}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.3rem' }}>
                      <Star size={12} fill="#FFB800" color="#FFB800" />
                      <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{g.rating}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>({g.reviews} reviews)</span>
                    </div>
                  </div>
                  <div style={{ background: g.available ? 'rgba(122,158,126,0.12)' : 'rgba(196,154,114,0.12)', color: g.available ? 'var(--sage)' : 'var(--muted)', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 20, flexShrink: 0 }}>
                    {g.available ? '● Available' : 'Busy'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
                  {g.specialties.slice(0, 2).map((s: string) => (
                    <span key={s} style={{ background: 'var(--blush)', color: 'var(--rose)', fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: 20 }}>{s}</span>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <div>
                    <span style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.1rem', fontWeight: 900, color: 'var(--rose)' }}>₹{g.price_per_hour}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>/hour</span>
                  </div>
                  <button onClick={() => user ? navigate(`/book/guide/${g.id}`) : navigate('/login')} className="btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem', opacity: g.available ? 1 : 0.5, pointerEvents: g.available ? 'auto' : 'none' }}>
                    {g.available ? 'Book Now' : 'Unavailable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — 3 steps ── */}
      <section style={{ padding: '5rem 0', background: 'var(--warm)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="section-tag">Simple steps</div>
            <h2 className="section-title">Start in <em>3 easy steps</em></h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '2rem', maxWidth: 800, margin: '0 auto' }}>
            {[
              { step: '1', icon: '📱', title: 'Sign up with your mobile', desc: 'Enter your phone number. We send you a quick 4-digit OTP to verify — no email, no password.' },
              { step: '2', icon: '🔍', title: 'Find what you need', desc: 'Browse verified guides, safe hostels, or just keep the SOS button ready for any emergency.' },
              { step: '3', icon: '🛡️', title: 'Travel with confidence', desc: 'Book, go, and explore. Our team and your guide are with you every step of the way.' },
            ].map(s => (
              <div key={s.step} style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--blush)', border: '2px solid var(--rose)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 1.2rem' }}>
                  {s.icon}
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--rose)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.5rem' }}>Step {s.step}</div>
                <h3 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.6rem' }}>{s.title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED STAYS ── */}
      <section style={{ padding: '5rem 0', background: 'var(--cream)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div className="section-tag">Women-only stays</div>
              <h2 className="section-title">Safe places to <em>rest</em></h2>
            </div>
            <Link to="/hostels" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--sage)', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
              See all stays <ArrowRight size={15} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.2rem' }}>
            {HOSTELS.slice(0, 3).map(h => (
              <div key={h.id} className="card">
                <div style={{ height: 150, background: 'linear-gradient(135deg,var(--sage),var(--sand))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', position: 'relative' }}>
                  🏠
                  {h.women_only && (
                    <span style={{ position: 'absolute', top: 10, left: 10, background: 'var(--blush)', color: 'var(--rose)', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 20 }}>♀ Women Only</span>
                  )}
                </div>
                <div style={{ padding: '1.3rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <h3 style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: '1rem' }}>{h.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', flexShrink: 0 }}>
                      <Star size={12} fill="#FFB800" color="#FFB800" />
                      <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{h.rating}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1rem' }}>
                    <MapPin size={11} /> {h.city}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    <div>
                      <span style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.05rem', fontWeight: 900, color: 'var(--rose)' }}>₹{h.price_per_night}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>/night</span>
                    </div>
                    <button onClick={() => user ? navigate(`/book/hostel/${h.id}`) : navigate('/login')} className="btn-primary" style={{ padding: '0.45rem 1.1rem', fontSize: '0.83rem' }}>
                      Book
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section style={{ padding: '5rem 0', background: 'linear-gradient(135deg,var(--night),#3D1520)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
          <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: 'clamp(1.8rem,3vw,2.6rem)', fontWeight: 900, color: 'white', marginBottom: '1rem' }}>
            Ready to travel safely?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem', fontSize: '1.05rem' }}>
            Join thousands of women who already trust SafeShe.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {user ? (
              <Link to="/guides" className="btn-primary" style={{ fontSize: '1rem', padding: '0.9rem 2.2rem' }}>
                Find a Guide <ArrowRight size={17} />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary" style={{ fontSize: '1rem', padding: '0.9rem 2.2rem' }}>
                  Create Free Account
                </Link>
                <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.9rem 2rem', borderRadius: 50, fontWeight: 600, fontSize: '1rem', color: 'white', border: '2px solid rgba(255,255,255,0.3)', textDecoration: 'none' }}>
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

    </div>
  )
}
