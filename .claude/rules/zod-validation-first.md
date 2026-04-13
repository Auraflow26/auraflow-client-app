# Rule: Zod Validation on All API Routes

**TRIGGER:** When creating or editing any `route.ts` API file.

## The Mandate

Every API route that accepts a request body MUST validate it with Zod before touching Supabase.

## Pattern

```typescript
import { z } from 'zod'

const schema = z.object({
  client_id: z.string().uuid(),
  status: z.enum(['new', 'qualified', 'booked', 'won', 'lost']),
  estimated_value: z.number().positive().optional(),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const { client_id, status, estimated_value } = parsed.data
  // Now safe to use — fully typed, validated
}
```

## Column Name Check

Before writing any Supabase query, read `.claude/registry/schema-map.json`.
Do NOT guess column names. The schema map is the source of truth.

## Common Zod Types for This Project

```typescript
z.string().uuid()           // for all id fields
z.enum(['new','qualified','booked','won','lost'])  // lead status
z.enum(['urgent','important','informational'])     // directive severity
z.number().int().min(0).max(100)  // scores
z.string().email()          // contact_email
z.coerce.number()           // when value might come as string from form
```