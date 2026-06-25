import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Shield, Moon, Bus, Star, Bot, Users, Search, ChevronRight } from 'lucide-react'

interface CitySafety {
  city: string; country: string
  overall_score: number; night_score: number
  transport_score: number; solo_traveller_score: number
  summary: string
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 7.5 ? 'var(--sage)' : score >= 5.5 ? 'var(--sand)' : 'var(--rose)'
  return (
    <div style={{ height: 4, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', marginTop: 4 }}>
      <div style={{ height: '100%', width: `${(score / 10) * 100}%`, background: color, borderRadius: 4 }} />
    </div>
  )
}

function ScoreChip({ score }: { score: number }) {
  const color = score >= 7.5 ? 'var(--sage)' : score >= 5.5 ? 'var(--sand)' : 'var(--rose)'
  const bg = score >= 7.5 ? 'rgba(122,158,126,0.12)' : score >= 5.5 ? 'rgba(212,165,116,0.12)' : 'var(--blush)'
  return <span style={{ fontWeight: 800, fontSize: '1.1rem', color, background: bg, padding: '0.1rem 0.6rem', borderRadius: 8 }}>{score?.toFixed(1)}</span>
}

export default function Safety() {
  const [cities, setCities] = useState<CitySafety[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('city_safety').select('city,country,overall_score,night_score,transport_score,solo_traveller_score,summary')
      .order('overall_score', { ascending: false })
      .then(({ data }) => { setCities((data || []) as CitySafety[]); setLoading(false) })
  }, [])

  const filtered = cities.filter(c =>
    !search.trim() || c.city.toLowerCase().includes(search.toLowerCase()) || c.country.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page" style={{ background: 'var(--cream)', paddingTop: '5.5rem' }}>
      <style>{`
        .safety-search-wrap {
          position: relative;
          margin-bottom: 1.2rem;
          width: 100%;
        }
        .safety-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--muted);
          pointer-events: none;
          display: flex;
          align-items: center;
        }
        .safety-search-input {
          width: 100%;
          padding: 0.85rem 1rem 0.85rem 2.6rem;
          border-radius: 14px;
          border: 1.5px solid var(--border);
          background: white;
          font-size: 0.95rem;
          font-family: 'DM Sans', sans-serif;
          color: var(--earth);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .safety-search-input:focus {
          border-color: var(--rose);
          box-shadow: 0 0 0 3px rgba(232,68,90,0.08);
        }
        .safety-search-input::placeholder { color: var(--muted); }

        @media (min-width: 768px) {
          .safety-search-input {
            font-size: 1rem;
            padding: 0.95rem 1.2rem 0.95rem 2.8rem;
            border-radius: 16px;
          }
        }
        @media (min-width: 1200px) {
          .safety-search-input {
            font-size: 1.05rem;
            padding: 1rem 1.4rem 1rem 3rem;
            border-radius: 18px;
          }
        }
      `}</style>

      <div className="container" style={{ maxWidth: 760, paddingBottom: '3rem' }}>

        {/* Hero */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--rose)', marginBottom: '0.3rem' }}>SafeShe Safety Layer</p>
          <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: 'clamp(1.8rem,4vw,2.4rem)', fontWeight: 800, color: 'var(--night)', lineHeight: 1.2, marginBottom: '0.6rem' }}>
            Know before you go.
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem', maxWidth: 480, lineHeight: 1.6 }}>
            Real safety scores, scam alerts, and community reviews from women who've actually been there.
          </p>
        </div>

        {/* AI Assistant card */}
        <Link to="/safety/assistant" style={{ textDecoration: 'none', display: 'block', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--dawn-gradient)', borderRadius: 18, padding: '1.5rem', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.25), transparent 55%)' }} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={24} color="var(--night)" />
                </div>
                <div>
                  <h3 style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: '1.05rem', color: 'var(--night)', marginBottom: '0.2rem' }}>AI Safety Assistant</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--night)', opacity: 0.75, margin: 0 }}>
                    "Is this area safe at 10 PM?" · "Women's safety score?" · Local tips
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,255,255,0.35)', borderRadius: 10, padding: '0.45rem 1rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--night)' }}>
                Ask now <ChevronRight size={14} />
              </div>
            </div>
          </div>
        </Link>

        {/* Companions card */}
        <Link to="/safety/companions" style={{ textDecoration: 'none', display: 'block', marginBottom: '1.8rem' }}>
          <div style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 18, padding: '1.2rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(122,158,126,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Users size={20} color="var(--sage)" />
              </div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--night)', marginBottom: '0.15rem' }}>Find a travel companion</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>Connect with women on the same route</p>
              </div>
            </div>
            <ChevronRight size={16} color="var(--muted)" />
          </div>
        </Link>

        {/* Responsive search bar */}
        <div className="safety-search-wrap">
          <span className="safety-search-icon">
            <Search size={16} />
          </span>
          <input
            className="safety-search-input"
            type="text"
            placeholder="Search any city or country…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Score legend */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {[['var(--sage)', '7.5+ Safe'], ['var(--sand)', '5.5–7.4 Caution'], ['var(--rose)', 'Below 5.5 High risk']].map(([c, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'inline-block' }} />{l}
            </div>
          ))}
        </div>

        {/* City grid */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>Loading cities…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>
            No safety profile yet for that city.{' '}
            <Link to="/safety/assistant" style={{ color: 'var(--rose)', fontWeight: 600 }}>Ask our AI →</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {filtered.map(c => (
              <Link key={c.city} to={`/safety/${encodeURIComponent(c.city)}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: '1.2rem 1.4rem', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 6px 24px rgba(61,35,20,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.7rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <div>
                      <h3 style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: '1.05rem', color: 'var(--night)', marginBottom: '0.1rem' }}>{c.city}</h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{c.country}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                      <ScoreChip score={c.overall_score} />
                      <span style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>Overall</span>
                    </div>
                  </div>
                  {c.summary && <p style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '0.8rem' }}>{c.summary.slice(0, 110)}…</p>}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '0.2rem' }}>
                        <Moon size={11} /> Night
                      </div>
                      <ScoreBar score={c.night_score} />
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--earth)' }}>{c.night_score?.toFixed(1)}</span>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '0.2rem' }}>
                        <Bus size={11} /> Transport
                      </div>
                      <ScoreBar score={c.transport_score} />
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--earth)' }}>{c.transport_score?.toFixed(1)}</span>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '0.2rem' }}>
                        <Star size={11} /> Solo
                      </div>
                      <ScoreBar score={c.solo_traveller_score} />
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--earth)' }}>{c.solo_traveller_score?.toFixed(1)}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.8rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--rose)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      Full profile <ChevronRight size={13} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
