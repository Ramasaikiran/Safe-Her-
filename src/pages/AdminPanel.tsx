import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import {
  Users, Briefcase, ShieldCheck, AlertTriangle, TrendingUp,
  RefreshCw, Check, X, Loader2, Eye, ChevronDown, LogOut,
  IndianRupee, Clock, UserCheck, Flag, Search, Filter
} from 'lucide-react'
import toast from 'react-hot-toast'

// ── types ──────────────────────────────────────────────────────────
type AdminTab = 'overview' | 'users' | 'guides' | 'bookings' | 'reports'

interface Profile {
  id: string; email: string; full_name: string
  phone: string | null; role: string; city: string | null
  onboarding_completed: boolean; created_at: string
}

interface GuideRow {
  id: string; status: string; rating: number; reviews_count: number
  trips_count: number; hourly_rate: number; city: string | null
  kyc_status: string; kyc_verified_name: string | null
  kyc_aadhaar_last4: string | null; created_at: string
  profiles: { full_name: string; email: string } | null
}

interface BookingRow {
  id: string; type: string; city: string | null
  booking_date: string; hours: number | null; amount: number
  status: string; payment_status: string; created_at: string
  traveller: { full_name: string; email: string } | null
  guide_id: string | null
}

interface ReportRow {
  id: string; reason: string; details: string | null; created_at: string
  guide: { full_name: string; email: string } | null
  reporter: { full_name: string; email: string } | null
  guide_id: string
}

interface Stats {
  totalUsers: number; totalGuides: number; totalBookings: number
  totalRevenue: number; pendingKyc: number; openReports: number
  activeBookings: number; pendingGuides: number
}

// ── helpers ────────────────────────────────────────────────────────
const GUIDE_STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  pending:   { color: 'var(--sand)',  bg: 'rgba(212,165,116,0.12)' },
  active:    { color: 'var(--sage)',  bg: 'rgba(122,158,126,0.12)' },
  suspended: { color: 'var(--rose)',  bg: 'var(--blush)' },
  rejected:  { color: 'var(--muted)', bg: '#F3F0ED' },
}

const KYC_COLORS: Record<string, { color: string; bg: string }> = {
  not_started: { color: 'var(--muted)', bg: '#F3F0ED' },
  pending:     { color: 'var(--sand)',  bg: 'rgba(212,165,116,0.12)' },
  verified:    { color: 'var(--sage)',  bg: 'rgba(122,158,126,0.12)' },
  failed:      { color: 'var(--rose)',  bg: 'var(--blush)' },
}

