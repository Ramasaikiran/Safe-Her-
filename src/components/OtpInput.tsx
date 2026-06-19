import { useRef, useState, useEffect } from 'react'

interface OtpInputProps {
  length?: number
  onComplete: (code: string) => void
  error?: boolean
  disabled?: boolean
  resetKey?: number // bump this to clear the inputs (e.g. after a failed attempt)
}

/**
 * Accessible 4/6-digit OTP input.
 * - Auto-advances on digit entry, auto-submits when full.
 * - Backspace moves focus to previous box.
 * - Supports paste of full code.
 */
export default function OtpInput({ length = 4, onComplete, error, disabled, resetKey }: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''))
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    setValues(Array(length).fill(''))
    refs.current[0]?.focus()
  }, [resetKey, length])

  const handleChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...values]
    next[i] = digit
    setValues(next)
    if (digit && i < length - 1) refs.current[i + 1]?.focus()
    if (next.every(d => d !== '')) onComplete(next.join(''))
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !values[i] && i > 0) {
      refs.current[i - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '')
    if (!text) return
    e.preventDefault()
    const next = Array(length).fill('')
    for (let i = 0; i < Math.min(length, text.length); i++) next[i] = text[i]
    setValues(next)
    const lastFilled = Math.min(length, text.length) - 1
    refs.current[Math.min(lastFilled + 1, length - 1)]?.focus()
    if (next.every(d => d !== '')) onComplete(next.join(''))
  }

  return (
    <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', margin: '1rem 0' }} onPaste={handlePaste}>
      {values.map((v, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el }}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          value={v}
          disabled={disabled}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          aria-label={`OTP digit ${i + 1} of ${length}`}
          style={{
            width: 56, height: 64, textAlign: 'center', fontSize: '1.6rem', fontWeight: 700,
            borderRadius: 14, border: `2px solid ${error ? 'var(--err, #DC2626)' : 'var(--border, rgba(196,154,114,.2))'}`,
            background: error ? 'var(--err-l, #FEE2E2)' : 'white',
            color: 'var(--night, #1A0F0A)', outline: 'none',
            fontFamily: 'DM Sans, sans-serif',
          }}
        />
      ))}
    </div>
  )
}
