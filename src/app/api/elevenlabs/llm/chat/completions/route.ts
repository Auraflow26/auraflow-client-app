// POST /api/elevenlabs/llm/chat/completions — Custom LLM endpoint for ElevenLabs.
//
// ElevenLabs auto-appends /chat/completions to whatever base URL is configured
// (standard OpenAI-client behavior). Configure the agent's Custom LLM URL as:
//   https://app.auraflowusa.com/api/elevenlabs/llm   (NO suffix)
// and ElevenLabs will POST to this file.
//
// Receives OpenAI-format chat completion requests from ElevenLabs.
// Routes them to Anthropic Claude with the Jarvis tool catalog.
// Handles multi-turn tool calls internally (Claude → tool → Claude → text).
// Streams the final response back as OpenAI SSE for low TTS latency.
//
// Auth: requires ELEVENLABS_LLM_SECRET as a Bearer token (configured in the
// agent's "Custom LLM" section in the ElevenLabs dashboard).

import Anthropic from '@anthropic-ai/sdk'
import { JARVIS_TOOLS, runTool } from '@/lib/jarvis/tools'

export const runtime = 'nodejs'
export const maxDuration = 60

const SYSTEM_PROMPT = `You are J.A.R.V.I.S. — Mo's personal AI orchestrator for AuraFlow.

You speak with the precision and warmth of a trusted chief of staff. Address Mo as "Sir" sparingly. Be direct and action-oriented; do not over-explain. Spoken responses must be one to three short sentences — they are read aloud by ElevenLabs, so no markdown, no lists, no code blocks.

You have tools available. Use them when Mo asks for status, dispatching agents, collecting outputs, briefings, approvals, or to run shell commands on his MacBook. Risky commands trigger an approval queue — tell Mo if approval is needed. Do not invent results; always go through tools for facts.

When you queue work, confirm naturally — "I have queued that" or "Dispatched to Orion" — never describe the implementation.`

