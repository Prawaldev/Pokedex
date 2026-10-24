export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <div className="logo-frame">
        <svg
          className="logo-svg"
          viewBox="0 0 100 100"
          role="img"
          aria-label="Pokédex logo"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="48" fill="#000000" />
          <path d="M 2 50 A 48 48 0 0 1 98 50 L 65 50 A 15 15 0 0 0 35 50 Z" fill="#d62828" />
          <path d="M 2 50 A 48 48 0 0 0 98 50 L 65 50 A 15 15 0 0 1 35 50 Z" fill="#f8f9fa" />
          <circle cx="50" cy="50" r="14" fill="#000000" />
          <circle cx="50" cy="50" r="7" fill="#f8f9fa" />
          <circle cx="50" cy="50" r="3" fill="#ffffff" />
        </svg>
      </div>
    </div>
  )
}
