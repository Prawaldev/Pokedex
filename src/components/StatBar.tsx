import { MAX_BASE_STAT } from '../lib/format'

interface StatBarProps {
  label: string
  value: number
}

export function StatBar({ label, value }: StatBarProps) {
  const percent = Math.min(100, Math.round((value / MAX_BASE_STAT) * 100))

  return (
    <li className="stat">
      <span className="stat-label">{label}</span>
      <span
        className="stat-track"
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={MAX_BASE_STAT}
      >
        <span className="stat-fill" style={{ width: `${percent}%` }} />
      </span>
      <span className="stat-value">{value}</span>
    </li>
  )
}
