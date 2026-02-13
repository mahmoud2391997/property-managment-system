'use client'

import { useState, useCallback } from 'react'
import {
  StatusMetricCard,
} from '@/components/dashboard'
import { SummaryMetricCard } from '@/components/dashboard/summary-metric-card'
import { IncomeExpenseChart } from '@/components/dashboard/income-expense-chart'
import { ExpenseBreakdown } from '@/components/dashboard/expense-breakdown'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { TicketsTasksCard } from '@/components/dashboard/tickets-tasks-card'
import { OccupancyOverview } from '@/components/dashboard/occupancy-overview'
import { ExpiringLeasesContracts } from '@/components/dashboard/expiring-leases-contracts'
import { STATUS_COLORS } from '@/lib/dashboard-data'
import { Card } from '@/components/ui/card'
import Dialog from '@/components/costume-ui/dialog'
import AddTask from '@/components/add-task'
import AddTenant from '@/components/add-tenant'
import AddOwner from '@/components/add-owner'
import AddStaff from '@/components/add-staff'
import AddProject from '@/components/add-project'
import AddTicket from '@/components/add-ticket'
import AddView from '@/components/add-view'
import AddBookingWizard from '@/components/add-booking-wizard'

const MONTHLY_DATA_2026 = [
  { month: 'Jan', payments: 42000, expenses: 28000 },
  { month: 'Feb', payments: 38500, expenses: 24500 },
  { month: 'Mar', payments: 45000, expenses: 31000 },
  { month: 'Apr', payments: 41000, expenses: 26000 },
  { month: 'May', payments: 47500, expenses: 29500 },
  { month: 'Jun', payments: 44000, expenses: 32000 },
  { month: 'Jul', payments: 49000, expenses: 27000 },
  { month: 'Aug', payments: 43500, expenses: 30500 },
  { month: 'Sep', payments: 46000, expenses: 28500 },
  { month: 'Oct', payments: 50000, expenses: 33000 },
  { month: 'Nov', payments: 48000, expenses: 31500 },
  { month: 'Dec', payments: 52000, expenses: 35000 },
]

const MONTHLY_DATA_2025 = [
  { month: 'Jan', payments: 35000, expenses: 22000 },
  { month: 'Feb', payments: 33000, expenses: 20500 },
  { month: 'Mar', payments: 38000, expenses: 25000 },
  { month: 'Apr', payments: 36000, expenses: 23000 },
  { month: 'May', payments: 40000, expenses: 26500 },
  { month: 'Jun', payments: 37500, expenses: 28000 },
  { month: 'Jul', payments: 42000, expenses: 24000 },
  { month: 'Aug', payments: 39000, expenses: 27000 },
  { month: 'Sep', payments: 41000, expenses: 25500 },
  { month: 'Oct', payments: 44000, expenses: 30000 },
  { month: 'Nov', payments: 43000, expenses: 29000 },
  { month: 'Dec', payments: 46000, expenses: 32000 },
]

const EXPENSE_CATEGORIES = [
  { category: 'Property Related', amount: 12400, color: '#0d9488' },
  { category: 'Staff Related', amount: 8600, color: '#0284c7' },
  { category: 'Company Related', amount: 5200, color: '#7c3aed' },
  { category: 'Purchase Related', amount: 3800, color: '#64748b' },
  { category: 'Contract Related', amount: 2000, color: '#d97706' },
]

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

const PROJECTS = [
  { id: 'proj-1', name: 'Sunrise Residency' },
  { id: 'proj-2', name: 'Greenfield Towers' },
  { id: 'proj-3', name: 'Marina Heights' },
]

