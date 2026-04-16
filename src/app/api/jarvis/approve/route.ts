// POST /api/jarvis/approve
// Approve or reject a jarvis_task that's currently awaiting_approval.
// Auth: requires logged-in user whose email is in JARVIS_ADMIN_EMAILS.
// Writes audit row to jarvis_approvals + flips task status to approved/rejected.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const runtime = 'nodejs'

const ADMIN_EMAILS = (process.env.JARVIS_ADMIN_EMAILS ?? 'mo@auraflowusa.com')
  .split(',')
  .map((s) => s.trim().toLowerCase())

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const email = (user.email ?? '').toLowerCase()
  if (!ADMIN_EMAILS.includes(email)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  let body: { task_id?: string; decision?: 'approve' | 'reject'; reason?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const { task_id, decision, reason } = body
  if (!task_id || (decision !== 'approve' && decision !== 'reject')) {
    return NextResponse.json({ error: 'task_id and decision (approve|reject) required' }, { status: 400 })
  }

  // Use service client to bypass RLS for the audit insert
  const service = createServiceClient()

  const newStatus = decision === 'approve' ? 'approved' : 'rejected'

  const { error: updateErr } = await service
    .from('jarvis_tasks')
    .update({ status: newStatus, approved_by: email })
    .eq('id', task_id)
    .eq('status', 'awaiting_approval')

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  const { error: auditErr } = await service.from('jarvis_approvals').insert({
    task_id,
    decided_by: email,
    decision,
    reason: reason ?? null,
  })

  if (auditErr) {
    return NextResponse.json({ error: auditErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, status: newStatus })
}
