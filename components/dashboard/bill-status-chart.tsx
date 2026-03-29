'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface StatusData {
  name: string
  value: number
  color: string
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-card-md px-3 py-2.5 text-sm">
      <p className="font-semibold text-gray-900">
        ₹{Number(payload[0].value).toLocaleString('en-IN')}
      </p>
      <p className="text-gray-500 text-xs">{payload[0].name}</p>
    </div>
  )
}

function CustomLegend({ payload }: any) {
  return (
    <div className="flex flex-col gap-2 justify-center pl-2">
      {payload?.map((entry: any) => (
        <div key={entry.value} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-xs text-gray-500">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function BillStatusChart({ data }: { data: StatusData[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-sm text-gray-400">
        No bill data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="40%"
          cy="50%"
          innerRadius={60}
          outerRadius={88}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          content={<CustomLegend />}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