const DUMMY_TICKETS = [
  { id: 'tk-1', referenceId: '#TK-20260012', title: 'Water heater not working in unit B3', type: 'Maintenance', property: 'SR-B3', room: null, status: 'Open', issuedAt: '2026-02-09T14:30:00Z' },
  { id: 'tk-2', referenceId: '#TK-20260011', title: 'Aircon needs servicing', type: 'Aircon Top-Up', property: 'GF-12A', room: 'Room 205', status: 'In Progress', issuedAt: '2026-02-08T09:15:00Z' },
  { id: 'tk-3', referenceId: '#TK-20260010', title: 'Billing dispute on January invoice', type: 'Billing', property: 'MH-PH1', room: null, status: 'Pending Tenant Confirmation', issuedAt: '2026-02-07T16:00:00Z' },
  { id: 'tk-4', referenceId: '#TK-20260009', title: 'Noise complaint from unit A2', type: 'Complaint', property: 'SR-A2', room: null, status: 'Resolved', issuedAt: '2026-02-06T11:45:00Z' },
  { id: 'tk-5', referenceId: '#TK-20260008', title: 'Door lock replacement needed', type: 'Maintenance', property: 'GF-12A', room: 'Room 101', status: 'Open', issuedAt: '2026-02-05T08:20:00Z' },
]

const DUMMY_TASKS = [
  { id: 'tsk-1', referenceId: '#TSK-20260005', title: 'Inspect unit A1 after tenant move-out', type: 'Inspection', property: 'SR-A1', room: null, priority: 'High', status: 'Open', dueDate: '2026-02-12T00:00:00Z', createdAt: '2026-02-08T10:00:00Z' },
  { id: 'tsk-2', referenceId: '#TSK-20260004', title: 'Prepare Room 301 for new tenant', type: 'Preparation', property: 'GF-12A', room: 'Room 301', priority: 'Urgent', status: 'In Progress', dueDate: '2026-02-11T00:00:00Z', createdAt: '2026-02-07T14:00:00Z' },
  { id: 'tsk-3', referenceId: '#TSK-20260003', title: 'Process refund for unit B3 deposit', type: 'Refund Request', property: 'SR-B3', room: null, priority: 'Medium', status: 'Open', dueDate: '2026-02-15T00:00:00Z', createdAt: '2026-02-06T09:30:00Z' },
  { id: 'tsk-4', referenceId: '#TSK-20260002', title: 'Deep cleaning of penthouse', type: 'Cleaning', property: 'MH-PH1', room: null, priority: 'Low', status: 'In Progress', dueDate: null, createdAt: '2026-02-05T16:00:00Z' },
  { id: 'tsk-5', referenceId: '#TSK-20260001', title: 'Update lease documentation for renewal', type: 'Documentation', property: 'SR-A2', room: null, priority: 'Medium', status: 'Resolved', dueDate: '2026-02-10T00:00:00Z', createdAt: '2026-02-04T11:00:00Z' },
]

const TICKET_STATUS_COUNTS = [
  { label: 'Open', count: 8, color: '#3b82f6' },
  { label: 'In Progress', count: 4, color: '#d97706' },
  { label: 'Pending Tenant', count: 2, color: '#7c3aed' },
  { label: 'Resolved', count: 12, color: '#0d9488' },
  { label: 'Closed', count: 31, color: '#64748b' },
]

const TASK_STATUS_COUNTS = [
  { label: 'Open', count: 6, color: '#3b82f6' },
  { label: 'In Progress', count: 3, color: '#d97706' },
  { label: 'Resolved', count: 18, color: '#0d9488' },
]

const OCCUPANCY_GROUPS = [
  {
    label: 'Properties',
    total: 24,
    occupied: 15,
    segments: [
      { label: 'Occupied', count: 15, color: '#0d9488' },
      { label: 'Vacant', count: 5, color: '#3b82f6' },
      { label: 'Under Preparation', count: 3, color: '#d97706' },
      { label: 'Pending Inspection', count: 1, color: '#7c3aed' },
    ],
  },
  {
    label: 'Rooms',
    total: 86,
    occupied: 64,
    segments: [
      { label: 'Occupied', count: 64, color: '#0d9488' },
      { label: 'Vacant', count: 12, color: '#3b82f6' },
      { label: 'Under Preparation', count: 7, color: '#d97706' },
      { label: 'Pending Inspection', count: 3, color: '#7c3aed' },
    ],
  },
]

