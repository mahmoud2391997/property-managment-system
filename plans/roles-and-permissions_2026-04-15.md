# Roles & Permissions — Coding Plan

**Date**: 2026-04-15
**Companion doc**: [.local/docs/roles-and-permissions.md](../.local/docs/roles-and-permissions.md) — the full 103-permission catalog and rules.

---

## 1. Goal

Build a full role-based permission system for TenancyPilot staff. Every staff member has one role. Each role is a set of permissions. Permissions gate what the user can see (pages, sidebar items, tabs, cards) and what they can do (API actions). The **Owner** of an organization starts with every permission and defines other roles through a new admin UI.

The system enforces 103 permissions across 18 modules, as defined in the companion doc. Tenants are a separate system and are not part of this work.

---

## 2. Current state

- **Schema is ready.** `permissions`, `roles`, `roles_permissions`, `staff.role_id` already exist in [prisma/schema.prisma](../prisma/schema.prisma). No schema changes needed.
- **Auth chokepoint exists.** Every API route calls [utils/getUserAndStaff.ts](../utils/getUserAndStaff.ts), which returns `{ user, staff }`. We extend this function to also return permissions.
- **Proxy handles auth only.** [proxy.ts](../proxy.ts) + [utils/supabase/proxy.ts](../utils/supabase/proxy.ts) runs on every request at the edge. It checks login state, user type (staff/tenant), and organization routing. It does NOT (and will not) check permissions — Prisma isn't available at the edge.
- **Hardcoded email restriction.** The proxy has a `RESTRICTED_STAFF_EMAILS` array that limits two specific users to `/tasks`, `/tickets`, `/notifications`. This is a crude placeholder that will be replaced by giving those users a real role with the same restriction.
- **Zero permission logic today.** No `hasPermission` calls anywhere. No role-based UI gating. Every staff member currently sees every page.
- **`/api/user/info` exists** and is called by the sidebar to show the user's name + role title. We leave it alone and add a new `/api/me` in parallel.

---

## 3. How it works

### Three enforcement layers

| Layer | Where | What it checks | Reads from |
|---|---|---|---|
| **Proxy** | [utils/supabase/proxy.ts](../utils/supabase/proxy.ts), runs at the edge | Is the user logged in? Is their user type right for the path? | Supabase REST |
| **Server components** | Every protected page's `page.tsx` | Can this user see this page? | Prisma via `getUserAndStaff` |
| **API routes** | Every `app/api/**/route.ts` handler | Can this user perform this action? | Prisma via `getUserAndStaff` |

The proxy stays simple. All permission logic lives in server components and API handlers, which run on the Node runtime and can use Prisma directly. This matches the POS pattern exactly.

### The `module.access` rule

Every module has an `access` permission. It is the gate for the entire module:
- No `module.access` → sidebar item hidden, page redirects to `/unauthorized`, every API route in that module returns 403.
- `module.access` is a prerequisite for every other action in the module. Having `leases.update` without `leases.access` is meaningless and never happens.

### Permissions for features that don't exist yet

The catalog includes permissions for actions that don't have a UI button or API route yet — for example, a `delete` permission for a module where the delete feature isn't built. This is intentional. The permission row is seeded now, so when the feature ships later we only wire up the `hasPermission` check, we don't also have to seed a new row and retroactively update every role in the database. Roles created before the feature ships simply won't have that permission ticked; the Owner adds it through the admin UI once the feature is live. Phase 3 enforcement only adds `hasPermission` calls to routes and buttons that actually exist — unimplemented actions are a seed-only entry until their feature lands.

### Page protection

At the top of every protected page's server component:

```ts
await requirePermission('leases.access')
```

`requirePermission` is a server helper that reads the current staff's permission set and throws `redirect('/unauthorized')` if the permission is missing. It runs before the page renders — no flash of protected content.

### API protection

After the existing `getUserAndStaff()` call in every route handler:

```ts
const { user, staff, permissions, error } = await getUserAndStaff()
if (error) return error
if (!hasPermission(permissions, 'leases.end'))
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
```

GET routes use `module.access`. Writes use the specific action (`create`, `update`, `end`, `transfer`, etc.).

### Client UI gating

A React Context (`UserProvider`) fetches `/api/me` once on mount and caches `{ user, role, permissions: Set<string> }`. Every client component can call:

```ts
const { can, canAny } = usePermissions()
```

Used to:
- **Sidebar**: filter menu items by `can('module.access')`. Sub-menu parents hidden if no visible children.
- **Buttons**: `{can('properties.create') && <Button />}`.
- **Detail page tabs**: tab bar filters its tab list by `can('sub_module.access')`. Hidden tabs simply don't render.
- **Embedded cards**: wrap in `<PermissionGate permission="leases.access">` — renders the card if allowed, renders a restricted-UI placeholder (small card saying "You don't have access to leases") if not. This prevents the overview layout from collapsing.

### Nested detail pages

Pages like `/properties/[id]/leases` have their own `page.tsx` server components. Each gets its own sub-module `requirePermission` — e.g. the leases tab under property detail requires `leases.access`. If a user with only `properties.access` types the URL directly, they redirect to `/unauthorized`. The tab is also hidden in the tab bar client-side.

