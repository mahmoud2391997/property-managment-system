# Calendar Feature — Plan

## Context

The property management app needs a calendar feature that gives staff a single "what do I need to act on" view across the business. Today, due payments, due expenses, due tasks, pending assignments, and lease lifecycle events are scattered across multiple pages with no unified date-anchored view. Staff have to remember which dates matter and check each module separately.

Through extensive discussion the design and scope have been agreed. Two prerequisite features must ship before the calendar can be built, and a placeholder secondary sidebar must exist on the right edge of the app to host the calendar entry point.

## Design — what the calendar looks like

### Layout
- **Month view only** (no week view, no separate day view).
- **Top half: month grid** — 7×N day cells showing date numbers and stacked all-day chips for that day.
- **Bottom half: hour grid for the selected day** — vertical timeline (24 hours) showing manual time-based events for whichever day is selected in the month grid above. Clicking a day in the month grid updates the hour grid below.
- **Header bar**: month/year title, prev/next month arrows, "Today" button, "Create event" button (opens manual event modal).

### Day cells (month grid)
- Date number (today highlighted).
- Stacked **all-day chips** ordered: overdue first (red), then due (neutral), then info (lease starts, etc.).
- "+ N more" link if chips overflow → opens popover listing all chips for that day.
- Empty days show only the date number.

### Chips
- Format: `<icon> <count> <label> — <total amount where relevant>`
  - e.g. `💰 100 rent due — RM 180,000`
  - e.g. `🏢 3 property expenses overdue — RM 1,200`
- **Two visual states**:
  - **Due** — today or future, unpaid/open. Neutral color.
  - **Overdue** — past date, still unpaid/open. Red border/background. Anchored to original date.
- **Done/paid items hidden entirely** — calendar only shows actionable work.
- **Aggregation rules**:
  - Payments: one chip per day (all unpaid grouped).
  - Expenses: **one chip per category per day** (Property, Contract, Staff, Company, Purchase = up to 5 chips/day).
  - Tasks: one chip per day, urgent flagged inline (e.g. "🔧 5 tasks due (1 urgent)").
  - Assignment requests: one chip per day.
  - Lease/refund/rent-change/booking events: one chip per day per type.
- **Click behavior**:
  - **Clickable** (destination page exists): payments, expenses, tasks, assignments → navigate to filtered page.
  - **Not clickable for now** (no destination page): leases, bookings, refunds, rent changes. Will become clickable later when those pages are built.

### Hour grid (bottom half)
- Vertical 24-hour timeline for the day selected in the month grid above.
- Renders **manual events only** (system events live in the all-day strip on the month grid, not in hours).
- Manual events render as time blocks based on their timestamp + optional duration. Events without a duration render as a point marker at the timestamp.

### Manual events (the "create event" feature)
- Created via "Create event" button in the calendar header.
- Modal fields:
  - Title (required)
  - Timestamp (required — date + time)
  - Duration (optional)
  - Description (optional)
  - Attendees: "All staff" toggle, OR specific staff multi-select
- Stored in a new `calendar_events` table (schema work to be requested from the user — per memory, never modify `prisma/schema.prisma` directly).
- Visible on the month grid as an all-day chip on the event date AND in the hour grid when that day is selected.
- Editable/deletable by the creator.

