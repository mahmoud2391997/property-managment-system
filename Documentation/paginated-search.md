# Paginated Search System Documentation

## Overview

This document explains the paginated search system used for tables (properties, tenants, rooms, etc.) that need server-side pagination and search functionality.

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         Page Component                          │
│  (e.g., app/(protected)/properties/(with-loading)/page.tsx)    │
│                                                                 │
│  - Server-side: Fetches first 10 items + total count           │
│  - Passes initialData and initialTotal to Section component    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Section Component                          │
│       (e.g., components/sections/properties-section.tsx)        │
│                                                                 │
│  - Uses usePaginatedSearch hook                                 │
│  - Renders SearchInput and Table                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    usePaginatedSearch Hook                      │
│              (hooks/use-paginated-search.ts)                    │
│                                                                 │
│  - Manages pagination state                                     │
│  - Manages search state with debounce                           │
│  - Caches visited pages                                         │
│  - Syncs with URL parameters                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Route                               │
│             (e.g., app/api/properties/route.ts)                 │
│                                                                 │
│  - Accepts: paginate, page, limit, search params                │
│  - Returns: { success, data, total, page, pageSize }            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Hook: usePaginatedSearch

### Import & Usage

```typescript
import { usePaginatedSearch } from '@/hooks/use-paginated-search'

const {
  data,              // Current data to display
  isLoading,         // Loading state
  searchTerm,        // Current search input value
  handleSearchChange,// Handler for search input
  currentPage,       // Current page number
  total,             // Total items count
  canGoNext,         // Can navigate to next page
  canGoPrevious,     // Can navigate to previous page
  goToNextPage,      // Next page handler
  goToPreviousPage,  // Previous page handler
  pageSize           // Items per page
} = usePaginatedSearch<YourType>({
  apiRoute: '/api/your-route',
  initialData,       // First page data from server
  initialTotal,      // Total count from server
  pageSize: 10,      // Optional, default 10
  debounceMs: 500    // Optional, default 500ms
})
```

### Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| apiRoute | string | Yes | - | API endpoint for fetching data |
| initialData | T[] | Yes | - | First page data from SSR |
| initialTotal | number | Yes | - | Total count from SSR |
| pageSize | number | No | 10 | Items per page |
| debounceMs | number | No | 500 | Search debounce delay |

### Return Values

| Value | Type | Description |
|-------|------|-------------|
| data | T[] | Current data to display in table |
| isLoading | boolean | True when fetching data |
| searchTerm | string | Current search input (for controlled input) |
| handleSearchChange | (value: string) => void | Handler for search input onChange |
| currentPage | number | Current page number (1-indexed) |
| total | number | Total items (filtered if searching) |
| canGoNext | boolean | True if next page exists |
| canGoPrevious | boolean | True if previous page exists |
| goToNextPage | () => void | Navigate to next page |
| goToPreviousPage | () => void | Navigate to previous page |
| pageSize | number | Items per page |

---

## API Contract

### Request

```
GET /api/[resource]?paginate=true&page=1&limit=10&search=term
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| paginate | boolean | Yes | Must be "true" to use pagination mode |
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 10) |
| search | string | No | Search term |

### Response

```json
{
  "success": true,
  "data": [...],
  "total": 42,
  "page": 1,
  "pageSize": 10
}
```

---

## URL Parameters

The hook syncs state with URL for bookmarking/sharing:

| Param | Description | Example |
|-------|-------------|---------|
| list | Page number (only shown if > 1) | ?list=2 |
| search | Search term | ?search=apartment |

### Examples

- `/properties` - Page 1, no search
- `/properties?list=2` - Page 2, no search
- `/properties?search=apt` - Page 1, searching "apt"
- `/properties?list=2&search=apt` - Page 2 of search results

### URL Validation

- If `list` exceeds max pages, redirects to list=1
- If `list` is invalid (negative, zero), defaults to 1

---

## Caching Strategy

### Page Cache
- Stores fetched pages in a Map: `pageNumber -> data[]`
- Page 1 is pre-cached with initialData
- When navigating back to a cached page, no API call is made

### Search Cache
- Stores search results in a Map: `"term:page" -> data[]`
- Cache is cleared when search is cleared
- When searching same term again, uses cached results

---

## User Flow Diagrams

### Initial Page Load

```
User visits /properties
        │
        ▼
┌───────────────────┐
│   Server-side     │
│   Fetch page 1    │
│   + total count   │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│   Render with     │
│   initialData     │
│   No loading      │
└───────────────────┘
```

### Initial Load with URL Params

```
User visits /properties?list=2&search=apt
        │
        ▼
┌───────────────────┐
│   Server-side     │
│   Fetch page 1    │
│   + total count   │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│   Show skeleton   │
│   loading state   │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│   Client-side     │
│   Fetch search    │
│   results         │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│   Display search  │
│   results         │
└───────────────────┘
```

### Search Flow

```
User types "apt"
        │
        ▼
