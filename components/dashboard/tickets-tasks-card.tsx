'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

// ── Types ──────────────────────────────────────────────────────────────

export interface TicketItem {
  id: string
  referenceId: string
  title: string
  type: string
  property: string
  room?: string | null
  status: string
  issuedAt: string // ISO timestamp
}

export interface TaskItem {
  id: string
  referenceId: string
  title: string
  type: string
  property?: string | null
  room?: string | null
  priority: string
  status: string
  dueDate?: string | null
  createdAt: string // ISO timestamp
}

export interface StatusCount {
  label: string
  count: number
  color: string
}

interface TicketsTasksCardProps {
  tickets: TicketItem[]
  tasks: TaskItem[]
  ticketStatusCounts: StatusCount[]
  taskStatusCounts: StatusCount[]
  className?: string
}

// ── Status colors ──────────────────────────────────────────────────────

const TICKET_STATUS_STYLE: Record<string, string> = {
  Open: 'bg-blue-50 text-blue-700',
  'In Progress': 'bg-amber-50 text-amber-700',
  'Pending Tenant Confirmation': 'bg-violet-50 text-violet-700',
  Resolved: 'bg-emerald-50 text-emerald-700',
  Closed: 'bg-gray-100 text-gray-500',
}

const TASK_STATUS_STYLE: Record<string, string> = {
  Open: 'bg-blue-50 text-blue-700',
  'In Progress': 'bg-amber-50 text-amber-700',
  Resolved: 'bg-emerald-50 text-emerald-700',
}

const PRIORITY_STYLE: Record<string, string> = {
  Urgent: 'bg-red-50 text-red-700',
  High: 'bg-red-50 text-red-700',
  Medium: 'bg-amber-50 text-amber-700',
  Low: 'bg-blue-50 text-blue-700',
}

// ── Component ──────────────────────────────────────────────────────────

export function TicketsTasksCard({
  tickets,
  tasks,
  ticketStatusCounts,
  taskStatusCounts,
  className,
}: TicketsTasksCardProps) {
  const [tab, setTab] = useState<'tickets' | 'tasks'>('tickets')

  const isTickets = tab === 'tickets'
  const statusCounts = isTickets ? ticketStatusCounts : taskStatusCounts

  return (
    <Card className={cn('py-0 gap-0 flex flex-col', className)}>
      {/* Header with tabs */}
      <CardHeader className="p-5 pb-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="texts-label-medium text-(--text-secondary)">
              Work Operations
            </h3>
            <p className="texts-heading-h3 text-(--text-primary) mt-1">
              {isTickets ? 'Tickets' : 'Tasks'}
            </p>
          </div>
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-(--background-tertiary)">
            <button
              onClick={() => setTab('tickets')}
              className={cn(
                'px-3 py-1.5 rounded-md texts-label-small transition-all cursor-pointer',
                isTickets
                  ? 'bg-(--background-primary) text-(--text-primary) shadow-xs'
                  : 'text-(--text-muted) hover:text-(--text-secondary)',
              )}
            >
              Tickets
            </button>
            <button
              onClick={() => setTab('tasks')}
              className={cn(
                'px-3 py-1.5 rounded-md texts-label-small transition-all cursor-pointer',
                !isTickets
                  ? 'bg-(--background-primary) text-(--text-primary) shadow-xs'
                  : 'text-(--text-muted) hover:text-(--text-secondary)',
              )}
            >
              Tasks
            </button>
          </div>
        </div>
      </CardHeader>

      {/* Status counts */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {statusCounts.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md"
              style={{ backgroundColor: `${s.color}14` }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span
                className="texts-caption-large font-bold leading-none"
                style={{ color: s.color }}
              >
                {s.count} {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-(--border-default)" />

      {/* Item list */}
      <CardContent className="flex-1 overflow-auto p-0">
        {isTickets ? (
          <TicketList items={tickets} />
        ) : (
          <TaskList items={tasks} />
        )}
      </CardContent>

      {/* Footer */}
      <div className="border-t border-(--border-default) px-5 py-3">
        <Link
          href={isTickets ? '/tickets' : '/tasks'}
          className="flex items-center gap-1.5 texts-label-small text-[#0d9488] hover:text-[#0d9488]/80 transition-colors w-fit"
        >
          View all {isTickets ? 'tickets' : 'tasks'}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  )
}

// ── Ticket list ────────────────────────────────────────────────────────

function TicketList({ items }: { items: TicketItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="texts-body-medium-medium text-(--text-secondary)">No tickets</p>
        <p className="texts-caption-large text-(--text-muted) mt-0.5">All clear for now</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-(--border-default)">
      {items.map((ticket) => {
        const statusStyle = TICKET_STATUS_STYLE[ticket.status] || TICKET_STATUS_STYLE.Open

        return (
          <Link
            key={ticket.id}
            href={`/tickets/${ticket.id}`}
            className="flex items-center gap-3 px-5 py-3 hover:bg-(--background-tertiary)/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="texts-body-medium-medium text-(--text-primary) line-clamp-1">
                {ticket.title}
              </p>
              <p className="texts-caption-large text-(--text-muted) mt-0.5 truncate">
                {ticket.referenceId} · {ticket.type}
                {ticket.property && ` · ${ticket.property}`}
                {ticket.room && ` · ${ticket.room}`}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className={cn('px-2 py-0.5 rounded-full texts-caption-large font-medium', statusStyle)}>
                {ticket.status}
              </span>
              <span className="texts-caption-large text-(--text-muted)">
                {formatDistanceToNow(new Date(ticket.issuedAt), { addSuffix: true })}
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

// ── Task list ──────────────────────────────────────────────────────────

function TaskList({ items }: { items: TaskItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="texts-body-medium-medium text-(--text-secondary)">No tasks</p>
        <p className="texts-caption-large text-(--text-muted) mt-0.5">All caught up</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-(--border-default)">
      {items.map((task) => {
        const statusStyle = TASK_STATUS_STYLE[task.status] || TASK_STATUS_STYLE.Open
        const priorityStyle = PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.Medium

        return (
          <Link
            key={task.id}
            href={`/tasks/${task.id}`}
            className="flex items-center gap-3 px-5 py-3 hover:bg-(--background-tertiary)/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="texts-body-medium-medium text-(--text-primary) line-clamp-1">
                {task.title}
              </p>
              <p className="texts-caption-large text-(--text-muted) mt-0.5 truncate">
                {task.referenceId} · {task.type}
                {task.property && ` · ${task.property}`}
                {task.room && ` · ${task.room}`}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className={cn('px-2 py-0.5 rounded-full texts-caption-large font-medium', priorityStyle)}>
                  {task.priority}
                </span>
                <span className={cn('px-2 py-0.5 rounded-full texts-caption-large font-medium', statusStyle)}>
                  {task.status}
                </span>
              </div>
              {task.dueDate && (
                <span className="texts-caption-large text-(--text-muted)">
                  Due {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                </span>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────

export function TicketsTasksCardSkeleton() {
  return (
    <Card className="py-0 gap-0 flex flex-col">
      <CardHeader className="p-5 pb-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-4 w-28 bg-gray-100 rounded animate-pulse mb-2" />
            <div className="h-6 w-20 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-8 w-40 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </CardHeader>
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 w-20 bg-gray-100 rounded-md animate-pulse" />
          ))}
        </div>
      </div>
      <div className="border-t border-(--border-default)" />
      <CardContent className="p-0">
        <div className="divide-y divide-(--border-default)">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <div className="flex-1">
                <div className="h-4 w-48 bg-gray-100 rounded animate-pulse mb-1.5" />
                <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
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
