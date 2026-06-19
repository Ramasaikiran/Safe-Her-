import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Search, CheckCircle, Wifi, Lock } from 'lucide-react'
import { HOSTELS, CITIES } from '../data/seed'

export default function Hostels() {
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('All')
  const [womenOnly, setWomenOnly] = useState(false)
  const [availableOnly, setAvailableOnly] = useState(false)
  const [sortBy, setSortBy] = useState('rating')

  const liveCities = ['All', ...CITIES.filter(c => c.status === 'live').map(c => c.name)]

  const filtered = HOSTELS
    .filter(h => {
      const matchSearch = h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.address.toLowerCase().includes(search.toLowerCase()) ||
        h.amenities.some(a => a.toLowerCase().includes(search.toLowerCase()))
      const matchCity = cityFilter === 'All' || h.city === cityFilter
      const matchWomen = !womenOnly || h.women_only
      const matchAvail = !availableOnly || h.available_rooms > 0
      return matchSearch && matchCity && matchWomen && matchAvail
    })
    .sort((a, b) => sortBy === 'rating' ? b.rating - a.rating : sortBy === 'price_low' ? a.price_per_night - b.price_per_night : b.price_per_night - a.price_per_night)

  return (
    <div className="page">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #2D1F3D, #1A0F0A)', padding: '3rem 0 4rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', fontSize: '20rem', opacity: 0.04, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: 'Playfair Display,serif', pointerEvents: 'none' }}>🏠</div>
        <div className="container">
          <div className="badge" style={{ background: 'rgba(122,158,126,0.2)', color: '#A8D5AC', marginBottom: '0.8rem' }}>✓ SafeStay Verified</div>
          <h1 className="section-title" style={{ color: 'white', marginBottom: '0.6rem' }}>Safe Stays for <em style={{ color: '#A8D5AC' }}>Solo Women</em></h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>Every property physically verified. Women-only floors, 24/7 CCTV, and trained female staff.</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '1.2rem 0', position: 'sticky', top: 72, zIndex: 50 }}>
        <div className="container" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search hostel, area, amenity..."
              style={{ paddingLeft: '2.2rem', padding: '0.65rem 1rem 0.65rem 2.2rem', border: '1.5px solid var(--border)', borderRadius: 50, fontSize: '0.88rem', fontFamily: 'DM Sans,sans-serif', outline: 'none', width: '100%', color: 'var(--earth)' }} />
          </div>
          <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}
            style={{ padding: '0.65rem 1rem', border: '1.5px solid var(--border)', borderRadius: 50, fontSize: '0.88rem', fontFamily: 'DM Sans,sans-serif', color: 'var(--earth)', outline: 'none', cursor: 'pointer' }}>
            {liveCities.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ padding: '0.65rem 1rem', border: '1.5px solid var(--border)', borderRadius: 50, fontSize: '0.88rem', fontFamily: 'DM Sans,sans-serif', color: 'var(--earth)', outline: 'none', cursor: 'pointer' }}>
            <option value="rating">Top Rated</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={womenOnly} onChange={e => setWomenOnly(e.target.checked)} style={{ accentColor: 'var(--rose)', width: 15, height: 15 }} />
            Women Only
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={availableOnly} onChange={e => setAvailableOnly(e.target.checked)} style={{ accentColor: 'var(--rose)', width: 15, height: 15 }} />
            Available Rooms
          </label>
        </div>
      </div>

      {/* Results */}
      <div className="container" style={{ padding: '2.5rem 2rem' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
          Showing <strong style={{ color: 'var(--earth)' }}>{filtered.length}</strong> properties{cityFilter !== 'All' ? ` in ${cityFilter}` : ''}
        </p>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏠</div>
            <h3 style={{ fontFamily: 'Playfair Display,serif', marginBottom: '0.5rem' }}>No properties found</h3>
            <p style={{ color: 'var(--muted)' }}>Try adjusting your filters.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {filtered.map(hostel => (
              <div key={hostel.id} className="card">
                {/* Image */}
                <div style={{ position: 'relative', height: 200, background: `url(${hostel.image_url}) center/cover` }}>
                  <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {hostel.women_only && <span className="badge badge-rose">♀ Women Only</span>}
                    {hostel.verified && <span className="badge badge-sage">✓ Verified</span>}
                  </div>
                  {hostel.available_rooms === 0 && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.95rem', backdropFilter: 'blur(2px)' }}>
                      Fully Booked
                    </div>
                  )}
                  {hostel.available_rooms > 0 && (
                    <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: 20, backdropFilter: 'blur(4px)' }}>
                      {hostel.available_rooms} rooms left
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: '1.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <h3 style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: '1.05rem', flex: 1 }}>{hostel.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginLeft: '0.5rem', flexShrink: 0 }}>
                      <span style={{ color: '#FFB800', fontSize: '0.85rem' }}>★</span>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{hostel.rating}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>({hostel.reviews})</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1rem' }}>
                    <MapPin size={11} />{hostel.address}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.2rem' }}>
                    {hostel.amenities.map(a => (
                      <span key={a} className="badge badge-sand" style={{ fontSize: '0.68rem' }}>
                        {a === 'WiFi' ? '📶' : a === 'Lockers' ? '🔒' : a === 'Pool' ? '🏊' : a === 'Yoga Deck' ? '🧘' : '✓'} {a}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <div>
                      <strong style={{ color: 'var(--rose)', fontSize: '1.2rem' }}>₹{hostel.price_per_night}</strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>/night</span>
                    </div>
                    <Link
                      to={hostel.available_rooms > 0 ? `/book/hostel/${hostel.id}` : '#'}
                      className={hostel.available_rooms > 0 ? 'btn-primary' : 'btn-secondary'}
                      style={{ padding: '0.55rem 1.3rem', fontSize: '0.88rem', opacity: hostel.available_rooms === 0 ? 0.5 : 1, pointerEvents: hostel.available_rooms === 0 ? 'none' : 'auto' }}
                    >
                      {hostel.available_rooms > 0 ? 'Book Now' : 'Full'}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
