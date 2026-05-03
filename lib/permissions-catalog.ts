export type PermissionDef = {
  module: string
  action: string
  title: string
  description: string
}

export const PERMISSIONS: PermissionDef[] = [
  // dashboard
  { module: 'dashboard', action: 'access', title: 'Access Dashboard', description: 'View the main dashboard with KPIs and metrics' },

  // projects
  { module: 'projects', action: 'access', title: 'Access Projects', description: 'View the projects list and any project detail' },
  { module: 'projects', action: 'create', title: 'Create Project', description: 'Create a new project' },
  { module: 'projects', action: 'update', title: 'Update Project', description: 'Edit an existing project' },
  { module: 'projects', action: 'delete', title: 'Delete Project', description: 'Delete a project' },

  // properties
  { module: 'properties', action: 'access', title: 'Access Properties', description: 'View the Properties module, list, and any property detail' },
  { module: 'properties', action: 'create', title: 'Create Property', description: 'Create a new property' },
  { module: 'properties', action: 'update', title: 'Update Property', description: 'Edit an existing property' },
  { module: 'properties', action: 'delete', title: 'Delete Property', description: 'Delete a property' },
  { module: 'properties', action: 'assign_owner', title: 'Assign Owner', description: 'Assign an owner to a property' },

  // rooms
  { module: 'rooms', action: 'access', title: 'Access Rooms', description: 'View the Rooms module, list, and any room detail' },
  { module: 'rooms', action: 'create', title: 'Create Room', description: 'Create a new room' },
  { module: 'rooms', action: 'update', title: 'Update Room', description: 'Edit an existing room' },
  { module: 'rooms', action: 'delete', title: 'Delete Room', description: 'Delete a room' },

  // leases
  { module: 'leases', action: 'access', title: 'Access Leases', description: 'View the Leases module, list, and any lease detail' },
  { module: 'leases', action: 'create', title: 'Create Lease', description: 'Create a new lease' },
  { module: 'leases', action: 'update', title: 'Update Lease', description: 'Edit an existing lease' },
  { module: 'leases', action: 'delete', title: 'Delete Lease', description: 'Delete a lease' },
  { module: 'leases', action: 'end', title: 'End Lease', description: 'End or terminate a lease' },
  { module: 'leases', action: 'transfer', title: 'Transfer Lease', description: 'Transfer a lease to another property/room' },

  // bookings
  { module: 'bookings', action: 'access', title: 'Access Bookings', description: 'View the Bookings module, list, and any booking detail' },
  { module: 'bookings', action: 'create', title: 'Create Booking', description: 'Create a new booking' },
  { module: 'bookings', action: 'update', title: 'Update Booking', description: 'Edit an existing booking' },
  { module: 'bookings', action: 'delete', title: 'Delete Booking', description: 'Delete a booking' },
  { module: 'bookings', action: 'cancel', title: 'Cancel Booking', description: 'Cancel a booking' },

  // contracts
  { module: 'contracts', action: 'access', title: 'Access Contracts', description: 'View the Contracts module, list, and any contract detail' },
  { module: 'contracts', action: 'create', title: 'Create Contract', description: 'Create a new contract' },
  { module: 'contracts', action: 'update', title: 'Update Contract', description: 'Edit an existing contract' },
  { module: 'contracts', action: 'delete', title: 'Delete Contract', description: 'Delete a contract' },

  // payments
  { module: 'payments', action: 'access', title: 'Access Payments', description: 'View the Payments module, list, and any payment detail' },
  { module: 'payments', action: 'create', title: 'Create Payment', description: 'Create a new payment record' },
  { module: 'payments', action: 'update', title: 'Update Payment', description: 'Edit an existing payment' },
  { module: 'payments', action: 'delete', title: 'Delete Payment', description: 'Delete a payment' },
  { module: 'payments', action: 'refund', title: 'Refund Payment', description: 'Process a payment refund' },

  // expenses
  { module: 'expenses', action: 'access', title: 'Access Expenses', description: 'View the Expenses module, list, and any expense detail' },
  { module: 'expenses', action: 'create', title: 'Create Expense', description: 'Create a new expense' },
  { module: 'expenses', action: 'update', title: 'Update Expense', description: 'Edit an existing expense' },
  { module: 'expenses', action: 'delete', title: 'Delete Expense', description: 'Delete an expense' },
  { module: 'expenses', action: 'approve', title: 'Approve Expense', description: 'Approve pending expenses' },

  // tenants
  { module: 'tenants', action: 'access', title: 'Access Tenants', description: 'View the Tenants module, list, and any tenant detail' },
  { module: 'tenants', action: 'create', title: 'Create Tenant', description: 'Create a new tenant' },
  { module: 'tenants', action: 'update', title: 'Update Tenant', description: 'Edit an existing tenant' },
  { module: 'tenants', action: 'delete', title: 'Delete Tenant', description: 'Delete a tenant' },
  { module: 'tenants', action: 'view_own', title: 'View Own Tenant Info', description: 'View and edit own tenant information' },
  { module: 'tenants', action: 'view_lease', title: 'View Own Leases', description: 'View own lease information and payments' },
  { module: 'tenants', action: 'make_payment', title: 'Make Payment', description: 'Make payments for own leases' },
  { module: 'tenants', action: 'view_property', title: 'View Properties', description: 'View properties associated with own leases' },

  // owners
  { module: 'owners', action: 'access', title: 'Access Owners', description: 'View the Owners module, list, and any owner detail' },
  { module: 'owners', action: 'create', title: 'Create Owner', description: 'Create a new owner' },
  { module: 'owners', action: 'update', title: 'Update Owner', description: 'Edit an existing owner' },
  { module: 'owners', action: 'delete', title: 'Delete Owner', description: 'Delete an owner' },

  // agents
  { module: 'agents', action: 'access', title: 'Access Agents', description: 'View the Agents module, list, and any agent detail' },
  { module: 'agents', action: 'create', title: 'Create Agent', description: 'Create a new agent' },
  { module: 'agents', action: 'update', title: 'Update Agent', description: 'Edit an existing agent' },
  { module: 'agents', action: 'delete', title: 'Delete Agent', description: 'Delete an agent' },

  // vendors
  { module: 'vendors', action: 'access', title: 'Access Vendors', description: 'View the Vendors module, list, and any vendor detail' },
  { module: 'vendors', action: 'create', title: 'Create Vendor', description: 'Create a new vendor' },
  { module: 'vendors', action: 'update', title: 'Update Vendor', description: 'Edit an existing vendor' },
  { module: 'vendors', action: 'delete', title: 'Delete Vendor', description: 'Delete a vendor' },

  // staff
  { module: 'staff', action: 'access', title: 'Access Staff', description: 'View the Staff module, list, and any staff detail' },
  { module: 'staff', action: 'create', title: 'Create Staff', description: 'Create a new staff member' },
  { module: 'staff', action: 'update', title: 'Update Staff', description: 'Edit an existing staff member' },
  { module: 'staff', action: 'delete', title: 'Delete Staff', description: 'Delete a staff member' },

  // roles
  { module: 'roles', action: 'access', title: 'Access Roles', description: 'View the Roles module and manage role assignments' },
  { module: 'roles', action: 'create', title: 'Create Role', description: 'Create a new role' },
  { module: 'roles', action: 'update', title: 'Update Role', description: 'Edit an existing role' },
  { module: 'roles', action: 'delete', title: 'Delete Role', description: 'Delete a role' },

  // tasks
  { module: 'tasks', action: 'access', title: 'Access Tasks', description: 'View the Tasks module, list, and any task detail' },
  { module: 'tasks', action: 'create', title: 'Create Task', description: 'Create a new task' },
  { module: 'tasks', action: 'update', title: 'Update Task', description: 'Edit an existing task' },
  { module: 'tasks', action: 'delete', title: 'Delete Task', description: 'Delete a task' },
  { module: 'tasks', action: 'assign', title: 'Assign Task', description: 'Assign tasks to staff members' },
  { module: 'tasks', action: 'complete', title: 'Complete Task', description: 'Mark tasks as completed' },

  // tickets
  { module: 'tickets', action: 'access', title: 'Access Tickets', description: 'View the Tickets module, list, and any ticket detail' },
  { module: 'tickets', action: 'create', title: 'Create Ticket', description: 'Create a new ticket' },
  { module: 'tickets', action: 'update', title: 'Update Ticket', description: 'Edit an existing ticket' },
  { module: 'tickets', action: 'delete', title: 'Delete Ticket', description: 'Delete a ticket' },
  { module: 'tickets', action: 'assign', title: 'Assign Ticket', description: 'Assign tickets to staff members' },
  { module: 'tickets', action: 'resolve', title: 'Resolve Ticket', description: 'Resolve tickets' },

  // notices
  { module: 'notices', action: 'access', title: 'Access Notices', description: 'View the Notices module and manage notices' },
  { module: 'notices', action: 'create', title: 'Create Notice', description: 'Create a new notice' },
  { module: 'notices', action: 'update', title: 'Update Notice', description: 'Edit an existing notice' },
  { module: 'notices', action: 'delete', title: 'Delete Notice', description: 'Delete a notice' },
  { module: 'notices', action: 'publish', title: 'Publish Notice', description: 'Publish notices to tenants' },

  // notifications
  { module: 'notifications', action: 'access', title: 'Access Notifications', description: 'View the Notifications module and manage notifications' },
  { module: 'notifications', action: 'create', title: 'Create Notification', description: 'Create a new notification' },
  { module: 'notifications', action: 'update', title: 'Update Notification', description: 'Edit an existing notification' },
  { module: 'notifications', action: 'delete', title: 'Delete Notification', description: 'Delete a notification' },
  { module: 'notifications', action: 'send', title: 'Send Notification', description: 'Send notifications to users' },

  // reports
  { module: 'reports', action: 'access', title: 'Access Reports', description: 'View the Reports module and generate reports' },
  { module: 'reports', action: 'create', title: 'Create Report', description: 'Create a new report' },
  { module: 'reports', action: 'update', title: 'Update Report', description: 'Edit an existing report' },
  { module: 'reports', action: 'delete', title: 'Delete Report', description: 'Delete a report' },
  { module: 'reports', action: 'export', title: 'Export Report', description: 'Export reports in various formats' },

  // views
  { module: 'views', action: 'access', title: 'Access Views', description: 'View property views and viewing schedules' },
  { module: 'views', action: 'create', title: 'Create View', description: 'Schedule a property viewing' },
  { module: 'views', action: 'update', title: 'Update View', description: 'Edit an existing viewing' },
  { module: 'views', action: 'delete', title: 'Delete View', description: 'Delete a viewing' },

  // tenant_screening
  { module: 'tenant_screening', action: 'access', title: 'Access Tenant Screening', description: 'View the Tenant Screening module and manage screenings' },
  { module: 'tenant_screening', action: 'create', title: 'Create Screening', description: 'Create a new tenant screening' },
  { module: 'tenant_screening', action: 'update', title: 'Update Screening', description: 'Edit an existing screening' },
  { module: 'tenant_screening', action: 'delete', title: 'Delete Screening', description: 'Delete a screening' },
  { module: 'tenant_screening', action: 'approve', title: 'Approve Screening', description: 'Approve tenant screenings' },

  // recurring
  { module: 'recurring', action: 'access', title: 'Access Recurring', description: 'View recurring payments and expenses' },
  { module: 'recurring', action: 'create', title: 'Create Recurring', description: 'Create a new recurring payment/expense' },
  { module: 'recurring', action: 'update', title: 'Update Recurring', description: 'Edit an existing recurring payment/expense' },
  { module: 'recurring', action: 'delete', title: 'Delete Recurring', description: 'Delete a recurring payment/expense' },

  // financial
  { module: 'financial', action: 'access', title: 'Access Financial', description: 'View financial reports and analytics' },
  { module: 'financial', action: 'overview', title: 'Financial Overview', description: 'View financial overview and metrics' },
  { module: 'financial', action: 'reports', title: 'Financial Reports', description: 'Generate financial reports' },

  // calendar
  { module: 'calendar', action: 'create', title: 'Create Calendar Events', description: 'Create custom calendar events' },
]