const EXPIRING_LEASES = [
  { id: 'ls-1', tenantName: 'Ahmad Razak', propertyCode: 'SR-A1', roomTitle: null, daysUntilExpiry: 5, monthlyRent: 2800 },
  { id: 'ls-2', tenantName: 'Sarah Lim', propertyCode: 'GF-12A', roomTitle: 'Room 205', daysUntilExpiry: 12, monthlyRent: 1200 },
  { id: 'ls-3', tenantName: 'David Chen', propertyCode: 'MH-PH1', roomTitle: null, daysUntilExpiry: 18, monthlyRent: 5500 },
  { id: 'ls-4', tenantName: 'Nurul Huda', propertyCode: 'SR-B3', roomTitle: null, daysUntilExpiry: 27, monthlyRent: 3200 },
]

const EXPIRING_CONTRACTS = [
  { id: 'ct-1', contractorName: 'CleanPro Services', propertyCode: 'SR-A1', type: 'Cleaning', daysUntilExpiry: 3, monthlyCost: 1500 },
  { id: 'ct-2', contractorName: 'SecureGuard Sdn Bhd', propertyCode: 'GF-12A', type: 'Security', daysUntilExpiry: 10, monthlyCost: 4200 },
  { id: 'ct-3', contractorName: 'GreenScape Landscaping', propertyCode: 'MH-PH1', type: 'Landscaping', daysUntilExpiry: 22, monthlyCost: 800 },
  { id: 'ct-4', contractorName: 'AirCool Engineering', propertyCode: 'SR-B3', type: 'Aircon Maintenance', daysUntilExpiry: 29, monthlyCost: 2100 },
]

const DUMMY_DATA = {
  properties: {
    total: 24,
    vacant: 5,
    occupied: 15,
    underPreparation: 3,
    pendingInspection: 1,
  },
  rooms: {
    total: 86,
    vacant: 12,
    occupied: 64,
    underPreparation: 7,
    pendingInspection: 3,
  },
  leases: {
    total: 79,
    active: 68,
    expiringSoon: 8,
    expired: 3,
  },
  contracts: {
    total: 12,
    active: 9,
    expiringSoon: 2,
    expired: 1,
  },
  payments: {
    overdueAmount: 15400,
    overdueCount: 7,
    pendingCount: 12,
  },
  expenses: {
    overdueAmount: 8250,
    overdueCount: 4,
    pendingCount: 9,
  },
}

