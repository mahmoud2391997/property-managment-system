import type {
  Expense,
  ChargeTypeType,
  Notice,
  Owner,
  Payment,
  Project,
  Property,
  Room,
  Staff,
  Task,
  Tenant,
  Ticket,
  PaymentType
} from '@/types'

export const projectsData: Project[] = [
  {
    id: '1',
    name: 'Heights Residence Condominium',
    state: 'Melaka',
    property_count: 4
  },
  {
    id: '2',
    name: 'Serene Park Villas',
    state: 'Selangor',
    property_count: 12
  },
  {
    id: '3',
    name: 'Bayview Residences',
    state: 'Penang',
    property_count: 8
  },
  {
    id: '4',
    name: 'Eco Horizon Apartments',
    state: 'Kedah',
    property_count: 5
  },
  {
    id: '5',
    name: 'Sunrise Heights',
    state: 'Johor',
    property_count: 10
  },
  {
    id: '6',
    name: 'Palm Grove Residences',
    state: 'Negeri Sembilan',
    property_count: 6
  },
  {
    id: '7',
    name: 'Lakefront City Towers',
    state: 'Selangor',
    property_count: 9
  },
  {
    id: '8',
    name: 'Horizon Bay Condos',
    state: 'Penang',
    property_count: 11
  },
  {
    id: '9',
    name: 'Vista Verde Apartments',
    state: 'Perak',
    property_count: 7
  },
  {
    id: '10',
    name: 'The Garden Suites',
    state: 'Kuala Lumpur',
    property_count: 14
  },
  {
    id: '11',
    name: 'Oceanview Residences',
    state: 'Sabah',
    property_count: 5
  },
  {
    id: '12',
    name: 'Greenwood Terrace',
    state: 'Pahang',
    property_count: 6
  },
  {
    id: '13',
    name: 'City Central Loft',
    state: 'Kuala Lumpur',
    property_count: 13
  },
  {
    id: '14',
    name: 'Riverside Apartments',
    state: 'Sarawak',
    property_count: 7
  },
  {
    id: '15',
    name: 'The Maple Residences',
    state: 'Selangor',
    property_count: 15
  },
  {
    id: '16',
    name: 'Amber Hill Villas',
    state: 'Perlis',
    property_count: 3
  },
  {
    id: '17',
    name: 'Palm Springs Condominiums',
    state: 'Johor',
    property_count: 9
  },
  {
    id: '18',
    name: 'Marina Bay Suites',
    state: 'Penang',
    property_count: 10
  },
  {
    id: '19',
    name: 'Aspen Residences',
    state: 'Melaka',
    property_count: 6
  },
  {
    id: '20',
    name: 'Emerald Court Apartments',
    state: 'Negeri Sembilan',
    property_count: 8
  },
  {
    id: '21',
    name: 'Golden Palm Residences',
    state: 'Selangor',
    property_count: 12
  }
]