function Chip({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ fontSize: '0.7rem', fontWeight: 700, color, background: bg, padding: '0.18rem 0.55rem', borderRadius: 20, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

function StatCard({ icon, value, label, accent }: { icon: React.ReactNode; value: string | number; label: string; accent: string }) {
  return (
    <div className="card" style={{ padding: '1.1rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--night)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.2rem' }}>{label}</div>
      </div>
    </div>
  )
}

// ── main component ─────────────────────────────────────────────────
export default function AdminPanel() {
  const { user, profile, signOut } = useAuth()

  // Guard: only admin role gets in
  if (!user || profile?.role !== 'admin') return <Navigate to="/" replace />

  const [tab, setTab] = useState<AdminTab>('overview')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<Profile[]>([])
  const [guides, setGuides] = useState<GuideRow[]>([])
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [reports, setReports] = useState<ReportRow[]>([])
  const [search, setSearch] = useState('')
  const [guideFilter, setGuideFilter] = useState<string>('all')
  const [bookingFilter, setBookingFilter] = useState<string>('all')
  const [actioning, setActioning] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [
        { data: profilesData },
        { data: guidesData },
        { data: bookingsData },
        { data: reportsData },
      ] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('guide_profiles').select('*, profiles(full_name, email)').order('created_at', { ascending: false }),
        supabase.from('bookings').select('id, type, city, booking_date, hours, amount, status, payment_status, created_at, traveller_id, guide_id').order('created_at', { ascending: false }),
        supabase.from('guide_reports').select('id, reason, details, created_at, guide_id, reporter_id').order('created_at', { ascending: false }),
      ])

      const p = (profilesData || []) as Profile[]
      const g = (guidesData || []) as GuideRow[]
      const b = (bookingsData || []) as any[]
      const r = (reportsData || []) as any[]

      setUsers(p)
      setGuides(g)

      // Enrich bookings with traveller name
      const travellerIds = [...new Set(b.map((x: any) => x.traveller_id).filter(Boolean))]
      let travellerMap: Record<string, { full_name: string; email: string }> = {}
      if (travellerIds.length) {
        const { data: tp } = await supabase.from('profiles').select('id, full_name, email').in('id', travellerIds)
        for (const t of tp || []) travellerMap[t.id] = { full_name: t.full_name, email: t.email }
      }
      const enrichedBookings: BookingRow[] = b.map((x: any) => ({
        ...x,
        traveller: travellerMap[x.traveller_id] || null,
      }))
      setBookings(enrichedBookings)

      // Enrich reports
      const guideIds = [...new Set(r.map((x: any) => x.guide_id).filter(Boolean))]
      const reporterIds = [...new Set(r.map((x: any) => x.reporter_id).filter(Boolean))]
      const allIds = [...new Set([...guideIds, ...reporterIds])]
      let personMap: Record<string, { full_name: string; email: string }> = {}
      if (allIds.length) {
        const { data: rp } = await supabase.from('profiles').select('id, full_name, email').in('id', allIds)
        for (const t of rp || []) personMap[t.id] = { full_name: t.full_name, email: t.email }
      }
      const enrichedReports: ReportRow[] = r.map((x: any) => ({
        ...x,
        guide: personMap[x.guide_id] || null,
        reporter: personMap[x.reporter_id] || null,
      }))
      setReports(enrichedReports)

      // Stats
      const completedBookings = enrichedBookings.filter(x => x.status === 'completed')
      setStats({
        totalUsers: p.filter(x => x.role === 'traveller').length,
        totalGuides: p.filter(x => x.role === 'guide').length,
        totalBookings: enrichedBookings.length,
        totalRevenue: completedBookings.reduce((s, x) => s + x.amount, 0),
        pendingKyc: g.filter(x => x.kyc_status === 'pending').length,
        openReports: r.length,
        activeBookings: enrichedBookings.filter(x => x.status === 'confirmed').length,
        pendingGuides: g.filter(x => x.status === 'pending').length,
      })
    } catch (e) {
      toast.error('Could not load admin data. Check RLS policies.')
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const updateGuideStatus = async (guideId: string, status: string) => {
    setActioning(guideId)
    const { error } = await supabase.from('guide_profiles').update({ status }).eq('id', guideId)
    setActioning(null)
    if (error) { toast.error('Could not update guide status.'); return }
    toast.success(`Guide ${status}`)
    loadAll()
  }

  const filteredUsers = users.filter(u => {
    if (!search) return true
    const q = search.toLowerCase()
    return u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.city?.toLowerCase().includes(q)
  })

  const filteredGuides = guides.filter(g => {
    const matchStatus = guideFilter === 'all' || g.status === guideFilter
    if (!search) return matchStatus
    const q = search.toLowerCase()
    const name = g.profiles?.full_name?.toLowerCase() || ''
    const email = g.profiles?.email?.toLowerCase() || ''
    return matchStatus && (name.includes(q) || email.includes(q))
  })

  const filteredBookings = bookings.filter(b => {
    const matchStatus = bookingFilter === 'all' || b.status === bookingFilter
    if (!search) return matchStatus
    const q = search.toLowerCase()
    const name = b.traveller?.full_name?.toLowerCase() || ''
    return matchStatus && (name.includes(q) || b.city?.toLowerCase().includes(q))
  })

  const TABS: { key: AdminTab; label: string; badge?: number }[] = [
    { key: 'overview',  label: '📊 Overview' },
    { key: 'users',     label: '👤 Users',    badge: stats?.totalUsers },
    { key: 'guides',    label: '🧭 Guides',   badge: stats?.pendingGuides },
    { key: 'bookings',  label: '📅 Bookings', badge: stats?.activeBookings },
    { key: 'reports',   label: '🚩 Reports',  badge: stats?.openReports },
  ]

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', color: 'var(--muted)', background: 'var(--warm)' }}>
      <Loader2 size={18} className="spin" /> Loading admin data…
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0F0A07', paddingTop: '5rem' }}>
      <style>{`
        .adm-shell { max-width: 1100px; margin: 0 auto; padding: 1.5rem 1.2rem 4rem; }
        @media (min-width: 640px) { .adm-shell { padding: 2rem 2rem 4rem; } }

        .adm-tabs {
          display: flex; gap: 0.25rem; overflow-x: auto;
          -ms-overflow-style: none; scrollbar-width: none;
          background: rgba(255,255,255,0.04); border-radius: 14px;
          padding: 0.3rem; margin-bottom: 1.8rem;
        }
        .adm-tabs::-webkit-scrollbar { display: none; }
        .adm-tab {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.6rem 1rem; border-radius: 10px;
          font-size: 0.83rem; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.5); white-space: nowrap;
          transition: all 0.16s;
        }
        .adm-tab:hover { color: rgba(255,255,255,0.8); }
        .adm-tab.active { background: rgba(232,68,90,0.18); color: #FF8FA0; }
        .adm-badge {
          background: var(--rose); color: white;
          font-size: 0.65rem; font-weight: 800;
          padding: 0.1rem 0.42rem; border-radius: 20px; min-width: 18px;
          text-align: center;
        }

        .adm-stats-grid {
          display: grid; gap: 0.75rem;
          grid-template-columns: repeat(2, 1fr);
          margin-bottom: 1.8rem;
        }
        @media (min-width: 640px)  { .adm-stats-grid { grid-template-columns: repeat(4, 1fr); } }

        .adm-card {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; overflow: hidden;
        }
        .adm-table-wrap { overflow-x: auto; }
        .adm-table {
          width: 100%; border-collapse: collapse;
          font-size: 0.82rem; font-family: 'DM Sans', sans-serif;
        }
        .adm-table th {
          padding: 0.75rem 1rem; text-align: left;
          font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; color: rgba(255,255,255,0.35);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          white-space: nowrap;
        }
        .adm-table td {
          padding: 0.8rem 1rem; color: rgba(255,255,255,0.82);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          vertical-align: middle;
        }
        .adm-table tr:last-child td { border-bottom: none; }
        .adm-table tr:hover td { background: rgba(255,255,255,0.03); }

        .adm-search-row {
          display: flex; gap: 0.6rem; align-items: center;
          margin-bottom: 1rem; flex-wrap: wrap;
        }
        .adm-search {
          flex: 1; min-width: 180px;
          padding: 0.65rem 1rem 0.65rem 2.4rem;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.9); font-size: 0.85rem;
          font-family: 'DM Sans', sans-serif; outline: none;
          transition: border-color 0.18s;
        }
        .adm-search::placeholder { color: rgba(255,255,255,0.3); }
        .adm-search:focus { border-color: rgba(232,68,90,0.5); }
        .adm-search-wrap { position: relative; flex: 1; min-width: 180px; }
        .adm-search-icon {
          position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
          color: rgba(255,255,255,0.3); pointer-events: none; display: flex;
        }

        .adm-filter-pill {
          padding: 0.45rem 0.85rem; border-radius: 50px;
          font-size: 0.76rem; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.5); cursor: pointer;
          transition: all 0.16s; white-space: nowrap;
        }
        .adm-filter-pill.active { background: rgba(232,68,90,0.2); border-color: rgba(232,68,90,0.4); color: #FF8FA0; }

        .adm-action-btn {
          padding: 0.3rem 0.7rem; border-radius: 8px; border: none;
          font-size: 0.73rem; font-weight: 700; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: all 0.15s;
          display: inline-flex; align-items: center; gap: 0.3rem;
        }
        .adm-btn-approve { background: rgba(122,158,126,0.2); color: #9DC2A0; }
        .adm-btn-approve:hover { background: rgba(122,158,126,0.35); }
        .adm-btn-suspend { background: rgba(232,68,90,0.15); color: #FF8FA0; }
        .adm-btn-suspend:hover { background: rgba(232,68,90,0.28); }
        .adm-btn-reject  { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); }
        .adm-btn-reject:hover  { background: rgba(255,255,255,0.12); }

        .adm-section-title {
          font-family: 'Playfair Display', serif;
          font-size: 1rem; font-weight: 700;
          color: rgba(255,255,255,0.85); margin-bottom: 0.9rem;
        }

        .adm-empty {
          padding: 2.5rem; text-align: center;
          color: rgba(255,255,255,0.3); font-size: 0.85rem;
        }

        .adm-rev-hero {
          background: var(--dawn-gradient); border-radius: 16px;
          padding: 1.4rem 1.6rem; margin-bottom: 1.2rem;
          position: relative; overflow: hidden;
        }
        .adm-rev-hero::after {
          content:''; position:absolute; inset:0;
          background: radial-gradient(circle at 85% 50%, rgba(255,255,255,0.2), transparent 55%);
        }
      `}</style>

      <div className="adm-shell">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(232,68,90,0.8)', marginBottom: '0.2rem' }}>SafeShe · Admin</p>
            <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: 'clamp(1.3rem,3vw,1.7rem)', fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
              Control Panel
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button onClick={loadAll} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.5rem 0.9rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
              <RefreshCw size={13} /> Refresh
            </button>
            <button onClick={async () => { await signOut(); window.location.href = '/' }} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(232,68,90,0.12)', border: '1px solid rgba(232,68,90,0.2)', borderRadius: 10, padding: '0.5rem 0.9rem', color: '#FF8FA0', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="adm-tabs">
          {TABS.map(t => (
            <button key={t.key} className={`adm-tab${tab === t.key ? ' active' : ''}`} onClick={() => { setTab(t.key); setSearch('') }}>
              {t.label}
              {t.badge != null && t.badge > 0 && <span className="adm-badge">{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ─────────────────────────────────────────────── */}
        {tab === 'overview' && stats && (
          <>
            {/* Revenue hero */}
            <div className="adm-rev-hero">
              <div style={{ position: 'relative', zIndex: 1 }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--night)', opacity: 0.65, marginBottom: '0.3rem' }}>Platform revenue</p>
                <div style={{ fontFamily: 'Playfair Display,serif', fontWeight: 900, fontSize: 'clamp(2rem,5vw,2.8rem)', color: 'var(--night)', lineHeight: 1 }}>
                  ₹{stats.totalRevenue.toLocaleString('en-IN')}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--night)', opacity: 0.6, marginTop: '0.35rem' }}>
                  From {bookings.filter(b => b.status === 'completed').length} completed bookings
                </p>
              </div>
            </div>

            <div className="adm-stats-grid">
              <StatCard icon={<Users size={18} color="#7A9E7E" />}    value={stats.totalUsers}    label="Travellers"         accent="#7A9E7E" />
              <StatCard icon={<UserCheck size={18} color="#C49A72" />} value={stats.totalGuides}   label="Guides"             accent="#C49A72" />
              <StatCard icon={<Briefcase size={18} color="#E8445A" />} value={stats.totalBookings} label="Total bookings"     accent="#E8445A" />
              <StatCard icon={<Clock size={18} color="#C49A72" />}     value={stats.activeBookings} label="Confirmed trips"   accent="#C49A72" />
              <StatCard icon={<ShieldCheck size={18} color="#C49A72" />} value={stats.pendingKyc}  label="KYC pending"        accent="#C49A72" />
              <StatCard icon={<AlertTriangle size={18} color="#E8445A" />} value={stats.openReports} label="Reports"          accent="#E8445A" />
              <StatCard icon={<Clock size={18} color="#7A9E7E" />}     value={stats.pendingGuides} label="Guides awaiting approval" accent="#7A9E7E" />
              <StatCard icon={<IndianRupee size={18} color="#7A9E7E" />} value={bookings.filter(b => b.payment_status === 'pending').length} label="Unpaid bookings" accent="#E8445A" />
            </div>

            {/* Quick KYC queue */}
            {guides.filter(g => g.kyc_status === 'pending').length > 0 && (
              <>
                <h2 className="adm-section-title" style={{ color: 'rgba(255,255,255,0.8)' }}>KYC pending review</h2>
                <div className="adm-card" style={{ marginBottom: '1.4rem' }}>
                  <div className="adm-table-wrap">
                    <table className="adm-table">
                      <thead><tr><th>Guide</th><th>Email</th><th>City</th><th>Aadhaar</th><th>Actions</th></tr></thead>
                      <tbody>
                        {guides.filter(g => g.kyc_status === 'pending').map(g => (
                          <tr key={g.id}>
                            <td style={{ fontWeight: 600 }}>{g.profiles?.full_name || '—'}</td>
                            <td style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem' }}>{g.profiles?.email || '—'}</td>
                            <td>{g.city || '—'}</td>
                            <td>••••{g.kyc_aadhaar_last4 || '??'}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <button className="adm-action-btn adm-btn-approve" onClick={() => updateGuideStatus(g.id, 'active')} disabled={actioning === g.id}>
                                  {actioning === g.id ? <Loader2 size={11} className="spin" /> : <Check size={11} />} Approve
                                </button>
                                <button className="adm-action-btn adm-btn-reject" onClick={() => updateGuideStatus(g.id, 'rejected')} disabled={actioning === g.id}>
                                  <X size={11} /> Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Quick reports queue */}
            {reports.length > 0 && (
              <>
                <h2 className="adm-section-title" style={{ color: 'rgba(255,255,255,0.8)' }}>Latest reports</h2>
                <div className="adm-card">
                  <div className="adm-table-wrap">
                    <table className="adm-table">
                      <thead><tr><th>Reporter</th><th>Guide reported</th><th>Reason</th><th>Date</th><th>Guide status</th></tr></thead>
                      <tbody>
                        {reports.slice(0, 5).map(r => {
                          const guide = guides.find(g => g.id === r.guide_id)
                          const gs = guide ? GUIDE_STATUS_COLORS[guide.status] : GUIDE_STATUS_COLORS.pending
                          return (
                            <tr key={r.id}>
                              <td>{r.reporter?.full_name || '—'}</td>
                              <td style={{ fontWeight: 600 }}>{r.guide?.full_name || '—'}</td>
                              <td><Chip label={r.reason.replace('_', ' ')} color="#FF8FA0" bg="rgba(232,68,90,0.15)" /></td>
                              <td style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                              <td>{guide && <Chip label={guide.status} color={gs.color} bg={gs.bg} />}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ── USERS ────────────────────────────────────────────────── */}
        {tab === 'users' && (
          <>
            <div className="adm-search-row">
              <div className="adm-search-wrap">
                <span className="adm-search-icon"><Search size={14} /></span>
                <input className="adm-search" placeholder="Search name, email, city…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>{filteredUsers.length} users</span>
            </div>
            <div className="adm-card">
              {filteredUsers.length === 0
                ? <div className="adm-empty">No users found.</div>
                : (
                  <div className="adm-table-wrap">
                    <table className="adm-table">
                      <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>City</th><th>Onboarded</th><th>Joined</th></tr></thead>
                      <tbody>
                        {filteredUsers.map(u => (
                          <tr key={u.id}>
                            <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                            <td style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem' }}>{u.email}</td>
                            <td>
                              <Chip
                                label={u.role}
                                color={u.role === 'admin' ? '#FF8FA0' : u.role === 'guide' ? '#9DC2A0' : 'rgba(255,255,255,0.55)'}
                                bg={u.role === 'admin' ? 'rgba(232,68,90,0.15)' : u.role === 'guide' ? 'rgba(122,158,126,0.15)' : 'rgba(255,255,255,0.07)'}
                              />
                            </td>
                            <td>{u.city || '—'}</td>
                            <td>
                              {u.onboarding_completed
                                ? <span style={{ color: '#9DC2A0', fontSize: '0.75rem', fontWeight: 700 }}>✓ Yes</span>
                                : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>No</span>}
                            </td>
                            <td style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                              {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          </>
        )}

        {/* ── GUIDES ───────────────────────────────────────────────── */}
        {tab === 'guides' && (
          <>
            <div className="adm-search-row">
              <div className="adm-search-wrap">
                <span className="adm-search-icon"><Search size={14} /></span>
                <input className="adm-search" placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {(['all','pending','active','suspended','rejected'] as const).map(f => (
                <button key={f} className={`adm-filter-pill${guideFilter === f ? ' active' : ''}`} onClick={() => setGuideFilter(f)}>
                  {f === 'all' ? `All (${guides.length})` : `${f} (${guides.filter(g => g.status === f).length})`}
                </button>
              ))}
            </div>
            <div className="adm-card">
              {filteredGuides.length === 0
                ? <div className="adm-empty">No guides found.</div>
                : (
                  <div className="adm-table-wrap">
                    <table className="adm-table">
                      <thead><tr><th>Guide</th><th>City</th><th>Rate</th><th>Rating</th><th>KYC</th><th>Status</th><th>Actions</th></tr></thead>
                      <tbody>
                        {filteredGuides.map(g => {
                          const st = GUIDE_STATUS_COLORS[g.status] || GUIDE_STATUS_COLORS.pending
                          const kyc = KYC_COLORS[g.kyc_status] || KYC_COLORS.not_started
                          return (
                            <tr key={g.id}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{g.profiles?.full_name || '—'}</div>
                                <div style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.35)' }}>{g.profiles?.email || '—'}</div>
                              </td>
                              <td>{g.city || '—'}</td>
                              <td>₹{g.hourly_rate}/hr</td>
                              <td>⭐ {g.rating?.toFixed(1) || '—'} <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>({g.reviews_count})</span></td>
                              <td><Chip label={g.kyc_status.replace('_',' ')} color={kyc.color} bg={kyc.bg} /></td>
                              <td><Chip label={g.status} color={st.color} bg={st.bg} /></td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                  {g.status !== 'active' && (
                                    <button className="adm-action-btn adm-btn-approve" onClick={() => updateGuideStatus(g.id, 'active')} disabled={actioning === g.id}>
                                      {actioning === g.id ? <Loader2 size={11} className="spin" /> : <Check size={11} />} Approve
                                    </button>
                                  )}
                                  {g.status !== 'suspended' && (
                                    <button className="adm-action-btn adm-btn-suspend" onClick={() => updateGuideStatus(g.id, 'suspended')} disabled={actioning === g.id}>
                                      <X size={11} /> Suspend
                                    </button>
                                  )}
                                  {g.status !== 'rejected' && (
                                    <button className="adm-action-btn adm-btn-reject" onClick={() => updateGuideStatus(g.id, 'rejected')} disabled={actioning === g.id}>
                                      Reject
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          </>
        )}

        {/* ── BOOKINGS ─────────────────────────────────────────────── */}
        {tab === 'bookings' && (
          <>
            <div className="adm-search-row">
              <div className="adm-search-wrap">
                <span className="adm-search-icon"><Search size={14} /></span>
                <input className="adm-search" placeholder="Search name or city…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {(['all','pending','confirmed','completed','cancelled'] as const).map(f => (
                <button key={f} className={`adm-filter-pill${bookingFilter === f ? ' active' : ''}`} onClick={() => setBookingFilter(f)}>
                  {f === 'all' ? `All (${bookings.length})` : `${f} (${bookings.filter(b => b.status === f).length})`}
                </button>
              ))}
            </div>
            <div className="adm-card">
              {filteredBookings.length === 0
                ? <div className="adm-empty">No bookings found.</div>
                : (
                  <div className="adm-table-wrap">
                    <table className="adm-table">
                      <thead><tr><th>Traveller</th><th>Type</th><th>City</th><th>Date</th><th>Amount</th><th>Status</th><th>Payment</th></tr></thead>
                      <tbody>
                        {filteredBookings.map(b => {
                          const st = GUIDE_STATUS_COLORS[b.status] || GUIDE_STATUS_COLORS.pending
                          const paid = b.payment_status === 'paid'
                          return (
                            <tr key={b.id}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{b.traveller?.full_name || '—'}</div>
                                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>{b.traveller?.email || '—'}</div>
                              </td>
                              <td><Chip label={b.type} color="rgba(255,255,255,0.6)" bg="rgba(255,255,255,0.07)" /></td>
                              <td>{b.city || '—'}</td>
                              <td style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
                                {new Date(b.booking_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                {b.hours ? ` · ${b.hours}h` : ''}
                              </td>
                              <td style={{ fontWeight: 700, color: '#FF8FA0' }}>₹{b.amount.toLocaleString('en-IN')}</td>
                              <td><Chip label={b.status} color={st.color} bg={st.bg} /></td>
                              <td>
                                <Chip
                                  label={b.payment_status}
                                  color={paid ? '#9DC2A0' : 'rgba(255,255,255,0.4)'}
                                  bg={paid ? 'rgba(122,158,126,0.15)' : 'rgba(255,255,255,0.06)'}
                                />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          </>
        )}

        {/* ── REPORTS ──────────────────────────────────────────────── */}
        {tab === 'reports' && (
          <>
            <div className="adm-search-row">
              <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{reports.length} reports total</span>
            </div>
            <div className="adm-card">
              {reports.length === 0
                ? <div className="adm-empty">No reports. Platform is clean 🎉</div>
                : (
                  <div className="adm-table-wrap">
                    <table className="adm-table">
                      <thead><tr><th>Reporter</th><th>Guide reported</th><th>Reason</th><th>Details</th><th>Guide status</th><th>Date</th><th>Action</th></tr></thead>
                      <tbody>
                        {reports.map(r => {
                          const guide = guides.find(g => g.id === r.guide_id)
                          const gs = guide ? GUIDE_STATUS_COLORS[guide.status] : GUIDE_STATUS_COLORS.pending
                          return (
                            <tr key={r.id}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{r.reporter?.full_name || '—'}</div>
                                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>{r.reporter?.email || '—'}</div>
                              </td>
                              <td style={{ fontWeight: 600, color: '#FF8FA0' }}>{r.guide?.full_name || '—'}</td>
                              <td><Chip label={r.reason.replace(/_/g,' ')} color="#FF8FA0" bg="rgba(232,68,90,0.15)" /></td>
                              <td style={{ maxWidth: 200, fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
                                {r.details ? r.details.slice(0, 60) + (r.details.length > 60 ? '…' : '') : '—'}
                              </td>
                              <td>{guide && <Chip label={guide.status} color={gs.color} bg={gs.bg} />}</td>
                              <td style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                                {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                              <td>
                                {guide && guide.status !== 'suspended' && (
                                  <button className="adm-action-btn adm-btn-suspend" onClick={() => updateGuideStatus(r.guide_id, 'suspended')} disabled={actioning === r.guide_id}>
                                    {actioning === r.guide_id ? <Loader2 size={11} className="spin" /> : <X size={11} />} Suspend guide
                                  </button>
                                )}
                                {guide && guide.status === 'suspended' && (
                                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>Already suspended</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          </>
        )}

      </div>
    </div>
  )
}
