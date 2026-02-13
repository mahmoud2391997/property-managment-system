'use client'

import React, { useState, useMemo, useRef } from 'react'
import { cn } from '@/lib/utils'
import { InfoPopover } from '@/components/info-popover'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight, ArrowUpDown, Info } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

// ── Types ──────────────────────────────────────────────────────────────

export interface PropertyMonthData {
  month: string
  income: number | null
  outcome: number | null
  profit: number | null
}

export interface PropertyMonthlyData {
  propertyCode: string
  months: PropertyMonthData[]
  avgProfit: number
}

export interface ProjectOption {
  id: string
  name: string
}

interface PropertyProfitHeatmapProps {
  data: PropertyMonthlyData[]
  years: number[]
  projects: ProjectOption[]
  selectedYear: number
  selectedProject: string
  onYearChange: (year: number) => void
  onProjectChange: (projectId: string) => void
  className?: string
}

// ── Color helpers ──────────────────────────────────────────────────────

// Smooth HSL interpolation between color stops for a continuous gradient
const COLOR_STOPS = [
  { pos: 0.0, h: 0, s: 80, l: 72 },    // soft red
  { pos: 0.25, h: 30, s: 80, l: 72 },   // soft orange
  { pos: 0.4, h: 45, s: 85, l: 75 },    // soft amber
  { pos: 0.5, h: 170, s: 10, l: 88 },   // neutral slate
  { pos: 0.6, h: 152, s: 60, l: 80 },   // soft mint
  { pos: 0.75, h: 168, s: 70, l: 65 },  // medium teal
  { pos: 1.0, h: 174, s: 50, l: 30 },   // deep teal (system)
]

function interpolateColor(t: number): string {
  const clamped = Math.max(0, Math.min(1, t))

  // Find the two stops to interpolate between
  let lower = COLOR_STOPS[0]
  let upper = COLOR_STOPS[COLOR_STOPS.length - 1]
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    if (clamped >= COLOR_STOPS[i].pos && clamped <= COLOR_STOPS[i + 1].pos) {
      lower = COLOR_STOPS[i]
      upper = COLOR_STOPS[i + 1]
      break
    }
  }

  const range = upper.pos - lower.pos
  const local = range === 0 ? 0 : (clamped - lower.pos) / range

  const h = Math.round(lower.h + (upper.h - lower.h) * local)
  const s = Math.round(lower.s + (upper.s - lower.s) * local)
  const l = Math.round(lower.l + (upper.l - lower.l) * local)

  return `hsl(${h}, ${s}%, ${l}%)`
}