Summary cards on overview pages (current lease card, recent payments card, etc.) wrap in `<PermissionGate>`. If the user lacks the sub-module access, the card is replaced with a small "No access" placeholder so the layout stays clean.

### 30-second permission cache

Loading permissions on every request from Prisma would be wasteful. We add an in-memory TTL cache keyed by `staff.id`:

- First call for a user → Prisma join, cache result, TTL 30 seconds.
- Subsequent calls within 30s → return cached `Set<string>`, no DB hit.
- After 30s → re-fetch.
- **Explicit invalidation** on `PATCH /api/roles/:id` (every staff assigned to that role) and `PATCH /api/staff/:id` (just that staff). Role changes propagate immediately instead of waiting for TTL expiry.

React's `cache()` wrapper is also applied so multiple server components in one request share a single fetch.

---

### Patterns to copy

Every Phase 3 edit follows one of the shapes below. Copy them exactly — do not improvise. Consistency makes the rollout mechanical instead of case-by-case, and makes review trivial.

#### Pattern A — Protecting an API route

**What you edit**: every `route.ts` file under `app/api/{module}/**/*.ts`.

**What you do**: after the existing `getUserAndStaff()` call, add a `hasPermission()` check. GET routes use `{module}.access`; writes use the specific action.

```diff
 import { NextResponse } from 'next/server'
 import { getUserAndStaff } from '@/utils/getUserAndStaff'
+import { hasPermission } from '@/lib/has-permission'

 export async function POST(req: Request) {
-  const { user, staff, error } = await getUserAndStaff()
-  if (error) return error
+  const { user, staff, permissions, error } = await getUserAndStaff()
+  if (error) return error
+  if (!hasPermission(permissions, 'leases.end'))
+    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

   // ... rest of handler unchanged
 }
```

**Function to call**: `hasPermission(permissions, 'module.action')` from `@/lib/has-permission`.

**Rule**: the check comes immediately after `getUserAndStaff`, before body parsing or validation. One check per handler. Never skip it.

---

#### Pattern B — Protecting a page server component

**What you edit**: every `page.tsx` file under `app/(protected)/{module}/**/page.tsx`.

**What you do**: add one line at the top of the server component.

```tsx
import { requirePermission } from '@/lib/server-permissions'

export default async function LeasesPage() {
  await requirePermission('leases.access')
  // ... rest of page
}
```

**Function to call**: `requirePermission('module.access')` from `@/lib/server-permissions`. It throws `redirect('/unauthorized')` if the permission is missing.

**Rule**: for a top-level page like `/leases`, use `{module}.access`. For a nested detail tab like `/properties/[id]/leases`, use the **sub-module** permission (`leases.access`), not the parent — the parent page already enforced `properties.access`.

---

#### Pattern C — Gating client buttons and actions

**What you edit**: tables, dialogs, toolbars, and detail-page action areas where buttons currently render unconditionally.

**What you do**: call `usePermissions()` and wrap each button in a conditional.

```tsx
'use client'
import { usePermissions } from '@/hooks/use-permissions'

export function LeasesToolbar() {
  const { can } = usePermissions()
  return (
    <div>
      {can('leases.create') && <Button onClick={...}>New Lease</Button>}
      {can('leases.end')    && <Button onClick={...}>End Lease</Button>}
      {can('leases.transfer') && <Button onClick={...}>Transfer</Button>}
    </div>
  )
}
```

**Function to call**: `const { can, canAny } = usePermissions()` from `@/hooks/use-permissions`.

**Rule**: never hide a button by disabling it. Either the user has the permission and the button renders, or they don't and it doesn't render at all.

---

#### Pattern D — Filtering detail-page tab bars

**What you edit**: the tab bar component on each detail page (Property, Room, Tenant, Owner detail pages).

**What you do**: give each tab a `permission` field and filter the tab list through `can()`.

```tsx
'use client'
import { usePermissions } from '@/hooks/use-permissions'

const TABS = [
  { label: 'Overview',  href: `/properties/${id}/overview`,  permission: 'properties.access' },
  { label: 'Rooms',     href: `/properties/${id}/rooms`,     permission: 'rooms.access' },
  { label: 'Leases',    href: `/properties/${id}/leases`,    permission: 'leases.access' },
  { label: 'Views',     href: `/properties/${id}/views`,     permission: 'views.access' },
  { label: 'Bookings',  href: `/properties/${id}/bookings`,  permission: 'bookings.access' },
  { label: 'Contracts', href: `/properties/${id}/contracts`, permission: 'contracts.access' },
]

export function PropertyTabs({ id }: { id: string }) {
  const { can } = usePermissions()
  const visibleTabs = TABS.filter(t => can(t.permission))
  return <>{visibleTabs.map(...)}</>
}
```

**Function to call**: `usePermissions().can('sub_module.access')`.

**Rule**: hidden tabs don't render at all. The nested `page.tsx` for each tab also enforces `requirePermission` (Pattern B), so typing the URL directly also redirects — defense in depth.

