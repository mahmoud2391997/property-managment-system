// Mock authentication utilities

export interface MockUser {
  id: string
  email: string
  full_name: string
  user_type: 'admin' | 'staff' | 'tenant'
  password_set: boolean
  created_at: string
}

export const MOCK_ADMIN_USER: MockUser = {
  id: '1',
  email: 'admin@example.com',
  full_name: 'Admin User',
  user_type: 'admin',
  password_set: true,
  created_at: new Date('2024-01-01').toISOString(),
}

export const MOCK_USERS: Record<string, { password: string; user: MockUser }> = {
  'admin@example.com': {
    password: 'admin123',
    user: MOCK_ADMIN_USER,
  },
  'manager@example.com': {
    password: 'manager123',
    user: {
      id: '2',
      email: 'manager@example.com',
      full_name: 'John Manager',
      user_type: 'staff',
      password_set: true,
      created_at: new Date('2024-01-15').toISOString(),
    },
  },
  'tenant@example.com': {
    password: 'tenant123',
    user: {
      id: '3',
      email: 'tenant@example.com',
      full_name: 'Jane Tenant',
      user_type: 'tenant',
      password_set: true,
      created_at: new Date('2024-02-01').toISOString(),
    },
  },
}

export function mockLogin(email: string, password: string): MockUser | null {
  const userData = MOCK_USERS[email]
  if (!userData || userData.password !== password) {
    return null
  }
  return userData.user
}

export function mockGetCurrentUser(): MockUser | null {
  if (typeof window === 'undefined') return null
  
  const stored = localStorage.getItem('mock_current_user')
  if (!stored) return null
  
  try {
    return JSON.parse(stored) as MockUser
  } catch {
    return null
  }
}

export function mockSetCurrentUser(user: MockUser | null): void {
  if (typeof window === 'undefined') return
  
  if (user) {
    localStorage.setItem('mock_current_user', JSON.stringify(user))
  } else {
    localStorage.removeItem('mock_current_user')
  }
}

export function mockLogout(): void {
  mockSetCurrentUser(null)
}