export const propertiesData: Property[] = [
  {
    id: '1',
    code: 'PR001',
    address: '12 Jalan Merpati, Melaka',
    project: 'Heights Residence Condominium',
    type: 'Condo',
    status: 'Occupied'
  },
  {
    id: '2',
    code: 'PR002',
    address: '24 Jalan Kenari, Selangor',
    project: 'Serene Park Villas',
    type: 'Villa',
    status: 'Vacant'
  },
  {
    id: '3',
    code: 'PR003',
    address: '36 Jalan Mawar, Penang',
    project: 'Bayview Residences',
    type: 'Apartment',
    status: 'Under_Preparation'
  },
  {
    id: '4',
    code: 'PR004',
    address: '48 Jalan Dahlia, Kedah',
    project: 'Eco Horizon Apartments',
    type: 'Apartment',
    status: 'Pending_Inspection'
  },

  {
    id: '6',
    code: 'PR006',
    address: '72 Jalan Cempaka, Negeri Sembilan',
    project: 'Palm Grove Residences',
    type: 'Condo',
    status: 'Occupied'
  },
  {
    id: '7',
    code: 'PR007',
    address: '84 Jalan Kasturi, Selangor',
    project: 'Lakefront City Towers',
    type: 'Apartment',
    status: 'Vacant'
  },
  {
    id: '8',
    code: 'PR008',
    address: '96 Jalan Teratai, Penang',
    project: 'Horizon Bay Condos',
    type: 'Condo',
    status: 'Under_Preparation'
  },
  {
    id: '9',
    code: 'PR009',
    address: '108 Jalan Bunga Raya, Perak',
    project: 'Vista Verde Apartments',
    type: 'Apartment',
    status: 'Occupied'
  },
  {
    id: '10',
    code: 'PR010',
    address: '120 Jalan Melati, Kuala Lumpur',
    project: 'The Garden Suites',
    type: 'Condo',
    status: 'Pending_Inspection'
  },
  {
    id: '11',
    code: 'PR011',
    address: '132 Jalan Angsana, Sabah',
    project: 'Oceanview Residences',
    type: 'Condo',
    status: 'Vacant'
  },

  {
    id: '13',
    code: 'PR013',
    address: '156 Jalan Merak, Kuala Lumpur',
    project: 'City Central Loft',
    type: 'Apartment',
    status: 'Occupied'
  },
  {
    id: '14',
    code: 'PR014',
    address: '168 Jalan Rumbia, Sarawak',
    project: 'Riverside Apartments',
    type: 'Apartment',
    status: 'Under_Preparation'
  },
  {
    id: '15',
    code: 'PR015',
    address: '180 Jalan Jati, Selangor',
    project: 'The Maple Residences',
    type: 'Condo',
    status: 'Vacant'
  },
  {
    id: '16',
    code: 'PR016',
    address: '192 Jalan Pinang, Perlis',
    project: 'Amber Hill Villas',
    type: 'Villa',
    status: 'Occupied'
  },
  {
    id: '17',
    code: 'PR017',
    address: '204 Jalan Meranti, Johor',
    project: 'Palm Springs Condominiums',
    type: 'Condo',
    status: 'Pending_Inspection'
  },

  {
    id: '19',
    code: 'PR019',
    address: '228 Jalan Orkid, Melaka',
    project: 'Aspen Residences',
    type: 'Apartment',
    status: 'Occupied'
  },
  {
    id: '20',
    code: 'PR020',
    address: '240 Jalan Bakawali, Negeri Sembilan',
    project: 'Emerald Court Apartments',
    type: 'Condo',
    status: 'Vacant'
  }
]

export const roomsData: Room[] = [
  {
    id: '1',
    title: 'Room 101',
    property: 'Sunrise Apartments',
    status: 'Occupied'
  },
  {
    id: '2',
    title: 'Room 102',
    property: 'Sunrise Apartments',
    status: 'Vacant'
  },
  {
    id: '3',
    title: 'Room 103',
    property: 'Sunrise Apartments',
    status: 'Under_Preparation'
  },
  {
    id: '4',
    title: 'Room 104',
    property: 'Sunrise Apartments',
    status: 'Pending_Inspection'
  },
  {
    id: '5',
    title: 'Room 105',
    property: 'Sunrise Apartments',
    status: 'Property_Rented'
  },
  {
    id: '6',
    title: 'Room 201',
    property: 'Maple Residency',
    status: 'Occupied'
  },
  { id: '7', title: 'Room 202', property: 'Maple Residency', status: 'Vacant' },
  {
    id: '8',
    title: 'Room 203',
    property: 'Maple Residency',
    status: 'Under_Preparation'
  },
  {
    id: '9',
    title: 'Room 204',
    property: 'Maple Residency',
    status: 'Pending_Inspection'
  },
  {
    id: '10',
    title: 'Room 205',
    property: 'Maple Residency',
    status: 'Property_Rented'
  },
  { id: '11', title: 'Room 301', property: 'Ocean View', status: 'Occupied' },
  { id: '12', title: 'Room 302', property: 'Ocean View', status: 'Vacant' },
  {
    id: '13',
    title: 'Room 303',
    property: 'Ocean View',
    status: 'Under_Preparation'
  },
  {
    id: '14',
    title: 'Room 304',
    property: 'Ocean View',
    status: 'Pending_Inspection'
  },
  {
    id: '15',
    title: 'Room 305',
    property: 'Ocean View',
    status: 'Property_Rented'
  },
  {
    id: '16',
    title: 'Room 401',
    property: 'Skyline Towers',
    status: 'Occupied'
  },
  { id: '17', title: 'Room 402', property: 'Skyline Towers', status: 'Vacant' },
  {
    id: '18',
    title: 'Room 403',
    property: 'Skyline Towers',
    status: 'Under_Preparation'
  },
  {
    id: '19',
    title: 'Room 404',
    property: 'Skyline Towers',
    status: 'Pending_Inspection'
  },
  {
    id: '20',
    title: 'Room 405',
    property: 'Skyline Towers',
    status: 'Property_Rented'
  }
]

