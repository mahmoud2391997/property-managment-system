/**
 * Lease status utility functions
 *
 * Database only stores: 'Current' | 'Ended'
 * We compute: 'Scheduled' | 'Current' | 'Expired' | 'Ended' based on dates
 */

export type LeaseStatusDB = 'Current' | 'Ended'
export type LeaseStatusComputed = 'Scheduled' | 'Current' | 'Expired' | 'Ended'

export interface LeaseForStatus {
  status: string // Accept any string to handle Prisma enum types
  start_date: Date | string
  number_of_months: number | null
}

/**
 * Calculate the end date of a lease based on start_date + number_of_months
 * Returns null if number_of_months is null (ongoing lease)
 */
export function calculateLeaseEndDate(
  startDate: Date | string,
  numberOfMonths: number | null
): Date | null {
  if (numberOfMonths === null) {
    return null
  }

  const start = new Date(startDate)
  const endDate = new Date(start)
  endDate.setMonth(endDate.getMonth() + numberOfMonths)

  return endDate
}

/**
 * Get today's date at midnight (start of day) in local timezone
 * This is used for date-only comparisons
 */
function getTodayDateOnly(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/**
 * Convert a date to date-only (midnight) in local timezone
 * Handles both Date objects and ISO strings from database
 */
function toDateOnly(date: Date | string): Date {
  const d = new Date(date)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/**
 * Compute the display status of a lease based on its DB status and dates
 *
 * Logic:
 * - If DB status is 'Ended' -> 'Ended'
 * - If DB status is 'Current':
 *   - If start_date is in the future -> 'Scheduled'
 *   - If number_of_months exists and end_date has passed -> 'Expired'
 *   - Otherwise -> 'Current'
 */
export function computeLeaseStatus(lease: LeaseForStatus): LeaseStatusComputed {
  if (lease.status === 'Ended') {
    return 'Ended'
  }

  const today = getTodayDateOnly()
  const startDate = toDateOnly(lease.start_date)

  // If start date is in the future, it's scheduled
  if (startDate > today) {
    return 'Scheduled'
  }

  // If there's an end date and it has passed, it's expired
  if (lease.number_of_months !== null) {
    const endDate = calculateLeaseEndDate(lease.start_date, lease.number_of_months)
    if (endDate) {
      const endDateOnly = toDateOnly(endDate)
      if (endDateOnly < today) {
        return 'Expired'
      }
    }
  }

  return 'Current'
}

/**
 * Check if a lease is considered "active" (Current or Expired but not Ended)
 * Active leases block new leases from being added
 */
export function isLeaseActive(lease: LeaseForStatus): boolean {
  const status = computeLeaseStatus(lease)
  return status === 'Current' || status === 'Expired'
}

/**
 * Check if a lease has a defined end date
 */
export function hasLeaseEndDate(lease: LeaseForStatus): boolean {
  return lease.number_of_months !== null
}

/**
 * Get the earliest date a new lease can start after an existing lease
 * Returns null if the existing lease has no end date (cannot schedule after)
 */
export function getEarliestNewLeaseStartDate(lease: LeaseForStatus): Date | null {
  const endDate = calculateLeaseEndDate(lease.start_date, lease.number_of_months)

  if (!endDate) {
    return null
  }

  // New lease must start at least 1 day after existing lease ends
  const earliestStart = new Date(endDate)
  earliestStart.setDate(earliestStart.getDate() + 1)

  return earliestStart
}

/**
 * Format a date for display
 */
export function formatLeaseDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}