---

#### Pattern E — Gating embedded cards and widgets (with fallback UI)

**What you edit**: overview pages that show summary cards (Property overview, Room overview, Tenant overview, Owner overview). These pages embed small cards like "Current Lease", "Recent Payments", "Active Tickets".

**What you do**: wrap each card in `<PermissionGate>` with a `fallback` that shows a small "You don't have access" placeholder card. The layout stays intact; the card just shows a restricted state.

```tsx
import { PermissionGate } from '@/components/permission-gate'
import { NoAccessCard } from '@/components/no-access-card'

<PermissionGate
  permission="leases.access"
  fallback={<NoAccessCard label="Current Lease" />}
>
  <CurrentLeaseCard propertyId={id} />
</PermissionGate>

<PermissionGate
  permission="payments.access"
  fallback={<NoAccessCard label="Recent Payments" />}
>
  <RecentPaymentsCard propertyId={id} />
</PermissionGate>
```

**Component to use**: `<PermissionGate permission="x.y" fallback={...}>` from `@/components/permission-gate`.

**Rule**:
- For summary cards on a shared overview page → always pass a `fallback`. Removing a card without a placeholder breaks the grid layout.
- For floating action buttons or toolbar icons → omit `fallback`. The element should simply vanish.
- The `<CurrentLeaseCard>` inside the gate never mounts when denied, so it never fires its `/api/leases/...` fetch. No 403 errors in the console, no wasted requests.

---

#### Pattern F — Invalidating the permission cache on role changes

**What you edit**: the role and staff PATCH handlers.

**What you do**: after writing to the database, call the cache invalidation helper so the 30s TTL doesn't hold stale permissions for the affected users.

```ts
// app/api/roles/[id]/route.ts — PATCH handler
import { invalidateByRole } from '@/lib/permissions-cache'

export async function PATCH(req, { params }) {
  // ... update role title + sync roles_permissions ...
  await invalidateByRole(params.id)   // busts cache for every staff on this role
  return NextResponse.json({ success: true })
}
```

```ts
// app/api/staff/[id]/route.ts — PATCH handler (when role_id changes)
import { invalidate } from '@/lib/permissions-cache'

export async function PATCH(req, { params }) {
  // ... update staff record ...
  if (roleIdChanged) invalidate(params.id)   // busts cache just for this staff
  return NextResponse.json({ success: true })
}
```

**Functions to call**:
- `invalidate(staffId)` from `@/lib/permissions-cache` — when a single staff's role changes.
- `invalidateByRole(roleId)` from `@/lib/permissions-cache` — when a role's permissions change, affects every staff on that role.

**Rule**: invalidation goes **after** the DB write, not before. If the DB write fails, the cache stays correct.

---

#### Pattern G — Sidebar filtering

**What you edit**: [components/app-sidebar.tsx](../components/app-sidebar.tsx), the `staffMenuItems` array.

**What you do**: add a `permission` field to each menu item. Filter the array through `can()` inside the component. Hide sub-menu parents that have no visible children.

```tsx
const staffMenuItems = [
  { icon: GaugeIcon, label: 'Dashboard',  href: '/dashboard', permission: 'dashboard.access' },
  { icon: ProjectIcon, label: 'Projects', href: '/projects',  permission: 'projects.access' },
  {
    icon: HouseIcon, label: 'Properties',
    subMenu: [
      { label: 'Properties', href: '/properties', permission: 'properties.access' },
      { label: 'Rooms',      href: '/rooms',      permission: 'rooms.access' }
    ]
  },
  // ... etc
]

const { can } = usePermissions()
const visibleMenu = staffMenuItems
  .map(item => item.subMenu
    ? { ...item, subMenu: item.subMenu.filter(s => can(s.permission)) }
    : item
  )
  .filter(item => item.subMenu ? item.subMenu.length > 0 : can(item.permission))
```

**Function to call**: `usePermissions().can('module.access')`.

**Rule**: sidebar items map 1:1 to `{module}.access` permissions. A sub-menu parent is hidden if all its children are hidden.

---

## 4. Core code & flow

This section shows the actual code for every foundation file and walks through what happens end-to-end on a page load. Read this before starting Phase 1 — every snippet in Section 3 (Patterns to copy) depends on the helpers defined here.

### 4.1 End-to-end flow on a page load

Imagine a logged-in staff member opens `/properties` in the browser. Here is exactly what runs, in order:

1. **Proxy runs at the edge** ([utils/supabase/proxy.ts](../utils/supabase/proxy.ts)). Checks the Supabase session cookie. User is logged in as staff, has an organization → request passes through. **No permission check here.** The proxy's only job is auth + user-type routing.

2. **Next.js matches the route** to [app/(protected)/properties/(with-loading)/page.tsx](../app/(protected)/properties/(with-loading)/page.tsx), which is a Server Component.

3. **The protected layout renders first**. [app/(protected)/layout.tsx](../app/(protected)/layout.tsx) wraps its `children` in `<UserProvider>` (added in Phase 1). On the server, `<UserProvider>` is just a passthrough — it only does work when it hydrates on the client.

