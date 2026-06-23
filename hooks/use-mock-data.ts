import {
  mockProperties,
  mockTenants,
  mockLeases,
  mockTickets,
  mockPayments,
  mockExpenses,
  mockNotifications,
  mockDocuments,
  mockUsers,
} from '@/lib/mock-data'

export function useProperties() {
  return mockProperties
}

export function useTenants() {
  return mockTenants
}

export function useLeases() {
  return mockLeases
}

export function useTickets() {
  return mockTickets
}

export function usePayments() {
  return mockPayments
}

export function useExpenses() {
  return mockExpenses
}

export function useNotifications() {
  return mockNotifications
}

export function useDocuments() {
  return mockDocuments
}

export function useUsers() {
  return mockUsers
}

export function useProperty(id: string) {
  return mockProperties.find(p => p.id === id)
}

export function useTenant(id: string) {
  return mockTenants.find(t => t.id === id)
}

export function useLease(id: string) {
  return mockLeases.find(l => l.id === id)
}

export function useTicket(id: string) {
  return mockTickets.find(t => t.id === id)
}
