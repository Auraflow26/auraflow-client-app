'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ?? 'agent_1001knww7wwafyqtrnbk1q6ev143'

export default function TalkPage() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'radial-gradient(ellipse at 50% 40%, #0a0f1a 0%, #000000 70%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
      color: '#fff',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle ambient glow */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(39,146,220,0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      {/* Title */}
      <div style={{
        position: 'absolute',
        top: '8vh',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: '13px',
          fontWeight: 500,
          letterSpacing: '6px',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.25)',
          margin: 0,
        }}>
          J.A.R.V.I.S.
        </h1>
        <p style={{
          fontSize: '11px',
          color: 'rgba(255,255,255,0.12)',
          marginTop: '6px',
          letterSpacing: '2px',
        }}>
          {time}
        </p>
      </div>

      {/* ElevenLabs widget — centered */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
      }}>
        <Script
          src="https://elevenlabs.io/convai-widget/index.js"
          strategy="afterInteractive"
          async
        />
        {/* @ts-expect-error — custom element from ElevenLabs */}
        <elevenlabs-convai agent-id={AGENT_ID}></elevenlabs-convai>
      </div>

      {/* Hint at bottom */}
      <p style={{
        position: 'absolute',
        bottom: '6vh',
        fontSize: '11px',
        color: 'rgba(255,255,255,0.15)',
        letterSpacing: '1px',
        textAlign: 'center',
        maxWidth: '280px',
        lineHeight: 1.5,
      }}>
        tap the orb to speak
      </p>
    </div>
  )
}
