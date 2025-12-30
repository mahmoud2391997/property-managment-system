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

/**
 * Parses a date and time string (YYYY-MM-DD and HH:MM) into a Date object
 * that correctly preserves the local timezone when saved to PostgreSQL timestamptz.
 *
 * This solves the issue where entering "14:30" gets saved as UTC time instead of local time.
 *
 * @param dateString - Date in YYYY-MM-DD format (e.g., "2025-01-15")
 * @param timeString - Time in HH:MM format (e.g., "14:30")
 * @returns Date object with correct timezone offset
 *
 * @example
 * // Input: "2025-01-15" and "14:30" (2:30 PM local time)
 * // Returns: Date object representing 2:30 PM in your timezone
 * const dateTime = parseLocalDateTime("2025-01-15", "14:30")
 */
export function parseLocalDateTime(dateString: string, timeString: string): Date {
  // Create date in local timezone
  const localDateTime = new Date(`${dateString}T${timeString}`)

  // Get timezone offset in minutes and convert to hours
  const timezoneOffsetMinutes = localDateTime.getTimezoneOffset()
  const timezoneOffsetHours = -timezoneOffsetMinutes / 60

  // Extract date/time components
  const year = localDateTime.getFullYear()
  const month = String(localDateTime.getMonth() + 1).padStart(2, '0')
  const day = String(localDateTime.getDate()).padStart(2, '0')
  const hours = String(localDateTime.getHours()).padStart(2, '0')
  const minutes = String(localDateTime.getMinutes()).padStart(2, '0')
  const seconds = '00'

  // Format timezone offset: +08:00 or -05:00
  const sign = timezoneOffsetHours >= 0 ? '+' : '-'
  const absOffset = Math.abs(timezoneOffsetHours)
  const offsetHours = String(Math.floor(absOffset)).padStart(2, '0')
  const offsetMinutes = String((absOffset % 1) * 60).padStart(2, '0')
  const offsetStr = `${sign}${offsetHours}:${offsetMinutes}`

  // Create ISO string with timezone: 2025-01-15T14:30:00+08:00
  const isoStringWithTimezone = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetStr}`

  return new Date(isoStringWithTimezone)
}
