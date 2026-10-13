import { contrastInk, typeColor } from '../lib/format'

interface TypeBadgeProps {
  type: string
}

export function TypeBadge({ type }: TypeBadgeProps) {
  const color = typeColor(type)

  return (
    <span className="type-badge" style={{ backgroundColor: color, color: contrastInk(color) }}>
      {type}
    </span>
  )
}
