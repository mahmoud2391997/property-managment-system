import type {
  Property,
  Tenant,
  LeaseWithDetails,
  Payment,
  Ticket,
  Project,
  Room,
  Notice,
  Task
} from '@/types.d.ts'

export const dummyProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Sunset Residences',
    state: 'Kuala Lumpur',
    property_count: 12
  },
  {
    id: 'proj-2',
    name: 'Green Valley Apartments',
    state: 'Selangor',
    property_count: 8
  },
  {
    id: 'proj-3',
    name: 'City Center Condos',
    state: 'Kuala Lumpur',
    property_count: 15
  }
]

export const dummyProperties: Property[] = [
  {
    id: 'prop-1',
    code: 'A-101',
    address: '123 Jalan Sultan, Kuala Lumpur',
    project: 'Sunset Residences',
    type: 'Condominium',
    status: 'Occupied'
  },
  {
    id: 'prop-2',
    code: 'A-102',
    address: '125 Jalan Sultan, Kuala Lumpur',
    project: 'Sunset Residences',
    type: 'Condominium',
    status: 'Vacant'
  },
  {
    id: 'prop-3',
    code: 'B-201',
    address: '456 Jalan Ampang, Kuala Lumpur',
    project: 'Sunset Residences',
    type: 'Apartment',
    status: 'Occupied'
  },
  {
    id: 'prop-4',
    code: 'C-301',
    address: '789 Jalan Tun Razak, Selangor',
    project: 'Green Valley Apartments',
    type: 'Studio',
    status: 'Pending_Inspection'
  },
  {
    id: 'prop-5',
    code: 'D-401',
    address: '321 Jalan Bukit Bintang, Kuala Lumpur',
    project: 'City Center Condos',
    type: 'Penthouse',
    status: 'Under_Preparation'
  },
  {
    id: 'prop-6',
    code: 'E-501',
    address: '654 Jalan Imbi, Kuala Lumpur',
    project: 'City Center Condos',
    type: 'Condominium',
    status: 'Vacant'
  }
]

export const dummyRooms: Room[] = [
  {
    id: 'room-1',
    title: 'Master Bedroom',
    property: 'A-101',
    status: 'Occupied'
  },
  {
    id: 'room-2',
    title: 'Bedroom 2',
    property: 'A-101',
    status: 'Vacant'
  },
  {
    id: 'room-3',
    title: 'Master Bedroom',
    property: 'B-201',
    status: 'Occupied'
  },
  {
    id: 'room-4',
    title: 'Studio Unit',
    property: 'C-301',
    status: 'Vacant'
  }
]

export const dummyTenants: Tenant[] = [
  {
    id: 'tenant-1',
    tenant_name: 'Ahmad bin Ali',
    tenant_picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad',
    identity_no: '800101-10-5555',
    phone_no: '+6012-345-6789',
    email: 'ahmad.ali@email.com',
    account_status: 'Activated',
    rental_status: 'Renting'
  },
  {
    id: 'tenant-2',
    tenant_name: 'Siti Aminah binti Omar',
    tenant_picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Siti',
    identity_no: '850505-08-4444',
    phone_no: '+6013-456-7890',
    email: 'siti.aminah@email.com',
    account_status: 'Activated',
    rental_status: 'Renting'
  },
  {
    id: 'tenant-3',
    tenant_name: 'John Smith',
    tenant_picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    identity_no: '900202-12-3333',
    phone_no: '+6014-567-8901',
    email: 'john.smith@email.com',
    account_status: 'Activated',
    rental_status: 'Booking'
  },
  {
    id: 'tenant-4',
    tenant_name: 'Maria Garcia',
    tenant_picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
    identity_no: '920303-14-2222',
    phone_no: '+6017-678-9012',
    email: 'maria.garcia@email.com',
    account_status: 'Pending Activation',
    rental_status: 'Not Renting'
  },
  {
    id: 'tenant-5',
    tenant_name: 'Raj Kumar',
    tenant_picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Raj',
    identity_no: '880404-16-1111',
    phone_no: '+6019-789-0123',
    email: 'raj.kumar@email.com',
    account_status: 'Activated',
    rental_status: 'Renting'
  }
]

