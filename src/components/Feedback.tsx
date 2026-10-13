interface LoaderProps {
  label?: string
}

/** A simple inline loading line for lists and the detail panel. */
export function Loader({ label = 'Loading' }: LoaderProps) {
  return (
    <p className="loader meta" role="status">
      {label}…
    </p>
  )
}

interface ErrorBoxProps {
  message: string
  onRetry: () => void
}

export function ErrorBox({ message, onRetry }: ErrorBoxProps) {
  return (
    <div className="error-box" role="alert">
      <p className="error-title">{message}</p>
      <button type="button" className="btn btn-accent" onClick={onRetry}>
        <span aria-hidden="true">↻</span> Retry
      </button>
    </div>
  )
}
