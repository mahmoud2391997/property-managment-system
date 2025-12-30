'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'

interface UsePaginatedSearchOptions<T> {
  /** API route for fetching data (e.g., '/api/properties') */
  apiRoute: string
  /** Initial data from server-side render */
  initialData: T[]
  /** Initial total count from server */
  initialTotal: number
  /** Number of items per page */
  pageSize?: number
  /** Debounce delay in milliseconds */
  debounceMs?: number
  /** Default filter values (e.g., { status: 'all', type: 'all' }) */
  defaultFilters?: Record<string, string>
}

interface UsePaginatedSearchReturn<T> {
  /** Current data to display */
  data: T[]
  /** Whether data is being loaded */
  isLoading: boolean
  /** Current search term (for input binding) */
  searchTerm: string
  /** Handler for search input changes */
  handleSearchChange: (value: string) => void
  /** Current page number */
  currentPage: number
  /** Total number of items */
  total: number
  /** Whether there's a next page */
  canGoNext: boolean
  /** Whether there's a previous page */
  canGoPrevious: boolean
  /** Go to next page */
  goToNextPage: () => void
  /** Go to previous page */
  goToPreviousPage: () => void
  /** Page size */
  pageSize: number
  /** Update a single item by id */
  updateItem: (id: string, updates: Partial<T>) => void
  /** Update filters (updates URL, which triggers refetch) */
  updateFilters: (newFilters: Record<string, string>) => void
  /** Current active filters (derived from URL) */
  activeFilters: Record<string, string>
}

