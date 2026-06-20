import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

/**
 * Manages a single "live trip" — watches the browser's geolocation and
 * keeps one row in `live_trips` updated with the latest position. The
 * row's id is the shareable link's only access control (see schema.sql).
 */
export function useLiveTrip(userId: string | undefined) {
  const [tripId, setTripId] = useState<string | null>(null)
  const [tracking, setTracking] = useState(false)
  const watchIdRef = useRef<number | null>(null)

  const stop = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (tripId) {
      await supabase.from('live_trips').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', tripId)
    }
    setTracking(false)
    setTripId(null)
  }, [tripId])

  const start = useCallback(async (bookingId: string | null) => {
    if (!userId) return null
    if (!('geolocation' in navigator)) {
      toast.error('Location is not available on this device.')
      return null
    }

    const { data, error } = await supabase
      .from('live_trips')
      .insert({ user_id: userId, booking_id: bookingId, status: 'active' })
      .select('id')
      .single()

    if (error || !data) {
      toast.error('Could not start live location sharing.')
      return null
    }

    const id = data.id as string
    setTripId(id)
    setTracking(true)

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        await supabase.from('live_trips').update({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy_m: pos.coords.accuracy,
          last_updated: new Date().toISOString(),
        }).eq('id', id)
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          toast.error('Location permission denied. Trip sharing stopped.')
          stop()
        }
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 }
    )

    return id
  }, [userId, stop])

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [])

  return { tripId, tracking, start, stop }
}