export const paymentsData: Payment[] = [
  {
    id: '1',
    type: 'Rent',
    property: 'Sunrise Apartments',
    room: 'Room 101',
    due_date: new Date('2025-11-15'),
    recurring_pattern: 'Recurring',
    recurring_pattern_description: 'Monthly on the 15th',
    amount: 1200,
    status: 'Paid',
    payment_percentage: 100,
    tenant_name: 'John Doe',
    tenant_picture: '/avatars/john_doe.png',
    tenant_color: '#3B82F6',
    latest_payment_timestamp: '2025-11-10T14:30:00Z',
    has_pending_payments: false
  },
  {
    id: '2',
    type: 'Maintenance Fee',
    property: 'Sunrise Apartments',
    room: 'Room 102',
    recurring_pattern: 'One-time',
    recurring_pattern_description: 'Annual maintenance fee',
    amount: 150,
    status: 'Pending',
    payment_percentage: 25,
    tenant_name: 'Jane Smith',
    tenant_picture: '/avatars/jane_smith.png',
    tenant_color: '#3B82F6',
    latest_payment_timestamp: '2025-11-01T09:00:00Z',
    has_pending_payments: true
  },
  {
    id: '3',
    type: 'Rent',
    property: 'Maple Residency',
    room: 'Whole unit',
    due_date: new Date('2025-11-01'),
    recurring_pattern: 'Recurring',
    recurring_pattern_description: 'Monthly on the 1st',
    amount: 2000,
    status: 'Paid Late',
    payment_percentage: 100,
    tenant_name: 'Alice Johnson',
    tenant_picture: '/avatars/alice_johnson.png',
    tenant_color: '#FACC15',
    latest_payment_timestamp: '2025-11-03T11:45:00Z',
    has_pending_payments: false
  },
  {
    id: '4',
    type: 'Utilities',
    property: 'Ocean View',
    room: 'Room 304',
    due_date: new Date('2025-11-12'),
    recurring_pattern: 'One-time',
    recurring_pattern_description: 'Monthly utilities bill',
    amount: 180,
    status: 'Overdue',
    payment_percentage: 20,
    tenant_name: 'Bob Lee',
    tenant_picture: '/avatars/bob_lee.png',
    tenant_color: '#A855F7',
    latest_payment_timestamp: '2025-10-15T08:20:00Z',
    has_pending_payments: false
  },
  {
    id: '5',
    type: 'Rent',
    property: 'Skyline Towers',
    room: 'Room 402',
    due_date: new Date('2025-11-10'),
    recurring_pattern: 'Recurring',
    recurring_pattern_description: 'Monthly on the 10th',
    amount: 1500,
    status: 'Pending',
    payment_percentage: 50,
    tenant_name: 'Charlie Brown',
    tenant_picture: '/avatars/charlie_brown.png',
    tenant_color: '#EC4899',
    latest_payment_timestamp: '2025-11-05T10:15:00Z',
    has_pending_payments: true
  }
]

export const expensesData: Expense[] = [
  {
    id: '1',
    type: 'Rent',
    property: 'Sunrise Apartments',
    due_date: new Date('2025-11-15'),
    recurring_pattern: 'Recurring',
    recurring_pattern_description: 'Monthly on the 15th',
    amount: 1200,
    status: 'Paid',
    payment_percentage: 25
  },
  {
    id: '2',
    type: 'Maintenance Fee',
    property: 'Sunrise Apartments',
    recurring_pattern: 'One-time',
    recurring_pattern_description: 'Annual maintenance fee',
    amount: 150,
    status: 'Pending',
    payment_percentage: 25
  },
  {
    id: '3',
    type: 'Rent',
    property: 'Maple Residency',
    due_date: new Date('2025-11-01'),
    recurring_pattern: 'Recurring',
    recurring_pattern_description: 'Monthly on the 1st',
    amount: 2000,
    status: 'Paid Late',
    payment_percentage: 25
  },
  {
    id: '4',
    type: 'Utilities',
    property: 'Ocean View',
    due_date: new Date('2025-11-12'),
    recurring_pattern: 'One-time',
    recurring_pattern_description: 'Monthly utilities bill',
    amount: 180,
    status: 'Overdue',
    payment_percentage: 25
  },
  {
    id: '5',
    type: 'Rent',
    property: 'Skyline Towers',
    due_date: new Date('2025-11-10'),
    recurring_pattern: 'Recurring',
    recurring_pattern_description: 'Monthly on the 10th',
    amount: 1500,
    status: 'Pending',
    payment_percentage: 25
  }
]

