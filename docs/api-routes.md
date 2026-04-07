# AuraFlow Client App — API Routes Specification

## Authentication
All routes require valid Supabase JWT. Middleware redirects unauthenticated users to /login.

## Core Endpoints

### GET /api/dashboard
Returns the Home/Pulse screen data in one call.
```typescript
Response: {
  greeting: string           // "Good morning, Robert"
  business_name: string
  metrics: {
    leads_today: number
    avg_response_time_sec: number
    pipeline_value: number
    total_reviews: number
    leads_trend: number      // % change vs last period
    response_trend: number
    pipeline_trend: number
    reviews_trend: number
  }
  recent_activity: AgentActivity[]  // last 20 items
  unread_notifications: number
}
```

### POST /api/chat
Sends a message to Claude API with client context.
```typescript
Request: {
  message: string
  conversation_id?: string  // for continuing a conversation
}
Response: {
  role: "assistant"
  content: string
  actions?: { label: string, action: string }[]  // optional action buttons
}
```

### GET /api/notifications
Returns notifications for the current client.
```typescript
Query params: ?read=false&limit=20
Response: Notification[]
```

### PATCH /api/notifications/:id
Mark notification as read.

## Data fetching strategy
Most screens use Supabase client directly (via hooks) rather than API routes.
API routes are only needed for:
- Chat (requires server-side Claude API key)
- Complex aggregations (dashboard metrics)
- Webhook receivers (n8n → app notifications)
