# Skill: App Self-Healer

**Trigger:** Next.js compilation error, TypeScript error, or hydration mismatch.

## Rule 1: Stop and Read

Do NOT rewrite the whole file. Read the exact error message and trace to the specific line.

## Diagnosis Protocols

### Hydration Mismatch
```
Error: Hydration failed because the initial UI does not match what was rendered on the server.
```
Cause: Something rendered differently on server vs client.
Fix: Move the offending expression to `useEffect` or a client-only component.
```typescript
// ❌ Wrong — renders differently on server/client
<span>{new Date().toLocaleDateString()}</span>

// ✓ Correct
const [date, setDate] = useState('')
useEffect(() => setDate(new Date().toLocaleDateString()), [])
<span>{date}</span>
```

### TypeScript Error — Property does not exist
Read `.claude/registry/schema-map.json` for exact column names.
Check `src/lib/types.ts` for the TypeScript interface.
Never cast with `as any` — fix the type properly.

### Supabase RLS Error (403 / empty result)
The query is hitting a table the user doesn't have RLS access to.
- Client-facing routes: use `createClient()` from `@/lib/supabase/server` — respects RLS
- Admin/webhook routes: use `createServiceClient()` from `@/lib/supabase/service` — bypasses RLS
- Never use service client in a user-facing route

### "window is not defined"
Browser API used in server component or top-level module.
Fix: Move to `useEffect` or add `typeof window !== 'undefined'` guard.

### Module not found
Check import path casing — macOS is case-insensitive but Linux (Vercel) is not.
`@/components/ui/LeadCard` ≠ `@/components/ui/leadCard` on Vercel.

### Build passes locally but fails on Vercel
Usually a missing env var. Check Vercel → Settings → Environment Variables.
Required vars: all 13 in `.env.local` must be in Vercel.

## Precision Fix Rule

Target the exact line causing the issue.
Do not refactor unrelated code during a healing operation.
Do not add `// @ts-ignore` — fix the underlying type error.
