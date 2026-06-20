import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { INDIAN_CITIES } from '../lib/cities'
import { Camera, Shield, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const INTERESTS = ['Solo travel', 'Backpacking', 'Heritage & culture', 'Beaches', 'Mountains & trekking', 'Food trails', 'Photography', 'Wellness retreats', 'Nightlife', 'Pilgrimage']
const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'Gujarati', 'Punjabi']

export default function Onboarding() {
  const { user, profile, updateProfile } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [bio, setBio] = useState(profile?.bio || '')

  const [interests, setInterests] = useState<string[]>(profile?.travel_interests || [])
  const [destinations, setDestinations] = useState<string[]>(profile?.favorite_destinations || [])
  const [languages, setLanguages] = useState<string[]>(profile?.languages || [])

  const toggle = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item])
  }

  const handleAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > 4 * 1024 * 1024) { toast.error('Image must be under 4MB.'); return }

    setUploadingAvatar(true)
    const path = `${user.id}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    setUploadingAvatar(false)

    if (error) {
      toast.error('Could not upload photo. You can add one later.')
      return
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    setAvatarUrl(data.publicUrl)
  }

  const goStep2 = async () => {
    setSaving(true)
    const { error } = await updateProfile({ avatar_url: avatarUrl || null, bio: bio.trim() || null })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    setStep(2)
  }

  const goStep3 = async () => {
    setSaving(true)
    const { error } = await updateProfile({
      travel_interests: interests,
      favorite_destinations: destinations,
      languages,
    })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    setStep(3)
  }

  const finish = async () => {
    setSaving(true)
    const { error } = await updateProfile({ onboarding_completed: true })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    navigate('/dashboard')
  }

  return (
    <div className="onboard-shell">
      <div className="onboard-card fade-up">
        <div className="onboard-steps">
          {[1, 2, 3].map(n => (
            <div key={n} className={`onboard-step-dot ${step >= n ? 'active' : ''}`}>
              <div className="onboard-step-dot-fill" />
            </div>
          ))}
        </div>

        {step === 1 && (
          <div>
            <p className="auth-eyebrow">Step 1 of 3</p>
            <h1 className="auth-title" style={{ marginBottom: '0.4rem' }}>Add a face to your profile</h1>
            <p className="auth-sub" style={{ marginBottom: '1.8rem' }}>Guides and fellow travellers feel safer when they know who they're meeting.</p>

            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarPick} />
            <div className="avatar-upload" onClick={() => fileRef.current?.click()}>
              {avatarUrl ? <img src={avatarUrl} alt="Your avatar" /> : (uploadingAvatar ? '…' : <Camera size={26} />)}
            </div>
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1.6rem' }}>
              {uploadingAvatar ? 'Uploading…' : 'Tap to upload a photo (optional)'}
            </p>

            <div className="form-group" style={{ marginBottom: '1.8rem' }}>
              <label>Short bio <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span></label>
              <textarea rows={3} placeholder="A line about how you like to travel…" value={bio} onChange={e => setBio(e.target.value)} maxLength={160} />
            </div>

            <button className="btn-primary" disabled={saving} onClick={goStep2} style={{ width: '100%', justifyContent: 'center' }}>
              {saving ? 'Saving…' : 'Continue'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="auth-eyebrow">Step 2 of 3</p>
            <h1 className="auth-title" style={{ marginBottom: '0.4rem' }}>Tell us how you like to travel</h1>
            <p className="auth-sub" style={{ marginBottom: '1.6rem' }}>This shapes the guides and trips we surface for you.</p>

            <div style={{ marginBottom: '1.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.6rem', display: 'block' }}>Travel interests</label>
              <div className="chip-grid">
                {INTERESTS.map(i => (
                  <button key={i} type="button" className={`chip ${interests.includes(i) ? 'selected' : ''}`} onClick={() => toggle(interests, setInterests, i)}>
                    {interests.includes(i) && <Check size={12} style={{ marginRight: 4, verticalAlign: -1 }} />}{i}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.6rem', display: 'block' }}>Favorite destinations</label>
              <div className="chip-grid" style={{ maxHeight: 150, overflowY: 'auto' }}>
                {INDIAN_CITIES.slice(0, 20).map(c => (
                  <button key={c} type="button" className={`chip ${destinations.includes(c) ? 'selected' : ''}`} onClick={() => toggle(destinations, setDestinations, c)}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1.8rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.6rem', display: 'block' }}>Languages spoken</label>
              <div className="chip-grid">
                {LANGUAGES.map(l => (
                  <button key={l} type="button" className={`chip ${languages.includes(l) ? 'selected' : ''}`} onClick={() => toggle(languages, setLanguages, l)}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button className="btn-outline" onClick={() => setStep(1)} style={{ flex: 1, justifyContent: 'center' }}>Back</button>
              <button className="btn-primary" disabled={saving} onClick={goStep3} style={{ flex: 2, justifyContent: 'center' }}>
                {saving ? 'Saving…' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center' }} className="scale-in">
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--dawn-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.4rem' }}>
              <Shield size={30} color="var(--night)" />
            </div>
            <p className="auth-eyebrow">Step 3 of 3</p>
            <h1 className="auth-title" style={{ marginBottom: '0.6rem' }}>Welcome to SafeShe, {profile?.full_name?.split(' ')[0] || 'traveller'}</h1>
            <p className="auth-sub" style={{ marginBottom: '2rem' }}>
              Your profile is ready. Browse verified guides, book women-only stays, and travel with an SOS network always one tap away.
            </p>
            <button className="btn-primary" disabled={saving} onClick={finish} style={{ width: '100%', justifyContent: 'center' }}>
              {saving ? 'Finishing up…' : 'Go to dashboard →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