┌───────────────────┐
│   searchTerm      │
│   updates         │
│   immediately     │
│   (input visible) │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│   500ms debounce  │
│   (user may       │
│   continue        │
│   typing)         │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ debouncedSearch   │
│ Term updates      │
│ + API call starts │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│   useEffect       │
│   updates URL     │
│   ?search=apt     │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│   isLoading=true  │
│   Show skeleton   │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│   API returns     │
│   Check if still  │
│   relevant        │
└───────────────────┘
        │
   ┌────┴────┐
   │         │
 Valid    Stale
   │         │
   ▼         ▼
┌─────────┐  ┌───────────────────┐
│ Cache   │  │   Ignore response │
│ results │  │   (user cleared   │
│ Display │  │    or changed)    │
└─────────┘  └───────────────────┘
```

### Search Clear Flow

```
User clears search input
        │
        ▼
┌───────────────────┐
│ searchTerm = ""   │
│ debouncedSearch   │
│   Term = ""       │
│ searchResults=[]  │
│ lastSearchedTerm  │
│   Ref = ""        │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│   useEffect       │
│   updates URL     │
│   (removes search │
│    param)         │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│   displayData     │
│   returns         │
│   paginatedData   │
│   (original list) │
└───────────────────┘
```

### Pagination Flow

```
User clicks "Next"
        │
        ▼
┌───────────────────┐
│   Check cache     │
│   for page 2      │
└───────────────────┘
        │
   ┌────┴────┐
   │         │
Cached    Not Cached
   │         │
   ▼         ▼
┌─────────┐  ┌───────────────────┐
│ Display │  │   isLoading=true  │
│ cached  │  │   Fetch page 2    │
│ data    │  │   Cache result    │
│         │  │   Display data    │
└─────────┘  └───────────────────┘
        │         │
        └────┬────┘
             ▼
┌───────────────────┐
│   URL updates     │
│   ?list=2         │
└───────────────────┘
```

---

## Server vs Client Search

The hook automatically determines search strategy:

| Condition | Strategy | Reason |
|-----------|----------|--------|
| total > pageSize | Server search | Can't search data we don't have |
| total <= pageSize | Client search | All data already loaded |

### Client Search

When total <= pageSize, search is performed locally:
- No API calls
- Filters all string properties
- **Instant results** (no debounce on filtering)
- URL updates when `debouncedSearchTerm` changes

### Server Search

When total > pageSize:
- Debounced API call with search param (500ms)
- URL updates when `debouncedSearchTerm` changes (via useEffect)
- Server filters in database
- Supports pagination of search results
- **Stale response protection**: API responses are ignored if user cleared/changed the search input before response arrived

---

## URL Sync Strategy

The URL is updated via a `useEffect` that watches `debouncedSearchTerm`:

```typescript
useEffect(() => {
  if (!initialLoadRef.current) return
  updateUrl(debouncedSearchTerm ? 1 : page, debouncedSearchTerm)
}, [debouncedSearchTerm, page, updateUrl])
```

This approach:
- Avoids calling `updateUrl` on every keystroke (no lag)
- URL updates only after debounce completes
- Uses `window.history.replaceState` for instant, synchronous updates
- Keeps URL in sync with actual search state

---

## Race Condition Handling

When user clears search input while an API call is in flight:

```
User types "apt" → debounce → API call starts
User clears input → searchTerm = "", lastSearchedTermRef = ""
API returns → checks lastSearchedTermRef !== "apt" → ignores stale response
```

The hook uses `lastSearchedTermRef` to track the "intended" search term:
- Set when debounce fires and API call begins
- Cleared when search input is cleared
- API response is only applied if `lastSearchedTermRef === term`

---

## Files Reference

| File | Purpose |
|------|---------|
| `hooks/use-paginated-search.ts` | Reusable hook |
| `app/api/[resource]/route.ts` | API endpoint with paginate mode |
| `components/sections/[resource]-section.tsx` | Section using the hook |
| `components/tables/[resource]-table.tsx` | Table with pagination controls |
| `components/costume-ui/table.tsx` | Base table with skeleton loading |

---

## Adding to New Tables

1. **Update API route** to support `paginate=true` mode:
   ```typescript
   if (paginate) {
     const [data, total] = await Promise.all([
       prisma.yourModel.findMany({
         where: whereClause,
         skip: (page - 1) * limit,
         take: limit
       }),
       prisma.yourModel.count({ where: whereClause })
     ])
     return { success: true, data, total, page, pageSize: limit }
   }
   ```

2. **Update page component** to fetch first page + total:
   ```typescript
   const [data, total] = await Promise.all([
     fetch('/api/resource?paginate=true&page=1&limit=10'),
     // total comes from same response
   ])
   ```

3. **Use hook in section component**:
   ```typescript
   const { data, isLoading, ... } = usePaginatedSearch({
     apiRoute: '/api/resource',
     initialData,
     initialTotal
   })
   ```

4. **Pass props to table**:
   ```typescript
   <YourTable
     data={data}
     isLoading={isLoading}
     currentPage={currentPage}
     totalItems={total}
     pageSize={pageSize}
     canGoNext={canGoNext}
     canGoPrevious={canGoPrevious}
     onNextPage={goToNextPage}
     onPreviousPage={goToPreviousPage}
   />
   ```