export const tenantsData: Tenant[] = [
  {
    id: 't1',
    tenant_name: 'John Doe',
    identity_no: 'A12345678',
    phone_no: '+1234567890',
    email: 'john.doe@example.com',
    account_status: 'Activated',
    rental_status: 'Renting'
  },
  {
    id: 't2',
    tenant_name: 'Jane Smith',
    identity_no: 'B98765432',
    phone_no: '+1987654321',
    email: 'jane.smith@example.com',
    account_status: 'Pending Activation',
    rental_status: 'Booking'
  },
  {
    id: 't3',
    tenant_name: 'Michael Johnson',
    identity_no: 'C56781234',
    phone_no: '+1123456789',
    email: 'michael.johnson@example.com',
    account_status: 'Activated',
    rental_status: 'Pending Refund'
  },
  {
    id: 't4',
    tenant_name: 'Emily Davis',
    identity_no: 'D87654321',
    phone_no: '+1098765432',
    email: 'emily.davis@example.com',
    account_status: 'Activated',
    rental_status: 'Not Renting'
  },
  {
    id: 't5',
    tenant_name: 'William Brown',
    identity_no: 'E23456789',
    phone_no: '+1012345678',
    email: 'william.brown@example.com',
    account_status: 'Pending Activation',
    rental_status: 'Renting'
  },
  {
    id: 't6',
    tenant_name: 'Olivia Wilson',
    identity_no: 'F34567890',
    phone_no: '+1098765432',
    email: 'olivia.wilson@example.com',
    account_status: 'Activated',
    rental_status: 'Booking'
  },
  {
    id: 't7',
    tenant_name: 'James Taylor',
    identity_no: 'G45678901',
    phone_no: '+1230984567',
    email: 'james.taylor@example.com',
    account_status: 'Activated',
    rental_status: 'Pending Refund'
  },
  {
    id: 't8',
    tenant_name: 'Sophia Martinez',
    identity_no: 'H56789012',
    phone_no: '+1987345612',
    email: 'sophia.martinez@example.com',
    account_status: 'Pending Activation',
    rental_status: 'Not Renting'
  },
  {
    id: 't9',
    tenant_name: 'Benjamin Anderson',
    identity_no: 'I67890123',
    phone_no: '+1203948576',
    email: 'benjamin.anderson@example.com',
    account_status: 'Activated',
    rental_status: 'Renting'
  },
  {
    id: 't10',
    tenant_name: 'Mia Thomas',
    identity_no: 'J78901234',
    phone_no: '+1092837465',
    email: 'mia.thomas@example.com',
    account_status: 'Pending Activation',
    rental_status: 'Booking'
  }
]

export const ownersData: Owner[] = [
  {
    id: 'owner-1',
    owner_name: 'Alice Johnson',
    phone_no: '+1 555-123-4567',
    email: 'alice.johnson@example.com',
    property_count: 5
  },
  {
    id: 'owner-2',
    owner_name: 'Bob Smith',
    phone_no: '+1 555-987-6543',
    email: 'bob.smith@example.com',
    property_count: 2
  },
  {
    id: 'owner-3',
    owner_name: 'Carol Lee',
    phone_no: '+1 555-234-5678',
    email: 'carol.lee@example.com',
    property_count: 3
  },
  {
    id: 'owner-4',
    owner_name: 'David Martinez',
    phone_no: '+1 555-345-6789',
    email: 'david.martinez@example.com',
    property_count: 4
  },
  {
    id: 'owner-5',
    owner_name: 'Eva Brown',
    phone_no: '+1 555-456-7890',
    email: 'eva.brown@example.com',
    property_count: 1
  },
  {
    id: 'owner-6',
    owner_name: 'Frank Wilson',
    phone_no: '+1 555-567-8901',
    email: 'frank.wilson@example.com',
    property_count: 6
  }
]

export const staffData: Staff[] = [
  {
    id: 'staff-1',
    staff_name: 'John Doe',
    phone_no: '+1 555-111-2222',
    email: 'john.doe@example.com',
    role: 'Property Manager'
  },
  {
    id: 'staff-2',
    staff_name: 'Jane Smith',
    phone_no: '+1 555-333-4444',
    email: 'jane.smith@example.com',
    role: 'Leasing Agent'
  },
  {
    id: 'staff-3',
    staff_name: 'Michael Brown',
    phone_no: '+1 555-555-6666',
    email: 'michael.brown@example.com',
    role: 'Maintenance Supervisor'
  },
  {
    id: 'staff-4',
    staff_name: 'Emily Davis',
    phone_no: '+1 555-777-8888',
    email: 'emily.davis@example.com',
    role: 'Accountant'
  },
  {
    id: 'staff-5',
    staff_name: 'William Johnson',
    phone_no: '+1 555-999-0000',
    email: 'william.johnson@example.com',
    role: 'Front Desk'
  },
  {
    id: 'staff-6',
    staff_name: 'Olivia Martinez',
    phone_no: '+1 555-123-4567',
    email: 'olivia.martinez@example.com',
    role: 'Leasing Agent'
  },
  {
    id: 'staff-7',
    staff_name: 'James Wilson',
    phone_no: '+1 555-234-5678',
    email: 'james.wilson@example.com',
    role: 'Maintenance Technician'
  },
  {
    id: 'staff-8',
    staff_name: 'Sophia Taylor',
    phone_no: '+1 555-345-6789',
    email: 'sophia.taylor@example.com',
    role: 'Property Manager'
  }
]