function getTextColor(t: number): string {
  // White text on darkest backgrounds (top ~15%), dark elsewhere
  return t > 0.85 || t < 0.15 ? '#ffffff' : '#1f1f1f'
}

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}K`
  return String(value)
}

const MONTH_HEADERS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Build the CSS gradient string for the legend
const LEGEND_GRADIENT = `linear-gradient(to right, ${COLOR_STOPS.map(
  (s) => `hsl(${s.h}, ${s.s}%, ${s.l}%) ${s.pos * 100}%`,
).join(', ')})`

// ── Component ──────────────────────────────────────────────────────────

export function PropertyProfitHeatmap({
  data,
  years,
  projects,
  selectedYear,
  selectedProject,
  onYearChange,
  onProjectChange,
  className,
}: PropertyProfitHeatmapProps) {
  const isProjectFiltered = selectedProject !== 'all'
  const [sortOrder, setSortOrder] = useState<'profit' | 'loss'>('profit')
  const [currentPage, setCurrentPage] = useState(0)
  const [hovered, setHovered] = useState<{ row: number; col: number } | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const pageSize = 7

  // Sort data
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) =>
      sortOrder === 'profit'
        ? b.avgProfit - a.avgProfit
        : a.avgProfit - b.avgProfit,
    )
  }, [data, sortOrder])

  const totalPages = Math.ceil(sortedData.length / pageSize)
  const pageData = sortedData.slice(currentPage * pageSize, (currentPage + 1) * pageSize)

  // Global min/max for color normalization (across ALL data, not just page)
  // Uses diverging scale centered on 0: negative → red, 0 → neutral, positive → teal
  const { minProfit, maxProfit } = useMemo(() => {
    let min = Infinity
    let max = -Infinity
    data.forEach((p) =>
      p.months.forEach((m) => {
        if (m.profit == null) return
        if (m.profit < min) min = m.profit
        if (m.profit > max) max = m.profit
      }),
    )
    return { minProfit: min === Infinity ? 0 : min, maxProfit: max === -Infinity ? 0 : max }
  }, [data])

  return (
    <Card className={cn('py-0 gap-0', className)}>
      <CardHeader className="p-5 pb-0">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="texts-label-medium text-(--text-secondary) flex items-center">
              Property Profit Heatmap
              <InfoPopover
                title="Property Profit Heatmap"
                description="Monthly profit/loss for each property, calculated as Income − Expenses. Colors range from red (loss) through neutral to teal (profit). The Total column shows the annual sum. Hover over cells for details."
              />
            </h3>
            <p className="texts-heading-h3 text-(--text-primary) mt-1">
              Monthly Performance
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
                    Showing only properties in the selected project. Expenses not tied to properties are excluded.
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
              onClick={() => { setSortOrder((s) => s === 'profit' ? 'loss' : 'profit'); setCurrentPage(0) }}
              className="flex items-center gap-1 px-2 h-8 rounded-md border border-(--border-default) texts-caption-large text-(--text-secondary) hover:bg-(--background-tertiary) transition-colors cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {sortOrder === 'profit' ? 'Highest Profit' : 'Highest Loss'}
            </button>

            {/* Pagination */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="p-1.5 rounded-md hover:bg-(--background-tertiary) disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-(--text-secondary)" />
              </button>
              <span className="texts-caption-large text-(--text-muted) min-w-[40px] text-center">
                {currentPage + 1}/{totalPages || 1}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="p-1.5 rounded-md hover:bg-(--background-tertiary) disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-(--text-secondary)" />
              </button>
            </div>

            {/* Year */}
            <Select
              value={String(selectedYear)}
              onValueChange={(v) => { onYearChange(Number(v)); setCurrentPage(0) }}
            >
              <SelectTrigger size="sm" className="w-[90px] texts-caption-large">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-4">
        <div className="overflow-visible" ref={gridRef}>
          <div
            className="grid gap-1.5 min-w-[750px] p-1"
            style={{ gridTemplateColumns: '90px repeat(12, 1fr) 72px' }}
          >
            {/* Column headers */}
            <div /> {/* Empty corner cell */}
            {MONTH_HEADERS.map((m) => (
              <div
                key={m}
                className="texts-caption-large text-(--text-muted) text-center py-1.5 font-medium"
              >
                {m}
              </div>
            ))}
            <div className="texts-caption-large text-(--text-muted) text-center py-1.5 font-medium">
              Total
            </div>

            {/* Data rows */}
            {pageData.map((property, rowIdx) => {
              const isRowHovered = hovered?.row === rowIdx
              const validMonths = property.months.filter(m => m.profit != null)
              const totalProfit = validMonths.reduce((sum, m) => sum + m.profit!, 0)

              return (
                <React.Fragment key={property.propertyCode}>
                  {/* Row header */}
                  <div
                    className={cn(
                      'texts-label-small text-(--text-primary) flex items-center truncate pr-2 rounded-md px-1.5 transition-colors',
                      isRowHovered && 'bg-(--background-tertiary)',
                    )}
                  >
                    {property.propertyCode}
                  </div>

                  {/* Month cells */}
                  {property.months.map((month, colIdx) => {
                    const isNull = month.profit == null
                    const isHovered = hovered?.row === rowIdx && hovered?.col === colIdx
                    const isCrossHighlight =
                      (hovered?.row === rowIdx || hovered?.col === colIdx) &&
                      !(hovered?.row === rowIdx && hovered?.col === colIdx)

                    // Diverging color: 0 → 0.5 (neutral)
                    // Positive: scale 0.5–1.0 relative to maxProfit
                    // Negative: scale 0.0–0.5 relative to minProfit
                    let t = 0.5
                    if (!isNull) {
                      const p = month.profit!
                      if (p > 0 && maxProfit > 0) {
                        t = 0.5 + (p / maxProfit) * 0.5
                      } else if (p < 0 && minProfit < 0) {
                        t = 0.5 - (Math.abs(p) / Math.abs(minProfit)) * 0.5
                      }
                    }
                    const bgColor = isNull ? undefined : interpolateColor(t)
                    const txtColor = isNull ? undefined : getTextColor(t)

                    return (
                      <div
                        key={`${property.propertyCode}-${month.month}`}
                        className={cn(
                          'relative min-h-[38px] rounded-md transition-all duration-150 flex items-center justify-center',
                          isNull
                            ? 'bg-(--background-tertiary) border border-dashed border-(--border-default)'
                            : 'cursor-help',
                          isHovered && !isNull && 'ring-2 ring-offset-1 ring-(--text-primary) z-10',
                          isCrossHighlight && !isNull && 'brightness-90',
                        )}
                        style={bgColor ? { backgroundColor: bgColor } : undefined}
                        onMouseEnter={() => !isNull && setHovered({ row: rowIdx, col: colIdx })}
                        onMouseLeave={() => setHovered(null)}
                      >
                        {isNull ? (
                          <span className="texts-caption-small text-(--text-muted) leading-none">
                            N/A
                          </span>
                        ) : (
                          <span
                            className="texts-caption-small font-semibold leading-none"
                            style={{ color: txtColor }}
                          >
                            {formatCompact(month.profit!)}
                          </span>
                        )}

                        {/* Hover tooltip */}
                        {isHovered && !isNull && (
                          <div
                            className={cn(
                              'absolute z-50 bottom-full mb-2 bg-white border border-(--border-default) rounded-lg px-3 py-2 shadow-lg min-w-[160px] pointer-events-none',
                              colIdx <= 1 && 'left-0',
                              colIdx >= 10 && 'right-0',
                              colIdx > 1 && colIdx < 10 && 'left-1/2 -translate-x-1/2',
                            )}
                          >
                            <p className="texts-label-small text-(--text-muted) mb-1.5">
                              {property.propertyCode} · {month.month}
                            </p>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between gap-3">
                                <span className="texts-caption-large text-(--text-secondary)">Income</span>
                                <span className="texts-caption-large text-(--text-primary)">
                                  RM {month.income!.toLocaleString('en-MY')}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="texts-caption-large text-(--text-secondary)">Outcome</span>
                                <span className="texts-caption-large text-(--text-primary)">
                                  RM {month.outcome!.toLocaleString('en-MY')}
                                </span>
                              </div>
                              <div className="border-t border-(--border-default) pt-1 mt-0.5">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="texts-caption-large text-(--text-secondary)">
                                    {month.profit! >= 0 ? 'Profit' : 'Loss'}
                                  </span>
                                  <span
                                    className="texts-caption-large font-bold"
                                    style={{ color: month.profit! >= 0 ? '#0d9488' : '#ef4444' }}
                                  >
                                    {month.profit! >= 0 ? '+' : ''}RM {month.profit!.toLocaleString('en-MY')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {/* Arrow */}
                            <div
                              className={cn(
                                'absolute top-full w-2 h-2 bg-white border-b border-r border-(--border-default) rotate-45 -mt-1',
                                colIdx <= 1 && 'left-4',
                                colIdx >= 10 && 'right-4',
                                colIdx > 1 && colIdx < 10 && 'left-1/2 -translate-x-1/2',
                              )}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Total column */}
                  <div
                    key={`total-${property.propertyCode}`}
                    className={cn(
                      'min-h-[38px] rounded-md flex items-center justify-center bg-(--background-tertiary) border border-(--border-default) transition-colors',
                      isRowHovered && 'bg-(--background-secondary)',
                    )}
                  >
                    <span
                      className="texts-caption-small font-bold leading-none"
                      style={{ color: totalProfit >= 0 ? '#0d9488' : '#ef4444' }}
                    >
                      {totalProfit >= 0 ? '+' : ''}{formatCompact(totalProfit)}
                    </span>
                  </div>
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* Gradient legend */}
        <div className="flex items-center justify-center gap-3 mt-5">
          <span className="texts-caption-large text-(--text-muted)">Loss</span>
          <div
            className="h-3 w-48 rounded-full"
            style={{ background: LEGEND_GRADIENT }}
          />
          <span className="texts-caption-large text-(--text-muted)">Profit</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────

export function PropertyProfitHeatmapSkeleton() {
  return (
    <Card className="py-0 gap-0">
      <CardHeader className="p-5 pb-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="h-4 w-40 bg-gray-100 rounded animate-pulse mb-2" />
            <div className="h-6 w-36 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-28 bg-gray-100 rounded-md animate-pulse" />
            <div className="h-8 w-20 bg-gray-100 rounded-md animate-pulse" />
            <div className="h-8 w-[90px] bg-gray-100 rounded-md animate-pulse" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-4">
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: '90px repeat(12, 1fr) 64px' }}
        >
          <div />
          {Array.from({ length: 13 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
          ))}
          {Array.from({ length: 7 }).map((_, row) => (
            <>
              <div key={`l-${row}`} className="h-10 bg-gray-100 rounded-md animate-pulse" />
              {Array.from({ length: 12 }).map((_, col) => (
                <div key={`c-${row}-${col}`} className="h-10 bg-gray-100 rounded-md animate-pulse" />
              ))}
              <div key={`a-${row}`} className="h-10 bg-gray-100 rounded-md animate-pulse" />
            </>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
