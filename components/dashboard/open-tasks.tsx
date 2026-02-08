'use client'

import { cn } from '@/lib/utils'
import { OpenTask } from '@/lib/dashboard-data'
import { format } from 'date-fns'
import Link from 'next/link'
import { ArrowRight, ClipboardList, Circle, CheckCircle2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface OpenTasksProps {
  tasks: OpenTask[]
  className?: string
}

const PRIORITY_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  High: { bg: 'bg-red-100', text: 'text-red-700', label: 'High' },
  Medium: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Medium' },
  Low: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Low' },
}

const STATUS_ICON: Record<string, { icon: typeof Circle; color: string }> = {
  Pending: { icon: Circle, color: 'text-gray-400' },
  InProgress: { icon: Loader2, color: 'text-blue-500' },
}

export function OpenTasks({ tasks, className }: OpenTasksProps) {
  // Calculate stats
  const pendingCount = tasks.filter(t => t.status === 'Pending').length
  const inProgressCount = tasks.filter(t => t.status === 'InProgress').length
  const highPriorityCount = tasks.filter(t => t.priority === 'High').length

  return (
    <Card className={cn('py-0 gap-0 flex flex-col', className)}>
      {/* Header */}
      <CardHeader className="p-5 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-violet-100 rounded-lg">
              <ClipboardList className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Tasks</h3>
              <p className="text-sm text-gray-500">Tasks requiring attention</p>
            </div>
          </div>
          <Link
            href="/tasks"
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </CardHeader>

      {/* Stats Row */}
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xl font-bold text-gray-900">{pendingCount}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
          <div>
            <p className="text-xl font-bold text-blue-600">{inProgressCount}</p>
            <p className="text-xs text-gray-500">In Progress</p>
          </div>
          <div>
            <p className="text-xl font-bold text-red-600">{highPriorityCount}</p>
            <p className="text-xs text-gray-500">High Priority</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <CardContent className="flex-1 overflow-auto p-0">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-3 bg-gray-100 rounded-full mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-gray-600">All caught up!</p>
            <p className="text-xs text-gray-400 mt-1">No open tasks</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tasks.map((task) => {
              const priorityConfig = PRIORITY_CONFIG[task.priority || 'Medium'] || PRIORITY_CONFIG.Medium
              const statusConfig = STATUS_ICON[task.status] || STATUS_ICON.Pending
              const StatusIcon = statusConfig.icon

              return (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  {/* Status Icon */}
                  <div className="pt-0.5">
                    <StatusIcon
                      className={cn(
                        'w-5 h-5',
                        statusConfig.color,
                        task.status === 'InProgress' && 'animate-spin'
                      )}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                      {task.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {task.propertyCode}
                      {task.roomTitle && ` · ${task.roomTitle}`}
                    </p>
                  </div>

                  {/* Priority & Date */}
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <span className={cn(
                      'inline-block px-2 py-0.5 text-xs font-semibold rounded-full',
                      priorityConfig.bg, priorityConfig.text
                    )}>
                      {priorityConfig.label}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-gray-400">
                        {format(new Date(task.dueDate), 'MMM d')}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function OpenTasksSkeleton() {
  return (
    <Card className="py-0 gap-0 flex flex-col">
      <CardHeader className="p-5 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse" />
            <div>
              <div className="h-5 w-16 bg-gray-100 rounded animate-pulse mb-1" />
              <div className="h-4 w-36 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
        </div>
      </CardHeader>
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <div className="grid grid-cols-3 gap-4 text-center">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-6 w-8 bg-gray-200 rounded animate-pulse mx-auto mb-1" />
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>
      </div>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3 px-5 py-3">
              <div className="w-5 h-5 rounded-full bg-gray-100 animate-pulse mt-0.5" />
              <div className="flex-1">
                <div className="h-4 w-40 bg-gray-100 rounded animate-pulse mb-1" />
                <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="h-5 w-14 bg-gray-100 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