4. **The page's Server Component starts executing.** Line 1 is `await requirePermission('properties.access')`.

5. **`requirePermission` internally calls `getUserAndStaff()`**, which does:
   - React `cache()` wrapper → if another server component in the same request already called it, returns the memoized value.
   - Calls `supabase.auth.getUser()` to get the current user ID.
   - Calls `getCached(userId)` on the in-memory TTL cache. **Cache hit within 30s** → returns `{ user, staff, permissions, role }` using the cached permission set, done.
   - **Cache miss** → runs one Prisma query that joins `staff → roles → roles_permissions → permissions`, builds `Set<string>` (e.g. `Set { 'properties.access', 'properties.create', 'leases.access', ... }`), calls `setCached(userId, roleId, permissions)`, returns.

6. **Permission check inside `requirePermission`**: `if (!permissions.has('properties.access')) redirect('/unauthorized')`.
   - If allowed → `requirePermission` returns void, the page continues rendering.
   - If denied → `redirect()` throws a special Next.js error that aborts the server component and sends a 307 redirect to `/unauthorized`. **The page's data fetching never runs.**

7. **Page finishes rendering on the server**. HTML streams to the browser.

8. **Client hydrates**. `<UserProvider>` mounts on the client and fires `fetch('/api/me')` exactly once.

9. **`/api/me` runs on the server**. It calls `getUserAndStaff()` again — which is a cache hit from step 5 because we're still within the same 30s window. Returns `{ user, staff, role, permissions: string[] }`.

10. **`<UserProvider>` receives the response** and stores it in React state. The `permissions: string[]` array is converted to a `Set<string>` inside the provider for O(1) lookups.

11. **Any client component that calls `usePermissions()`** reads from this React Context. `const { can } = usePermissions()` + `can('leases.create')` is literally `permissions.has('leases.create')`.

12. **The properties list renders.** The "New Property" button is wrapped in `{can('properties.create') && ...}`, so it only shows if the user has the permission. The table's action dropdown items ("Edit", "Delete") are each wrapped the same way.

13. **User clicks "Edit Property"**. PATCH `/api/properties/[id]/edit` fires.

14. **The route handler** calls `getUserAndStaff()` — cache still hot, returns instantly. Then `hasPermission(permissions, 'properties.update')`. If true → proceeds. If false → returns 403.

15. **Owner edits the user's role** in `/staff/roles`. The PATCH handler calls `invalidateByRole(roleId)` **after** the DB write. The affected user's next request sees a cache miss → re-fetches fresh permissions from Prisma → new permissions take effect immediately.

**Summary of who does what:**

| Concern | Where | Why there |
|---|---|---|
| Auth (logged in?) | Proxy | Edge, uses Supabase REST, no Prisma needed |
| User type routing (staff vs tenant) | Proxy | Same reason |
| Page access (can see this page?) | Server Component via `requirePermission` | Needs Prisma to read current permissions |
| Action auth (can do this thing?) | API route handler via `hasPermission` | Needs Prisma; authoritative for writes |
| UI gating (hide/show buttons, tabs, cards) | Client components via `usePermissions` | React Context, zero network after initial fetch |
| Cache freshness | `invalidate` / `invalidateByRole` in role/staff PATCH handlers | Only place roles change |

---

### 4.2 The foundation files (actual code)

#### `lib/permissions-catalog.ts`

The static source of truth — every permission the app supports. This file is **NEVER mutated at runtime**. The seed script reads it and upserts into the `permissions` table. The role dialog UI reads it to render the checkbox list.

```ts
// lib/permissions-catalog.ts

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
  // ... all 103 entries, grouped by module
]
```

See [.local/docs/roles-and-permissions.md](../.local/docs/roles-and-permissions.md) for the full catalog text — titles and descriptions are copied from there.

---

#### `lib/permissions-cache.ts`

Process-local in-memory TTL cache. Keyed by `staff.id`. 30 second TTL. Explicit invalidation on role changes.

```ts
// lib/permissions-cache.ts

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
```

**Notes**:
- Per-process. Each Next.js server instance has its own Map. On Vercel, each warm lambda shares the cache across requests; cold starts pay one DB query.
- Linear scan inside `invalidateByRole` is fine because the cache is bounded by active staff count (typically low hundreds per process).
- No LRU eviction — entries expire naturally via TTL. If memory ever becomes a concern, add a periodic sweep.

---

#### `lib/has-permission.ts`

Pure helpers. No state. Used inside API routes.

```ts
// lib/has-permission.ts

export function hasPermission(permissions: Set<string>, perm: string): boolean {
  return permissions.has(perm)
}

export function hasAny(permissions: Set<string>, ...perms: string[]): boolean {
  return perms.some(p => permissions.has(p))
}

export function hasAll(permissions: Set<string>, ...perms: string[]): boolean {
  return perms.every(p => permissions.has(p))
}
```

---

#### `utils/getUserAndStaff.ts` (updated)

The core auth function, extended to load permissions with cache integration and wrapped in React `cache()`.

