'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'

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
}

export function usePaginatedSearch<T>({
  apiRoute,
  initialData,
  initialTotal,
  pageSize = 10,
  debounceMs = 1000
}: UsePaginatedSearchOptions<T>): UsePaginatedSearchReturn<T> {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Read initial values from URL
  const urlList = parseInt(searchParams.get('list') || '1')
  const urlSearch = searchParams.get('search') || ''

  // Calculate max pages from total
  const maxPages = Math.max(1, Math.ceil(initialTotal / pageSize))

  // Validate list param - default to 1 if invalid or exceeds max pages
  const initialList = (urlList > 0 && urlList <= maxPages) ? urlList : 1

  // Check if URL params require fetching different data than initialData
  const needsInitialFetch = initialList > 1 || urlSearch !== ''

  // Pagination state - if URL needs different data, start empty
  const [paginatedData, setPaginatedData] = useState<T[]>(needsInitialFetch ? [] : initialData)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(initialList)

  // Page cache - stores visited pages to avoid refetching
  const pageCacheRef = useRef<Map<number, T[]>>(
    new Map([[1, initialData]])
  )

  // Search state
  const [searchTerm, setSearchTerm] = useState(urlSearch)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<T[]>([])
  const [searchTotal, setSearchTotal] = useState(0)
  const [searchPage, setSearchPage] = useState(1)

  // Loading state - start loading if URL needs different data
  const [isLoading, setIsLoading] = useState(needsInitialFetch)

  // Search page cache - key is "term:page"
  const searchCacheRef = useRef<Map<string, T[]>>(new Map())

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Track last searched term to avoid duplicate searches
  const lastSearchedTermRef = useRef<string>('')

  // Track if initial URL load has been processed
  const initialLoadRef = useRef(false)

  // Determine if we should use server-side search (total > pageSize)
  const useServerSearch = initialTotal > pageSize

  // Update URL without causing navigation (instant, synchronous)
  const updateUrl = useCallback((list: number, search: string) => {
    const params = new URLSearchParams()
    if (list > 1) {
      params.set('list', list.toString())
    }
    if (search) {
      params.set('search', search)
    }
    const queryString = params.toString()
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname
    // Use native history API for instant URL update
    window.history.replaceState(null, '', newUrl)
  }, [pathname])

  // Fetch paginated data from API (with caching)
  const fetchPage = useCallback(async (pageNum: number, updateUrlParam = true) => {
    // Check cache first
    const cached = pageCacheRef.current.get(pageNum)
    if (cached) {
      setPaginatedData(cached)
      setPage(pageNum)
      if (updateUrlParam) updateUrl(pageNum, '')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `${apiRoute}?paginate=true&page=${pageNum}&limit=${pageSize}`
      )
      const result = await response.json()
      if (result.success) {
        // Cache the result
        pageCacheRef.current.set(pageNum, result.data)
        setPaginatedData(result.data)
        setTotal(result.total)
        setPage(pageNum)
        if (updateUrlParam) updateUrl(pageNum, '')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [apiRoute, pageSize, updateUrl])

  // Fetch search results from API (with caching)
  const fetchSearchResults = useCallback(async (term: string, pageNum: number, updateUrlParam = true) => {
    // Check cache first - key is "term:page"
    const cacheKey = `${term}:${pageNum}`
    const cached = searchCacheRef.current.get(cacheKey)
    if (cached) {
      // Only update if this term is still the latest searched term
      if (lastSearchedTermRef.current !== term) return
      setSearchResults(cached)
      setSearchPage(pageNum)
      setDebouncedSearchTerm(term)
      if (updateUrlParam) updateUrl(pageNum, term)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `${apiRoute}?paginate=true&page=${pageNum}&limit=${pageSize}&search=${encodeURIComponent(term)}`
      )
      const result = await response.json()
      // Only update state if this term is still the latest searched term (user didn't clear/change input)
      if (result.success && lastSearchedTermRef.current === term) {
        // Cache the result
        searchCacheRef.current.set(cacheKey, result.data)
        setSearchResults(result.data)
        setSearchTotal(result.total)
        setSearchPage(pageNum)
        // Set debounced term AFTER data is ready
        setDebouncedSearchTerm(term)
        if (updateUrlParam) updateUrl(pageNum, term)
      }
    } catch (error) {
      console.error('Error searching data:', error)
    } finally {
      // Only clear loading if this is still the active search
      if (lastSearchedTermRef.current === term || lastSearchedTermRef.current === '') {
        setIsLoading(false)
      }
    }
  }, [apiRoute, pageSize, updateUrl])

  // Handle search input change with debounce
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    const trimmedValue = value.trim()

    // If search is cleared, reset immediately
    if (!trimmedValue) {
      setDebouncedSearchTerm('')
      setSearchResults([])
      setSearchTotal(0)
      setSearchPage(1)
      searchCacheRef.current.clear()
      lastSearchedTermRef.current = ''
      return
    }

    // Only use server search if total > pageSize
    if (useServerSearch) {
      // Debounce the search term update
      debounceTimerRef.current = setTimeout(() => {
        // Skip if same as last searched term
        if (trimmedValue === lastSearchedTermRef.current) {
          return
        }

        lastSearchedTermRef.current = trimmedValue
        setDebouncedSearchTerm(trimmedValue)
        fetchSearchResults(trimmedValue, 1, false)
      }, debounceMs)
    } else {
      // Client-side search: update debounced term immediately for instant filtering
      setDebouncedSearchTerm(trimmedValue)
    }
  }, [useServerSearch, fetchSearchResults, debounceMs])

  // Client-side filtering for when total <= pageSize
  const clientFilteredData = useMemo(() => {
    if (!debouncedSearchTerm || useServerSearch) {
      return paginatedData
    }

    const lowerSearch = debouncedSearchTerm.toLowerCase()

    // Generic filtering - searches all string properties
    return paginatedData.filter(item => {
      return Object.values(item as object).some(value => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowerSearch)
        }
        return false
      })
    })
  }, [paginatedData, debouncedSearchTerm, useServerSearch])

  // Determine what data to display
  const displayData = useMemo(() => {
    // If searching and using server search, show search results
    if (debouncedSearchTerm && useServerSearch) {
      return searchResults
    }
    // If searching but using client search, show filtered data
    if (debouncedSearchTerm && !useServerSearch) {
      return clientFilteredData
    }
    // No search, show paginated data
    return paginatedData
  }, [debouncedSearchTerm, useServerSearch, searchResults, clientFilteredData, paginatedData])

  // Determine current page info for pagination controls
  const currentPage = debouncedSearchTerm && useServerSearch ? searchPage : page
  const currentTotal = debouncedSearchTerm && useServerSearch ? searchTotal : total

  // Pagination handlers
  const goToNextPage = useCallback(() => {
    if (debouncedSearchTerm && useServerSearch) {
      fetchSearchResults(debouncedSearchTerm, searchPage + 1)
    } else {
      fetchPage(page + 1)
    }
  }, [debouncedSearchTerm, useServerSearch, searchPage, page, fetchSearchResults, fetchPage])

  const goToPreviousPage = useCallback(() => {
    if (debouncedSearchTerm && useServerSearch) {
      fetchSearchResults(debouncedSearchTerm, searchPage - 1)
    } else {
      fetchPage(page - 1)
    }
  }, [debouncedSearchTerm, useServerSearch, searchPage, page, fetchSearchResults, fetchPage])

  const canGoNext = currentPage * pageSize < currentTotal
  const canGoPrevious = currentPage > 1

  // Update a single item by id (for optimistic updates)
  const updateItem = useCallback((id: string, updates: Partial<T>) => {
    const updateInArray = (arr: T[]) =>
      arr.map(item => ((item as any).id === id ? { ...item, ...updates } : item))

    // Update paginated data
    setPaginatedData(prev => updateInArray(prev))

    // Update search results if in search mode
    if (debouncedSearchTerm) {
      setSearchResults(prev => updateInArray(prev))
    }

    // Update page cache
    pageCacheRef.current.forEach((data, pageNum) => {
      pageCacheRef.current.set(pageNum, updateInArray(data))
    })

    // Update search cache
    searchCacheRef.current.forEach((data, key) => {
      searchCacheRef.current.set(key, updateInArray(data))
    })
  }, [debouncedSearchTerm])

  // Handle initial URL params on mount
  useEffect(() => {
    if (initialLoadRef.current) return
    initialLoadRef.current = true

    // If URL list exceeds max pages, redirect to list 1
    if (urlList > maxPages && urlList > 0) {
      updateUrl(1, urlSearch)
    }

    // If URL has search param, trigger search
    if (urlSearch && useServerSearch) {
      lastSearchedTermRef.current = urlSearch
      fetchSearchResults(urlSearch, 1, false)
    }
    // If URL has list param > 1 and no search, fetch that page
    else if (initialList > 1 && !urlSearch) {
      fetchPage(initialList, false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync URL when debouncedSearchTerm changes
  useEffect(() => {
    // Skip on initial mount (handled by initial URL effect)
    if (!initialLoadRef.current) return

    updateUrl(debouncedSearchTerm ? 1 : page, debouncedSearchTerm)
  }, [debouncedSearchTerm, page, updateUrl])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return {
    data: displayData,
    isLoading,
    searchTerm,
    handleSearchChange,
    currentPage,
    total: currentTotal,
    canGoNext,
    canGoPrevious,
    goToNextPage,
    goToPreviousPage,
    pageSize,
    updateItem
  }
}
