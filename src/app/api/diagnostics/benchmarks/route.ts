// GET /api/diagnostics/benchmarks/:vertical — Benchmark data for a vertical
// Requires auth.

import { createClient } from '@/lib/supabase/server'
import type { IndustryBenchmark, Vertical, SizeBand } from '@/lib/types'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const vertical = url.searchParams.get('vertical') as Vertical | null
  const size_band = url.searchParams.get('size_band') as SizeBand | null

  if (!vertical) {
    return Response.json({ error: 'vertical is required' }, { status: 400 })
  }

  let query = supabase
    .from('industry_benchmarks')
    .select('*')
    .eq('vertical', vertical)
    .order('data_point_id')

  if (size_band) query = query.eq('size_band', size_band)

  const { data, error } = await query.returns<IndustryBenchmark[]>()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ vertical, size_band, benchmarks: data ?? [] })
}