```ts
// utils/getUserAndStaff.ts
'use server'

import { cache } from 'react'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { getCached, setCached } from '@/lib/permissions-cache'

type StaffInfo = { id: string; organization_id: string }

type Success = {
  user: NonNullable<Awaited<ReturnType<typeof createClient>>['auth']['getUser']> extends any ? any : never
  staff: StaffInfo
  permissions: Set<string>
  role: string | null
  error: null
}

type Failure = {
  user: null
  staff: null
  permissions: Set<string>
  role: null
  error: NextResponse
}

export const getUserAndStaff = cache(async (): Promise<Success | Failure> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      user: null, staff: null, permissions: new Set(), role: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // Fast path — cache hit
  const cached = getCached(user.id)
  if (cached) {
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { id: true, organization_id: true }
    })
    if (!staff) {
      return {
        user: null, staff: null, permissions: new Set(), role: null,
        error: NextResponse.json({ error: 'Staff record not found' }, { status: 404 })
      }
    }
    return { user, staff, permissions: cached, role: null, error: null }
  }

  // Cold path — Prisma join to build the permission set
  const row = await prisma.staff.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      organization_id: true,
      role_id: true,
      roles: {
        select: {
          title: true,
          roles_permissions: {
            select: {
              permissions: { select: { module: true, action: true } }
            }
          }
        }
      }
    }
  })

  if (!row) {
    return {
      user: null, staff: null, permissions: new Set(), role: null,
      error: NextResponse.json({ error: 'Staff record not found' }, { status: 404 })
    }
  }

  const permissions = new Set<string>(
    row.roles?.roles_permissions.map(rp =>
      `${rp.permissions.module}.${rp.permissions.action}`
    ) ?? []
  )

  setCached(user.id, row.role_id, permissions)

  return {
    user,
    staff: { id: row.id, organization_id: row.organization_id },
    permissions,
    role: row.roles?.title ?? null,
    error: null
  }
})
```

**Why `cache()`**: if 5 server components in the same request each call `getUserAndStaff()`, they share one execution. Prevents redundant Prisma queries within a single render pass.

**Why two code paths**: the cache only stores permissions, not the full staff record. On a cache hit we still fetch `{ id, organization_id }` because existing API routes need it. This second query is a trivially cheap primary-key lookup. Optional optimization: also cache `organization_id` and skip the second query entirely — do this later if profiling says it matters.

**Backward compatibility**: every existing caller destructures `{ user, staff, error }`. Those callers keep working unchanged because we only added fields.

---

#### `lib/server-permissions.ts`

Server-side helper for use in Server Components. Throws a redirect on failure.

```ts
// lib/server-permissions.ts
import { redirect } from 'next/navigation'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function requirePermission(perm: string) {
  const { permissions, error } = await getUserAndStaff()
  if (error) redirect('/login')
  if (!permissions.has(perm)) redirect('/unauthorized')
}

export async function requireAnyPermission(...perms: string[]) {
  const { permissions, error } = await getUserAndStaff()
  if (error) redirect('/login')
  if (!perms.some(p => permissions.has(p))) redirect('/unauthorized')
}
```

**Why `redirect()` and not throw a response**: Next.js Server Components can't return a 403 response directly. `redirect()` is the idiomatic way to abort rendering and send the browser somewhere else. Internally, `redirect()` throws a `NEXT_REDIRECT` error that the Next.js runtime catches and converts into a 307.

---

#### `app/api/me/route.ts`

The single client-facing endpoint for "who am I + what can I do".

```ts
// app/api/me/route.ts
import { NextResponse } from 'next/server'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function GET() {
  const { user, staff, permissions, role, error } = await getUserAndStaff()
  if (error) return error

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email
    },
    staff: {
      id: staff.id,
      organization_id: staff.organization_id
    },
    role,
    permissions: Array.from(permissions)
  })
}
```

