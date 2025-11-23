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
  status: 'Occupied' | 'Under Preparation' | 'Pending Inspection' | 'Vacant'
}

export type Room = {
  id: string
  title: string
  property: string
  status:
    | 'Occupied'
    | 'Under Preparation'
    | 'Pending Inspection'
    | 'Vacant'
    | 'Property Rented'
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
  status: 'Paid' | 'Paid Late' | 'Pending' | 'Overdue'
  payment_percentage: number
  tenant_name: string
  tenant_picture: string
  tenant_color: string
  latest_payment_timestamp: string // ISO timestamp
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
  id: string
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
  id: string
  type: 'Maintenance' | 'Cleaning' | 'Property Turnover' | 'Others'
  title: string
  description: string
  property: string
  room: string | 'Whole unit'
  issued_by: string
  issuer_picture: string
  issue_timestamp: string // ISO Timestamp
  assignee_name?: string
  assignee_picture?: string
  assignment_timestamp: string // ISO Timestamp
  status: 'Resolved' | 'Open' | 'Closed' | 'In Progress' | 'Pending Review'
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
  subtitle?: string
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

export type PaymentType = { type: string; isRecurrable?: boolean }

export type TabType = {
  label: string
  isSelected: boolean
}

type OrganizationIdParams = { params: { organizationId: string } }
