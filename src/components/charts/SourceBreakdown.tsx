'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { LEAD_SOURCES, type LeadSource } from '@/lib/types'

interface Point { source: LeadSource; count: number }

export function SourceBreakdown({ data }: { data: Point[] }) {
  const formatted = data.map((d) => ({
    label: LEAD_SOURCES[d.source]?.label ?? d.source,
    count: d.count,
    color: LEAD_SOURCES[d.source]?.color ?? '#8b5cf6',
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={formatted} margin={{ top: 8, right: 8, bottom: 8, left: -20 }}>
        <XAxis dataKey="label" stroke="#7c7291" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis stroke="#7c7291" fontSize={10} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#0c0a12',
            border: '1px solid rgba(139,92,246,0.35)',
            borderRadius: 12,
            fontSize: 12,
          }}
          cursor={{ fill: 'rgba(139,92,246,0.06)' }}
        />
        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
          {formatted.map((e, i) => (
            <Cell key={i} fill={e.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
