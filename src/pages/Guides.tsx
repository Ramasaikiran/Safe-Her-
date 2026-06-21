import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Search, Filter, CheckCircle } from 'lucide-react'
import { GUIDES, CITIES } from '../data/seed'
import { INDIAN_CITIES, WORLD_COUNTRIES } from '../lib/cities'
import { supabase } from '../lib/supabase'
import ComingSoonNotify from '../components/ComingSoonNotify'

interface GuideCard {
  id: string
  name: string
  city: string
  rating: number
  reviews: number
  languages: string[]
  price_per_hour: number
  specialties: string[]
  bio: string
  avatar_url: string
  verified: boolean
  available: boolean
  trips_completed: number
}

export default function Guides() {
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('All')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [sortBy, setSortBy] = useState('rating')
  const [realGuides, setRealGuides] = useState<GuideCard[]>([])

  useEffect(() => {
    async function fetchRealGuides() {
      const { data: gps } = await supabase
        .from('guide_profiles')
        .select('id, status, rating, reviews_count, trips_count, hourly_rate, city, languages, specialties, bio, available')
        .eq('status', 'active')
        .not('city', 'is', null)
      if (!gps || gps.length === 0) return

      const ids = gps.map(g => g.id)
      const { data: profilesData } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', ids)
      const profileMap = Object.fromEntries((profilesData || []).map(p => [p.id, p]))

      // Real, self-registered guides aren't vetted yet (no admin review
      // pipeline exists) -- always shown as unverified, never inheriting
      // the curated seed guides' "verified" badge.
      const mapped: GuideCard[] = gps.map(gp => {
        const p = profileMap[gp.id]
        return {
          id: gp.id,
          name: p?.full_name || 'SafeShe Guide',
          city: gp.city as string,
          rating: gp.rating || 0,
          reviews: gp.reviews_count || 0,
          languages: gp.languages || [],
          price_per_hour: gp.hourly_rate,
          specialties: gp.specialties || [],
          bio: gp.bio || 'New on SafeShe — hasn\'t added a bio yet.',
          avatar_url: p?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${gp.id}`,
          verified: false,
          available: gp.available,
          trips_completed: gp.trips_count || 0,
        }
      })
      setRealGuides(mapped)
    }
    fetchRealGuides()
  }, [])

  const allGuides = useMemo<GuideCard[]>(() => [...GUIDES, ...realGuides], [realGuides])

  const liveCities = CITIES.filter(c => c.status === 'live').map(c => c.name)
  const comingSoonSeed = CITIES.filter(c => c.status === 'coming').map(c => c.name)
  const moreIndianCities = useMemo(
    () => INDIAN_CITIES.filter(c => !liveCities.includes(c) && !comingSoonSeed.includes(c)),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const filtered = allGuides
    .filter(g => {
      const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.specialties.some(s => s.toLowerCase().includes(search.toLowerCase())) ||
        g.languages.some(l => l.toLowerCase().includes(search.toLowerCase()))
      const matchCity = cityFilter === 'All' || g.city === cityFilter
      const matchAvail = !availableOnly || g.available
      return matchSearch && matchCity && matchAvail
    })
    .sort((a, b) => sortBy === 'rating' ? b.rating - a.rating : sortBy === 'price_low' ? a.price_per_hour - b.price_per_hour : b.price_per_hour - a.price_per_hour)

  return (
    <div className="page">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--night), #3D1520)', padding: '3rem 0 4rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', fontSize: '20rem', opacity: 0.04, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: 'Playfair Display,serif', pointerEvents: 'none' }}>♀</div>
        <div className="container">
          <div className="badge" style={{ background: 'rgba(232,68,90,0.2)', color: 'var(--rose-light)', marginBottom: '0.8rem' }}>👩 Verified Women Guides</div>
          <h1 className="section-title" style={{ color: 'white', marginBottom: '0.6rem' }}>Find Your <em style={{ color: 'var(--rose-light)' }}>Safety Companion</em></h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>All guides are background-verified, trained in safety protocols, and locally knowledgeable.</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '1.2rem 0', position: 'sticky', top: 72, zIndex: 50 }}>
        <div className="container" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, specialty, language..."
              style={{ paddingLeft: '2.2rem', padding: '0.65rem 1rem 0.65rem 2.2rem', border: '1.5px solid var(--border)', borderRadius: 50, fontSize: '0.88rem', fontFamily: 'DM Sans,sans-serif', outline: 'none', width: '100%', color: 'var(--earth)' }} />
          </div>
          <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}
            style={{ padding: '0.65rem 1rem', border: '1.5px solid var(--border)', borderRadius: 50, fontSize: '0.88rem', fontFamily: 'DM Sans,sans-serif', color: 'var(--earth)', outline: 'none', cursor: 'pointer', maxWidth: 220 }}>
            <option value="All">All cities</option>
            <optgroup label="Available now">
              {liveCities.map(c => <option key={c} value={c}>{c}</option>)}
            </optgroup>
            <optgroup label="Coming soon">
              {comingSoonSeed.map(c => <option key={c} value={c}>{c}</option>)}
            </optgroup>
            <optgroup label="More cities in India">
              {moreIndianCities.map(c => <option key={c} value={c}>{c}</option>)}
            </optgroup>
            <optgroup label="Worldwide">
              {WORLD_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </optgroup>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ padding: '0.65rem 1rem', border: '1.5px solid var(--border)', borderRadius: 50, fontSize: '0.88rem', fontFamily: 'DM Sans,sans-serif', color: 'var(--earth)', outline: 'none', cursor: 'pointer' }}>
            <option value="rating">Top Rated</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={availableOnly} onChange={e => setAvailableOnly(e.target.checked)} style={{ accentColor: 'var(--rose)', width: 16, height: 16 }} />
            Available Now
          </label>
        </div>
      </div>

      {/* Results */}
      <div className="container" style={{ padding: '2.5rem 2rem' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
          Showing <strong style={{ color: 'var(--earth)' }}>{filtered.length}</strong> guides{cityFilter !== 'All' ? ` in ${cityFilter}` : ''}
        </p>
        {filtered.length === 0 && cityFilter !== 'All' && !liveCities.includes(cityFilter) ? (
          <ComingSoonNotify place={cityFilter} />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <h3 style={{ fontFamily: 'Playfair Display,serif', marginBottom: '0.5rem' }}>No guides found</h3>
            <p style={{ color: 'var(--muted)' }}>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {filtered.map(guide => (
              <div key={guide.id} className="card" style={{ padding: '1.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                  <img src={guide.avatar_url} alt={guide.name} style={{ width: 64, height: 64, borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: '1.05rem' }}>{guide.name}</h3>
                      {guide.verified && <CheckCircle size={15} color="var(--sage)" />}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', margin: '0.2rem 0' }}>
                      <MapPin size={11} />{guide.city}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ color: '#FFB800', fontSize: '0.85rem' }}>{'★'.repeat(Math.round(guide.rating))}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{guide.rating} ({guide.reviews} reviews)</span>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <span className={`badge ${guide.available ? 'badge-sage' : 'badge-sand'}`}>
                      {guide.available ? '● Available' : '○ Busy'}
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.65, marginBottom: '1rem' }}>{guide.bio}</p>

                <div style={{ marginBottom: '0.8rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--earth)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Specialties</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {guide.specialties.map(s => <span key={s} className="badge badge-rose" style={{ fontSize: '0.7rem' }}>{s}</span>)}
                  </div>
                </div>

                <div style={{ marginBottom: '1.2rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--earth)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Languages</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {guide.languages.map(l => <span key={l} className="badge badge-sand" style={{ fontSize: '0.7rem' }}>{l}</span>)}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <div>
                    <strong style={{ color: 'var(--rose)', fontSize: '1.1rem' }}>₹{guide.price_per_hour}</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>/hour</span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{guide.trips_completed} trips done</div>
                  </div>
                  <Link
                    to={guide.available ? `/book/guide/${guide.id}` : '#'}
                    className={guide.available ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: '0.55rem 1.3rem', fontSize: '0.88rem', opacity: guide.available ? 1 : 0.5, pointerEvents: guide.available ? 'auto' : 'none' }}
                  >
                    {guide.available ? 'Book Now' : 'Unavailable'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