export const dummyLeases: LeaseWithDetails[] = [
  {
    id: 'lease-1',
    reference_id: 'LS-2025-001',
    start_date: '2024-01-15',
    number_of_months: 12,
    monthly_rent: 2500,
    payment_day: 5,
    property_id: 'prop-1',
    room_id: 'room-1',
    status: 'Current',
    tenant: {
      id: 'tenant-1',
      first_name: 'Ahmad',
      last_name: 'bin Ali',
      profile_thumb: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad'
    },
    property: {
      code: 'A-101'
    },
    room: {
      title: 'Master Bedroom'
    }
  },
  {
    id: 'lease-2',
    reference_id: 'LS-2025-002',
    start_date: '2024-03-01',
    number_of_months: 6,
    monthly_rent: 1800,
    payment_day: 1,
    property_id: 'prop-3',
    room_id: 'room-3',
    status: 'Current',
    tenant: {
      id: 'tenant-2',
      first_name: 'Siti Aminah',
      last_name: 'binti Omar',
      profile_thumb: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Siti'
    },
    property: {
      code: 'B-201'
    },
    room: {
      title: 'Master Bedroom'
    }
  },
  {
    id: 'lease-3',
    reference_id: 'LS-2025-003',
    start_date: '2024-06-01',
    number_of_months: 12,
    monthly_rent: 3200,
    payment_day: 15,
    property_id: 'prop-5',
    room_id: null,
    status: 'Scheduled',
    tenant: {
      id: 'tenant-3',
      first_name: 'John',
      last_name: 'Smith',
      profile_thumb: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
    },
    property: {
      code: 'D-401'
    }
  },
  {
    id: 'lease-4',
    reference_id: 'LS-2024-005',
    start_date: '2023-06-01',
    number_of_months: 12,
    monthly_rent: 2000,
    payment_day: 10,
    property_id: 'prop-1',
    room_id: 'room-2',
    status: 'Expired',
    tenant: {
      id: 'tenant-5',
      first_name: 'Raj',
      last_name: 'Kumar',
      profile_thumb: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Raj'
    },
    property: {
      code: 'A-101'
    },
    room: {
      title: 'Bedroom 2'
    }
  }
]

export const dummyPayments: Payment[] = [
  {
    id: 'pay-1',
    type: 'Rent',
    property: 'A-101',
    room: 'Master Bedroom',
    due_date: new Date('2025-01-05'),
    recurring_pattern: 'Recurring',
    recurring_pattern_description: 'Monthly',
    amount: 2500,
    status: 'Paid',
    payment_percentage: 100,
    has_pending_payments: false,
    tenant_name: 'Ahmad bin Ali',
    tenant_picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad',
    tenant_color: '#3B82F6',
    latest_payment_timestamp: '2025-01-05T10:30:00Z'
  },
  {
    id: 'pay-2',
    type: 'Rent',
    property: 'B-201',
    room: 'Master Bedroom',
    due_date: new Date('2025-01-01'),
    recurring_pattern: 'Recurring',
    recurring_pattern_description: 'Monthly',
    amount: 1800,
    status: 'Paid Late',
    payment_percentage: 100,
    has_pending_payments: false,
    tenant_name: 'Siti Aminah binti Omar',
    tenant_picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Siti',
    tenant_color: '#10B981',
    latest_payment_timestamp: '2025-01-03T14:20:00Z'
  },
  {
    id: 'pay-3',
    type: 'Rent',
    property: 'A-101',
    room: 'Bedroom 2',
    due_date: new Date('2025-01-10'),
    recurring_pattern: 'Recurring',
    recurring_pattern_description: 'Monthly',
    amount: 2000,
    status: 'Pending',
    payment_percentage: 0,
    has_pending_payments: true,
    tenant_name: 'Raj Kumar',
    tenant_picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Raj',
    tenant_color: '#F59E0B',
    latest_payment_timestamp: '2024-12-10T09:15:00Z'
  },
  {
    id: 'pay-4',
    type: 'Utilities',
    property: 'A-101',
    room: 'Whole unit',
    due_date: new Date('2025-01-15'),
    recurring_pattern: 'Recurring',
    recurring_pattern_description: 'Monthly',
    amount: 350,
    status: 'Overdue',
    payment_percentage: 0,
    has_pending_payments: true,
    tenant_name: 'Ahmad bin Ali',
    tenant_picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad',
    tenant_color: '#3B82F6',
    latest_payment_timestamp: '2024-12-15T11:00:00Z'
  },
  {
    id: 'pay-5',
    type: 'Deposit',
    property: 'D-401',
    room: 'Whole unit',
    due_date: new Date('2024-12-20'),
    recurring_pattern: 'One-time',
    recurring_pattern_description: 'Security Deposit',
    amount: 6400,
    status: 'Paid',
    payment_percentage: 100,
    has_pending_payments: false,
    tenant_name: 'John Smith',
    tenant_picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    tenant_color: '#8B5CF6',
    latest_payment_timestamp: '2024-12-20T16:45:00Z'
  },
  {
    id: 'pay-6',
    type: 'Rent',
    property: 'A-101',
    room: 'Master Bedroom',
    due_date: new Date('2025-02-05'),
    recurring_pattern: 'Recurring',
    recurring_pattern_description: 'Monthly',
    amount: 2500,
    status: 'Pending',
    payment_percentage: 0,
    has_pending_payments: true,
    tenant_name: 'Ahmad bin Ali',
    tenant_picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad',
    tenant_color: '#3B82F6',
    latest_payment_timestamp: '2025-01-05T10:30:00Z'
  }
]

