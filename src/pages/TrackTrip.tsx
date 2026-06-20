import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Shield, MapPin, Clock, ExternalLink } from 'lucide-react'

interface LiveTrip {
  id: string
  status: 'active' | 'ended'
  latitude: number | null
  longitude: number | null
  accuracy_m: number | null
  last_updated: string
  started_at: string
  ended_at: string | null
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  return `${Math.floor(seconds / 3600)}h ago`
}

/**
 * Public page — no login required. Anyone with the link (e.g. a family
 * member) can see the traveller's last known position while a trip is
 * active. Access control is the unguessable trip id in the URL, not an
 * account — see schema.sql's RLS policy on live_trips for the tradeoff.
 */
export default function TrackTrip() {
  const { tripId } = useParams()
  const [trip, setTrip] = useState<LiveTrip | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchTrip = useCallback(async () => {
    if (!tripId) return
    const { data, error } = await supabase.from('live_trips').select('*').eq('id', tripId).maybeSingle()
    if (error || !data) {
      setNotFound(true)
    } else {
      setTrip(data as LiveTrip)
    }
    setLoading(false)
  }, [tripId])

  useEffect(() => {
    fetchTrip()
    const interval = setInterval(fetchTrip, 10000)
    return () => clearInterval(interval)
  }, [fetchTrip])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)' }}>
        <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans,sans-serif' }}>Loading trip…</p>
      </div>
    )
  }

  if (notFound || !trip) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)', padding: '1.5rem', textAlign: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'Playfair Display,serif', marginBottom: '0.5rem' }}>This trip link isn't valid</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>It may have ended or the link was mistyped.</p>
          <Link to="/" className="btn-primary" style={{ marginTop: '1.2rem', display: 'inline-flex' }}>Go to SafeShe</Link>
        </div>
      </div>
    )
  }

  const hasLocation = trip.latitude !== null && trip.longitude !== null
  const bbox = hasLocation
    ? `${trip.longitude! - 0.01}%2C${trip.latitude! - 0.01}%2C${trip.longitude! + 0.01}%2C${trip.latitude! + 0.01}`
    : null
  const osmEmbed = bbox ? `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&marker=${trip.latitude}%2C${trip.longitude}&layer=mapnik` : null
  const gmapsLink = hasLocation ? `https://www.google.com/maps?q=${trip.latitude},${trip.longitude}` : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1.4rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', background: 'white' }}>
        <Shield size={20} color="var(--rose)" />
        <span style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: '1.1rem' }}>SafeShe</span>
        <span style={{
          marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.7rem', borderRadius: 20,
          background: trip.status === 'active' ? 'rgba(122,158,126,0.15)' : '#F3F0ED',
          color: trip.status === 'active' ? 'var(--sage)' : 'var(--muted)',
        }}>
          {trip.status === 'active' ? '● Live' : 'Trip ended'}
        </span>
      </div>

      <div style={{ flex: 1, position: 'relative', minHeight: 320, background: '#E8E2DC' }}>
        {osmEmbed ? (
          <iframe title="Live location map" src={osmEmbed} style={{ width: '100%', height: '100%', minHeight: 320, border: 0 }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 320, color: 'var(--muted)', fontSize: '0.9rem' }}>
            Waiting for the first location update…
          </div>
        )}
      </div>

      <div className="container" style={{ padding: '1.5rem' }}>
        <div className="card" style={{ padding: '1.4rem' }}>
          <h2 style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.6rem' }}>
            {trip.status === 'active' ? 'Following this trip live' : 'This trip has ended'}
          </h2>
          {hasLocation && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.2rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
                <Clock size={13} /> Last updated {timeAgo(trip.last_updated)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
                <MapPin size={13} /> {trip.latitude!.toFixed(5)}, {trip.longitude!.toFixed(5)}
              </span>
            </div>
          )}
          {gmapsLink && (
            <a href={gmapsLink} target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              Open in Google Maps <ExternalLink size={14} />
            </a>
          )}
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', textAlign: 'center', marginTop: '1rem', lineHeight: 1.5 }}>
            This page updates automatically every 10 seconds while the trip is active.
          </p>
        </div>
      </div>
    </div>
  )
}
