
### 2.2 Modified Files
| File | Changes |
|------|---------|
| `middleware.ts` | Added permission checks for protected routes; tenant access routing |
| `utils/getUserAndStaff.ts` | Extended to fetch roles, permissions, and `roleTitle` via `permissions-cache` |
| `app/api/me/route.ts` | Added `userType` and tenant permissions in response |
| `contexts/user-context.tsx` | Added tenant user support alongside staff |

### 2.3 New Permissions Added
- `staff.change_role` — allows changing another staff member's role (requires `staff.update`)
- `leases.update` — allows editing existing leases
- Tenant-specific: `tenants.view_own`, `tenants.view_lease`, `tenants.make_payment`, `tenants.view_property`
- `calendar.create` — create custom calendar events

---

## 3. Staff Editing Feature

### 3.1 New Files
| File | Purpose |
|------|---------|
| `app/(protected)/staff/[id]/edit/page.tsx` | Staff edit form with role assignment |
| `app/api/staff/[id]/update/route.ts` | PUT API to update staff details and role |

### 3.2 Modified Files
| File | Changes |
|------|---------|
| `components/tables/staff-table.tsx` | Extracted `StaffActionsCell` component (hooks violation fix) |
| `components/staff/edit-staff.tsx` | Non-owners cannot assign "Owner" role; Owner-to-Owner editing restricted |

### 3.3 Rules
- Only **Owner** role users can edit other **Owner** staff.
- Non-owners cannot assign the "Owner" role via the edit UI.
- `staff.change_role` permission required for role changes (in addition to `staff.update`).

---

## 4. Lease Edit Feature

### 4.1 New API Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/leases/details` | GET | Fetch lease data for edit form (query: `?leaseId=xxx`) |
| `/api/leases/update` | PUT | Update lease fields (body includes `leaseId`) |

> **Note:** Originally created as `[leaseId]/` dynamic segments but flattened to avoid Next.js conflict with existing `[propertyId]/` sibling directory.

### 4.2 New Pages
| Page | Purpose |
|------|---------|
| `app/(protected)/properties/[id]/.../leases/[leaseId]/edit/page.tsx` | Edit property lease |
| `app/(protected)/rooms/[id]/.../leases/[leaseId]/edit/page.tsx` | Edit room lease |

### 4.3 Modified Files
| File | Changes |
|------|---------|
| `components/lease-details/lease-details-content.tsx` | Added "Edit" button in header (Current/Scheduled leases only) |
| `components/tables/leases-table.tsx` | Extracted `LeaseActionsCell` component; added "Edit Lease" to dropdown menu |

### 4.4 Rules
- Only **Current** or **Scheduled** leases can be edited.
- Requires `leases.update` permission.
- Editable fields: start_date, number_of_months, monthly_rent, payment_day, reminder settings.

---

## 5. Tenant Portal Access Fixes

| File | Changes |
|------|---------|
| `lib/server-permissions.ts` | `requirePermission()` now checks `userType === 'tenant'` against `TENANT_PERMISSIONS` before falling back to staff logic |
| `app/api/me/route.ts` | Added `TENANT_PERMISSIONS` constant; returns correct permissions for tenant users |
| `components/sections/rentals-section.tsx` | Tenant access to Rentals page |
| `components/sections/payments-section.tsx` | Tenant access to Payments page |
| Tenant access to Tickets, Notifications pages | Fixed via `requirePermission` tenant branch |

---

## 6. Bug Fixes

| Issue | Fix |
|-------|-----|
| React hooks called inside table `cell` functions | Extracted `StaffActionsCell` and `LeaseActionsCell` as standalone components |
| `can is not defined` error in leases table | Extracted `LeaseActionsCell`; permissions checked inside component |
| `leases.terminate` permission not found | Changed to `leases.end` and `leases.transfer` (correct permissions) |
| Owner role editing broken (null `roleTitle`) | Added `roleTitle` to `permissions-cache` fetch and return |
| Duplicate JSX in staff-table | Removed duplicate render |
| `propertyId=undefined` causing 500 errors | Added strict guards in `add-lease/page.tsx` and `view-conversion-modal.tsx` |
| `LeasesSection` routing to wrong path | Fixed `handleAddLease` to check `roomId` before `propertyId` |

---