export const ticketsData: Ticket[] = [
  {
    id: 'TK-20250001',
    ticket_id: 't1-uuid-0001-0001-000000000001',
    type: 'Maintenance',
    title: 'Leaky faucet in kitchen',
    description: 'The kitchen faucet is leaking constantly.',
    property: 'Maple Residency',
    room: '101',
    tenant_name: 'Alice Johnson',
    tenant_picture: '/avatar/alice.png',
    issue_timestamp: '2025-11-10T08:15:00.000Z',
    staff_name: 'Bob Smith',
    staff_picture: '/avatar/bob.png',
    assignment_timestamp: '2025-11-10T09:00:00.000Z',
    status: 'In Progress'
  },
  {
    id: 'TK-20250002',
    ticket_id: 't2-uuid-0002-0002-000000000002',
    type: 'Maintenance',
    title: 'Air conditioner not cooling',
    description: 'AC in living room is not producing cold air.',
    property: 'Oakwood Apartments',
    room: 'Whole unit',
    tenant_name: 'John Doe',
    tenant_picture: '/avatar/john.png',
    issue_timestamp: '2025-11-09T14:30:00.000Z',
    staff_name: 'Clara Lee',
    staff_picture: '/avatar/clara.png',
    assignment_timestamp: '2025-11-09T15:00:00.000Z',
    status: 'Open'
  },
  {
    id: 'TK-20250003',
    ticket_id: 't3-uuid-0003-0003-000000000003',
    type: 'Maintenance',
    title: 'Broken window lock',
    description: 'Bedroom window lock is broken, cannot secure window.',
    property: 'Pine View',
    room: '202',
    tenant_name: 'Michael Brown',
    tenant_picture: '/avatar/michael.png',
    issue_timestamp: '2025-11-08T10:20:00.000Z',
    staff_name: 'Emma Davis',
    staff_picture: '/avatar/emma.png',
    assignment_timestamp: '2025-11-08T11:00:00.000Z',
    status: 'Resolved'
  },
  {
    id: 'TK-20250004',
    ticket_id: 't4-uuid-0004-0004-000000000004',
    type: 'Maintenance',
    title: 'Internet not working',
    description: 'WiFi in apartment keeps disconnecting.',
    property: 'Maple Residency',
    room: '103',
    tenant_name: 'Sara Wilson',
    tenant_picture: '/avatar/sara.png',
    issue_timestamp: '2025-11-10T12:00:00.000Z',
    staff_name: 'Bob Smith',
    staff_picture: '/avatar/bob.png',
    assignment_timestamp: '2025-11-10T12:30:00.000Z',
    status: 'In Progress'
  },
  {
    id: 'TK-20250005',
    ticket_id: 't5-uuid-0005-0005-000000000005',
    type: 'Maintenance',
    title: 'Water heater not working',
    description: 'No hot water in the bathroom.',
    property: 'Oakwood Apartments',
    room: 'Whole unit',
    tenant_name: 'Emma Johnson',
    tenant_picture: '/avatar/emma2.png',
    issue_timestamp: '2025-11-07T07:45:00.000Z',
    staff_name: 'Clara Lee',
    staff_picture: '/avatar/clara.png',
    assignment_timestamp: '2025-11-07T08:15:00.000Z',
    status: 'Pending Tenant Confirmation'
  },
  {
    id: 'TK-20250006',
    ticket_id: 't6-uuid-0006-0006-000000000006',
    type: 'Complaint',
    title: 'Stained carpet',
    description: 'Living room carpet has large stain from previous spill.',
    property: 'Pine View',
    room: '301',
    tenant_name: 'David Lee',
    tenant_picture: '/avatar/david.png',
    issue_timestamp: '2025-11-06T16:50:00.000Z',
    staff_name: 'Emma Davis',
    staff_picture: '/avatar/emma.png',
    assignment_timestamp: '2025-11-06T17:20:00.000Z',
    status: 'Closed'
  },
  {
    id: 'TK-20250007',
    ticket_id: 't7-uuid-0007-0007-000000000007',
    type: 'Maintenance',
    title: 'Door handle broken',
    description: 'Front door handle is loose and comes off.',
    property: 'Maple Residency',
    room: '105',
    tenant_name: 'Olivia Martinez',
    tenant_picture: '/avatar/olivia.png',
    issue_timestamp: '2025-11-09T09:10:00.000Z',
    staff_name: 'Bob Smith',
    staff_picture: '/avatar/bob.png',
    assignment_timestamp: '2025-11-09T09:45:00.000Z',
    status: 'Resolved'
  },
  {
    id: 'TK-20250008',
    ticket_id: 't8-uuid-0008-0008-000000000008',
    type: 'Maintenance',
    title: 'Leaking ceiling',
    description: 'Water dripping from ceiling in bedroom.',
    property: 'Oakwood Apartments',
    room: '203',
    tenant_name: 'Liam Thomas',
    tenant_picture: '/avatar/liam.png',
    issue_timestamp: '2025-11-08T18:20:00.000Z',
    staff_name: 'Clara Lee',
    staff_picture: '/avatar/clara.png',
    assignment_timestamp: '2025-11-08T18:50:00.000Z',
    status: 'In Progress'
  },
  {
    id: 'TK-20250009',
    ticket_id: 't9-uuid-0009-0009-000000000009',
    type: 'Maintenance',
    title: 'Malfunctioning oven',
    description: 'Oven temperature fluctuates unexpectedly.',
    property: 'Pine View',
    room: 'Whole unit',
    tenant_name: 'Sophia Anderson',
    tenant_picture: '/avatar/sophia.png',
    issue_timestamp: '2025-11-07T11:30:00.000Z',
    staff_name: 'Emma Davis',
    staff_picture: '/avatar/emma.png',
    assignment_timestamp: '2025-11-07T12:00:00.000Z',
    status: 'Open'
  },
  {
    id: 'TK-20250010',
    ticket_id: 't10-uuid-0010-0010-000000000010',
    type: 'Complaint',
    title: 'Noisy neighbors',
    description: 'Neighbors making loud noises late at night.',
    property: 'Maple Residency',
    room: '104',
    tenant_name: 'Ethan Scott',
    tenant_picture: '/avatar/ethan.png',
    issue_timestamp: '2025-11-10T22:15:00.000Z',
    staff_name: 'Bob Smith',
    staff_picture: '/avatar/bob.png',
    assignment_timestamp: '2025-11-10T22:45:00.000Z',
    status: 'Pending Tenant Confirmation'
  }
]

