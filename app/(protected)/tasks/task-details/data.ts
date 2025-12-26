import type { Task, StaffMember } from './types'

// Mock staff members
export const MOCK_STAFF: StaffMember[] = [
  { id: 'staff-1', name: 'Ahmad Ismail', avatar: undefined, role: 'Property Manager' },
  { id: 'staff-2', name: 'Sarah Wong', avatar: undefined, role: 'Maintenance Lead' },
  { id: 'staff-3', name: 'Kumar Patel', avatar: undefined, role: 'Technician' },
  { id: 'staff-4', name: 'Lisa Chen', avatar: undefined, role: 'Admin Officer' }
]

// Mock task for testing
export const MOCK_TASK: Task = {
  id: 'task-001',
  referenceId: 'TSK-2024-001',
  title: 'Replace faulty air conditioning unit in Unit 5A',
  description:
    'The AC unit in Unit 5A has been making unusual noises and not cooling properly. Tenant has complained multiple times. Need to assess whether repair is possible or full replacement is needed.',
  type: 'Maintenance',
  priority: 'High',
  status: 'Open',
  createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  createdById: 'staff-1',
  createdByName: 'Ahmad Ismail',
  createdByAvatar: undefined,
  dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
  location: {
    projectId: 'proj-001',
    projectName: 'Skyview Residence',
    projectState: 'Selangor',
    propertyId: 'prop-001',
    propertyCode: 'SKY-101',
    propertyCity: 'Petaling Jaya',
    roomId: 'room-5a',
    roomTitle: 'Unit 5A'
  },
  assignment: undefined,
  pendingAssignment: undefined,
  timeline: [
    {
      id: 'evt-1',
      type: 'task_created',
      performerId: 'staff-1',
      performerName: 'Ahmad Ismail',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      message:
        'The AC unit in Unit 5A has been making unusual noises and not cooling properly. Tenant has complained multiple times. Need to assess whether repair is possible or full replacement is needed.'
    },
    {
      id: 'evt-2',
      type: 'priority_changed',
      performerId: 'staff-1',
      performerName: 'Ahmad Ismail',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60000).toISOString(),
      oldValue: 'Medium',
      newValue: 'High'
    },
    {
      id: 'evt-3',
      type: 'due_date_set',
      performerId: 'staff-1',
      performerName: 'Ahmad Ismail',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 120000).toISOString(),
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  report: undefined
}

// Additional mock tasks for list view later
export const MOCK_TASKS: Task[] = [
  MOCK_TASK,
  {
    id: 'task-002',
    referenceId: 'TSK-2024-002',
    title: 'Monthly property inspection - Block B',
    description: 'Routine monthly inspection of all common areas in Block B including hallways, stairwells, and parking area.',
    type: 'Documentation',
    priority: 'Medium',
    status: 'In Progress',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdById: 'staff-1',
    createdByName: 'Ahmad Ismail',
    location: {
      projectId: 'proj-001',
      projectName: 'Skyview Residence',
      projectState: 'Selangor',
      propertyId: 'prop-002',
      propertyCode: 'SKY-B01',
      propertyCity: 'Petaling Jaya'
      // No room - property-level task
    },
    assignment: {
      id: 'assign-002',
      staffId: 'staff-2',
      staffName: 'Sarah Wong',
      status: 'accepted',
      assignerId: 'staff-1',
      assignerName: 'Ahmad Ismail',
      requestedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      respondedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 3600000).toISOString()
    },
    timeline: [
      {
        id: 'evt-t2-1',
        type: 'task_created',
        performerId: 'staff-1',
        performerName: 'Ahmad Ismail',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        message: 'Routine monthly inspection of all common areas in Block B including hallways, stairwells, and parking area.'
      },
      {
        id: 'evt-t2-2',
        type: 'assignment_sent',
        performerId: 'staff-1',
        performerName: 'Ahmad Ismail',
        assignerName: 'Ahmad Ismail',
        assignedName: 'Sarah Wong',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'evt-t2-3',
        type: 'assignment_accepted',
        performerId: 'staff-2',
        performerName: 'Sarah Wong',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 3600000).toISOString()
      },
      {
        id: 'evt-t2-4',
        type: 'status_changed',
        performerId: 'staff-2',
        performerName: 'Sarah Wong',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        oldValue: 'Open',
        newValue: 'In Progress'
      }
    ]
  },
  {
    id: 'task-003',
    referenceId: 'TSK-2024-003',
    title: 'Deep cleaning of common areas',
    description: 'Quarterly deep cleaning of lobby, corridors, and parking areas.',
    type: 'Cleaning',
    priority: 'Low',
    status: 'Resolved',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    createdById: 'staff-4',
    createdByName: 'Lisa Chen',
    location: {
      projectId: 'proj-002',
      projectName: 'Urban Heights',
      projectState: 'Kuala Lumpur',
      propertyId: 'prop-010',
      propertyCode: 'URB-A01',
      propertyCity: 'Bangsar'
      // No room - property-level task
    },
    assignment: {
      id: 'assign-003',
      staffId: 'staff-3',
      staffName: 'Kumar Patel',
      status: 'accepted',
      assignerId: 'staff-4',
      assignerName: 'Lisa Chen',
      requestedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      respondedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000 + 1800000).toISOString()
    },
    timeline: [
      {
        id: 'evt-t3-1',
        type: 'task_created',
        performerId: 'staff-4',
        performerName: 'Lisa Chen',
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        message: 'Quarterly deep cleaning of lobby, corridors, and parking areas.'
      },
      {
        id: 'evt-t3-2',
        type: 'assignment_self_assigned',
        performerId: 'staff-3',
        performerName: 'Kumar Patel',
        timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'evt-t3-3',
        type: 'status_changed',
        performerId: 'staff-3',
        performerName: 'Kumar Patel',
        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        oldValue: 'Open',
        newValue: 'In Progress'
      },
      {
        id: 'evt-t3-4',
        type: 'report_submitted',
        performerId: 'staff-3',
        performerName: 'Kumar Patel',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        message: 'All common areas have been deep cleaned. Floors polished, walls wiped, and fixtures cleaned.'
      },
      {
        id: 'evt-t3-5',
        type: 'status_changed',
        performerId: 'staff-3',
        performerName: 'Kumar Patel',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 60000).toISOString(),
        oldValue: 'In Progress',
        newValue: 'Resolved'
      }
    ],
    report: {
      content: 'All common areas have been deep cleaned. Floors polished, walls wiped, and fixtures cleaned.',
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      submittedById: 'staff-3',
      submittedByName: 'Kumar Patel'
    }
  }
]

// Helper to get staff by ID
export function getStaffById(id: string): StaffMember | undefined {
  return MOCK_STAFF.find(s => s.id === id)
}

// Helper to generate a new ID
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
