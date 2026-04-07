'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Point { label: string; before: number; after: number }

export function MetricComparison({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -20 }}>
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
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="before" name="Before" fill="#4a4458" radius={[6, 6, 0, 0]} />
        <Bar dataKey="after" name="After" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