export const tasksData: Task[] = [
  {
    id: 'TSK-20250000001',
    task_id: '1',
    type: 'Maintenance',
    priority: 'High',
    title: 'Air Conditioner Repair',
    description: 'The AC in Room 204 is not cooling properly.',
    property: 'Sunrise Apartments',
    room: 'Room 204',
    created_by_name: 'James Carter',
    created_by_picture: 'https://randomuser.me/api/portraits/men/12.jpg',
    created_at: '2025-11-10T09:45:00Z',
    staff_name: 'Michael Brown',
    staff_picture: 'https://randomuser.me/api/portraits/men/32.jpg',
    assignment_timestamp: '2025-11-10T10:30:00Z',
    status: 'In Progress'
  },
  {
    id: 'TSK-20250000002',
    task_id: '2',
    type: 'Cleaning',
    priority: 'Medium',
    title: 'Post-Checkout Cleaning',
    description: 'Deep cleaning required after tenant move-out.',
    property: 'Emerald Heights',
    room: 'Whole unit',
    created_by_name: 'Sophia Green',
    created_by_picture: 'https://randomuser.me/api/portraits/women/15.jpg',
    created_at: '2025-11-09T14:10:00Z',
    staff_name: 'Emma Davis',
    staff_picture: 'https://randomuser.me/api/portraits/women/25.jpg',
    assignment_timestamp: '2025-11-09T15:00:00Z',
    status: 'Open'
  },
  {
    id: 'TSK-20250000003',
    task_id: '3',
    type: 'Administrative',
    priority: 'Medium',
    title: 'Unit Handover Preparation',
    description: 'Inspect and prepare the unit for new tenants.',
    property: 'Maple Residency',
    room: 'Whole unit',
    created_by_name: 'Daniel Scott',
    created_by_picture: 'https://randomuser.me/api/portraits/men/45.jpg',
    created_at: '2025-11-08T12:00:00Z',
    staff_name: 'Liam Wilson',
    staff_picture: 'https://randomuser.me/api/portraits/men/28.jpg',
    assignment_timestamp: '2025-11-08T13:00:00Z',
    status: 'Resolved'
  },
  {
    id: 'TSK-20250000004',
    task_id: '4',
    type: 'Maintenance',
    priority: 'Urgent',
    title: 'Plumbing Leak Fix',
    description: 'Leak detected under kitchen sink.',
    property: 'Palm Grove Apartments',
    room: 'Room 103',
    created_by_name: 'Olivia Johnson',
    created_by_picture: 'https://randomuser.me/api/portraits/women/18.jpg',
    created_at: '2025-11-11T08:20:00Z',
    staff_name: 'Noah Clark',
    staff_picture: 'https://randomuser.me/api/portraits/men/51.jpg',
    assignment_timestamp: '2025-11-11T09:00:00Z',
    status: 'In Progress'
  },
  {
    id: 'TSK-20250000005',
    task_id: '5',
    type: 'Miscellaneous/Others',
    priority: 'Low',
    title: 'Key Replacement Request',
    description: 'Lost keys for Room 507, replacement needed.',
    property: 'Cedar Park Residences',
    room: 'Room 507',
    created_by_name: 'Henry Adams',
    created_by_picture: 'https://randomuser.me/api/portraits/men/62.jpg',
    created_at: '2025-11-06T10:15:00Z',
    staff_name: 'Lucas King',
    staff_picture: 'https://randomuser.me/api/portraits/men/30.jpg',
    assignment_timestamp: '2025-11-06T11:00:00Z',
    status: 'Open'
  },
  {
    id: 'TSK-20250000006',
    task_id: '6',
    type: 'Cleaning',
    priority: 'Medium',
    title: 'Lobby Deep Cleaning',
    description: 'Full deep clean of the lobby and reception area.',
    property: 'Vista Towers',
    room: 'Whole unit',
    created_by_name: 'Charlotte White',
    created_by_picture: 'https://randomuser.me/api/portraits/women/26.jpg',
    created_at: '2025-11-05T07:30:00Z',
    staff_name: 'Grace Hill',
    staff_picture: 'https://randomuser.me/api/portraits/women/33.jpg',
    assignment_timestamp: '2025-11-05T08:00:00Z',
    status: 'Resolved'
  },
  {
    id: 'TSK-20250000007',
    task_id: '7',
    type: 'Administrative',
    priority: 'High',
    title: 'Final Inspection for Unit 9B',
    description: 'Ensure all fixtures are functional before handover.',
    property: 'Orchid Residences',
    room: 'Whole unit',
    created_by_name: 'William Harris',
    created_by_picture: 'https://randomuser.me/api/portraits/men/48.jpg',
    created_at: '2025-11-07T13:25:00Z',
    staff_name: 'Benjamin Lee',
    staff_picture: 'https://randomuser.me/api/portraits/men/37.jpg',
    assignment_timestamp: '2025-11-07T14:10:00Z',
    status: 'Resolved'
  },
  {
    id: 'TSK-20250000008',
    task_id: '8',
    type: 'Maintenance',
    priority: 'Medium',
    title: 'Lighting Replacement in Hallway',
    description: 'Replace two flickering lights in the corridor.',
    property: 'Lakeside Apartments',
    room: 'Whole unit',
    created_by_name: 'Amelia Brown',
    created_by_picture: 'https://randomuser.me/api/portraits/women/40.jpg',
    created_at: '2025-11-04T16:00:00Z',
    staff_name: 'Ethan Walker',
    staff_picture: 'https://randomuser.me/api/portraits/men/55.jpg',
    assignment_timestamp: '2025-11-04T16:45:00Z',
    status: 'Open'
  }
]

