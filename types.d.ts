import { StartupSnapshot } from 'v8'

export type Project = {
  id: string
  name: string
  state: string
  property_count: number
}

export type Property = {
  id: string
  code: string
  address: string
  project: string
  type: string
  status: 'Occupied' | 'Vacant' | 'Pending_Inspection' | 'Under_Preparation'
}

export type PropertyWithDetails = {
  id: string
  code: string
  address: string
  project: string | null
  type: property_type
  status: property_status
}

export type Room = {
  id: string
  title: string
  property: string
  status:
    | 'Occupied'
    | 'Vacant'
    | 'Pending_Inspection'
    | 'Under_Preparation'
    | 'Property_Rented'
    | 'Property_Not_Ready'
}

export type RoomWithProperty = {
  id: string
  title: string
  property: string
  status: property_status
}

export type ViewWithProperty = {
  id: string
  reference_id: string
  first_name: string
  last_name: string | null
  phone_number: string | null
  email: string | null
  viewed_at: string
  created_at: string
}

export type LeaseStatusComputed = 'Scheduled' | 'Current' | 'Expired' | 'Ended'

export type LeaseWithDetails = {
  id: string
  reference_id: string
  start_date: string
  number_of_months: number | null
  monthly_rent: number
  status: LeaseStatusComputed
  tenant: {
    id: string
    first_name: string
    last_name: string | null
    profile_thumb: string | null
  }
  property?: {
    code: string
  }
  room?: {
    title: string
  }
}

export type PaymentHistory = {
  id: string
  payment_number: number
  payment_method: 'Cash' | 'Bank_Transfer' | 'FPX' | 'Online_Payment'
  amount_paid: number
  remaining_amount: number
  status: 'Success' | 'Failed' | 'Pending'
  paid_at: string // ISO timestamp
  receipt_image: string | null
}

export type Payment = {
  id: string
  type: string
  property: string
  room: string | 'Whole unit'
  due_date?: Date | null
  recurring_pattern: 'Recurring' | 'One-time'
  recurring_pattern_description: string
  amount: number
  status: 'Paid' | 'Paid Late' | 'Pending' | 'Overdue' | 'Cancelled'
  payment_percentage: number
  has_pending_payments: boolean
  tenant_name: string
  tenant_picture: string
  tenant_color: string
  latest_payment_timestamp: string // ISO timestamp
  payment_history?: PaymentHistory[] // Loaded on demand
}

export type Expense = {
  id: string
  type: string
  property: string
  due_date?: Date | null
  recurring_pattern: 'Recurring' | 'One-time'
  recurring_pattern_description: string
  amount: number
  status: 'Paid' | 'Paid Late' | 'Pending' | 'Overdue'
  payment_percentage: number
}

export type Tenant = {
  id: string
  tenant_name: string
  tenant_picture?: string
  identity_no: string
  phone_no: string
  email: string
  account_status: 'Activated' | 'Pending Activation'
  rental_status: 'Renting' | 'Booking' | 'Pending Refund' | 'Not Renting'
}

export type Owner = {
  id: string
  owner_name: string
  owner_picture?: string
  phone_no: string
  email: string
  property_count: number
}

export type Staff = {
  id: string
  staff_name: string
  staff_picture?: string
  phone_no: string
  email: string
  role: string
}

export type Ticket = {
  id: string // reference_id (e.g., TK-20250001)
  ticket_id: string // actual UUID for linking
  type: 'Maintenance' | 'Billing' | 'Complaint' | 'Others'
  title: string
  description: string
  property: string
  room: string | 'Whole unit'
  tenant_name: string
  tenant_picture: string
  issue_timestamp: string // ISO Timestamp
  staff_name?: string
  staff_picture?: string
  assignment_timestamp: string // ISO Timestamp
  status:
    | 'Resolved'
    | 'Open'
    | 'Closed'
    | 'In Progress'
    | 'Pending Tenant Confirmation'
}

export type Task = {
  id: string // reference_id (e.g., TSK-20250000001)
  task_id: string // actual UUID for linking
  type:
    | 'Inspection'
    | 'Preparation'
    | 'Refund Request'
    | 'Refund Finalizatoin'
    | 'Maintenance'
    | 'Renovation'
    | 'Cleaning'
    | 'Administrative'
    | 'Documentation'
    | 'Data Entry'
    | 'Accounting'
    | 'Legal'
    | 'IT Support'
    | 'Follow Up'
    | 'Complaint Handling'
    | 'Miscellaneous/Others'
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  title: string
  description: string
  property?: string
  room?: string
  due_date?: string // ISO Timestamp
  created_by_name: string
  created_by_picture?: string
  created_at: string // ISO Timestamp
  staff_name?: string
  staff_picture?: string
  assignment_timestamp?: string // ISO Timestamp
  status: 'Open' | 'In Progress' | 'Resolved'
  has_pending_assignment?: boolean // True if current user has pending assignment for this task
}

export type Notice = {
  id: string
  title: string
  description: string
  type: string
  created_at: string // ISO Timestamp
  effective_date: string // ISO Timestamp
  posted_by: string
  audience:
    | 'All Staff & Tenants'
    | 'Specific Recipients'
    | 'All Staff'
    | 'All Tenants'
    | 'Tenants With Overdue Payment'
}

export type ComboBoxitemsType = {
  id?: string
  avatar?: string | React.ReactNode
  label: string
  extraReference?: string
  subtitle?: string
  metadata?: any // Additional metadata for special use cases
}

export type Crumb = {
  label: string | indefined
  href?: string // last item should not have href
}

export type ChargeTypeType = {
  type: string
  taxable: boolean
  refundable: boolean
}

export type PaymentType = { type: string; isRecurrable?: boolean; isFixedByDefault?: boolean }

export type TabType = {
  label: string
  isSelected: boolean
}

export type OrganizationIdParams = { params: { organizationId: string } }

export type Notification = {
  id: string
  title: string
  message: string
  reference_id: string | null // UUID of the related entity
  reference_type: string | null // 'tickets', 'payments', 'leases', etc.
  is_read: boolean
  created_at: string // ISO Timestamp
  page: string | null // Page to navigate to
  performer_name: string | null
  performer_picture: string | null
}