### Secondary sidebar (right edge — placeholder for this scope)
- Vertical bar on the right edge of every protected page.
- Contains:
  - **User profile picture** — clicking opens a popover with user details and a sign-out button. Behaves identically to the existing left-sidebar profile/signout (out of scope to build the popover behavior; just put a placeholder that mirrors the left sidebar's behavior, or stub it).
  - **Calendar icon** — clicking navigates to the calendar page.
- Sidebar itself is **out of scope to fully implement** beyond what's needed to host the calendar entry point. The profile popover is also out of scope. But the sidebar shell + calendar icon must exist so the calendar is reachable.

## Events to show on the calendar (agreed list)

### System chips (date-based, auto-generated, aggregated, due/overdue)

| # | Event | Source data | Click target |
|---|---|---|---|
| 1 | Payments due / overdue | `payments.due_payment_timestamp` where `status = Pending` | `/payments?dueDate=X&status=Pending` (after prereq filter built) |
| 2 | Expenses due / overdue (per category) | `expenses.due_payment_date` + `expenses.category` where calculated status ∈ (Pending, Overdue) | `/expenses?category=Y&dueDate=X` (after prereq filter built) |
| 3 | Tasks due / overdue | latest `task_due_dates.due_date` per task where `task_state ∈ (Open, In_Progress, Needs_Modification)` | `/tasks?dueDate=X&status=Open,In_Progress,Needs_Modification` ✅ filter already exists |
| 4 | Pending assignment requests | `task_assignments.requested_at` where `status = Pending` for current user | `/tasks` "Pending My Assignment" tab ✅ already exists |
| 5 | Lease starts | `leases.start_date` | Inert (no destination) |
| 6 | Lease ends | `leases.ended_at` + `lease_end_schedule.scheduled_date` | Inert |
| 7 | Lease expiry reminders | computed: `lease.end_date − expiry_days_before_reminder` | Inert |
| 8 | Refunds pending / SLA breached | `task_flow_instances` of refund type + `refund_decisions.submitted_at` | Inert |
| 9 | Scheduled rent changes effective | `scheduled_rental_changes.effective_from` where status = `Scheduled` | Inert |

### Manual layer (time-based, staff-created)

| # | Event | Storage | Click target |
|---|---|---|---|
| 10 | Custom events | new `calendar_events` table | Opens event detail modal |

## Verified findings (codebase reality check)

| Module | Page | Filters today | Status values |
|---|---|---|---|
| Payments | `/payments` ✅ | Status tabs, Property, Tenant, Type, Pattern. **No due-date filter — must be added.** | `Paid, Pending, Cancelled, Unset` |
| Expenses | `/expenses` ✅ | Category tabs, Search. **No due-date filter — must be added per category.** | None — calculated client-side |
| Tasks | `/tasks` ✅ | dueDate, status, assignee, type, priority, property, room, created_by | `Open, In_Progress, Resolved, Needs_Modification` |
| Task assignments | `/tasks` "Pending My Assignment" tab ✅ | Already filters by current user + Pending status | `Pending, Accepted, Rejected, Unassigned, Cancelled` |
| Leases | No top-level page | Nested under `/properties/[id]/leases`, `/rooms/[id]/leases`, `/tenants/[id]/leases` | `lease_status_new: Current, Ended` |
| Bookings | No top-level page | Nested under property/room | `Current, Cancelled, Converted` |
| Refunds | No page | Lives as tasks with `task_type IN (Refund_Request, Refund_Finalization)` | Uses task statuses |
| Reminders | No page | Config-only on properties/leases; surface in `/notifications` | N/A |

## Performance considerations

1. **One aggregate query per chip type per visible month** — group counts by date in a single query, not per-day per-type. ~9 queries total per month load, not 270.
2. **DB indexes on every date column the calendar reads** — `payments.due_payment_timestamp`, `expenses.due_payment_date`, `task_due_dates.due_date`, `leases.start_date / ended_at`, `bookings.move_in_timestamp`, `scheduled_rental_changes.effective_from`. Without indexes, month queries scan whole tables. **User must add these to schema** (per memory rule, never modify `prisma/schema.prisma` directly).
3. **Always scope to organization_id + visible date range** — never fetch all-time, always `WHERE org = X AND date BETWEEN month_start AND month_end`.
4. **Computed events expanded server-side, not client-side** — lease expiry reminders (`end_date − N days`) and recurring expense occurrences from `recurring_configs` must be expanded in the server query, windowed to the visible month.
5. **Cache the month view** — React Query (or equivalent) with staleTime ~30–60s. Same month doesn't change every keystroke.
6. **Lazy-load chip detail panels** — chip queries return count + total only. Full row list loads only when the popover or page is opened.
7. **Pagination on detail panels** — load first 50 rows, paginate further. Don't drop 1000 rows into a popover.
8. **Avoid N+1 on relations** — chip detail rows often need tenant name, unit, property — fetch via joins/includes, not per-row queries.
9. **Skeleton UI on month load** — render the empty grid immediately; chips fade in as queries resolve. No blocking spinner.
10. **Debounce month navigation** — cancel in-flight queries when user clicks next/prev rapidly instead of stacking them.
11. **Cache manual events separately** — `calendar_events` is small; can be loaded for a wider window (e.g. quarter) and reused as the user navigates months.

## Build order (prerequisites first)

### Phase A — Prerequisite filters (must ship before calendar)

**A1. Due-date filter on `/payments`**
- Add a date range / date filter UI to the existing filter bar at `app/(protected)/payments/page.tsx` (and its filter sub-components).
- Extend the API at `app/api/payments/route.ts` (or whatever drives the page list) to accept `dueDate` / `dueDateFrom` / `dueDateTo` params.
- Filter against `payments.due_payment_timestamp`.

**A2. Due-date filter on `/expenses` per category**
- Each category tab has its own dedicated view. Add a date filter to each category's view component under `app/(protected)/expenses/`.
- Extend the API to accept `dueDate` filter param scoped per category.
- Filter against `expenses.due_payment_date`.

These two filters are the click-targets for chips #1 and #2. The calendar can navigate to the filtered page once they exist.

### Phase B — Secondary sidebar (placeholder)

**B1. Right-edge secondary sidebar shell**
- Create a thin vertical sidebar component on the right edge of `app/(protected)/layout.tsx` (or wherever the existing left sidebar is mounted).
- Two slots:
  - **Profile avatar** at top — click opens popover (mirror the existing left-sidebar profile popover behavior — out of scope to fully implement; stub the popover with current user info and a sign-out button using the existing auth signout).
  - **Calendar icon** below — clicking navigates to `/calendar`.
- Out of scope: any other items in this sidebar, full profile popover behavior beyond what already exists in the left sidebar.

### Phase C — Calendar page (main feature)

**C1. Schema additions (request from user, do not modify schema)**
Ask the user to add:
- A `calendar_events` table for manual events: `id, organization_id, title, description, timestamp, duration_minutes (nullable), is_for_all_staff (bool), created_by, created_at, updated_at`.
- A `calendar_event_attendees` table (many-to-many): `event_id, staff_id`.
- Indexes on the date columns listed in the performance section.

**C2. Calendar page route**
- New page at `app/(protected)/calendar/page.tsx`.
- Top half: month grid component.
- Bottom half: hour grid component.
- Header: month/year + prev/next + Today + Create event.

**C3. Calendar API endpoints**
- `GET /api/calendar/month?from=YYYY-MM-DD&to=YYYY-MM-DD` — returns aggregated chip data for the month range. Internally runs the per-chip-type aggregate queries and merges results by date.
- `GET /api/calendar/day-detail?date=YYYY-MM-DD&type=X` — returns the row list for a specific day + chip type (used by the popover).
- `POST /api/calendar/events` — create manual event.
- `PATCH /api/calendar/events/[id]` — edit manual event.
- `DELETE /api/calendar/events/[id]` — delete manual event.

**C4. Month grid component**
- Renders 6×7 grid (always 6 weeks for layout stability).
- Each cell takes day's chip aggregates, renders chips per the design rules.
- Chip click → navigate (if destination exists) or popover (if inert).
- Day cell click → updates the hour grid below.

**C5. Hour grid component**
- Renders 24h vertical timeline for the selected day.
- Pulls manual events for that date from `/api/calendar/events?date=X`.
- Renders events as time blocks (with duration) or point markers (no duration).
- Click event → opens detail/edit modal.

**C6. Manual event create/edit modal**
- Form: title, timestamp, optional duration, description, all-staff toggle / specific-staff multi-select.
- Validates required fields.
- Submits to API.

**C7. Computed-event server logic**
- Lease expiry reminders: SQL/server-side expansion of `end_date − expiry_days_before_reminder` for leases active in the visible window.
- Recurring expense occurrences: expand `recurring_configs` for the visible window only.

## Critical files (touch list)

**Phase A (prerequisites):**
- `app/(protected)/payments/page.tsx` — add date filter UI
- `app/(protected)/payments/components/*` — filter bar component
- `app/api/payments/route.ts` — accept dueDate param
- `app/(protected)/expenses/page.tsx` and per-category sub-views — add date filter UI
- `app/api/expenses/route.ts` — accept dueDate param
- `lib/expenses-utils.ts` — extend if status/date helpers needed

**Phase B (secondary sidebar):**
- `app/(protected)/layout.tsx` — mount right sidebar
- New: `components/secondary-sidebar/` — sidebar shell, profile slot, calendar icon

**Phase C (calendar):**
- New: `app/(protected)/calendar/page.tsx`
- New: `app/(protected)/calendar/components/month-grid.tsx`
- New: `app/(protected)/calendar/components/day-cell.tsx`
- New: `app/(protected)/calendar/components/chip.tsx`
- New: `app/(protected)/calendar/components/hour-grid.tsx`
- New: `app/(protected)/calendar/components/event-modal.tsx`
- New: `app/api/calendar/month/route.ts`
- New: `app/api/calendar/day-detail/route.ts`
- New: `app/api/calendar/events/route.ts`
- New: `app/api/calendar/events/[id]/route.ts`
- New: `lib/calendar-utils.ts` — date math, aggregation helpers, computed-event expansion

## Out of scope

- Tenant-facing calendar (separate feature, future).
- Week view, day view (only month view in v1).
- Hour-grid for system events (system events stay all-day chips).
- Full secondary-sidebar build-out — only the shell + profile placeholder + calendar icon needed.
- Full profile popover behavior — stub only.
- Personal manual reminders (the `reminders` table is config-only and surfaces in `/notifications`).
- Click-through pages for lease, refund, booking, rent-change chips (will be built later when those top-level pages exist; chips inert for now).
- RLS / role-based filtering (not verified to exist; out of scope for this plan).

## Verification (how to test end-to-end)

1. **Prerequisites:**
   - Visit `/payments`, apply a due-date filter, confirm only payments with `due_payment_timestamp` in range are shown.
   - Visit `/expenses`, switch to each category tab, apply a due-date filter, confirm only expenses with `due_payment_date` in range and matching category are shown.

2. **Secondary sidebar:**
   - Confirm the right-edge sidebar appears on every protected page.
   - Click the profile picture → popover with user info + working sign-out.
   - Click the calendar icon → navigates to `/calendar`.

3. **Calendar month grid:**
   - Open `/calendar`. Confirm month grid renders with current month.
   - Seed a payment due today (status=Pending) → see the chip on today's cell.
   - Seed a payment due 3 days ago (status=Pending) → see overdue (red) chip on that past date.
   - Mark the payment as paid → chip disappears on next refresh.
   - Repeat for expenses (each category), tasks, assignment requests.
   - Confirm lease/refund/rent-change chips appear but are inert (no navigation).

4. **Hour grid:**
   - Click a day in the month grid → hour grid below updates.
   - Create a manual event with timestamp + duration → appears as time block in the hour grid + as all-day chip on the month grid for that day.
   - Create a manual event without duration → renders as point marker.
   - Edit / delete event → reflected in both grids.

5. **Performance:**
   - With realistic data volume (1000+ payments, 500+ expenses, 200+ tasks across the org), measure month load time. Should be < 1s under normal network.
   - Confirm only one network round-trip per chip type for the month view.
   - Confirm chip detail popover lazy-loads on click, not upfront.

6. **Aggregation correctness:**
   - 100 unpaid rents on the same day → chip shows "100 rent due — RM <total>".
   - Mix of past-due and same-day → past chip is red, today's is neutral.
   - Multiple expense categories on same day → 5 separate chips.
