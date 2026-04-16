type Entry = {
  permissions: Set<string>
  roleId: string
  expiresAt: number
}

const TTL_MS = 30_000
const store = new Map<string, Entry>()

export function getCached(staffId: string): Set<string> | null {
  const entry = store.get(staffId)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    store.delete(staffId)
    return null
  }
  return entry.permissions
}

export function setCached(staffId: string, roleId: string, permissions: Set<string>) {
  store.set(staffId, {
    permissions,
    roleId,
    expiresAt: Date.now() + TTL_MS
  })
}

/** Bust one staff member's cache — call when their role_id changes. */
export function invalidate(staffId: string) {
  store.delete(staffId)
}

/** Bust every staff member on a given role — call when the role's permissions change. */
export function invalidateByRole(roleId: string) {
  for (const [staffId, entry] of store.entries()) {
    if (entry.roleId === roleId) store.delete(staffId)
  }
}
