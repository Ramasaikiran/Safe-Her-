import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id?: string) => void
      remove: (id?: string) => void
    }
    onTurnstileLoad?: () => void
  }
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined

let scriptPromise: Promise<void> | null = null
function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve) => {
    window.onTurnstileLoad = () => resolve()
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad'
    script.async = true
    script.defer = true
    document.body.appendChild(script)
  })
  return scriptPromise
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void
  onExpire?: () => void
  resetKey?: number
}

/**
 * Cloudflare Turnstile -- the actual bot defense on auth forms (real
 * rate limiting lives in Postgres, see schema.sql; this is what stops
 * a script from ever getting that far). Renders nothing if
 * VITE_TURNSTILE_SITE_KEY isn't set, so the app keeps working before
 * that's configured -- it just isn't protected yet.
 */
export default function TurnstileWidget({ onVerify, onExpire, resetKey }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!SITE_KEY) return
    let cancelled = false

    loadTurnstileScript().then(() => {
      if (cancelled || !containerRef.current || !window.turnstile) return
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: onVerify,
        'expired-callback': onExpire,
        theme: 'light',
      })
    })

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  if (!SITE_KEY) return null
  return <div ref={containerRef} style={{ margin: '0.4rem 0' }} />
}

export const turnstileEnabled = Boolean(SITE_KEY)
