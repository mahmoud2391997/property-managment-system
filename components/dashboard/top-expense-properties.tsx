'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { InfoPopover } from '@/components/info-popover'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronLeft, ChevronRight, ArrowUpDown, Info } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────

export interface PropertyExpenseData {
  propertyCode: string
  totalExpense: number
}

export interface ExpenseCategoryTypeMap {
  [category: string]: string[]
}

export interface ProjectOption {
  id: string
  name: string
}

interface TopExpensePropertiesProps {
  data: PropertyExpenseData[]
  categories: string[]
  categoryTypeMap: ExpenseCategoryTypeMap
  projects: ProjectOption[]
  selectedCategory: string
  selectedTypes: string[]
  selectedProject: string
  onCategoryChange: (category: string) => void
  onTypesChange: (types: string[]) => void
  onProjectChange: (projectId: string) => void
  className?: string
}

interface TypeItem {
  key: string
  type: string
  category: string
}

// ── Helpers ────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return value.toFixed(0)
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const { propertyCode, totalExpense } = payload[0].payload
    return (
      <div className="bg-white border border-(--border-default) rounded-lg px-4 py-3 shadow-lg min-w-[160px]">
        <p className="texts-label-small text-(--text-muted) mb-1">{propertyCode}</p>
        <span className="texts-label-small text-(--text-primary)">
          RM {totalExpense.toLocaleString('en-MY')}
        </span>
      </div>
    )
  }
  return null
}

// ── Component ──────────────────────────────────────────────────────────

