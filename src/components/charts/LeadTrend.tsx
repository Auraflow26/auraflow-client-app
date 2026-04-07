'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format, parseISO } from 'date-fns'

interface Point { date: string; leads: number }

export function LeadTrend({ data }: { data: Point[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: format(parseISO(d.date), 'MMM d'),
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={formatted} margin={{ top: 8, right: 8, bottom: 8, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.08)" vertical={false} />
        <XAxis
          dataKey="label"
          stroke="#7c7291"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis stroke="#7c7291" fontSize={10} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#0c0a12',
            border: '1px solid rgba(139,92,246,0.35)',
            borderRadius: 12,
            fontSize: 12,
          }}
          labelStyle={{ color: '#c4b5fd' }}
        />
        <Line
          type="monotone"
          dataKey="leads"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={{ fill: '#8b5cf6', r: 3 }}
          activeDot={{ r: 5, fill: '#c4b5fd' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