export const noticesData: Notice[] = [
  {
    id: '1',
    title: 'Maintenance Scheduled',
    description:
      'Water supply will be shut down from 9 AM to 1 PM due to maintenance work.',
    type: 'Maintenance',
    created_at: '2025-11-10T08:00:00Z',
    effective_date: '2025-11-12T09:00:00Z',
    posted_by: 'John Doe',
    audience: 'Specific Recipients'
  },
  {
    id: '2',
    title: 'Fire Drill',
    description:
      'A fire drill is scheduled for all tenants next Monday at 3 PM.',
    type: 'Safety',
    created_at: '2025-11-08T10:30:00Z',
    effective_date: '2025-11-15T15:00:00Z',
    posted_by: 'Lisa Smith',
    audience: 'All Staff & Tenants'
  },
  {
    id: '3',
    title: 'Rent Reminder',
    description:
      'Tenants with overdue payments are requested to settle before the 15th.',
    type: 'Finance',
    created_at: '2025-11-09T09:15:00Z',
    effective_date: '2025-11-13T00:00:00Z',
    posted_by: 'Michael Brown',
    audience: 'Tenants With Overdue Payment'
  },
  {
    id: '4',
    title: 'Staff Meeting',
    description: 'Monthly staff meeting in the conference room at 10 AM.',
    type: 'Meeting',
    created_at: '2025-11-07T14:00:00Z',
    effective_date: '2025-11-14T10:00:00Z',
    posted_by: 'Sarah Johnson',
    audience: 'All Staff'
  },
  {
    id: '5',
    title: 'Tenant BBQ Event',
    description:
      'We are hosting a BBQ for tenants this weekend at the community area.',
    type: 'Event',
    created_at: '2025-11-06T12:00:00Z',
    effective_date: '2025-11-16T17:00:00Z',
    posted_by: 'Emily Davis',
    audience: 'All Tenants'
  },
  {
    id: '6',
    title: 'Elevator Maintenance',
    description:
      'The elevator will be out of service on the 20th from 8 AM to 6 PM. ',
    type: 'Maintenance',
    created_at: '2025-11-05T11:30:00Z',
    effective_date: '2025-11-20T08:00:00Z',
    posted_by: 'Robert Wilson',
    audience: 'All Staff & Tenants'
  }
]

