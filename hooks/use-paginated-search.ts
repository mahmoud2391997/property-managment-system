'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'

interface UsePaginatedSearchOptions<T> {
  apiRoute: string
  initialData: T[]
  initialTotal: number
  pageSize?: number
  debounceMs?: number
  defaultFilters?: Record<string, string>
  /** Maps filter keys to actual data property names (e.g., { payment_id: 'id' }) */
  filterKeyMapping?: Record<string, string>
  /** Filter keys that should use partial/case-insensitive matching instead of exact match */
  textFilterKeys?: string[]
  /** Filter keys that represent a month (YYYY-MM) to match against a date property */
  monthFilterKeys?: string[]
  /** Filter keys that represent a date (YYYY-MM-DD) to match against a date property */
  dateFilterKeys?: string[]
}

interface UsePaginatedSearchReturn<T> {
  data: T[]
  isLoading: boolean
  searchTerm: string
  handleSearchChange: (value: string) => void
  currentPage: number
  total: number
  canGoNext: boolean
  canGoPrevious: boolean
  goToNextPage: () => void
  goToPreviousPage: () => void
  pageSize: number
  updateItem: (id: string, updates: Partial<T>) => void
  updateFilters: (newFilters: Record<string, string>) => void
  activeFilters: Record<string, string>
  resetSearch: () => void
}

