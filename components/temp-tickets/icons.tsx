interface IconProps {
  className?: string
}

export function AssignmentIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 12h6M12 9v6" />
    </svg>
  )
}

export function AssignmentRejectIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </svg>
  )
}

export function AssignmentAcceptIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

export function StatusIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  )
}