interface Stats {
  total: number
  completed: number
  in_progress: number
  cancelled: number
  no_show: number
}

export default function TodayStats({ stats }: { stats: Stats }) {
  const items = [
    { label: 'Total', value: stats.total, color: 'text-gray-900' },
    { label: 'Completed', value: stats.completed, color: 'text-success' },
    { label: 'In Progress', value: stats.in_progress, color: 'text-warning' },
    { label: 'Cancelled', value: stats.cancelled, color: 'text-muted' },
    { label: 'No Show', value: stats.no_show, color: 'text-danger' },
  ]

  return (
    <div className="grid grid-cols-5 gap-3">
      {items.map(({ label, value, color }) => (
        <div
          key={label}
          className="bg-white rounded-xl border border-border px-4 py-3"
        >
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          <p className="text-xs text-muted mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  )
}
