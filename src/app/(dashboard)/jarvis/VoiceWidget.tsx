'use client'

import Script from 'next/script'

const AGENT_ID =
  process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ?? 'agent_1001knww7wwafyqtrnbk1q6ev143'

export function VoiceWidget() {
  return (
    <div className="relative min-h-[120px]">
      <Script
        src="https://elevenlabs.io/convai-widget/index.js"
        strategy="afterInteractive"
        async
      />
      {/* @ts-expect-error — custom element from ElevenLabs */}
      <elevenlabs-convai agent-id={AGENT_ID}></elevenlabs-convai>
      <p className="mt-3 text-xs text-zinc-500">
        Tap the mic. The agent (&quot;Cyrus AF&quot;) is wired to your existing ElevenLabs configuration.
        Tools the agent can call are configured in the <a href="https://elevenlabs.io/app/conversational-ai/agents" className="underline text-zinc-400 hover:text-zinc-200" target="_blank" rel="noreferrer">ElevenLabs dashboard</a>.
      </p>
    </div>
  )
}
