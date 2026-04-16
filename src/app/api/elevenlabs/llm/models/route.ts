// GET /api/elevenlabs/llm/models — OpenAI-compatible model list endpoint.
// Some OpenAI-client integrations probe /models to validate the base URL.
// We return a single synthetic Claude entry so the probe succeeds.

export const runtime = 'nodejs'

export async function GET() {
  return Response.json({
    object: 'list',
    data: [
      {
        id: 'claude-sonnet-4-5-20250929',
        object: 'model',
        created: 1727481600,
        owned_by: 'anthropic',
      },
      {
        id: 'claude-opus-4-1-20250805',
        object: 'model',
        created: 1723248000,
        owned_by: 'anthropic',
      },
      {
        id: 'claude-haiku-4-5-20251001',
        object: 'model',
        created: 1727827200,
        owned_by: 'anthropic',
      },
    ],
  })
}
