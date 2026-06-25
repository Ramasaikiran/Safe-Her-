import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Shield, Moon, Bus, Star, AlertTriangle, CheckCircle2, MapPin, Plus, ThumbsUp, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

interface CitySafety {
  id: string; city: string; country: string
  overall_score: number; night_score: number
  transport_score: number; solo_traveller_score: number
  summary: string; tips: string[]; scam_alerts: string[]
  safe_areas: string[]; avoid_areas: string[]
  emergency_numbers: Record<string, string>
}

interface SafetyReport {
  id: string; area: string | null; report_type: string
  description: string; severity: string | null
  time_of_day: string | null; upvotes: number
  created_at: string
}

const REPORT_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  harassment:      { label: 'Harassment', color: 'var(--rose)', icon: '⚠️' },
  scam:            { label: 'Scam', color: '#E9895A', icon: '🎭' },
  unsafe_area:     { label: 'Unsafe area', color: 'var(--rose)', icon: '🚫' },
  transport_issue: { label: 'Transport issue', color: '#E9895A', icon: '🚌' },
  safe_spot:       { label: 'Safe spot', color: 'var(--sage)', icon: '✅' },
  helpful_locals:  { label: 'Helpful locals', color: 'var(--sage)', icon: '💚' },
  women_friendly:  { label: 'Women-friendly', color: 'var(--sage)', icon: '🌸' },
  positive:        { label: 'Positive experience', color: 'var(--sage)', icon: '⭐' },
}

