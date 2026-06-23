// Property form types
export type PropertyFormData = {
  // Required property details
  code: string
  street_address: string
  postal_code: string
  type: 'HOUSE' | 'APARTMENT' | 'STUDIO' | 'COMMERCIAL_UNIT'
  project_id?: string | null
  is_ready: boolean

  // Optional rooms
  rooms?: Array<{
    title: string
    is_ready: boolean
  }>

  // Optional payment details
  monthly_rent?: number
  payment_day?: number
  initial_charges?: Array<{
    charge_type: string
    amount: number
    is_taxed: boolean
  }>
  late_payment_charges?: Array<{
    days_after_due: number
    amount: number
  }>

  // Optional reminder details
  reminders?: {
    is_expiry_reminder: boolean
    expiry_days_before_reminder: number | null
    is_rent_reminder: boolean
    rent_reminder_days_before: number | null
    is_overdue_rent_reminder: boolean
    overdue_days_after_reminder: number | null
  }
}

export type PropertyAPIResponse = {
  success: boolean
  property: {
    id: string
    code: string
    street_address: string
    postal_code: string
    type: string
    is_ready: boolean
    created_at: string
  }
}

export type PropertyAPIError = {
  error: string
}