export function TopExpenseProperties({
  data,
  categories,
  categoryTypeMap,
  projects,
  selectedCategory,
  selectedTypes,
  selectedProject,
  onCategoryChange,
  onTypesChange,
  onProjectChange,
  className,
}: TopExpensePropertiesProps) {
  const isProjectFiltered = selectedProject !== 'all'
  const [sortDirection, setSortDirection] = useState<'top' | 'least'>('top')
  const [pageIndex, setPageIndex] = useState(0)
  const pageSize = 7
  const TAG_LIMIT = 7

  // Available types — keeps duplicates across categories with composite keys
  const availableTypes = useMemo<TypeItem[]>(() => {
    const buildItems = (category: string, types: string[]): TypeItem[] => {
      const sorted = [...types].sort((a, b) => {
        if (a === 'Miscellaneous_Others') return 1
        if (b === 'Miscellaneous_Others') return -1
        return 0
      })
      return sorted.map((type) => ({ key: `${category}:${type}`, type, category }))
    }

    if (selectedCategory === 'All Categories') {
      return Object.entries(categoryTypeMap).flatMap(([cat, types]) => buildItems(cat, types))
    }
    return buildItems(selectedCategory, categoryTypeMap[selectedCategory] || [])
  }, [selectedCategory, categoryTypeMap])

  const visibleTypes = availableTypes.slice(0, TAG_LIMIT)
  const overflowTypes = availableTypes.slice(TAG_LIMIT)
  const overflowSelectedCount = overflowTypes.filter((t) => selectedTypes.includes(t.key)).length

  // Group overflow types by category for the popover
  const overflowGrouped = useMemo(() => {
    const groups: { category: string; items: TypeItem[] }[] = []
    overflowTypes.forEach((item) => {
      const last = groups[groups.length - 1]
      if (last && last.category === item.category) {
        last.items.push(item)
      } else {
        groups.push({ category: item.category, items: [item] })
      }
    })
    return groups
  }, [overflowTypes])

  // Sort data
  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) =>
      sortDirection === 'top'
        ? b.totalExpense - a.totalExpense
        : a.totalExpense - b.totalExpense,
    )
    return sorted
  }, [data, sortDirection])

  const totalPages = Math.ceil(sortedData.length / pageSize)
  const pageData = sortedData.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)

  const handleCategoryChange = (cat: string) => {
    onCategoryChange(cat)
    if (cat === 'All Categories') {
      onTypesChange(
        Object.entries(categoryTypeMap).flatMap(([c, types]) => types.map((t) => `${c}:${t}`)),
      )
    } else {
      onTypesChange((categoryTypeMap[cat] || []).map((t) => `${cat}:${t}`))
    }
    setPageIndex(0)
  }

  const toggleType = (key: string) => {
    if (selectedTypes.includes(key)) {
      onTypesChange(selectedTypes.filter((k) => k !== key))
    } else {
      onTypesChange([...selectedTypes, key])
    }
  }

  const allSelected = availableTypes.length > 0 && availableTypes.every((t) => selectedTypes.includes(t.key))

  const toggleAll = () => {
    if (allSelected) {
      onTypesChange([])
    } else {
      onTypesChange(availableTypes.map((t) => t.key))
    }
  }

  return (
    <Card className={cn('py-0 gap-0 flex-2', className)}>
      <CardHeader className="p-5 pb-0">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="texts-label-medium text-(--text-secondary) flex items-center">
              Properties by Expenses
              <InfoPopover
                title="Properties by Expenses"
                description="Properties ranked by total expenses. Use the category and type filters to narrow down by expense category. Toggle between highest and lowest spending properties."
              />
            </h3>
            <p className="texts-heading-h3 text-(--text-primary) mt-1">
              {sortDirection === 'top' ? 'Top' : 'Least'} 7
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Project filter info */}
            {isProjectFiltered && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="p-1 hover:bg-teal-50 rounded-full transition-colors cursor-pointer">
                    <Info className="w-4 h-4 text-[#0d9488]" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="end" className="w-64 p-3 bg-white border border-gray-200 shadow-lg">
                  <p className="texts-label-small text-(--text-primary) mb-1">Note</p>
                  <p className="texts-caption-large text-(--text-secondary)">
                    Showing only properties and their expenses from the selected project.
                  </p>
                </PopoverContent>
              </Popover>
            )}
            {/* Project selector */}
            <Select value={selectedProject} onValueChange={onProjectChange}>
              <SelectTrigger size="sm" className="w-[140px] texts-caption-large">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Sort toggle */}
            <button
              onClick={() => { setSortDirection((d) => d === 'top' ? 'least' : 'top'); setPageIndex(0) }}
              className="flex items-center gap-1 px-2 h-8 rounded-md border border-(--border-default) texts-caption-large text-(--text-secondary) hover:bg-(--background-tertiary) transition-colors cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {sortDirection === 'top' ? 'Top' : 'Least'}
            </button>

            {/* Pagination */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                disabled={pageIndex === 0}
                className="p-1.5 rounded-md hover:bg-(--background-tertiary) disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-(--text-secondary)" />
              </button>
              <span className="texts-caption-large text-(--text-muted) min-w-[40px] text-center">
                {pageIndex + 1}/{totalPages || 1}
              </span>
              <button
                onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                disabled={pageIndex >= totalPages - 1}
                className="p-1.5 rounded-md hover:bg-(--background-tertiary) disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-(--text-secondary)" />
              </button>
            </div>

            {/* Category */}
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger size="sm" className="w-[160px] texts-caption-large">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Type tags + overflow popover */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <button
            onClick={toggleAll}
            className={cn(
              'px-2.5 py-1 rounded-md texts-caption-large transition-colors cursor-pointer border',
              allSelected
                ? 'bg-(--secondary-color) text-white border-(--secondary-color)'
                : 'bg-(--background-tertiary) text-(--text-secondary) border-(--border-default) hover:bg-(--background-secondary)',
            )}
          >
            All
          </button>
          {visibleTypes.map((item) => {
            const isSelected = selectedTypes.includes(item.key)
            return (
              <button
                key={item.key}
                onClick={() => toggleType(item.key)}
                className={cn(
                  'px-2.5 py-1 rounded-md texts-caption-large transition-colors cursor-pointer border',
                  isSelected
                    ? 'bg-(--secondary-color) text-white border-(--secondary-color)'
                    : 'bg-(--background-tertiary) text-(--text-secondary) border-(--border-default) hover:bg-(--background-secondary)',
                )}
              >
                {item.type.replace(/_/g, ' ')}
              </button>
            )
          })}
          {overflowTypes.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    'px-2.5 py-1 rounded-md texts-caption-large transition-colors cursor-pointer border',
                    overflowSelectedCount > 0
                      ? 'bg-(--secondary-color)/10 text-(--secondary-color) border-(--secondary-color) font-medium'
                      : 'bg-(--background-tertiary) text-(--text-muted) border-(--border-default) hover:text-(--text-secondary) hover:bg-(--background-secondary)',
                  )}
                >
                  +{overflowTypes.length} more{overflowSelectedCount > 0 && ` (${overflowSelectedCount} selected)`}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-72 p-0 max-h-72 overflow-hidden">
                <div className="px-3 py-2.5 border-b border-(--border-default)">
                  <p className="texts-label-small text-(--text-primary) font-medium">
                    More Types
                  </p>
                  <p className="texts-caption-large text-(--text-muted) mt-0.5">
                    {overflowSelectedCount} of {overflowTypes.length} selected
                  </p>
                </div>
                <div className="p-1.5 max-h-52 overflow-y-auto">
                  {overflowGrouped.map((group) => (
                    <div key={group.category}>
                      <p className="texts-caption-large text-(--text-muted) font-semibold px-2.5 pt-2.5 pb-1">
                        {group.category.replace(/_/g, ' ')}
                      </p>
                      {group.items.map((item) => {
                        const checked = selectedTypes.includes(item.key)
                        return (
                          <label
                            key={item.key}
                            className={cn(
                              'flex items-center gap-2.5 px-2.5 py-2 rounded-md cursor-pointer transition-colors',
                              checked ? 'bg-(--secondary-color)/5' : 'hover:bg-(--background-tertiary)',
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleType(item.key)}
                            />
                            <span className={cn(
                              'texts-caption-large',
                              checked ? 'text-(--text-primary) font-medium' : 'text-(--text-secondary)',
                            )}>
                              {item.type.replace(/_/g, ' ')}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </CardHeader>

      <CardContent className="h-72 w-full p-5 pt-4 cursor-help [&_.recharts-wrapper]:cursor-help!">
        {pageData.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="texts-body-medium-medium text-(--text-muted)">No data</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={pageData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              barCategoryGap="25%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="propertyCode"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickFormatter={formatCurrency}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6', radius: 4 }} />
              <Bar
                dataKey="totalExpense"
                fill="#0d9488"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────

export function TopExpensePropertiesSkeleton() {
  return (
    <Card className="py-0 gap-0 flex-2">
      <CardHeader className="p-5 pb-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="h-4 w-36 bg-gray-100 rounded animate-pulse mb-2" />
            <div className="h-6 w-16 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-16 bg-gray-100 rounded-md animate-pulse" />
            <div className="h-8 w-24 bg-gray-100 rounded-md animate-pulse" />
            <div className="h-8 w-40 bg-gray-100 rounded-md animate-pulse" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-7 w-16 bg-gray-100 rounded-md animate-pulse" />
          ))}
        </div>
      </CardHeader>
      <CardContent className="h-72 w-full p-5 pt-4 flex items-end gap-6 justify-center">
        {[70, 55, 40, 30, 20].map((h, i) => (
          <div
            key={i}
            className="w-12 bg-gray-200 rounded-t animate-pulse"
            style={{ height: `${h}%` }}
          />
        ))}
      </CardContent>
    </Card>
  )
}