function ScoreBadge({ score, label, icon }: { score: number; label: string; icon: React.ReactNode }) {
  const color = score >= 7.5 ? 'var(--sage)' : score >= 5.5 ? 'var(--sand)' : 'var(--rose)'
  const bg = score >= 7.5 ? 'rgba(122,158,126,0.1)' : score >= 5.5 ? 'rgba(212,165,116,0.1)' : 'var(--blush)'
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '1rem', textAlign: 'center' }}>
      <div style={{ color: 'var(--muted)', marginBottom: '0.4rem' }}>{icon}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color, marginBottom: '0.2rem' }}>{score?.toFixed(1)}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600 }}>{label}</div>
      <div style={{ marginTop: '0.5rem', height: 4, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(score / 10) * 100}%`, background: color, borderRadius: 4, transition: 'width 1s ease' }} />
      </div>
    </div>
  )
}

export default function CitySafety() {
  const { city } = useParams<{ city: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const decodedCity = decodeURIComponent(city || '')

  const [data, setData] = useState<CitySafety | null>(null)
  const [reports, setReports] = useState<SafetyReport[]>([])
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [showReportForm, setShowReportForm] = useState(false)
  const [reportForm, setReportForm] = useState({ area: '', report_type: 'positive', description: '', severity: 'low', time_of_day: 'afternoon' })
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: safety }, { data: reps }] = await Promise.all([
      supabase.from('city_safety').select('*').ilike('city', decodedCity).maybeSingle(),
      supabase.from('safety_reports').select('id,area,report_type,description,severity,time_of_day,upvotes,created_at').ilike('city', decodedCity).order('upvotes', { ascending: false }).limit(30),
    ])
    setData(safety as CitySafety | null)
    setReports((reps || []) as SafetyReport[])
    if (user) {
      const { data: votes } = await supabase.from('safety_report_upvotes').select('report_id').eq('user_id', user.id)
      setUpvoted(new Set((votes || []).map((v: { report_id: string }) => v.report_id)))
    }
    setLoading(false)
  }, [decodedCity, user])

  useEffect(() => { load() }, [load])

  const handleUpvote = async (reportId: string) => {
    if (!user) { toast.error('Please log in to upvote.'); return }
    if (upvoted.has(reportId)) {
      await supabase.from('safety_report_upvotes').delete().eq('report_id', reportId).eq('user_id', user.id)
      setUpvoted(prev => { const s = new Set(prev); s.delete(reportId); return s })
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, upvotes: r.upvotes - 1 } : r))
    } else {
      await supabase.from('safety_report_upvotes').insert({ report_id: reportId, user_id: user.id })
      setUpvoted(prev => new Set([...prev, reportId]))
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, upvotes: r.upvotes + 1 } : r))
    }
  }

  const handleSubmitReport = async () => {
    if (!user) { toast.error('Please log in to submit a report.'); return }
    if (!reportForm.description.trim()) { toast.error('Please describe what happened.'); return }
    setSubmitting(true)
    const { error } = await supabase.from('safety_reports').insert({
      reporter_id: user.id,
      city: decodedCity,
      area: reportForm.area || null,
      report_type: reportForm.report_type,
      description: reportForm.description.trim(),
      severity: ['safe_spot','helpful_locals','women_friendly','positive'].includes(reportForm.report_type) ? null : reportForm.severity,
      time_of_day: reportForm.time_of_day,
    })
    setSubmitting(false)
    if (error) { toast.error(error.message || 'Could not submit. Please try again.'); return }
    toast.success('Report submitted — thank you for keeping the community safe!')
    setShowReportForm(false)
    setReportForm({ area: '', report_type: 'positive', description: '', severity: 'low', time_of_day: 'afternoon' })
    load()
  }

  if (loading) return <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>Loading safety data…</div>

  return (
    <div className="page" style={{ background: 'var(--cream)', paddingTop: '5.5rem' }}>
      <div className="container" style={{ maxWidth: 760, paddingBottom: '3rem' }}>

        <button onClick={() => navigate('/safety')} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '1.2rem', padding: 0, fontFamily: 'DM Sans,sans-serif' }}>
          <ArrowLeft size={14} /> All cities
        </button>

        {/* Hero */}
        <div style={{ background: 'var(--dawn-gradient)', borderRadius: 20, padding: '2rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.25), transparent 60%)' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <MapPin size={16} color="var(--night)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--night)', opacity: 0.7 }}>{data?.country || 'India'}</span>
            </div>
            <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: '2rem', fontWeight: 800, color: 'var(--night)', marginBottom: '0.6rem' }}>{decodedCity}</h1>
            {data?.summary && <p style={{ fontSize: '0.92rem', color: 'var(--night)', opacity: 0.8, maxWidth: 500, lineHeight: 1.6 }}>{data.summary}</p>}
            {!data && <p style={{ fontSize: '0.92rem', color: 'var(--night)', opacity: 0.8 }}>No official safety profile yet — community reports below.</p>}
          </div>
        </div>

        {/* Scores */}
        {data && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem', marginBottom: '1.5rem' }}>
            <ScoreBadge score={data.overall_score} label="Overall Safety" icon={<Shield size={18} color="var(--rose)" />} />
            <ScoreBadge score={data.night_score} label="Night Safety" icon={<Moon size={18} color="#7B5EA7" />} />
            <ScoreBadge score={data.transport_score} label="Public Transport" icon={<Bus size={18} color="var(--sage)" />} />
            <ScoreBadge score={data.solo_traveller_score} label="Solo Traveller" icon={<Star size={18} color="var(--sand)" />} />
          </div>
        )}

        {/* Tips */}
        {(data?.tips?.length ?? 0) > 0 && data && (
          <div className="card" style={{ padding: '1.4rem', marginBottom: '1.2rem' }}>
            <h3 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1rem', fontWeight: 700, marginBottom: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} color="var(--sage)" /> Safety tips
            </h3>
            <ul style={{ margin: 0, padding: '0 0 0 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.tips.map((tip, i) => <li key={i} style={{ fontSize: '0.88rem', color: 'var(--earth)', lineHeight: 1.5 }}>{tip}</li>)}
            </ul>
          </div>
        )}

        {/* Scam Alerts */}
        {(data?.scam_alerts?.length ?? 0) > 0 && data && (
          <div className="card" style={{ padding: '1.4rem', marginBottom: '1.2rem', borderLeft: '3px solid var(--rose)' }}>
            <h3 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1rem', fontWeight: 700, marginBottom: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertTriangle size={16} color="var(--rose)" /> Scam alerts
            </h3>
            <ul style={{ margin: 0, padding: '0 0 0 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.scam_alerts.map((a, i) => <li key={i} style={{ fontSize: '0.88rem', color: 'var(--earth)', lineHeight: 1.5 }}>{a}</li>)}
            </ul>
          </div>
        )}

        {/* Safe / Avoid areas */}
        {((data?.safe_areas?.length ?? 0) > 0 || (data?.avoid_areas?.length ?? 0) > 0) && data && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.2rem' }}>
            {(data.safe_areas?.length ?? 0) > 0 && (
              <div className="card" style={{ padding: '1.1rem' }}>
                <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--sage)', marginBottom: '0.6rem' }}>✅ Generally safe</p>
                {data.safe_areas.map(a => <div key={a} style={{ fontSize: '0.82rem', color: 'var(--earth)', padding: '0.2rem 0' }}>{a}</div>)}
              </div>
            )}
            {(data.avoid_areas?.length ?? 0) > 0 && (
              <div className="card" style={{ padding: '1.1rem' }}>
                <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--rose)', marginBottom: '0.6rem' }}>⚠️ Exercise caution</p>
                {data.avoid_areas.map(a => <div key={a} style={{ fontSize: '0.82rem', color: 'var(--earth)', padding: '0.2rem 0' }}>{a}</div>)}
              </div>
            )}
          </div>
        )}

        {/* Emergency numbers */}
        {data?.emergency_numbers && Object.keys(data.emergency_numbers).length > 0 && (
          <div className="card" style={{ padding: '1.1rem', marginBottom: '1.5rem' }}>
            <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--rose)', marginBottom: '0.6rem' }}>🆘 Emergency numbers</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              {Object.entries(data.emergency_numbers).map(([k, v]) => (
                <a key={k} href={`tel:${v}`} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.8rem', background: 'var(--blush)', borderRadius: 8, fontSize: '0.82rem', color: 'var(--rose)', fontWeight: 600, textDecoration: 'none' }}>
                  {k.replace(/_/g, ' ')} — {v}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Community Reports */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
          <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.2rem', fontWeight: 700 }}>Community reports</h2>
          <button onClick={() => user ? setShowReportForm(s => !s) : toast.error('Please log in to submit a report.')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'var(--rose)', color: 'white', border: 'none', borderRadius: 10, padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
            <Plus size={14} /> Add report
          </button>
        </div>

        {showReportForm && (
          <div className="card" style={{ padding: '1.4rem', marginBottom: '1.2rem' }}>
            <h3 style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>Share your experience</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Type of report</label>
                <select value={reportForm.report_type} onChange={e => setReportForm(p => ({ ...p, report_type: e.target.value }))} style={{ width: '100%' }}>
                  {Object.entries(REPORT_LABELS).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Area / neighbourhood</label>
                  <input type="text" placeholder="e.g. MG Road" value={reportForm.area} onChange={e => setReportForm(p => ({ ...p, area: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Time of day</label>
                  <select value={reportForm.time_of_day} onChange={e => setReportForm(p => ({ ...p, time_of_day: e.target.value }))}>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    <option value="night">Night</option>
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>What happened?</label>
                <textarea rows={3} placeholder="Describe your experience in detail…" value={reportForm.description} onChange={e => setReportForm(p => ({ ...p, description: e.target.value }))} maxLength={500} />
              </div>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button onClick={handleSubmitReport} disabled={submitting} className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                  {submitting ? 'Submitting…' : 'Submit report'}
                </button>
                <button onClick={() => setShowReportForm(false)} className="btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {reports.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
            No community reports yet. Be the first to share your experience!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {reports.map(r => {
              const rt = REPORT_LABELS[r.report_type] || { label: r.report_type, color: 'var(--muted)', icon: '📝' }
              const isPos = ['safe_spot','helpful_locals','women_friendly','positive'].includes(r.report_type)
              return (
                <div key={r.id} className="card" style={{ padding: '1rem', borderLeft: `3px solid ${rt.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: rt.color, background: isPos ? 'rgba(122,158,126,0.1)' : 'var(--blush)', padding: '0.15rem 0.6rem', borderRadius: 20 }}>{rt.icon} {rt.label}</span>
                      {r.area && <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>📍 {r.area}</span>}
                      {r.time_of_day && <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>🕐 {r.time_of_day}</span>}
                    </div>
                    <button onClick={() => handleUpvote(r.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: upvoted.has(r.id) ? 'var(--blush)' : 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '0.2rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer', color: upvoted.has(r.id) ? 'var(--rose)' : 'var(--muted)', fontFamily: 'DM Sans,sans-serif' }}>
                      <ThumbsUp size={11} /> {r.upvotes}
                    </button>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--earth)', lineHeight: 1.5, margin: 0 }}>{r.description}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