export function usePaginatedSearch<T> ({
  apiRoute,
  initialData,
  initialTotal,
  pageSize = 10,
  debounceMs = 1000,
  defaultFilters = {},
  filterKeyMapping = {},
  textFilterKeys = [],
  monthFilterKeys = [],
  dateFilterKeys = []
}: UsePaginatedSearchOptions<T>): UsePaginatedSearchReturn<T> {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  // ============================================
  // URL IS THE SOURCE OF TRUTH
  // ============================================

  const urlPage = Math.max(1, parseInt(searchParams.get('list') || '1'))
  const urlSearch = searchParams.get('search') || ''

  const urlFilters: Record<string, string> = { ...defaultFilters }
  Object.keys(defaultFilters).forEach(key => {
    const urlValue = searchParams.get(key)
    if (urlValue) {
      urlFilters[key] = urlValue
    }
  })

  // ============================================
  // LOCAL STATE
  // ============================================

  const [data, setData] = useState<T[]>(initialData)
  const [total, setTotal] = useState(initialTotal)
  const [isLoading, setIsLoading] = useState(false)
  const [searchInputValue, setSearchInputValue] = useState(urlSearch)

  // Sync data when initialData changes from empty to populated
  // This handles the case where initialData is fetched asynchronously
  const prevInitialLengthRef = useRef(initialData.length)
  useEffect(() => {
    if (prevInitialLengthRef.current === 0 && initialData.length > 0) {
      setData(initialData)
      setTotal(initialTotal)
    }
    prevInitialLengthRef.current = initialData.length
  }, [initialData, initialTotal])

  // REFS
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pageCacheRef = useRef<Map<string, { data: T[]; total: number }>>(
    new Map()
  )
  const isInitialMount = useRef(true)
  const lastFetchedParams = useRef<string>('')

  // [FIX] New Ref to track if the change originated from user typing
  const isInternalChange = useRef(false)

  const useServerSearch = initialTotal > pageSize

  // ============================================
  // URL UPDATE FUNCTION
  // ============================================

  const updateUrl = useCallback(
    (updates: {
      page?: number
      search?: string
      filters?: Record<string, string>
    }) => {
      const params = new URLSearchParams(searchParams.toString())

      if (updates.page !== undefined) {
        if (updates.page > 1) {
          params.set('list', updates.page.toString())
        } else {
          params.delete('list')
        }
      }

      if (updates.search !== undefined) {
        if (updates.search) {
          params.set('search', updates.search)
        } else {
          params.delete('search')
        }
      }

      if (updates.filters !== undefined) {
        Object.entries(updates.filters).forEach(([key, value]) => {
          if (value && value !== defaultFilters[key]) {
            params.set(key, value)
          } else {
            params.delete(key)
          }
        })

        const dueMonthValue = updates.filters.due_month
        if (dueMonthValue !== undefined) {
          if (dueMonthValue && dueMonthValue !== defaultFilters.due_month) {
            params.set('due_month_timezone_offset', String(new Date().getTimezoneOffset()))
          } else {
            params.delete('due_month_timezone_offset')
          }
        }
      }

      const queryString = params.toString()
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname

      router.replace(newUrl, { scroll: false })
    },
    [searchParams, pathname, router, defaultFilters]
  )

  // ============================================
  // BUILD CACHE KEY & FETCH
  // ============================================

  const buildCacheKey = useCallback(
    (page: number, search: string, filters: Record<string, string>) => {
      const filterStr = Object.entries(filters)
        .filter(([_, v]) => v && v !== 'all')
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('&')
      return `page=${page}&search=${search}&${filterStr}`
    },
    []
  )

  const fetchData = useCallback(
    async (page: number, search: string, filters: Record<string, string>) => {
      const cacheKey = buildCacheKey(page, search, filters)

      if (lastFetchedParams.current === cacheKey) return

      setIsLoading(true)

      const cached = pageCacheRef.current.get(cacheKey)
      if (cached) {
        setData(cached.data)
        setTotal(cached.total)
        lastFetchedParams.current = cacheKey
        setIsLoading(false)
        return
      }

      lastFetchedParams.current = cacheKey

      try {
        const params = new URLSearchParams()
        params.set('paginate', 'true')
        params.set('page', page.toString())
        params.set('limit', pageSize.toString())

        if (search) params.set('search', search)

Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== 'all') params.set(key, value)
        })
        
        // Pass timezone offset for correct due date filtering
        params.set('due_month_timezone_offset', new Date().getTimezoneOffset().toString())
        
        // Handle apiRoute that may already have query params
        const separator = apiRoute.includes('?') ? '&' : '?'
        const response = await fetch(`${apiRoute}${separator}${params.toString()}`)
        const result = await response.json()

        if (result.success) {
          pageCacheRef.current.set(cacheKey, {
            data: result.data,
            total: result.total
          })
          setData(result.data)
          setTotal(result.total)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    },
    [apiRoute, pageSize, buildCacheKey]
  )

  // ============================================
  // EFFECT: FETCH DATA WHEN URL CHANGES
  // ============================================

  useEffect(() => {
    // 1️⃣ Initial mount guard (NO debounce involved)
    if (isInitialMount.current) {
      isInitialMount.current = false

      const hasNonDefaultPage = urlPage > 1
      const hasSearch = urlSearch !== ''
      const hasNonDefaultFilters = Object.entries(urlFilters).some(
        ([key, value]) => value && value !== defaultFilters[key]
      )

      // Only cache and skip if we have actual data AND no custom URL params
      // If initialData is empty, don't cache - let subsequent renders handle it
      if (!hasNonDefaultPage && !hasSearch && !hasNonDefaultFilters && initialData.length > 0) {
        const cacheKey = buildCacheKey(1, '', urlFilters)
        pageCacheRef.current.set(cacheKey, {
          data: initialData,
          total: initialTotal
        })
        lastFetchedParams.current = cacheKey
        return // EXIT — do NOT schedule debounce
      }
    }

    // 2️⃣ Debounced fetch (only after initial mount)
    const hasNonDefaultFilters = Object.entries(urlFilters).some(
      ([key, value]) => value && value !== defaultFilters[key]
    )
    if (!useServerSearch && !hasNonDefaultFilters) {
      // Restore cached data if state was replaced by a non-default fetch
      const cacheKey = buildCacheKey(urlPage, urlSearch, urlFilters)
      const cached = pageCacheRef.current.get(cacheKey)
      if (cached && lastFetchedParams.current !== cacheKey) {
        setData(cached.data)
        setTotal(cached.total)
        lastFetchedParams.current = cacheKey
      }
      return
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchData(urlPage, urlSearch, urlFilters)
    }, debounceMs)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [
    urlPage,
    urlSearch,
    JSON.stringify(urlFilters),
    useServerSearch,
    debounceMs,
    fetchData
  ])

  // ============================================
  // [FIXED] SYNC SEARCH INPUT WITH URL
  // ============================================