// Other data
export const malaysiaStates: string[] = [
  'Johor',
  'Kedah',
  'Kelantan',
  'Melaka',
  'Negeri Sembilan',
  'Pahang',
  'Perak',
  'Perlis',
  'Penang',
  'Sabah',
  'Sarawak',
  'Selangor',
  'Terengganu',
  'Kuala Lumpur',
  'Labuan',
  'Putrajaya'
]

export const taskTypes: string[] = ['Maintenance', 'Cleaning', 'Others']

export const ticketTypes: string[] = ['Maintenance', 'Complaint', 'Billing & Payments', 'Aircon Top-Up', 'Others']

export const noticeTypes: string[] = [
  'General Announcement',
  'Maintenance',
  'Payment Reminder',
  'Policy Update',
  'Emergency Alert',
  'Event'
]

export const paymentTypes: PaymentType[] = [
  { type: 'Lease_Initial_Charges' },
  { type: 'Fines_or_Penalties' },
  { type: 'Internet_Bill', isRecurrable: true, isFixedByDefault: true },
  { type: 'Water_Bill', isRecurrable: true, isFixedByDefault: false },
  { type: 'Electricity_Bill', isRecurrable: true, isFixedByDefault: false },
  { type: 'Sewerage_Bill', isRecurrable: true, isFixedByDefault: false },
  { type: 'Cleaning_Service', isRecurrable: true, isFixedByDefault: true },
  { type: 'Parking', isRecurrable: true, isFixedByDefault: true },
  { type: 'Miscellaneous_Others', isRecurrable: true, isFixedByDefault: false }
]

export const chargeTypes: ChargeTypeType[] = [
  { type: 'First Month Rental', taxable: false, refundable: false },
  { type: 'Earnest Deposit', taxable: false, refundable: true },
  { type: 'Security Deposit', taxable: false, refundable: true },
  { type: 'Utility Deposit', taxable: false, refundable: true },
  { type: 'Legal Fees', taxable: false, refundable: false }
]

export const propertyExpenseTypes: PaymentType[] = [
  { type: 'Maintenance', isRecurrable: true, isFixedByDefault: false },
  { type: 'Cleaning_Service', isRecurrable: true, isFixedByDefault: true },
  { type: 'Internet_Bill', isRecurrable: true, isFixedByDefault: true },
  { type: 'Water_Bill', isRecurrable: true, isFixedByDefault: false },
  { type: 'Electricity_Bill', isRecurrable: true, isFixedByDefault: false },
  { type: 'Sewerage_Bill', isRecurrable: true, isFixedByDefault: false },
  { type: 'Management_Fees', isRecurrable: true, isFixedByDefault: true },
  { type: 'Renovation', isRecurrable: true, isFixedByDefault: false },
  { type: 'Furniture_Appliances', isRecurrable: true, isFixedByDefault: false },
  { type: 'Miscellaneous_Others', isRecurrable: true, isFixedByDefault: false }
]

export const contractExpenseTypes: PaymentType[] = [
  { type: 'Contract Initial Charges' },
  { type: 'Fines or Penalties' },
  { type: 'Miscellaneous/Other', isRecurrable: true }
]

export const companyExpenseTypes: PaymentType[] = [
  { type: 'Office Rent', isRecurrable: true },
  { type: 'Utilities', isRecurrable: true },
  { type: 'Legal & Professional Fees', isRecurrable: true },
  { type: 'Marketing & Advertising', isRecurrable: true },
  { type: 'Travel & Transportation', isRecurrable: true },
  { type: 'Office Supplies', isRecurrable: true },
  { type: 'Equipment & Furniture', isRecurrable: true },
  { type: 'Taxes & Licenses', isRecurrable: true },
  { type: 'Fines or Penalties' },
  { type: 'Miscellaneous/Other', isRecurrable: true }
]
