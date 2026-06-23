type Entry = {
  permissions: Set<string>
  roleId: string
  roleTitle: string | null
  expiresAt: number
}

const TTL_MS = 30_000
const store = new Map<string, Entry>()

export function getCached(staffId: string): { permissions: Set<string>; roleTitle: string | null } | null {
  const entry = store.get(staffId)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    store.delete(staffId)
    return null
  }
  return { permissions: entry.permissions, roleTitle: entry.roleTitle }
}

export function setCached(staffId: string, roleId: string, roleTitle: string | null, permissions: Set<string>) {
  store.set(staffId, {
    permissions,
    roleId,
    roleTitle,
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