useEffect(() => {
  setSearchInputValue(urlSearch)
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])

  // ============================================
  // [FIXED] HANDLER
  // ============================================

  const handleSearchChange = useCallback((value: string) => {
    setSearchInputValue(value)
  }, [])

  const resetSearch = useCallback(() => {
    setSearchInputValue('')
  }, [])

  useEffect(() => {
    updateUrl({ search: searchInputValue.trim(), page: 1 })
  }, [searchInputValue])

  // ============================================
  // REST OF LOGIC
  // ============================================

  const updateFilters = useCallback(
    (newFilters: Record<string, string>) => {
      const mergedFilters = { ...urlFilters, ...newFilters }
      updateUrl({ filters: mergedFilters, page: 1 })
    },
    [urlFilters, updateUrl]
  )

  const goToNextPage = useCallback(() => {
    updateUrl({ page: urlPage + 1 })
  }, [urlPage, updateUrl])

  const goToPreviousPage = useCallback(() => {
    updateUrl({ page: Math.max(1, urlPage - 1) })
  }, [urlPage, updateUrl])

  const displayData = useMemo(() => {
    if (useServerSearch) {
      return data
    }

    // Local filtering when total items <= pageSize
    let filteredData = data

    // Apply status filter (and other filters)
    const hasActiveFilters = Object.entries(urlFilters).some(
      ([key, value]) => value && value !== 'all' && value !== defaultFilters[key]
    )

    if (hasActiveFilters) {
      filteredData = filteredData.filter(item => {
        return Object.entries(urlFilters).every(([filterKey, filterValue]) => {
          if (!filterValue || filterValue === 'all' || filterValue === defaultFilters[filterKey]) {
            return true
          }

          // Get the actual data property name (use mapping if provided, otherwise use filter key)
          const dataKey = filterKeyMapping[filterKey] || filterKey
          const itemValue = (item as any)[dataKey]

          // Check if this is a month filter
          if (monthFilterKeys.includes(filterKey)) {
            if (!itemValue) return false
            const dateObj = new Date(itemValue as string | number | Date)
            if (isNaN(dateObj.getTime())) return false
            const y = dateObj.getFullYear()
            const m = String(dateObj.getMonth() + 1).padStart(2, '0')
            return `${y}-${m}` === filterValue
          }

          // Check if this is a date filter
          if (dateFilterKeys.includes(filterKey)) {
            if (!itemValue) return false
            const dateObj = new Date(itemValue as string | number | Date)
            if (isNaN(dateObj.getTime())) return false
            const y = dateObj.getFullYear()
            const m = String(dateObj.getMonth() + 1).padStart(2, '0')
            const d = String(dateObj.getDate()).padStart(2, '0')
            return `${y}-${m}-${d}` === filterValue
          }

          // Check if this is a text filter (partial/case-insensitive match)
          if (textFilterKeys.includes(filterKey)) {
            if (typeof itemValue === 'string') {
              return itemValue.toLowerCase().includes(filterValue.toLowerCase())
            }
            return false
          }

          // Exact match for select filters
          return itemValue === filterValue
        })
      })
    }

    // Apply search filter
    if (urlSearch) {
      const lowerSearch = urlSearch.toLowerCase()
      filteredData = filteredData.filter(item => {
        return Object.values(item as object).some(value => {
          if (typeof value === 'string') {
            return value.toLowerCase().includes(lowerSearch)
          }
          return false
        })
      })
    }

    return filteredData
  }, [data, urlSearch, urlFilters, useServerSearch, defaultFilters, filterKeyMapping, textFilterKeys])

  const updateItem = useCallback((id: string, updates: Partial<T>) => {
    const updateInArray = (arr: T[]) =>
      arr.map(item =>
        (item as any).id === id ? { ...item, ...updates } : item
      )

    setData(prev => updateInArray(prev))
    pageCacheRef.current.forEach((cached, key) => {
      pageCacheRef.current.set(key, {
        ...cached,
        data: updateInArray(cached.data)
      })
    })
  }, [])

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const canGoNext = urlPage * pageSize < total
  const canGoPrevious = urlPage > 1

  return {
    data: displayData,
    isLoading,
    searchTerm: searchInputValue,
    handleSearchChange,
    currentPage: urlPage,
    total,
    canGoNext,
    canGoPrevious,
    goToNextPage,
    goToPreviousPage,
    pageSize,
    updateItem,
    updateFilters,
    activeFilters: urlFilters,
    resetSearch
  }
}
