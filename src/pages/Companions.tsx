import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Users, MapPin, Calendar, Plus, X, Globe } from 'lucide-react'
import toast from 'react-hot-toast'

interface CompanionListing {
  id: string
  user_id: string
  from_city: string
  to_city: string
  travel_date: string
  bio: string | null
  languages: string[]
  looking_for: string
  created_at: string
  profiles: { full_name: string; avatar_url: string | null; city: string | null } | null
}

const LOOKING_FOR_LABELS: Record<string, string> = {
  travel_buddy: '🧳 Travel buddy',
  roommate: '🏠 Roommate',
  day_companion: '☀️ Day companion',
  any: '🌸 Open to anything',
}

const LANGUAGES = ['English','Hindi','Tamil','Telugu','Kannada','Malayalam','Marathi','Bengali','Gujarati','Punjabi']

export default function Companions() {
  const { user, profile } = useAuth()
  const [listings, setListings] = useState<CompanionListing[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [myListing, setMyListing] = useState<CompanionListing | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [filterCity, setFilterCity] = useState('')

  const [form, setForm] = useState({
    from_city: '', to_city: '', travel_date: '',
    bio: '', languages: [] as string[], looking_for: 'any',
  })

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('companions')
      .select('*, profiles(full_name, avatar_url, city)')
      .eq('is_active', true)
      .gte('travel_date', new Date().toISOString().split('T')[0])
      .order('travel_date', { ascending: true })
    setListings((data || []) as CompanionListing[])

    if (user) {
      const { data: mine } = await supabase.from('companions').select('*, profiles(full_name, avatar_url, city)').eq('user_id', user.id).maybeSingle()
      setMyListing(mine as CompanionListing | null)
      if (mine) setForm({ from_city: mine.from_city, to_city: mine.to_city, travel_date: mine.travel_date, bio: mine.bio || '', languages: mine.languages || [], looking_for: mine.looking_for })
    }
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const toggleLang = (l: string) => setForm(p => ({ ...p, languages: p.languages.includes(l) ? p.languages.filter(x => x !== l) : [...p.languages, l] }))

  const handleSubmit = async () => {
    if (!user) { toast.error('Please log in.'); return }
    if (!form.from_city.trim() || !form.to_city.trim() || !form.travel_date) { toast.error('From, to, and date are required.'); return }
    setSubmitting(true)
    const payload = { user_id: user.id, from_city: form.from_city.trim(), to_city: form.to_city.trim(), travel_date: form.travel_date, bio: form.bio.trim() || null, languages: form.languages, looking_for: form.looking_for, is_active: true }
    const { error } = myListing
      ? await supabase.from('companions').update(payload).eq('user_id', user.id)
      : await supabase.from('companions').insert(payload)
    setSubmitting(false)
    if (error) { toast.error(error.message || 'Could not save. Please try again.'); return }
    toast.success(myListing ? 'Listing updated!' : 'You\'re listed — other travellers can now find you!')
    setShowForm(false)
    load()
  }

  const handleDeactivate = async () => {
    if (!user) return
    await supabase.from('companions').update({ is_active: false }).eq('user_id', user.id)
    toast.success('Your listing has been removed.')
    setMyListing(null)
    load()
  }

  const today = new Date().toISOString().split('T')[0]
  const filtered = filterCity.trim()
    ? listings.filter(l => l.from_city.toLowerCase().includes(filterCity.toLowerCase()) || l.to_city.toLowerCase().includes(filterCity.toLowerCase()))
    : listings

  return (
    <div className="page" style={{ background: 'var(--cream)', paddingTop: '5.5rem' }}>
      <div className="container" style={{ maxWidth: 760, paddingBottom: '3rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.8rem' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sage)', marginBottom: '0.3rem' }}>SafeShe Community</p>
          <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: 'clamp(1.6rem,4vw,2.2rem)', fontWeight: 800, color: 'var(--night)', marginBottom: '0.5rem' }}>Find a travel companion</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: 480 }}>
            Connect with women travelling the same route. Build friendships, share rides, feel safer.
          </p>
        </div>

        {/* My listing banner */}
        {myListing && (
          <div style={{ background: 'rgba(122,158,126,0.1)', border: '1.5px solid var(--sage)', borderRadius: 14, padding: '1rem 1.2rem', marginBottom: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--sage)', marginBottom: '0.2rem' }}>✅ You're listed</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{myListing.from_city} → {myListing.to_city} · {new Date(myListing.travel_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setShowForm(s => !s)} className="btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>Edit</button>
              <button onClick={handleDeactivate} style={{ background: 'none', border: '1px solid var(--rose)', borderRadius: 10, padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: 'var(--rose)', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <X size={12} /> Remove
              </button>
            </div>
          </div>
        )}

        {/* Add / Edit form */}
        {(showForm || (!myListing && user)) && (
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: '1.05rem', marginBottom: '1.2rem' }}>
              {myListing ? 'Update your listing' : 'Add yourself as available'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Travelling from</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                    <input type="text" placeholder="e.g. Bangalore" value={form.from_city} onChange={e => setForm(p => ({ ...p, from_city: e.target.value }))} style={{ paddingLeft: '2.2rem' }} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Travelling to</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                    <input type="text" placeholder="e.g. Goa" value={form.to_city} onChange={e => setForm(p => ({ ...p, to_city: e.target.value }))} style={{ paddingLeft: '2.2rem' }} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Travel date</label>
                  <input type="date" min={today} value={form.travel_date} onChange={e => setForm(p => ({ ...p, travel_date: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Looking for</label>
                  <select value={form.looking_for} onChange={e => setForm(p => ({ ...p, looking_for: e.target.value }))}>
                    {Object.entries(LOOKING_FOR_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Short bio <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span></label>
                <textarea rows={2} maxLength={200} placeholder="A little about yourself and your travel style…" value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Languages</label>
                <div className="chip-grid">
                  {LANGUAGES.map(l => (
                    <button key={l} type="button" className={`chip ${form.languages.includes(l) ? 'selected' : ''}`} onClick={() => toggleLang(l)}>{l}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button onClick={handleSubmit} disabled={submitting} className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                  {submitting ? 'Saving…' : myListing ? 'Update listing' : 'List myself'}
                </button>
                <button onClick={() => setShowForm(false)} className="btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {!user && (
          <div style={{ background: 'var(--blush)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '1rem 1.2rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--earth)', marginBottom: '0.6rem' }}>Log in to list yourself and connect with other travellers.</p>
            <a href="/login" className="btn-primary" style={{ display: 'inline-flex', justifyContent: 'center' }}>Sign in</a>
          </div>
        )}

        {/* Add button for logged-in users without listing */}
        {user && !myListing && !showForm && (
          <button onClick={() => setShowForm(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: 'white', border: '2px dashed var(--border)', borderRadius: 14, padding: '0.9rem', fontSize: '0.88rem', fontWeight: 600, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', marginBottom: '1.5rem', transition: 'border-color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--rose)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
            <Plus size={16} /> List yourself as available
          </button>
        )}

        {/* Filter — responsive search bar */}
        <style>{`
          .comp-search-wrap { position: relative; margin-bottom: 1.2rem; width: 100%; }
          .comp-search-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; display: flex; align-items: center; }
          .comp-search-input {
            width: 100%; padding: 0.82rem 1rem 0.82rem 2.55rem;
            border-radius: 14px; border: 1.5px solid var(--border);
            background: white; font-size: 0.92rem;
            font-family: 'DM Sans', sans-serif; color: var(--earth);
            outline: none; transition: border-color 0.2s, box-shadow 0.2s;
            box-sizing: border-box;
          }
          .comp-search-input:focus { border-color: var(--sage); box-shadow: 0 0 0 3px rgba(122,158,126,0.1); }
          .comp-search-input::placeholder { color: var(--muted); }
          @media (min-width: 768px) {
            .comp-search-input { font-size: 0.95rem; padding: 0.9rem 1.1rem 0.9rem 2.7rem; border-radius: 16px; }
          }
          @media (min-width: 1200px) {
            .comp-search-input { font-size: 1rem; padding: 0.95rem 1.2rem 0.95rem 2.8rem; border-radius: 18px; }
          }
        `}</style>
        <div className="comp-search-wrap">
          <span className="comp-search-icon"><MapPin size={15} /></span>
          <input className="comp-search-input" type="text" placeholder="Filter by city (from or to)…" value={filterCity} onChange={e => setFilterCity(e.target.value)} />
        </div>

        {/* Listings */}
        <h2 style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.9rem' }}>
          {filtered.length} traveller{filtered.length !== 1 ? 's' : ''} looking for company
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
            No listings matching that route yet. Add yourself and be the first!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {filtered.map(l => (
              <div key={l.id} className="card" style={{ padding: '1.2rem' }}>
                <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--blush)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                    {l.profiles?.avatar_url ? <img src={l.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🌸'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.4rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{l.profiles?.full_name || 'SafeShe Traveller'}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Calendar size={11} /> {new Date(l.travel_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--earth)', fontWeight: 600 }}>{l.from_city}</span>
                      <span style={{ color: 'var(--rose)', fontSize: '0.9rem' }}>→</span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--earth)', fontWeight: 600 }}>{l.to_city}</span>
                    </div>
                    {l.bio && <p style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '0.6rem' }}>{l.bio}</p>}
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--sage)', background: 'rgba(122,158,126,0.1)', padding: '0.15rem 0.6rem', borderRadius: 20 }}>
                        {LOOKING_FOR_LABELS[l.looking_for] || l.looking_for}
                      </span>
                      {l.languages?.slice(0, 3).map(lang => (
                        <span key={lang} style={{ fontSize: '0.72rem', color: 'var(--muted)', background: '#F3F0ED', padding: '0.15rem 0.5rem', borderRadius: 20, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Globe size={9} /> {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {user && user.id !== l.user_id && profile?.phone && (
                  <div style={{ marginTop: '0.9rem', paddingTop: '0.9rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.6rem' }}>
                    <a href={`https://wa.me/91${profile.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi! I saw your SafeShe companion listing — I'm also travelling ${l.from_city} → ${l.to_city} around ${l.travel_date}. Would love to connect!`)}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: '#25D366', color: 'white', border: 'none', borderRadius: 10, padding: '0.5rem 0.8rem', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', fontFamily: 'DM Sans,sans-serif' }}>
                      WhatsApp
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