export function usePaginatedSearch<T>({
  apiRoute,
  initialData,
  initialTotal,
  pageSize = 10,
  debounceMs = 1000,
  defaultFilters = {}
}: UsePaginatedSearchOptions<T>): UsePaginatedSearchReturn<T> {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  // ============================================
  // URL IS THE SOURCE OF TRUTH
  // ============================================
  
  // Read current state from URL
  const urlPage = Math.max(1, parseInt(searchParams.get('list') || '1'))
  const urlSearch = searchParams.get('search') || ''
  
  // Read filters from URL, falling back to defaults
  const urlFilters: Record<string, string> = { ...defaultFilters }
  Object.keys(defaultFilters).forEach(key => {
    const urlValue = searchParams.get(key)
    if (urlValue) {
      urlFilters[key] = urlValue
    }
  })

  // ============================================
  // LOCAL STATE (for UI and caching only)
  // ============================================
  
  // Data state
  const [data, setData] = useState<T[]>(initialData)
  const [total, setTotal] = useState(initialTotal)
  const [isLoading, setIsLoading] = useState(false)

  // Search input state (for controlled input + debounce)
  const [searchInputValue, setSearchInputValue] = useState(urlSearch)

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Cache refs
  const pageCacheRef = useRef<Map<string, { data: T[]; total: number }>>(new Map())
  
  // Track if this is initial mount
  const isInitialMount = useRef(true)
  
  // Track last fetched params to avoid duplicate fetches
  const lastFetchedParams = useRef<string>('')

  // Determine if we should use server-side search
  const useServerSearch = initialTotal > pageSize

  // ============================================
  // URL UPDATE FUNCTION
  // ============================================
  
  const updateUrl = useCallback((updates: {
    page?: number
    search?: string
    filters?: Record<string, string>
  }) => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Update page
    if (updates.page !== undefined) {
      if (updates.page > 1) {
        params.set('list', updates.page.toString())
      } else {
        params.delete('list')
      }
    }
    
    // Update search
    if (updates.search !== undefined) {
      if (updates.search) {
        params.set('search', updates.search)
      } else {
        params.delete('search')
      }
    }
    
    // Update filters
    if (updates.filters !== undefined) {
      Object.entries(updates.filters).forEach(([key, value]) => {
        if (value && value !== defaultFilters[key]) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      })
    }
    
    const queryString = params.toString()
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname
    
    // Use replaceState for instant URL update without navigation
    window.history.replaceState(null, '', newUrl)
    
    // Also update Next.js router state (for searchParams to update)
    router.replace(newUrl, { scroll: false })
  }, [searchParams, pathname, router, defaultFilters])

  // ============================================
  // BUILD CACHE KEY FROM URL PARAMS
  // ============================================
  
  const buildCacheKey = useCallback((page: number, search: string, filters: Record<string, string>) => {
    const filterStr = Object.entries(filters)
      .filter(([_, v]) => v && v !== 'all')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&')
    return `page=${page}&search=${search}&${filterStr}`
  }, [])

  // ============================================
  // FETCH DATA FUNCTION
  // ============================================
  
  const fetchData = useCallback(async (page: number, search: string, filters: Record<string, string>) => {
    const cacheKey = buildCacheKey(page, search, filters)
    
    // Skip if we just fetched these exact params
    if (lastFetchedParams.current === cacheKey) {
      return
    }
    
    // Check cache first
    const cached = pageCacheRef.current.get(cacheKey)
    if (cached) {
      setData(cached.data)
      setTotal(cached.total)
      lastFetchedParams.current = cacheKey
      return
    }

    setIsLoading(true)
    lastFetchedParams.current = cacheKey
    
    try {
      // Build query string
      const params = new URLSearchParams()
      params.set('paginate', 'true')
      params.set('page', page.toString())
      params.set('limit', pageSize.toString())
      
      if (search) {
        params.set('search', search)
      }
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.set(key, value)
        }
      })
      
      const response = await fetch(`${apiRoute}?${params.toString()}`)
      const result = await response.json()
      
      if (result.success) {
        // Cache the result
        pageCacheRef.current.set(cacheKey, { data: result.data, total: result.total })
        setData(result.data)
        setTotal(result.total)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [apiRoute, pageSize, buildCacheKey])

  // ============================================
  // EFFECT: FETCH WHEN URL CHANGES
  // ============================================
  
  useEffect(() => {
    // On initial mount, check if URL params match initial data
    if (isInitialMount.current) {
      isInitialMount.current = false
      
      // Check if URL has non-default params that need fetching
      const hasNonDefaultPage = urlPage > 1
      const hasSearch = urlSearch !== ''
      const hasNonDefaultFilters = Object.entries(urlFilters).some(
        ([key, value]) => value && value !== defaultFilters[key]
      )
      
      // If URL matches initial data conditions (page 1, no search, default filters), use initial data
      if (!hasNonDefaultPage && !hasSearch && !hasNonDefaultFilters) {
        // Cache the initial data
        const cacheKey = buildCacheKey(1, '', urlFilters)
        pageCacheRef.current.set(cacheKey, { data: initialData, total: initialTotal })
        lastFetchedParams.current = cacheKey
        return
      }
    }
    
    // Fetch data based on URL params
    fetchData(urlPage, urlSearch, urlFilters)
  }, [urlPage, urlSearch, JSON.stringify(urlFilters)]) // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================
  // SYNC SEARCH INPUT WITH URL
  // ============================================
  
  // When URL search changes externally, sync input value
  useEffect(() => {
    setSearchInputValue(urlSearch)
  }, [urlSearch])

  // ============================================
  // HANDLERS
  // ============================================
  
  const handleSearchChange = useCallback((value: string) => {
    setSearchInputValue(value)

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    const trimmedValue = value.trim()

    // If not using server search, update URL immediately for client-side filtering
    if (!useServerSearch) {
      updateUrl({ search: trimmedValue, page: 1 })
      return
    }

    // Debounce server search
    debounceTimerRef.current = setTimeout(() => {
      updateUrl({ search: trimmedValue, page: 1 })
    }, debounceMs)
  }, [useServerSearch, updateUrl, debounceMs])

  const updateFilters = useCallback((newFilters: Record<string, string>) => {
    // Merge with current URL filters and update URL
    const mergedFilters = { ...urlFilters, ...newFilters }
    updateUrl({ filters: mergedFilters, page: 1 })
  }, [urlFilters, updateUrl])

  const goToNextPage = useCallback(() => {
    updateUrl({ page: urlPage + 1 })
  }, [urlPage, updateUrl])

  const goToPreviousPage = useCallback(() => {
    updateUrl({ page: Math.max(1, urlPage - 1) })
  }, [urlPage, updateUrl])

  // ============================================
  // CLIENT-SIDE FILTERING (when total <= pageSize)
  // ============================================
  
  const displayData = useMemo(() => {
    if (!urlSearch || useServerSearch) {
      return data
    }

    // Client-side search
    const lowerSearch = urlSearch.toLowerCase()
    return data.filter(item => {
      return Object.values(item as object).some(value => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowerSearch)
        }
        return false
      })
    })
  }, [data, urlSearch, useServerSearch])

  // ============================================
  // UPDATE ITEM (for optimistic updates)
  // ============================================
  
  const updateItem = useCallback((id: string, updates: Partial<T>) => {
    const updateInArray = (arr: T[]) =>
      arr.map(item => ((item as any).id === id ? { ...item, ...updates } : item))

    setData(prev => updateInArray(prev))

    // Update cache
    pageCacheRef.current.forEach((cached, key) => {
      pageCacheRef.current.set(key, {
        ...cached,
        data: updateInArray(cached.data)
      })
    })
  }, [])

  // ============================================
  // CLEANUP
  // ============================================
  
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // ============================================
  // COMPUTED VALUES
  // ============================================
  
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
    activeFilters: urlFilters
  }
}