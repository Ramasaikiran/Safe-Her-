import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail fast in dev so misconfiguration is obvious instead of silent auth failures
  console.error(
    'Missing Supabase env vars. Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

// ═══════════════════════════════════════
// Database types — mirrors schema in Supabase project "SafeShe"
// ═══════════════════════════════════════
export type UserRole = 'traveller' | 'guide' | 'admin'
export type GuideStatus = 'pending' | 'active' | 'suspended' | 'rejected'
export type BookingType = 'guide' | 'hostel' | 'guard'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
export type SosStatus = 'active' | 'responding' | 'resolved'

export interface Profile {
  id: string
  phone: string
  role: UserRole
  full_name: string
  city: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface GuideProfile {
  id: string
  status: GuideStatus
  rating: number
  reviews_count: number
  trips_count: number
  hourly_rate: number
  languages: string[]
  specialties: string[]
  bio: string | null
  years_experience: string | null
  available: boolean
  aadhaar_number: string | null
  aadhaar_doc_url: string | null
  pan_number: string | null
  pan_doc_url: string | null
  passport_doc_url: string | null
  selfie_doc_url: string | null
  verified_at: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

export interface Hostel {
  id: string
  name: string
  city: string
  address: string | null
  price_per_night: number
  women_only: boolean
  total_rooms: number
  occupied_rooms: number
  rating: number
  reviews_count: number
  verified: boolean
  amenities: string[]
  image_url: string | null
  created_at: string
}

export interface Booking {
  id: string
  traveller_id: string
  guide_id: string | null
  hostel_id: string | null
  type: BookingType
  city: string
  booking_date: string
  hours: number | null
  amount: number
  platform_fee: number
  payment_method: string | null
  payment_status: string
  status: BookingStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface EmergencyContact {
  id: string
  user_id: string
  contact_name: string
  contact_phone: string
  created_at: string
}

export interface SosAlert {
  id: string
  user_id: string
  latitude: number | null
  longitude: number | null
  location_label: string | null
  status: SosStatus
  responded_by: string | null
  created_at: string
  resolved_at: string | null
}
