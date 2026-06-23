export function hasPermission(permissions: Set<string>, perm: string): boolean {
  return permissions.has(perm)
}

export function hasAny(permissions: Set<string>, ...perms: string[]): boolean {
  return perms.some(p => permissions.has(p))
}

export function hasAll(permissions: Set<string>, ...perms: string[]): boolean {
  return perms.every(p => permissions.has(p))
}
