// Date -> DD/MM/YYYY
export const formatDate = (date?: Date | string | null): string => {
  if (!date) return '—'
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB').format(dateObj)
}

// Timestamp -> mins ago / hrs ago / DD/MM/YYYY
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 1000 / 60)
  const diffHours = Math.floor(diffMinutes / 60)

  if (diffMinutes < 60) {
    return `${diffMinutes} min${diffMinutes !== 1 ? 's' : ''} ago`
  } else if (diffHours < 24) {
    return `${diffHours} hr${diffHours !== 1 ? 's' : ''} ago`
  } else {
    // Format as DD/MM/YYYY
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }
}

// Timestamp -> Oct 15, 2025, 03:10 PM
export function formatTimestampLong(iso: string): string {
  const date = new Date(iso);

  return date.toLocaleString('en-US', {
    month: 'short',       // "Oct"
    day: '2-digit',       // "15"
    year: 'numeric',      // "2025"
    hour: '2-digit',      // "03"
    minute: '2-digit',    // "10"
    hour12: true,         // AM/PM
  });
}

// Date -> YYYY-MM-DD (for API submissions, avoids timezone shift)
export function formatDateForAPI(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