Returns the permission set as a plain array (not a `Set`, because JSON doesn't serialize `Set`). The client converts it back to a `Set` inside the provider.

---

#### `contexts/user-context.tsx`

The client-side provider. Fetches `/api/me` once on mount, stores the result, exposes `can`/`canAny`.

```tsx
// contexts/user-context.tsx
'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type UserData = {
  user: { id: string; email: string } | null
  staff: { id: string; organization_id: string } | null
  role: string | null
  permissions: string[]
}

type UserContextValue = {
  user: UserData['user']
  staff: UserData['staff']
  role: UserData['role']
  permissions: Set<string>
  can: (perm: string) => boolean
  canAny: (...perms: string[]) => boolean
  isLoading: boolean
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/me', { credentials: 'include' })
      .then(res => (res.ok ? res.json() : null))
      .then(json => { if (!cancelled) setData(json) })
      .catch(() => { if (!cancelled) setData(null) })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [])

  const permissions = useMemo(
    () => new Set<string>(data?.permissions ?? []),
    [data]
  )

  const value: UserContextValue = useMemo(() => ({
    user: data?.user ?? null,
    staff: data?.staff ?? null,
    role: data?.role ?? null,
    permissions,
    can: (perm: string) => permissions.has(perm),
    canAny: (...perms: string[]) => perms.some(p => permissions.has(p)),
    isLoading
  }), [data, permissions, isLoading])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>')
  return ctx
}
```

**Why a Set inside the provider**: every `can()` call becomes O(1). `Array.includes()` would be O(n) on a 100-permission list, and `can()` is called dozens of times per render.

**Why memoize `value`**: without `useMemo`, every parent re-render creates a new `value` object → every consumer of `useUser()` re-renders. With it, consumers only re-render when `data` actually changes.

---

#### `hooks/use-permissions.ts`

Thin re-export so callers don't have to know about `useUser`.

```ts
// hooks/use-permissions.ts
'use client'
import { useUser } from '@/contexts/user-context'

export function usePermissions() {
  const { can, canAny, permissions, isLoading } = useUser()
  return { can, canAny, permissions, isLoading }
}
```

---

#### `components/permission-guard.tsx`

Full-page protection for client components. Use when the page is client-side only or when server-side `requirePermission` is impractical. Prefer the server-side helper when possible.

```tsx
// components/permission-guard.tsx
'use client'

import { useUser } from '@/contexts/user-context'
import PageLoader from '@/components/loading-ui/page-loader'
import Unauthorized from '@/app/(protected)/unauthorized'

export function PermissionGuard({
  permission,
  children
}: {
  permission: string
  children: React.ReactNode
}) {
  const { can, isLoading } = useUser()
  if (isLoading) return <PageLoader />
  if (!can(permission)) return <Unauthorized />
  return <>{children}</>
}
```

---

#### `components/permission-gate.tsx`

Inline widget/card wrapper. Used around embedded cards on overview pages.

```tsx
// components/permission-gate.tsx
'use client'

import { useUser } from '@/contexts/user-context'

export function PermissionGate({
  permission,
  fallback = null,
  children
}: {
  permission: string
  fallback?: React.ReactNode
  children: React.ReactNode
}) {
  const { can, isLoading } = useUser()
  if (isLoading) return null
  if (!can(permission)) return <>{fallback}</>
  return <>{children}</>
}
```

**Difference from `PermissionGuard`**:
- `PermissionGuard` shows a full loader and full unauthorized page — for whole-page protection.
- `PermissionGate` returns `null` while loading and renders an optional inline fallback — for cards and widgets that live inside an already-allowed page.

---

### 4.3 Where everything connects

```
┌───────────────────────────────────────────────────────────────────┐
│                          Browser request                          │
└───────────────────────────┬───────────────────────────────────────┘
                            │
                ┌───────────▼───────────┐
                │  proxy.ts (edge)      │  ← auth only, no permissions
                └───────────┬───────────┘
                            │
            ┌───────────────▼───────────────┐
            │  app/(protected)/layout.tsx   │
            │  wraps in <UserProvider>      │
            └───────────────┬───────────────┘
                            │
            ┌───────────────▼────────────────────┐
            │  page.tsx (Server Component)       │
            │  await requirePermission('x.y')    │
            └───────────────┬────────────────────┘
                            │
                ┌───────────▼────────────┐
                │   getUserAndStaff()    │  ← React cache()
                │   ├─ getCached()       │  ← 30s TTL
                │   └─ Prisma join       │  ← on cache miss
                └───────────┬────────────┘
                            │
                            ▼
                   returns Set<string>
                            │
                 ┌──────────┴──────────┐
                 ▼                     ▼
     server component renders    client hydrates
                                        │
                                        ▼
                      <UserProvider> fetches /api/me
                                        │
                                        ▼
                      UserContext holds Set<string>
                                        │
                      ┌─────────────────┼─────────────────┐
                      ▼                 ▼                 ▼
               usePermissions()    PermissionGuard    PermissionGate
                      │                 │                 │
                 can('x.y')         full page          inline card
```

Every arrow points at a real function call. Every function has code above.

---

## 5. What we build

### 5.1 New files (15)

#### Phase 1 — Foundation

| # | File | Purpose |
|---|---|---|
| 1 | `lib/permissions-catalog.ts` | The static list of all 103 permissions as `{ module, action, title, description }`. Single source of truth, imported by the seed script and the role admin UI. |
| 2 | `lib/permissions-cache.ts` | In-memory TTL cache keyed by `staffId`. Exports `getCached`, `setCached`, `invalidate(staffId)`, `invalidateByRole(roleId)`. |
| 3 | `lib/has-permission.ts` | Pure helpers: `hasPermission(set, 'x.y')`, `hasAny(set, ...)`. Used by every API route. |
| 4 | `lib/server-permissions.ts` | Server-side `requirePermission(perm)`. Throws `redirect('/unauthorized')` if missing. Used in server components. |
| 5 | `scripts/seed-permissions.ts` | CLI script that upserts the catalog into the `permissions` table. Idempotent. Run `bun run seed:permissions`. |
| 6 | `scripts/seed-owner-role.ts` | CLI script: for every org, creates an "Owner" role with all permissions attached if missing. Run once during rollout, again any time new permissions are added. |
| 7 | `app/api/me/route.ts` | New endpoint. Returns `{ user, staff, role, permissions: string[] }`. Called once on client mount. |
| 8 | `contexts/user-context.tsx` | Client `UserProvider`. Fetches `/api/me` once, caches `{ user, role, permissions, can, canAny, isLoading }` via React Context. |
| 9 | `hooks/use-permissions.ts` | Thin hook exposing `can()` and `canAny()` from the context. |
| 10 | `components/permission-guard.tsx` | `<PermissionGuard permission="x.y">{children}</PermissionGuard>`. Full-page wrapper. Shows loader → unauthorized page → content. |
| 11 | `components/permission-gate.tsx` | `<PermissionGate permission="x.y" fallback={...}>{children}</PermissionGate>`. Inline widget/card wrapper. Renders children if allowed, renders fallback (or null) if not. |

#### Phase 2 — Admin UI

| # | File | Purpose |
|---|---|---|
| 12 | `app/api/permissions/route.ts` | `GET` — returns all 103 permissions grouped by module. Drives the role dialog checkboxes. |
| 13 | `app/api/roles/[id]/route.ts` | `PATCH` (update title + sync permissions in one transaction) and `DELETE` (rejected for Owner, rejected if any staff assigned). |
| 14 | `app/(protected)/staff/roles/page.tsx` | Roles management page. Gated by `requirePermission('roles.access')`. Lists roles with title, permission count, staff count, actions. |
| 15 | `components/dialogs/role-dialog.tsx` | Create/edit role modal. Module-grouped permission checkboxes. Toggling the module's "access" cascades to its sub-actions. Owner role renders read-only. |

### 5.2 Edited files

#### Phase 1

| File | Change |
|---|---|
| [utils/getUserAndStaff.ts](../utils/getUserAndStaff.ts) | Add the permissions join and cache integration. New return shape: `{ user, staff, permissions: Set<string>, role, error }`. Backward compatible — existing callers that ignore the new fields keep working. Wrap with React `cache()` for per-request deduplication. |
| [app/(protected)/layout.tsx](../app/(protected)/layout.tsx) | Wrap `children` in `<UserProvider>` next to `NotificationProvider`. |

#### Phase 2

| File | Change |
|---|---|
| [app/api/roles/route.ts](../app/api/roles/route.ts) | Expand `GET` to return `{ id, title, is_owner, permission_count, staff_count }[]`. Add `POST` for creating roles with a permission list. Gate both with `roles.*`. |
| [app/(protected)/staff/page.tsx](../app/(protected)/staff/page.tsx) | Add a "Manage Roles" button/link that navigates to `/staff/roles`, rendered only when `can('roles.access')`. |

#### Phase 3 — Enforcement (the bulk)

**Every API route under `app/api/{module}/**/*.ts`** (~110 files) gets a `hasPermission` check after `getUserAndStaff()`. Pattern:

```diff
- const { user, staff, error } = await getUserAndStaff()
- if (error) return error
+ const { user, staff, permissions, error } = await getUserAndStaff()
+ if (error) return error
+ if (!hasPermission(permissions, 'leases.end'))
+   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
```

**Every protected page under `app/(protected)/{module}/**/page.tsx`** (~60 files) gets a `requirePermission` call at line 1 of its server component.

**Plus these specific high-traffic edits**:

| File | Change |
|---|---|
| [components/app-sidebar.tsx](../components/app-sidebar.tsx) | Each menu item gets a `permission` field. Filter `menuItemContent` by `can(item.permission)`. Hide sub-menu parents if none of their children are accessible. |
| [utils/supabase/proxy.ts](../utils/supabase/proxy.ts) | Remove the `RESTRICTED_STAFF_EMAILS` / `RESTRICTED_STAFF_ALLOWED_PATHS` constants and the block that enforces them. Those two users get a role with only `tasks.*` + `tickets.*`. |
| Tab bars on detail pages | Property/Room/Tenant/Owner detail pages each have a tab component. Each one maps its tab list to `can(sub_module_permission)` and filters. |
| Overview pages | Property/Room/Tenant/Owner overview pages wrap their summary cards in `<PermissionGate>`. |
| Table action dropdowns | `components/tables/*.tsx` — each action item (Edit, Delete, etc.) wrapped with `{can('module.action') && ...}`. |
| "Add X" buttons | `components/add-*.tsx` and inline "New X" buttons — rendered only when `can('module.create')`. |
| Detail-page action buttons | "Initiate Preparation", "End Lease", "Schedule Rent Change", etc. — each gated with its specific permission. |

---

## 6. Phases

### Phase 1 — Foundation

**Goal**: Load permissions end-to-end. Expose them to every server component and client component. No enforcement yet — nothing is gated.

**Deliverables**: 11 new files (catalog, cache, helpers, seed scripts, `/api/me`, context, hook, guards). 2 edited files (`getUserAndStaff`, protected layout).

**Verify it works**: Log in as any staff member. Open devtools. `fetch('/api/me')` returns your permissions array. Call `usePermissions().can('anything')` in a test component — returns true/false based on real DB state. Run seed scripts against a dev org and confirm rows exist.

---

### Phase 2 — Admin UI

**Goal**: Owner can create, edit, and delete roles through the UI. Permission assignments are UI-driven from this point forward.

**Deliverables**: 4 new files (`/api/permissions`, `/api/roles/[id]`, roles page, role dialog). 2 edited files (expanded `/api/roles`, link from staff page).

**Verify it works**: Log in as Owner. Navigate to `/staff/roles`. Create a new role called "Test Manager" with only `properties.*` permissions. Edit it. Delete it. Try to delete the Owner role — rejected. Try to delete a role with staff assigned — rejected. Assign the Test Manager role to a real staff member via `/staff`.

---

### Phase 3 — Enforcement rollout

**Goal**: Every API route and every protected page enforces the right permission. Every button, tab, and card respects the current user's role.

**Deliverables**: ~170 mechanical edits (110 API routes + 60 pages) + the specific edits for sidebar, proxy, tab bars, overview cards, table action dropdowns, and add-buttons.

**Ordering** (see Section 7 for full list): one module per commit, low-risk modules first, `staff` and `roles` last.

**Verify each module**: after rolling out a module, log in as (a) Owner — should see everything, (b) a role with only that module's `access` — should see the module but not others, (c) a role without that module's `access` — should not see the module at all. Try to hit the module's API routes directly — 403.

---

### Phase 4 — Cleanup

**Goal**: Remove dead code and finalize.

**Deliverables**: Delete `RESTRICTED_STAFF_EMAILS` + its enforcement block in the proxy (only after all 18 modules are enforced and the two affected users have been migrated to a real role). Add a short `docs/permissions.md` reference table. Smoke test the whole app as Owner and as a restricted role.

---

## 7. Phase 3 rollout order

One module per commit. Low-risk first so the pattern is validated on simple modules before touching the high-risk ones. `staff` and `roles` go last so a permission mistake doesn't lock us out of the admin UI.

1. `dashboard` — 1 permission, read-only.
2. `projects` — simple CRUD.
3. `agents`, `vendors`, `owners` — simple CRUD, independent.
4. `rooms`, `properties` — large surface, many sub-actions.
5. `tenants` — touches auth invites.
6. `leases`, `bookings`, `contracts` — lifecycle-heavy.
7. `payments`, `expenses` — financial, sensitive.
8. `tasks`, `tickets` — many actions.
9. `views`.
10. `staff`, `roles` — last. Also in this step: filter the sidebar, remove `RESTRICTED_STAFF_EMAILS` from the proxy.

---

## 8. Day 1 safety

The day we merge Phase 1 + Phase 2 + start Phase 3, nothing should lock anyone out. Order of operations:

1. **Run `seed-permissions.ts`** against the production database. Upserts all 103 rows into `permissions`. Safe to re-run, no side effects.
2. **Run `seed-owner-role.ts`** against production. For every organization, creates an "Owner" role with all 103 permissions attached if one doesn't already exist.
3. **Reassign existing staff to Owner role** (done by the script, optional per-org override). Every existing staff member gets `role_id = Owner.id` for their org. This means every current user keeps full access — nobody loses anything on Day 1.
4. **Deploy Phase 1 + Phase 2 code**. The admin UI at `/staff/roles` is now visible to everyone (because everyone is Owner). No enforcement yet, so no behavior change.
5. **Owners configure their real roles** through the admin UI. They create "Property Manager", "Accountant", etc. and reassign non-owner staff to those roles. They do this at their own pace.
6. **Phase 3 rollout begins**, one module at a time. Because most staff are still on Owner, nothing breaks. As Owners migrate staff to reduced roles, the permissions start mattering.

The key invariant: **no staff member loses access on Day 1**. They lose access only when an Owner explicitly moves them to a reduced role. This is the Owner's decision, not ours.

---

## 9. Timeline & open questions

### Estimated time

| Phase | Focused hours | Wall-clock |
|---|---|---|
| Phase 1 — Foundation | 10-12 hrs | 1.5-2 days |
| Phase 2 — Admin UI | 12-15 hrs | 2 days |
| Phase 3 — Enforcement rollout | 35-40 hrs | ~1 week |
| Phase 4 — Cleanup | 3-5 hrs | 0.5 day |
| Buffer (surprises, bug fixes, reviews) | 8-12 hrs | 1-2 days |
| **Total** | **~70-85 hrs** | **~3 weeks full-time** |

With parallel work or interruptions, wall-clock stretches to ~1 month.

### Open questions

1. **Default roles beyond Owner** — do we seed additional templates like "Administrator", "Property Manager", "Accountant"? Or leave every non-Owner role to be created manually by the Owner through the UI?
2. **Sensitive role changes** — when an Owner demotes someone, should we optionally force-sign-out the affected user so their session refreshes immediately, or is the 30s cache TTL + explicit cache invalidation enough?
3. **`/api/user/info` migration** — do we eventually migrate the sidebar to read from `/api/me` and delete `/api/user/info`, or leave both endpoints in place? Low priority either way.
4. **Restricted cards fallback UI** — what does the "No access" placeholder look like visually on overview pages? Needs a small design decision before Phase 3 detail-page work.