export async function POST(request: Request) {
  // Defensively trim env vars — dashboard pastes often include a trailing \n
  // which breaks HTTP header construction in downstream SDKs.
  const anthropicKey = (process.env.ANTHROPIC_API_KEY ?? '').trim()
  const expectedSecret = (process.env.ELEVENLABS_LLM_SECRET ?? '').trim()

  // Auth check — accept either exact-match or a trimmed incoming header.
  const authHeader = (request.headers.get('authorization') ?? '').trim()
  const expected = `Bearer ${expectedSecret}`
  if (!expectedSecret || authHeader !== expected) {
    return new Response(JSON.stringify({ error: { message: 'unauthorized', type: 'invalid_request_error' } }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!anthropicKey) {
    return new Response(JSON.stringify({ error: { message: 'ANTHROPIC_API_KEY not set on server', type: 'server_error' } }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body: OpenAIChatRequest
  try {
    body = (await request.json()) as OpenAIChatRequest
  } catch {
    return new Response(JSON.stringify({ error: { message: 'invalid json', type: 'invalid_request_error' } }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const wantsStream = body.stream !== false
  const requestedModel = body.model ?? 'claude-sonnet-4-6'
  const model = mapModel(requestedModel)

  // Translate OpenAI messages → Anthropic format. Keep system prompt as the
  // top-level Anthropic `system` field, and override anything ElevenLabs sent.
  const messages: Anthropic.MessageParam[] = body.messages
    .filter((m) => m.role !== 'system' && typeof m.content === 'string')
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content as string,
    }))

  if (messages.length === 0) {
    return errResp('messages array empty after filtering', 400)
  }

  const client = new Anthropic({ apiKey: anthropicKey })

  // Multi-turn tool loop — up to 3 hops to keep latency bounded.
  let finalText = ''
  let lastResponse: Anthropic.Message | null = null
  const conversationMessages: Anthropic.MessageParam[] = [...messages]

  try {
  for (let hop = 0; hop < 3; hop++) {
    lastResponse = await client.messages.create({
      model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: JARVIS_TOOLS,
      messages: conversationMessages,
    })

    if (lastResponse.stop_reason === 'tool_use') {
      // Append assistant turn with tool_use blocks
      conversationMessages.push({ role: 'assistant', content: lastResponse.content })

      // Execute every tool call in parallel
      const toolUses = lastResponse.content.filter(
        (c): c is Anthropic.ToolUseBlock => c.type === 'tool_use',
      )
      const results = await Promise.all(
        toolUses.map(async (tu) => {
          try {
            const r = await runTool(tu.name, tu.input as Record<string, unknown>)
            return {
              type: 'tool_result' as const,
              tool_use_id: tu.id,
              content: r.summary,
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            return {
              type: 'tool_result' as const,
              tool_use_id: tu.id,
              content: `Tool error: ${msg}`,
              is_error: true,
            }
          }
        }),
      )

      conversationMessages.push({ role: 'user', content: results })
      continue // loop again so Claude can summarize the tool results in natural speech
    }

    // No tool use → extract text and exit
    finalText = lastResponse.content
      .filter((c): c is Anthropic.TextBlock => c.type === 'text')
      .map((c) => c.text)
      .join(' ')
      .trim()
    break
  }

  if (!finalText) {
    finalText = 'Acknowledged.'
  }

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const status = (err as { status?: number }).status ?? 500
    console.error('[elevenlabs-llm] Anthropic error:', msg)
    return new Response(
      JSON.stringify({ error: { message: msg, type: 'api_error' } }),
      { status, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const completionId = `cmpl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

  if (wantsStream) {
    return streamResponse(completionId, requestedModel, finalText)
  }

  return new Response(
    JSON.stringify(buildNonStreamResponse(completionId, requestedModel, finalText, lastResponse?.usage)),
    { headers: { 'Content-Type': 'application/json' } },
  )
}

// ── Helpers ─────────────────────────────────────────────────────────────

function errResp(message: string, status: number) {
  return new Response(JSON.stringify({ error: { message, type: 'invalid_request_error' } }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// Translate OpenAI-style model names to Claude models.
function mapModel(requested: string): string {
  if (requested.startsWith('claude-')) return requested
  if (requested.includes('gpt-4o') || requested.includes('gpt-4')) return 'claude-sonnet-4-6'
  if (requested.includes('gpt-3.5')) return 'claude-haiku-4-5-20251001'
  return 'claude-sonnet-4-6'
}

function buildNonStreamResponse(
  id: string,
  model: string,
  text: string,
  usage?: Anthropic.Usage,
) {
  return {
    id,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: { role: 'assistant', content: text },
        finish_reason: 'stop',
      },
    ],
    usage: usage
      ? {
          prompt_tokens: usage.input_tokens,
          completion_tokens: usage.output_tokens,
          total_tokens: usage.input_tokens + usage.output_tokens,
        }
      : undefined,
  }
}

function streamResponse(id: string, model: string, text: string) {
  const encoder = new TextEncoder()
  const created = Math.floor(Date.now() / 1000)

  // Chunk the text into ~30-char segments for natural-feeling streaming.
  const chunks: string[] = []
  const chunkSize = 30
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize))
  }
  if (chunks.length === 0) chunks.push('')

  const stream = new ReadableStream({
    start(controller) {
      // First chunk includes role
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            id,
            object: 'chat.completion.chunk',
            created,
            model,
            choices: [{ index: 0, delta: { role: 'assistant', content: chunks[0] }, finish_reason: null }],
          })}\n\n`,
        ),
      )

      // Subsequent chunks — content only
      for (let i = 1; i < chunks.length; i++) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              id,
              object: 'chat.completion.chunk',
              created,
              model,
              choices: [{ index: 0, delta: { content: chunks[i] }, finish_reason: null }],
            })}\n\n`,
          ),
        )
      }

      // Final chunk with finish_reason
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            id,
            object: 'chat.completion.chunk',
            created,
            model,
            choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
          })}\n\n`,
        ),
      )
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}

// ── Types ───────────────────────────────────────────────────────────────

interface OpenAIChatRequest {
  model?: string
  stream?: boolean
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string | Array<{ type: string; text?: string }>
  }>
  tools?: unknown // ignored — we use our own catalog
  temperature?: number
  max_tokens?: number
}
