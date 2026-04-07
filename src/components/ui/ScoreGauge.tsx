'use client'

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { scoreColor } from '@/lib/utils'

export function ScoreGauge({ score, size = 180 }: { score: number; size?: number }) {
  const color = scoreColor(score)
  const data = [{ name: 'score', value: score, fill: color }]

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="75%"
          outerRadius="100%"
          barSize={10}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar background={{ fill: 'rgba(139,92,246,0.08)' }} dataKey="value" cornerRadius={100} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-mono text-4xl font-semibold" style={{ color }}>{score}</div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted">/100</div>
      </div>
    </div>
  )
}
