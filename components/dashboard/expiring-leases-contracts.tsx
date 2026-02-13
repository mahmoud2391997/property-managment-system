'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────

export interface ExpiringLeaseItem {
  id: string
  tenantName: string
  propertyCode: string
  roomTitle?: string | null
  daysUntilExpiry: number
  monthlyRent: number
}

export interface ExpiringContractItem {
  id: string
  contractorName: string
  propertyCode: string
  type: string
  daysUntilExpiry: number
  monthlyCost: number
}

interface ExpiringLeasesContractsProps {
  leases: ExpiringLeaseItem[]
  contracts: ExpiringContractItem[]
  className?: string
}

// ── Urgency color helpers ─────────────────────────────────────────────

function getUrgencyStyle(days: number) {
  if (days <= 7) return 'bg-red-50 text-red-700'
  if (days <= 14) return 'bg-amber-50 text-amber-700'
  return 'bg-blue-50 text-blue-700'
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getInitialsBg(days: number) {
  if (days <= 7) return 'bg-red-500'
  if (days <= 14) return 'bg-amber-500'
  return 'bg-blue-500'
}

// ── Component ──────────────────────────────────────────────────────────

export function ExpiringLeasesContracts({
  leases,
  contracts,
  className,
}: ExpiringLeasesContractsProps) {
  const [tab, setTab] = useState<'leases' | 'contracts'>('leases')

  const isLeases = tab === 'leases'

  return (
    <Card className={cn('py-0 gap-0 flex flex-col flex-1', className)}>
      {/* Header with tabs */}
      <CardHeader className="p-5 pb-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="texts-label-medium text-(--text-secondary)">
              Expiring Soon
            </h3>
            <p className="texts-heading-h3 text-(--text-primary) mt-1">
              {isLeases ? `${leases.length} Leases` : `${contracts.length} Contracts`}
            </p>
            <p className="texts-caption-large text-(--text-muted) mt-0.5">
              Within the next 30 days
            </p>
          </div>
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-(--background-tertiary)">
            <button
              onClick={() => setTab('leases')}
              className={cn(
                'px-3 py-1.5 rounded-md texts-label-small transition-all cursor-pointer',
                isLeases
                  ? 'bg-(--background-primary) text-(--text-primary) shadow-xs'
                  : 'text-(--text-muted) hover:text-(--text-secondary)',
              )}
            >
              Leases
            </button>
            <button
              onClick={() => setTab('contracts')}
              className={cn(
                'px-3 py-1.5 rounded-md texts-label-small transition-all cursor-pointer',
                !isLeases
                  ? 'bg-(--background-primary) text-(--text-primary) shadow-xs'
                  : 'text-(--text-muted) hover:text-(--text-secondary)',
              )}
            >
              Contracts
            </button>
          </div>
        </div>
      </CardHeader>

      {/* Divider */}
      <div className="border-t border-(--border-default) mt-4" />

      {/* Item list */}
      <CardContent className="flex-1 overflow-auto p-0">
        {isLeases ? (
          <LeaseList items={leases} />
        ) : (
          <ContractList items={contracts} />
        )}
      </CardContent>
    </Card>
  )
}

// ── Lease list ─────────────────────────────────────────────────────────

function LeaseList({ items }: { items: ExpiringLeaseItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="texts-body-medium-medium text-(--text-secondary)">No expiring leases</p>
        <p className="texts-caption-large text-(--text-muted) mt-0.5">All leases are in good standing</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-(--border-default)">
      {items.map((lease) => {
        const urgencyStyle = getUrgencyStyle(lease.daysUntilExpiry)
        const initialsBg = getInitialsBg(lease.daysUntilExpiry)

        return (
          <Link
            key={lease.id}
            href={`/leases/${lease.id}`}
            className="flex items-center gap-3 px-5 py-3 hover:bg-(--background-tertiary)/50 transition-colors"
          >
            <div
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center texts-caption-large font-bold text-white shrink-0',
                initialsBg,
              )}
            >
              {getInitials(lease.tenantName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="texts-body-medium-medium text-(--text-primary) truncate">
                {lease.tenantName}
              </p>
              <p className="texts-caption-large text-(--text-muted) mt-0.5 truncate">
                {lease.propertyCode}
                {lease.roomTitle && ` · ${lease.roomTitle}`}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className={cn('px-2 py-0.5 rounded-full texts-caption-large font-medium', urgencyStyle)}>
                {lease.daysUntilExpiry} days
              </span>
              <span className="texts-caption-large text-(--text-muted)">
                RM {lease.monthlyRent.toLocaleString('en-MY')}/mo
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

// ── Contract list ─────────────────────────────────────────────────────

function ContractList({ items }: { items: ExpiringContractItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="texts-body-medium-medium text-(--text-secondary)">No expiring contracts</p>
        <p className="texts-caption-large text-(--text-muted) mt-0.5">All contracts are in good standing</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-(--border-default)">
      {items.map((contract) => {
        const urgencyStyle = getUrgencyStyle(contract.daysUntilExpiry)
        const initialsBg = getInitialsBg(contract.daysUntilExpiry)

        return (
          <Link
            key={contract.id}
            href={`/contracts/${contract.id}`}
            className="flex items-center gap-3 px-5 py-3 hover:bg-(--background-tertiary)/50 transition-colors"
          >
            <div
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center texts-caption-large font-bold text-white shrink-0',
                initialsBg,
              )}
            >
              {getInitials(contract.contractorName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="texts-body-medium-medium text-(--text-primary) truncate">
                {contract.contractorName}
              </p>
              <p className="texts-caption-large text-(--text-muted) mt-0.5 truncate">
                {contract.propertyCode} · {contract.type}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className={cn('px-2 py-0.5 rounded-full texts-caption-large font-medium', urgencyStyle)}>
                {contract.daysUntilExpiry} days
              </span>
              <span className="texts-caption-large text-(--text-muted)">
                RM {contract.monthlyCost.toLocaleString('en-MY')}/mo
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────

export function ExpiringLeasesContractsSkeleton() {
  return (
    <Card className="py-0 gap-0 flex flex-col flex-1">
      <CardHeader className="p-5 pb-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-2" />
            <div className="h-6 w-20 bg-gray-100 rounded animate-pulse mb-1" />
            <div className="h-3 w-36 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-8 w-40 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </CardHeader>
      <div className="border-t border-(--border-default) mt-4" />
      <CardContent className="p-0">
        <div className="divide-y divide-(--border-default)">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse shrink-0" />
              <div className="flex-1">
                <div className="h-4 w-28 bg-gray-100 rounded animate-pulse mb-1.5" />
                <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
                <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <div className="border-t border-(--border-default) px-5 py-3">
        <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
      </div>
    </Card>
  )
}
