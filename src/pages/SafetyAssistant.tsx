import { useState, useRef, useEffect } from 'react'
import { Shield, Send, Loader2, Bot, User, RotateCcw } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED = [
  'Is Goa safe for solo women at night?',
  'Women\'s safety score for Varanasi?',
  'Best safe hostels in Bangalore?',
  'What to do if I feel followed?',
  'Is Delhi Metro safe at 10 PM?',
  'How to avoid scams in Jaipur?',
  'Safe areas in Hyderabad for solo travel?',
  'What should I carry for safety?',
]

const SYSTEM_PROMPT = `You are SafeShe AI — a warm, knowledgeable travel safety assistant for women travelling in India and worldwide. You are powered by real community reviews, government safety data, and travel experience from thousands of women travellers.

Your role:
- Answer women's safety questions honestly, practically, and without being alarmist
- Give specific, actionable advice (real area names, real apps, real strategies)
- Rate safety on a 1-10 scale when asked
- Share community insights: what real women travellers have experienced
- Highlight safe areas, women-friendly services, and red flags
- Always end with an empowering, confidence-building note

Your knowledge covers:
- Indian cities: Mumbai, Delhi, Bangalore, Goa, Jaipur, Hyderabad, Kochi, Varanasi, Chennai, Kolkata, Pune, and more
- Safety metrics: overall safety, night safety, public transport safety
- Scam types and how to spot them
- Women-only facilities (metro coaches, hostels, etc.)
- Emergency numbers and resources
- Real community-reported incidents (without being scary)
- Solo travel strategies that real women use

Tone: Warm, direct, like a well-travelled friend who gives honest advice — not corporate, not preachy. Use emojis sparingly for clarity. Be specific, not vague.

If asked about a city not in your primary knowledge, give general safety strategies that apply universally.`

export default function SafetyAssistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      const reply = data.content?.[0]?.text || 'Sorry, I couldn\'t get a response. Please try again.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection issue. Please check your internet and try again.' }])
    }
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  return (
    <div className="page" style={{ background: 'var(--cream)', paddingTop: '5rem', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'white', flexShrink: 0 }}>
        <div className="container" style={{ maxWidth: 720, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--dawn-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={20} color="var(--night)" />
            </div>
            <div>
              <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>AI Safety Assistant</h1>
              <p style={{ fontSize: '0.75rem', color: 'var(--sage)', margin: 0, fontWeight: 600 }}>● Community-powered · Always learning</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '0.3rem 0.7rem', fontSize: '0.78rem', cursor: 'pointer', color: 'var(--muted)', fontFamily: 'DM Sans,sans-serif' }}>
              <RotateCcw size={12} /> New chat
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', paddingTop: '2rem' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--dawn-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem' }}>
                <Shield size={28} color="var(--night)" />
              </div>
              <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.3rem', marginBottom: '0.4rem' }}>Ask anything about travel safety</h2>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto 2rem' }}>
                Real answers from community reviews, safety data, and women who've been there.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                {SUGGESTED.map(q => (
                  <button key={q} onClick={() => sendMessage(q)}
                    style={{ padding: '0.5rem 1rem', borderRadius: 50, background: 'white', border: '1.5px solid var(--border)', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--earth)', fontFamily: 'DM Sans,sans-serif', transition: 'all 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--rose)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.2rem', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: m.role === 'user' ? 'var(--rose)' : 'var(--dawn-gradient)' }}>
                {m.role === 'user' ? <User size={16} color="white" /> : <Bot size={16} color="var(--night)" />}
              </div>
              <div style={{ maxWidth: '80%', padding: '0.85rem 1.1rem', borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: m.role === 'user' ? 'var(--rose)' : 'white', color: m.role === 'user' ? 'white' : 'var(--night)', fontSize: '0.9rem', lineHeight: 1.6, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', whiteSpace: 'pre-wrap' }}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.2rem' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dawn-gradient)' }}>
                <Bot size={16} color="var(--night)" />
              </div>
              <div style={{ padding: '0.85rem 1.1rem', borderRadius: '18px 18px 18px 4px', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--muted)', fontSize: '0.88rem' }}>
                <Loader2 size={14} className="spin" /> Thinking…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', background: 'white', flexShrink: 0, paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', gap: '0.6rem' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about safety, hostels, local tips…"
            rows={1}
            style={{ flex: 1, resize: 'none', padding: '0.75rem 1rem', border: '1.5px solid var(--border)', borderRadius: 14, fontSize: '0.9rem', fontFamily: 'DM Sans,sans-serif', outline: 'none', lineHeight: 1.4, maxHeight: 120, overflowY: 'auto' }}
            onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 120) + 'px' }}
          />
          <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()}
            style={{ width: 44, height: 44, borderRadius: '50%', background: input.trim() ? 'var(--rose)' : 'var(--border)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'default', flexShrink: 0, alignSelf: 'flex-end', transition: 'background 0.2s' }}>
            <Send size={18} color="white" />
          </button>
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
          Powered by community reviews · Always verify critical safety info locally
        </p>
      </div>
    </div>
  )
}