export default function DashboardMetricsTest() {
  const [selectedYear, setSelectedYear] = useState(2026)
  const [selectedProject, setSelectedProject] = useState('all')
  const [expenseMonth, setExpenseMonth] = useState('02')
  const [expenseYear, setExpenseYear] = useState(2026)
  const [occupancyMonth, setOccupancyMonth] = useState('02')
  const [occupancyYear, setOccupancyYear] = useState(2026)

  // Dialog states
  const [activeDialog, setActiveDialog] = useState<string | null>(null)
  const [dialogLoading, setDialogLoading] = useState(false)
  const [bookingPropertyId, setBookingPropertyId] = useState<string | null>(null)
  const [bookingRoomId, setBookingRoomId] = useState<string | null>(null)

  const closeDialog = useCallback(() => {
    setActiveDialog(null)
    setDialogLoading(false)
    setBookingPropertyId(null)
    setBookingRoomId(null)
  }, [])

  const handleDialogAction = useCallback((actionId: string, propertyId?: string, roomId?: string) => {
    if (actionId === 'add-booking') {
      if (propertyId) setBookingPropertyId(propertyId)
      if (roomId) setBookingRoomId(roomId)
    }
    setActiveDialog(actionId)
  }, [])

  const chartData = selectedYear === 2026 ? MONTHLY_DATA_2026 : MONTHLY_DATA_2025

  return (
    <div className="flex flex-col gap-6 p-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Metrics - Testing</h1>
          <p className="text-sm text-gray-500">Edit this page freely — no DB queries, instant reload</p>
        </div>
        <QuickActions
          onDialogAction={handleDialogAction}
        />
      </div>

      <Card className="gap-0 p-0 shadow-xs overflow-hidden">
        {/* Top row — 4 status metrics */}
        <div className="flex flex-row py-5">
          <div className="flex-1">
            <StatusMetricCard
              title="Properties"
              value={DUMMY_DATA.properties.total}
              statuses={[
                { label: 'Vacant', count: DUMMY_DATA.properties.vacant, color: STATUS_COLORS.vacant },
                { label: 'Occupied', count: DUMMY_DATA.properties.occupied, color: STATUS_COLORS.occupied },
                { label: 'Under Preparation', count: DUMMY_DATA.properties.underPreparation, color: STATUS_COLORS.underPreparation },
                { label: 'Pending Inspection', count: DUMMY_DATA.properties.pendingInspection, color: STATUS_COLORS.pendingInspection },
              ]}
            />
          </div>

          <div className="flex-1 border-l border-(--border-default)">
            <StatusMetricCard
              title="Rooms"
              value={DUMMY_DATA.rooms.total}
              statuses={[
                { label: 'Vacant', count: DUMMY_DATA.rooms.vacant, color: STATUS_COLORS.vacant },
                { label: 'Occupied', count: DUMMY_DATA.rooms.occupied, color: STATUS_COLORS.occupied },
                { label: 'Under Preparation', count: DUMMY_DATA.rooms.underPreparation, color: STATUS_COLORS.underPreparation },
                { label: 'Pending Inspection', count: DUMMY_DATA.rooms.pendingInspection, color: STATUS_COLORS.pendingInspection },
              ]}
            />
          </div>

          <div className="flex-1 border-l border-(--border-default)">
            <StatusMetricCard
              title="Active Leases"
              value={DUMMY_DATA.leases.total}
              statuses={[
                { label: 'Active', count: DUMMY_DATA.leases.active, color: STATUS_COLORS.active },
                { label: 'Expiring Soon', count: DUMMY_DATA.leases.expiringSoon, color: STATUS_COLORS.expiringSoon },
                { label: 'Expired', count: DUMMY_DATA.leases.expired, color: STATUS_COLORS.expired },
              ]}
            />
          </div>

          <div className="flex-1 border-l border-(--border-default)">
            <StatusMetricCard
              title="Active Contracts"
              value={DUMMY_DATA.contracts.total}
              statuses={[
                { label: 'Active', count: DUMMY_DATA.contracts.active, color: STATUS_COLORS.active },
                { label: 'Expiring Soon', count: DUMMY_DATA.contracts.expiringSoon, color: STATUS_COLORS.expiringSoon },
                { label: 'Expired', count: DUMMY_DATA.contracts.expired, color: STATUS_COLORS.expired },
              ]}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-(--border-default)" />

        {/* Bottom row — 2 summary metrics */}
        <div className="flex flex-row py-5">
          <div className="flex-1">
            <SummaryMetricCard
              title="Payments"
              value={`RM ${DUMMY_DATA.payments.overdueAmount.toLocaleString()}`}
              stats={[
                { label: 'Overdue', value: DUMMY_DATA.payments.overdueCount, color: STATUS_COLORS.overdue },
                { label: 'Pending', value: DUMMY_DATA.payments.pendingCount, color: STATUS_COLORS.pending },
              ]}
            />
          </div>

          <div className="flex-1 border-l border-(--border-default)">
            <SummaryMetricCard
              title="Expenses"
              value={`RM ${DUMMY_DATA.expenses.overdueAmount.toLocaleString()}`}
              stats={[
                { label: 'Overdue', value: DUMMY_DATA.expenses.overdueCount, color: STATUS_COLORS.overdue },
                { label: 'Pending', value: DUMMY_DATA.expenses.pendingCount, color: STATUS_COLORS.pending },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Income vs Expenses Chart */}
      <div className='flex gap-5'>
        <IncomeExpenseChart
          data={chartData}
          years={[2026, 2025]}
          projects={PROJECTS}
          selectedYear={selectedYear}
          selectedProject={selectedProject}
          onYearChange={setSelectedYear}
          onProjectChange={setSelectedProject}
        />
        {/* Expense Category Breakdown */}
        <ExpenseBreakdown
          data={EXPENSE_CATEGORIES}
          months={MONTHS}
          years={[2026, 2025]}
          selectedMonth={expenseMonth}
          selectedYear={expenseYear}
          onMonthChange={setExpenseMonth}
          onYearChange={setExpenseYear}
        />
      </div>

      {/* Occupancy + Expiring + Tickets/Tasks row */}
      <div className="flex gap-5">
        <OccupancyOverview
          groups={OCCUPANCY_GROUPS}
          changeFromLastMonth={2.4}
          months={MONTHS}
          years={[2026, 2025]}
          selectedMonth={occupancyMonth}
          selectedYear={occupancyYear}
          onMonthChange={setOccupancyMonth}
          onYearChange={setOccupancyYear}
        />
        <ExpiringLeasesContracts
          leases={EXPIRING_LEASES}
          contracts={EXPIRING_CONTRACTS}
        />
      </div>

      <TicketsTasksCard
          tickets={DUMMY_TICKETS}
          tasks={DUMMY_TASKS}
          ticketStatusCounts={TICKET_STATUS_COUNTS}
          taskStatusCounts={TASK_STATUS_COUNTS}
          className="flex-1"
        />

      {/* ── Dialogs (rendered but hidden until triggered) ── */}

      {/* Add Task */}
      <Dialog
        open={activeDialog === 'add-task'}
        onOpenChange={(open) => !open && closeDialog()}
        title="Add Task"
        saveButtonLabel={dialogLoading ? 'Creating...' : 'Create Task'}
        loading={dialogLoading}
        className="max-w-150!"
      >
        <AddTask onLoadingChange={setDialogLoading} onSuccess={closeDialog} />
      </Dialog>

      {/* Add Tenant */}
      <Dialog
        open={activeDialog === 'add-tenant'}
        onOpenChange={(open) => !open && closeDialog()}
        title="Add Tenant"
        saveButtonLabel={dialogLoading ? 'Saving...' : 'Save'}
        loading={dialogLoading}
        className="max-w-150!"
      >
        <AddTenant onLoadingChange={setDialogLoading} onSuccess={closeDialog} />
      </Dialog>

      {/* Add Owner */}
      <Dialog
        open={activeDialog === 'add-owner'}
        onOpenChange={(open) => !open && closeDialog()}
        title="Add Owner"
        saveButtonLabel={dialogLoading ? 'Saving...' : 'Save'}
        loading={dialogLoading}
        className="max-w-150!"
      >
        <AddOwner onLoadingChange={setDialogLoading} onSuccess={closeDialog} />
      </Dialog>

      {/* Add Staff */}
      <Dialog
        open={activeDialog === 'add-staff'}
        onOpenChange={(open) => !open && closeDialog()}
        title="Add Staff"
        saveButtonLabel={dialogLoading ? 'Saving...' : 'Save'}
        loading={dialogLoading}
        className="max-w-150!"
      >
        <AddStaff onLoadingChange={setDialogLoading} onSuccess={closeDialog} />
      </Dialog>

      {/* Add Project */}
      <Dialog
        open={activeDialog === 'add-project'}
        onOpenChange={(open) => !open && closeDialog()}
        title="Add Project"
        saveButtonLabel={dialogLoading ? 'Saving...' : 'Save'}
        loading={dialogLoading}
      >
        <AddProject onLoadingChange={setDialogLoading} onSuccess={closeDialog} />
      </Dialog>

      {/* Add Ticket */}
      <Dialog
        open={activeDialog === 'add-ticket'}
        onOpenChange={(open) => !open && closeDialog()}
        title="Add Ticket"
        saveButtonLabel={dialogLoading ? 'Submitting...' : 'Submit'}
        loading={dialogLoading}
        className="max-w-150!"
      >
        <AddTicket onLoadingChange={setDialogLoading} onSuccess={() => closeDialog()} />
      </Dialog>

      {/* Add View */}
      <Dialog
        open={activeDialog === 'add-view'}
        onOpenChange={(open) => !open && closeDialog()}
        title="Add View"
        saveButtonLabel={dialogLoading ? 'Saving...' : 'Save'}
        loading={dialogLoading}
        className="max-w-150!"
      >
        <AddView onLoadingChange={setDialogLoading} onSuccess={closeDialog} />
      </Dialog>

      {/* Add Booking (needs propertyId or roomId) */}
      {(bookingPropertyId || bookingRoomId) && (
        <AddBookingWizard
          propertyId={bookingPropertyId || ''}
          roomId={bookingRoomId || undefined}
          open={activeDialog === 'add-booking'}
          onOpenChange={(open) => !open && closeDialog()}
          onSuccess={closeDialog}
        />
      )}
    </div>
  )
}