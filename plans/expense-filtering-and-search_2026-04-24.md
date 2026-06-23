# Expense Filtering & Search — Coding Plan

**Date**: 2026-04-24
**Companion feature**: [components/sections/payments-section.tsx](../components/sections/payments-section.tsx) — the working pattern this plan ports over.

---

## 1. Goal

Bring the Expenses list to feature parity with Payments for filtering and search, adapted to the fact that Expenses already has a category tab system. Every category (Property / Contract / Staff / Company / Purchase) gets its **own** set of advanced filters and its **own** search term. Switching categories is a clean slate — previous filters and search vanish. URL query params are the source of truth so refresh / back-button keep state.

In passing, add one small change to Payments: a "Due Month" filter, because the same `<MonthPicker>` work is being done for Expenses anyway.

---

## 2. Current state

- **Payments has the full pattern.** [components/sections/payments-section.tsx](../components/sections/payments-section.tsx) uses `usePaginatedSearch` with `defaultFilters`, `filterKeyMapping`, `textFilterKeys`, status tabs, and `<TableFilter>` for advanced filters. URL is the source of truth.
- **Expenses has the skeleton.** [components/sections/expenses-section.tsx](../components/sections/expenses-section.tsx) already uses `usePaginatedSearch` with a `category` filter and a `SectionTab`. No advanced filters. No per-category state isolation.
- **Category tabs don't reset state.** Today, calling `updateFilters({ category: 'Staff_Related' })` merges — any non-category filters and the search term carry over into the new category. We need the opposite: clean slate on tab change.
- **API accepts search + category only.** [app/api/expenses/route.ts](../app/api/expenses/route.ts) builds `where` from `search` and `category`. No handling for `type`, `vendor`, `property`, `contract_id`, `staff_name`, `month`, `is_claimed`, `is_asset`, `status`, `reference_id`, `recurring_pattern`, `due_month`.
- **`transformExpense` lies about status.** [lib/expenses-utils.ts:253](../lib/expenses-utils.ts#L253) casts the raw DB enum (`Paid` / `Pending` / `Cancelled` / `Unset`) into the wider type `'Paid' | 'Paid Late' | 'Pending' | 'Overdue' | 'Cancelled'`. The extra values are aspirational — nothing computes them. The data to compute them (`payment_percentage`, `due_payment_date`, `payment_history[].paid_at`) is already loaded on the expense. Payments does the real calculation at [lib/payments-utils.ts:148-173](../lib/payments-utils.ts#L148-L173). We port that logic over, adjusting `due_payment_timestamp` → `due_payment_date`, and also extend the union to include `'Partially Paid'`.
- **`TableFilter` supports `text` / `select` / `date` only.** [components/costume-ui/table-filter.tsx:15](../components/costume-ui/table-filter.tsx#L15). No `'month'` type. `<MonthPicker>` already exists at [components/costume-ui/month-picker.tsx](../components/costume-ui/month-picker.tsx) and is what we want for "Due Month" and staff "Month". We extend `TableFilter` with a fourth type.

---

## 3. How it works

### 3.1 URL as source of truth

Nothing changes here — [hooks/use-paginated-search.ts](../hooks/use-paginated-search.ts) already does the right thing. Every filter key in `defaultFilters` that differs from its default is written to the URL. Reload preserves the view.

### 3.2 Per-category isolation

The hook's `updateFilters` merges. Merging is the right default for most screens (change one filter, keep the rest). For Expenses, tab = category, and switching tabs has to *replace* everything filter-scoped with defaults. We handle this in the section component, not the hook.

**How**: `handleCategoryChange(newCategory)` builds a fresh filter object containing only the keys valid for `newCategory` (plus `status`, `reference_id`, `recurring_pattern`, `due_month` which are global), with every value blanked out. It passes that object — plus the new `category` value — into `updateFilters`. Because the hook merges, we must also pass empty strings for every key the *previous* category owned so they get wiped out of the URL. The simplest way: clear every key in the union of all category-specific attribute keys, then set the new category.

**Search term**: the input is a `useState` inside the hook (`searchInputValue`). We expose a small addition — `resetSearch()` — so the section can clear it on tab change without the user having to see the old search bleed into a new category's URL.

### 3.3 Filter definitions

Two maps in [components/sections/expenses-section.tsx](../components/sections/expenses-section.tsx):

- `GLOBAL_EXPENSE_FILTERS` — shown on every category.
- `CATEGORY_FILTERS` — keyed by category, values are arrays of `FilterAttribute`.

On render, `attributes = [...GLOBAL_EXPENSE_FILTERS, ...CATEGORY_FILTERS[currentCategory]]` is passed to `<TableFilter>`.

### 3.4 Status calculation

We copy the exact logic from [lib/payments-utils.ts:148-173](../lib/payments-utils.ts#L148-L173) into [lib/expenses-utils.ts](../lib/expenses-utils.ts), adjusting the due-date field name. After this change, `transformExpense` returns one of `'Paid' | 'Paid Late' | 'Pending' | 'Partially Paid' | 'Overdue' | 'Cancelled'` computed from real data, not a cast.

### 3.5 Client-side vs server-side filtering

`usePaginatedSearch` already handles both: server-side when `initialTotal > pageSize`, client-side otherwise. Calculated statuses (`Paid Late`, `Partially Paid`, `Overdue`) are derived client-side from the transformed expense. The `status` filter key exists in `defaultFilters`, the hook puts it in the URL and passes it to the server — but the server only knows the raw enum. So when the user selects a calculated status, we filter it client-side after fetch.

Payments already solves this: the hook maps `status` URL value against the *transformed* field via `textFilterKeys` / `filterKeyMapping`. Expenses will do the same. No server-side status filtering for calculated values — the client-side pass is the filter.

### 3.6 Search scope per category

[app/api/expenses/route.ts:145-164](../app/api/expenses/route.ts#L145-L164) already does category-aware search. We extend the same switch with Company/Purchase search fields (currently they fall through to the default `reference_id` / `description` only) — vendor name, property code. The placeholder on the `<SearchInput>` updates so the user knows what's being searched.

---

## 4. Core code & flow

### 4.1 End-to-end flow when a user switches category

1. User clicks "Staff" in the `<SectionTab>`.
2. `handleCategoryChange('Staff_Related')` runs.
3. It builds `{ category: 'Staff_Related', status: '', reference_id: '', recurring_pattern: '', due_month: '', type: '', property: '', lease_id: '', vendor: '', is_claimed: '', contract_id: '', owner_name: '', staff_name: '', month: '', is_asset: '' }` — every known filter key blanked out except the new category.
4. It calls `resetSearch()` → clears the input state inside the hook, which triggers the existing search `useEffect` to delete `?search=` from the URL.
5. It calls `updateFilters(...)` → writes `category=Staff_Related` to the URL and deletes every other filter key.
6. The hook's URL-change effect fires. `urlFilters = { category: 'Staff_Related' }`. `urlSearch = ''`. Page resets to 1.
7. Debounced fetch to `/api/expenses?paginate=true&page=1&limit=10&category=Staff_Related` — fresh list.
8. `<TableFilter>` re-renders with `attributes = [...GLOBAL_EXPENSE_FILTERS, ...CATEGORY_FILTERS.Staff_Related]`.

### 4.2 Filter attribute catalogs

```ts
// components/sections/expenses-section.tsx

const GLOBAL_EXPENSE_FILTERS: FilterAttribute[] = [
  { key: 'reference_id', label: 'Expense ID', type: 'text' },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'Paid', label: 'Paid' },
      { value: 'Paid Late', label: 'Paid Late' },
      { value: 'Partially Paid', label: 'Partially Paid' },
      { value: 'Pending', label: 'Pending' },
      { value: 'Overdue', label: 'Overdue' },
      { value: 'Cancelled', label: 'Cancelled' }
    ]
  },
  {
    key: 'recurring_pattern',
    label: 'Pattern',
    type: 'select',
    options: [
      { value: 'Recurring', label: 'Recurring' },
      { value: 'One-time', label: 'One-time' }
    ]
  },
  { key: 'due_month', label: 'Due Month', type: 'month' }
]

const CATEGORY_FILTERS: Record<string, FilterAttribute[]> = {
  Property_Related: [
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'Refund', label: 'Refund' },
        { value: 'Agent_Commission', label: 'Agent Commission' },
        { value: 'Maintenance', label: 'Maintenance' },
        { value: 'Cleaning_Service', label: 'Cleaning Service' },
        { value: 'Internet_Bill', label: 'Internet Bill' },
        { value: 'Water_Bill', label: 'Water Bill' },
        { value: 'Electricity_Bill', label: 'Electricity Bill' },
        { value: 'Sewerage_Bill', label: 'Sewerage Bill' },
        { value: 'Management_Fees', label: 'Management Fees' },
        { value: 'Renovation', label: 'Renovation' },
        { value: 'Painting_Service', label: 'Painting Service' },
        { value: 'AC_Service_Installation', label: 'AC Service/Installation' },
        { value: 'Wiring_Electrical', label: 'Wiring/Electrical' },
        { value: 'Plumbing', label: 'Plumbing' },
        { value: 'Miscellaneous_Others', label: 'Miscellaneous/Others' }
      ]
    },
    { key: 'property', label: 'Property', type: 'text' },
    { key: 'lease_id', label: 'Lease Ref', type: 'text' },
    { key: 'vendor', label: 'Vendor', type: 'text' },
    {
      key: 'is_claimed',
      label: 'Claimed',
      type: 'select',
      options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]
    }
  ],
  Contract_Related: [
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'Rental', label: 'Rental' },
        { value: 'Contract_Initial_Charges', label: 'Contract Initial Charges' }
      ]
    },
    { key: 'contract_id', label: 'Contract Ref', type: 'text' },
    { key: 'owner_name', label: 'Owner', type: 'text' }
  ],
  Staff_Related: [
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'Salary', label: 'Salary' },
        { value: 'Allowances', label: 'Allowances' },
        { value: 'Miscellaneous_Others', label: 'Miscellaneous/Others' }
      ]
    },
    { key: 'staff_name', label: 'Staff', type: 'text' },
    { key: 'month', label: 'Salary Month', type: 'month' }
  ],
  Company_Related: [
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'Office_Rent', label: 'Office Rent' },
        { value: 'ICT_Equipment', label: 'ICT Equipment' },
        { value: 'Office_Stationary', label: 'Office Stationary' },
        { value: 'Software_Subscription', label: 'Software Subscription' },
        { value: 'Professional_Fees', label: 'Professional Fees' },
        { value: 'Bank_Charges', label: 'Bank Charges' },
        { value: 'Marketing___Advertising', label: 'Marketing & Advertising' },
        { value: 'Insurance', label: 'Insurance' },
        { value: 'Licenses___Government_Fees', label: 'Licenses & Government Fees' },
        { value: 'Plant___Machinery', label: 'Plant & Machinery' },
        { value: 'Company_Equipment', label: 'Company Equipment' },
        { value: 'Vehicle_Repair___Servicing', label: 'Vehicle Repair & Servicing' },
        { value: 'Transportation', label: 'Transportation' },
        { value: 'Vehicle_Purchase', label: 'Vehicle Purchase' },
        { value: 'Property_Purchase', label: 'Property Purchase' },
        { value: 'Loan', label: 'Loan' },
        { value: 'Tax', label: 'Tax' },
        { value: 'Miscellaneous_Others', label: 'Miscellaneous/Others' }
      ]
    },
    {
      key: 'is_asset',
      label: 'Asset',
      type: 'select',
      options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]
    },
    {
      key: 'is_claimed',
      label: 'Claimed',
      type: 'select',
      options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]
    },
    { key: 'vendor', label: 'Vendor', type: 'text' }
  ],
  Purchase_Related: [
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'Furniture', label: 'Furniture' },
        { value: 'Home_Appliances', label: 'Home Appliances' },
        { value: 'Office_Appliances', label: 'Office Appliances' },
        { value: 'Tools', label: 'Tools' },
        { value: 'Electrical_Items', label: 'Electrical Items' },
        { value: 'Plumbing_Items', label: 'Plumbing Items' },
        { value: 'Lighting___Bulbs', label: 'Lighting & Bulbs' },
        { value: 'Paint___Renovation_Materials', label: 'Paint & Renovation Materials' },
        { value: 'Maintenance_Consumables', label: 'Maintenance Consumables' },
        { value: 'Safety_Items', label: 'Safety Items' },
        { value: 'Miscellaneous_Others', label: 'Miscellaneous/Others' }
      ]
    },
    {
      key: 'is_asset',
      label: 'Asset',
      type: 'select',
      options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]
    },
    { key: 'property', label: 'Property', type: 'text' },
    { key: 'vendor', label: 'Vendor', type: 'text' },
    {
      key: 'is_claimed',
      label: 'Claimed',
      type: 'select',
      options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]
    }
  ]
}

// Union of all per-category keys — used to blank them out on tab change
const ALL_CATEGORY_FILTER_KEYS = Array.from(
  new Set(Object.values(CATEGORY_FILTERS).flat().map(a => a.key))
)
```

### 4.3 `handleCategoryChange` and `resetSearch`

```tsx
// components/sections/expenses-section.tsx

const { /* ... */, updateFilters, activeFilters, resetSearch } = usePaginatedSearch<ExpenseWithDetails>({
  apiRoute: '/api/expenses',
  initialData,
  initialTotal,
  pageSize: 10,
  defaultFilters: {
    category: 'Property_Related',
    status: '',
    reference_id: '',
    recurring_pattern: '',
    due_month: '',
    // every category-specific key, defaulted to ''
    type: '',
    property: '',
    lease_id: '',
    vendor: '',
    is_claimed: '',
    contract_id: '',
    owner_name: '',
    staff_name: '',
    month: '',
    is_asset: ''
  },
  filterKeyMapping: {
    lease_id: 'context_label',       // maps to transformed lease reference_id for client-side contract/property filter
    contract_id: 'context_label',
    property: 'context_label',
    owner_name: 'context_subtitle',
    staff_name: 'context_label'
  },
  textFilterKeys: [
    'reference_id', 'property', 'lease_id', 'vendor',
    'contract_id', 'owner_name', 'staff_name', 'status'
  ]
})

const handleCategoryChange = (index: number) => {
  const newCategory = CATEGORY_TABS[index].key
  const cleared: Record<string, string> = { category: newCategory }
  for (const key of ALL_CATEGORY_FILTER_KEYS) cleared[key] = ''
  cleared.status = ''
  cleared.reference_id = ''
  cleared.recurring_pattern = ''
  cleared.due_month = ''
  resetSearch()
  updateFilters(cleared)
}
```

**Note on `filterKeyMapping`**: the transformed expense's `context_label` is a string that holds the primary human-readable context — property code, lease ref, contract ref, or staff name, depending on category. For small datasets that filter client-side, this works fine. For server-side filtering, the API route handles each key explicitly (section 4.5).

### 4.4 Hook extension — `resetSearch`

```ts
// hooks/use-paginated-search.ts

// Inside usePaginatedSearch, add:
const resetSearch = useCallback(() => {
  setSearchInputValue('')
}, [])

// Add to the return type and the return object:
return { /* ... */, resetSearch }
```

The existing `useEffect` watching `searchInputValue` already writes the cleared value to the URL — no extra wiring needed.

### 4.5 API route — expanded filter handling

```ts
// app/api/expenses/route.ts — inside the paginate branch

const type = searchParams.get('type') || ''
const referenceId = searchParams.get('reference_id') || ''
const dueMonth = searchParams.get('due_month') || '' // YYYY-MM
const property = searchParams.get('property') || ''
const leaseId = searchParams.get('lease_id') || ''
const vendor = searchParams.get('vendor') || ''
const isClaimed = searchParams.get('is_claimed') || ''
const contractId = searchParams.get('contract_id') || ''
const ownerName = searchParams.get('owner_name') || ''
const staffName = searchParams.get('staff_name') || ''
const month = searchParams.get('month') || ''
const isAsset = searchParams.get('is_asset') || ''
const recurringPattern = searchParams.get('recurring_pattern') || ''
const rawStatus = searchParams.get('status') || ''

// Base where
const whereClause: any = {
  organization_id: staff.organization_id,
  category,
  ...(searchConditions.length > 0 && { OR: searchConditions })
}

// Global filters
if (referenceId) {
  whereClause.reference_id = { contains: referenceId, mode: 'insensitive' }
}
if (dueMonth) {
  const start = new Date(`${dueMonth}-01T00:00:00Z`)
  const end = new Date(start); end.setMonth(end.getMonth() + 1)
  whereClause.due_payment_date = { gte: start, lt: end }
}
if (recurringPattern === 'Recurring') {
  whereClause.recurring_config_id = { not: null }
} else if (recurringPattern === 'One-time') {
  whereClause.recurring_config_id = null
}
// Only filter on raw DB status values; calculated ones are client-side
if (rawStatus === 'Paid' || rawStatus === 'Pending' || rawStatus === 'Cancelled') {
  whereClause.status = rawStatus
}

// Category-specific
if (category === 'Property_Related') {
  const sub: any = {}
  if (type) sub.type = type
  if (isClaimed) sub.is_claimed = isClaimed === 'true'
  if (vendor) sub.vendors = { name: { contains: vendor, mode: 'insensitive' } }
  if (property) sub.properties = { code: { contains: property, mode: 'insensitive' } }
  if (leaseId) sub.leases = { reference_id: { contains: leaseId, mode: 'insensitive' } }
  if (Object.keys(sub).length) whereClause.property_expenses = sub
}

if (category === 'Contract_Related') {
  const sub: any = {}
  if (type) sub.type = type
  if (contractId || ownerName) {
    sub.contracts = {}
    if (contractId) sub.contracts.reference_id = { contains: contractId, mode: 'insensitive' }
    if (ownerName) {
      sub.contracts.owners = {
        OR: [
          { first_name: { contains: ownerName, mode: 'insensitive' } },
          { last_name: { contains: ownerName, mode: 'insensitive' } }
        ]
      }
    }
  }
  if (Object.keys(sub).length) whereClause.contract_expenses = sub
}

if (category === 'Staff_Related') {
  const sub: any = {}
  if (type) sub.type = type
  if (staffName) {
    sub.staff = {
      OR: [
        { first_name: { contains: staffName, mode: 'insensitive' } },
        { last_name: { contains: staffName, mode: 'insensitive' } }
      ]
    }
  }
  if (month) {
    const start = new Date(`${month}-01`)
    const end = new Date(start); end.setMonth(end.getMonth() + 1)
    sub.month = { gte: start, lt: end }
  }
  if (Object.keys(sub).length) whereClause.staff_expenses = sub
}

if (category === 'Company_Related') {
  const sub: any = {}
  if (type) sub.type = type
  if (isAsset) sub.is_asset = isAsset === 'true'
  if (isClaimed) sub.is_claimed = isClaimed === 'true'
  if (vendor) sub.vendors = { name: { contains: vendor, mode: 'insensitive' } }
  if (Object.keys(sub).length) whereClause.company_expenses = sub
}

if (category === 'Purchase_Related') {
  const sub: any = {}
  if (type) sub.type = type
  if (isAsset) sub.is_asset = isAsset === 'true'
  if (isClaimed) sub.is_claimed = isClaimed === 'true'
  if (vendor) sub.vendors = { name: { contains: vendor, mode: 'insensitive' } }
  if (property) sub.properties = { code: { contains: property, mode: 'insensitive' } }
  if (Object.keys(sub).length) whereClause.purchase_expenses = sub
}
```

**Vendor lookup**: the three `*_expenses` subtables carry `vendor_id`. To search by vendor *name*, we filter on the related `vendors.name`. The select in `expenseSelect` needs to be extended to include the vendor name as well so the transformed expense can render it in table cells (optional follow-up — not required for filtering to work).

### 4.6 `TableFilter` — add `'month'` type

```diff
 // components/costume-ui/table-filter.tsx
 import DatePicker from '@/components/costume-ui/date-picker'
+import MonthPicker from '@/components/costume-ui/month-picker'

 export type FilterAttribute = {
   key: string
   label: string
-  type: 'text' | 'select' | 'date'
+  type: 'text' | 'select' | 'date' | 'month'
   options?: { value: string; label: string }[]
 }
```

Add a branch in the value renderer (after the existing `type === 'date'` branch):

```tsx
) : attrConfig?.type === 'month' ? (
  <MonthPicker
    value={filter.value ? new Date(`${filter.value}-01`) : undefined}
    onValueChange={(date) => {
      if (!date) return updateFilter(filter.id, 'value', '')
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      updateFilter(filter.id, 'value', `${y}-${m}`)
    }}
  />
```

And in `ActiveFilterChips.getValueLabel`:

```diff
     if (attr?.type === 'date' && value) {
       return new Date(value).toLocaleDateString()
     }
+    if (attr?.type === 'month' && value) {
+      const [y, m] = value.split('-')
+      return new Date(+y, +m - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
+    }
```

`month` values are persisted as `YYYY-MM` strings — short, URL-safe, and what the API expects.

### 4.7 Port status calculation to expenses

```diff
 // lib/expenses-utils.ts

 export type ExpenseWithDetails = {
   // ...
-  status: 'Paid' | 'Paid Late' | 'Pending' | 'Overdue' | 'Cancelled'
+  status: 'Paid' | 'Paid Late' | 'Pending' | 'Partially Paid' | 'Overdue' | 'Cancelled'
   // ...
 }
```

Inside `transformExpense`, replace:

```diff
-  // Get status
-  const status = expense.status as 'Paid' | 'Paid Late' | 'Pending' | 'Overdue' | 'Cancelled'
+  let status: 'Paid' | 'Paid Late' | 'Pending' | 'Partially Paid' | 'Overdue' | 'Cancelled'
+  if (expense.status === 'Cancelled') {
+    status = 'Cancelled'
+  } else {
+    const now = new Date()
+    const dueDate = expense.due_payment_date
+    const isFullyPaid = paymentPercentage >= 100
+    const isPartiallyPaid = paymentPercentage > 0 && paymentPercentage < 100
+    const isOverdue = dueDate ? now > dueDate : false
+    const latestPaymentDate = successfulPayments[0]?.paid_at
+    if (isFullyPaid) {
+      status = (dueDate && latestPaymentDate && latestPaymentDate > dueDate) ? 'Paid Late' : 'Paid'
+    } else if (isOverdue) {
+      status = 'Overdue'
+    } else if (isPartiallyPaid) {
+      status = 'Partially Paid'
+    } else {
+      status = 'Pending'
+    }
+  }
```

This mirrors [lib/payments-utils.ts:148-173](../lib/payments-utils.ts#L148-L173) with `due_payment_date` swapped in for `due_payment_timestamp`. The priority ordering (Overdue > Partially Paid > Pending) is deliberate — do not reorder.

### 4.8 Payments — add Due Month

```diff
 // components/sections/payments-section.tsx
 const PAYMENT_FILTER_ATTRIBUTES: FilterAttribute[] = [
   { key: 'payment_id', label: 'Payment ID', type: 'text' },
   { key: 'lease_id', label: 'Lease ID', type: 'text' },
   // ... type, recurring_pattern, property, tenant_name ...
+  { key: 'due_month', label: 'Due Month', type: 'month' }
 ]
```

```diff
 defaultFilters: {
   // ...
+  due_month: ''
 }
```

And in [app/api/payments/route.ts](../app/api/payments/route.ts), handle `due_month` the same way as expenses — range on `due_payment_timestamp` (field name differs from expenses):

```ts
const dueMonth = searchParams.get('due_month') || ''
if (dueMonth) {
  const start = new Date(`${dueMonth}-01T00:00:00Z`)
  const end = new Date(start); end.setMonth(end.getMonth() + 1)
  whereClause.due_payment_timestamp = { gte: start, lt: end }
}
```

---

## 5. What we build

### 5.1 New files

None. Every change lives in existing files.

### 5.2 Edited files

| File | Change |
|---|---|
| [hooks/use-paginated-search.ts](../hooks/use-paginated-search.ts) | Expose `resetSearch` from the hook. One-line addition plus updated return type. |
| [components/costume-ui/table-filter.tsx](../components/costume-ui/table-filter.tsx) | Add `'month'` to `FilterAttribute['type']` union. Render `<MonthPicker>` in the value column when `type === 'month'`. Extend `ActiveFilterChips.getValueLabel` to format month values. |
| [lib/expenses-utils.ts](../lib/expenses-utils.ts) | Replace the blind status cast with the calculated status block ported from `payments-utils`. Add `'Partially Paid'` to the type union. |
| [components/sections/expenses-section.tsx](../components/sections/expenses-section.tsx) | Add `GLOBAL_EXPENSE_FILTERS` + `CATEGORY_FILTERS` maps. Render `<TableFilter>` alongside `<SearchInput>`. Wire `advancedFilters` / `handleFiltersChange` (copy the pattern from payments-section). Replace `handleTabChange` with `handleCategoryChange` that blanks every filter key and calls `resetSearch`. Update search placeholder per category. |
| [app/api/expenses/route.ts](../app/api/expenses/route.ts) | Accept all new query params (`type`, `reference_id`, `due_month`, `property`, `lease_id`, `vendor`, `is_claimed`, `contract_id`, `owner_name`, `staff_name`, `month`, `is_asset`, `recurring_pattern`, `status`). Build category-specific `where` branches as shown in 4.5. Extend `expenseSelect` to include `vendors: { select: { name: true } }` on `property_expenses`, `company_expenses`, `purchase_expenses` so vendor text filtering and chip display both work. |
| [components/sections/payments-section.tsx](../components/sections/payments-section.tsx) | Add `{ key: 'due_month', label: 'Due Month', type: 'month' }` to `PAYMENT_FILTER_ATTRIBUTES`. Add `due_month: ''` to `defaultFilters`. |
| [app/api/payments/route.ts](../app/api/payments/route.ts) | Accept `due_month` param. Add the month-range clause on `due_payment_timestamp`. |

---

## 6. Steps

The whole thing is small enough to do in one pass, but the ordering matters so each step leaves the app buildable.

1. **`TableFilter` — add `'month'` type.** No consumers use it yet; pure additive change. Verify by temporarily adding a month attribute to `PAYMENT_FILTER_ATTRIBUTES` and confirming the popover renders `<MonthPicker>`. Remove that temp line before moving on.

2. **`usePaginatedSearch` — expose `resetSearch`.** Pure additive. Payments keeps working because it doesn't call it.

3. **`lib/expenses-utils.ts` — real status calculation.** Run the Expenses page, confirm a partially-paid expense now reads "Partially Paid" instead of "Pending", and an expense past its due date with no payments reads "Overdue". Existing status-dependent UI (if any) continues to work because the string values are a superset of before.

4. **Expenses — filter maps + `<TableFilter>` wiring.** Render filters and make them write to the URL. Skip the API side for this step — client-side filtering kicks in for any org whose current category's total ≤ 10 rows, which is most dev scenarios, so this step is independently verifiable.

5. **`handleCategoryChange` + `resetSearch` wiring.** Switch between categories in the UI, confirm filters and search reset.

6. **Expenses API — filter handling.** Extend `/api/expenses` to accept all new params and build the category-specific `where` clauses. Now orgs with more than 10 rows per category filter server-side correctly.

7. **Payments — add Due Month.** One-line addition to the filter array and default filters, one small block added to the API route.

8. **Manual smoke test.** For each category:
   - Search, confirm results match the category-specific search fields.
   - Apply one filter, confirm URL updates and results change.
   - Apply multiple filters, confirm `AND` semantics.
   - Switch to another category, confirm all filters and search clear.
   - Refresh mid-filter, confirm state survives.
   - Back/forward browser buttons behave.

---
