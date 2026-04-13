# Rule: Next.js App Router Boundaries

**TRIGGER:** When creating any new page, layout, or component.

## The Boundary Law

Default to **Server Components**. Add `"use client"` only at leaf nodes.

| Allowed in Server Components | Requires "use client" |
|------------------------------|----------------------|
| `createClient()` from `@/lib/supabase/server` | `useState`, `useEffect`, `useRef` |
| `async/await` data fetching | `onClick`, `onChange` handlers |
| `SUPABASE_SERVICE_ROLE_KEY` access | Realtime subscriptions |
| Direct DB queries | `useStore()` (Zustand) |
| `cookies()`, `headers()` | `usePushSubscription` |

## Never Do These

- Import `SUPABASE_SERVICE_ROLE_KEY` or `ANTHROPIC_API_KEY` into a `"use client"` file
- Use `window`, `localStorage`, `navigator` outside of `useEffect`
- Call `createClient()` from `@/lib/supabase/server` in a client component
- Add `"use client"` to a page.tsx that only needs to display data

## Pattern: Data down, events up

```
page.tsx (Server) → fetches data → passes as props
  └── ViewComponent.tsx ("use client") → handles interactivity
        └── AtomicButton.tsx ("use client") → pure UI
```

## The Hydration Check

If you see "Hydration mismatch" — you rendered something server-side that differs client-side. Common causes:
- Timestamps formatted with `new Date()` directly in JSX → move to `useEffect`
- `Math.random()` in render → move to state initialization
- Browser-only APIs in component body → move to `useEffect`