export const dummyTickets: Ticket[] = [
  {
    id: 'TK-2025-001',
    ticket_id: 'ticket-1',
    type: 'Maintenance',
    title: 'Air conditioner not cooling',
    description: 'The air conditioner in the master bedroom is not cooling properly. It makes unusual noises.',
    property: 'A-101',
    room: 'Master Bedroom',
    tenant_name: 'Ahmad bin Ali',
    tenant_picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad',
    issue_timestamp: '2025-01-10T09:30:00Z',
    staff_name: 'Mike Johnson',
    staff_picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
    assigner_name: 'Admin',
    assignment_timestamp: '2025-01-10T10:00:00Z',
    status: 'In Progress'
  },
  {
    id: 'TK-2025-002',
    ticket_id: 'ticket-2',
    type: 'Maintenance',
    title: 'Leaking faucet in bathroom',
    description: 'The bathroom faucet is leaking continuously. Water is dripping even when turned off.',
    property: 'B-201',
    room: 'Whole unit',
    tenant_name: 'Siti Aminah binti Omar',
    tenant_picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Siti',
    issue_timestamp: '2025-01-12T14:15:00Z',
    staff_name: 'Sarah Lee',
    staff_picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    assigner_name: 'Admin',
    assignment_timestamp: '2025-01-12T15:00:00Z',
    status: 'Open'
  },
  {
    id: 'TK-2025-003',
    ticket_id: 'ticket-3',
    type: 'Maintenance',
    title: 'Light fixture not working',
    description: 'The ceiling light in the living room is not working. Changed bulb but still no power.',
    property: 'C-301',
    room: 'Whole unit',
    tenant_name: 'John Smith',
    tenant_picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    issue_timestamp: '2025-01-15T11:00:00Z',
    status: 'Open',
    staff_name: undefined,
    staff_picture: undefined,
    assigner_name: undefined,
    assignment_timestamp: '2025-01-15T11:30:00Z'
  },
  {
    id: 'TK-2025-004',
    ticket_id: 'ticket-4',
    type: 'Maintenance',
    title: 'Door lock jammed',
    description: 'The main door lock is difficult to turn. Sometimes gets stuck.',
    property: 'A-101',
    room: 'Whole unit',
    tenant_name: 'Ahmad bin Ali',
    tenant_picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad',
    issue_timestamp: '2025-01-08T16:30:00Z',
    staff_name: 'Mike Johnson',
    staff_picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
    assigner_name: 'Admin',
    assignment_timestamp: '2025-01-08T17:00:00Z',
    status: 'Resolved'
  },
  {
    id: 'TK-2025-005',
    ticket_id: 'ticket-5',
    type: 'Aircon Top-Up',
    title: 'Request for aircon credit top-up',
    description: 'Need to add RM50 to aircon credit for unit B-201.',
    property: 'B-201',
    room: 'Whole unit',
    tenant_name: 'Siti Aminah binti Omar',
    tenant_picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Siti',
    issue_timestamp: '2025-01-14T08:00:00Z',
    status: 'Open',
    staff_name: undefined,
    staff_picture: undefined,
    assigner_name: undefined,
    assignment_timestamp: '2025-01-14T08:30:00Z'
  }
]

export const dummyNotices: Notice[] = [
  {
    id: 'notice-1',
    title: 'Scheduled Water Maintenance',
    description: 'There will be a scheduled water maintenance on January 20, 2025 from 9 AM to 5 PM. Please store sufficient water.',
    type: 'Maintenance',
    created_at: '2025-01-10T00:00:00Z',
    effective_date: '2025-01-20T00:00:00Z',
    posted_by: 'Building Management',
    audience: 'All Staff & Tenants'
  },
  {
    id: 'notice-2',
    title: 'Rent Payment Reminder',
    description: 'Please ensure your rent payments are made by the 5th of each month to avoid late fees.',
    type: 'Payment',
    created_at: '2025-01-01T00:00:00Z',
    effective_date: '2025-01-01T00:00:00Z',
    posted_by: 'Finance Department',
    audience: 'All Tenants'
  },
  {
    id: 'notice-3',
    title: 'New Gym Equipment',
    description: 'We have added new equipment to the gym. Come check it out!',
    type: 'Announcement',
    created_at: '2025-01-05T00:00:00Z',
    effective_date: '2025-01-05T00:00:00Z',
    posted_by: 'Building Management',
    audience: 'All Staff & Tenants'
  }
]

export const dummyTasks: Task[] = [
  {
    id: 'TSK-2025-00001',
    task_id: 'task-1',
    type: 'Inspection',
    priority: 'High',
    title: 'Inspect unit C-301 before tenant move-in',
    description: 'Complete inspection of unit C-301 to ensure it is ready for new tenant John Smith.',
    property: 'C-301',
    room: 'Whole unit',
    due_date: '2025-01-20T00:00:00Z',
    created_by_name: 'Admin',
    created_by_picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    created_at: '2025-01-15T09:00:00Z',
    staff_name: 'Sarah Lee',
    staff_picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    assigner_name: 'Admin',
    assigner_picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    assignment_timestamp: '2025-01-15T10:00:00Z',
    status: 'In Progress'
  },
  {
    id: 'TSK-2025-00002',
    task_id: 'task-2',
    type: 'Cleaning',
    priority: 'Medium',
    title: 'Clean unit A-102 after tenant move-out',
    description: 'Deep cleaning of unit A-102 including carpets, windows, and kitchen.',
    property: 'A-102',
    room: 'Whole unit',
    due_date: '2025-01-18T00:00:00Z',
    created_by_name: 'Admin',
    created_by_picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    created_at: '2025-01-12T14:00:00Z',
    staff_name: 'Mike Johnson',
    staff_picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
    assigner_name: 'Admin',
    assigner_picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    assignment_timestamp: '2025-01-12T15:00:00Z',
    status: 'Open'
  },
  {
    id: 'TSK-2025-00003',
    task_id: 'task-3',
    type: 'Maintenance',
    priority: 'Urgent',
    title: 'Fix air conditioner in A-101',
    description: 'Repair or replace the malfunctioning air conditioner in master bedroom of unit A-101.',
    property: 'A-101',
    room: 'Master Bedroom',
    due_date: '2025-01-16T00:00:00Z',
    created_by_name: 'Admin',
    created_by_picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    created_at: '2025-01-10T09:30:00Z',
    staff_name: 'Mike Johnson',
    staff_picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
    assigner_name: 'Admin',
    assigner_picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    assignment_timestamp: '2025-01-10T10:00:00Z',
    status: 'In Progress'
  }
]
