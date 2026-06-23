'use client'

import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import type { TaskStatus, FlowTaskType } from './types'

type FlowTaskSummary = {
  id: string
  referenceId: string
  title: string
  status: TaskStatus
  type: FlowTaskType | string
  isCurrent?: boolean
}

type FlowLeaseInfo = {
  id: string
  depositAmount: number
  propertyCode?: string
  roomTitle?: string
  tenantName: string
}

type FlowInfo = {
  flowInstanceId: string
  flowType: string
  flowStatus: 'In Progress' | 'Completed'
  relatedTasks: FlowTaskSummary[]
  leaseInfo?: FlowLeaseInfo
}

type TaskGroup = {
  label: string
  tasks: FlowTaskSummary[]
  completedCount: number
  totalCount: number
}

type Props = {
  flowInfo: FlowInfo
  currentTaskId: string
}

export default function FlowTaskNavigation({ flowInfo, currentTaskId }: Props) {
  const [expandedPreparation, setExpandedPreparation] = useState(true)

  // Group tasks by type
  const inspectionTasks = flowInfo.relatedTasks.filter(t => t.type === 'Inspection')
  const preparationTasks = flowInfo.relatedTasks.filter(t => t.type === 'Preparation')
  const refundRequestTasks = flowInfo.relatedTasks.filter(t => t.type === 'Refund Request')
  const refundFinalizationTasks = flowInfo.relatedTasks.filter(t => t.type === 'Refund Finalization')

  // Build task groups
  const groups: TaskGroup[] = []

  // Inspection group
  if (inspectionTasks.length > 0) {
    groups.push({
      label: 'INSPECTION',
      tasks: inspectionTasks,
      completedCount: inspectionTasks.filter(t => t.status === 'Resolved').length,
      totalCount: inspectionTasks.length
    })
  }

  // Preparation group (if exists)
  if (preparationTasks.length > 0) {
    groups.push({
      label: 'PREPARATION',
      tasks: preparationTasks,
      completedCount: preparationTasks.filter(t => t.status === 'Resolved').length,
      totalCount: preparationTasks.length
    })
  }

  // Refund group
  const refundTasks = [...refundRequestTasks, ...refundFinalizationTasks]
  if (refundTasks.length > 0) {
    groups.push({
      label: 'REFUND',
      tasks: refundTasks,
      completedCount: refundTasks.filter(t => t.status === 'Resolved').length,
      totalCount: refundTasks.length
    })
  }

  // Calculate overall progress
  const totalTasks = flowInfo.relatedTasks.length
  const completedTasks = flowInfo.relatedTasks.filter(t => t.status === 'Resolved').length

  const getStatusIcon = (status: TaskStatus, isCurrent: boolean) => {
    if (status === 'Resolved') {
      return <CheckCircle2 size={18} className={isCurrent ? 'text-blue-500' : 'text-green-500'} />
    }
    if (status === 'Needs Modification') {
      return <AlertCircle size={18} className='text-amber-500' />
    }
    if (status === 'In Progress') {
      return <Clock size={18} className='text-blue-500' />
    }
    // Open or any other status
    return <Circle size={18} className={isCurrent ? 'text-blue-500' : 'text-neutral-300'} />
  }

  const getTaskStyles = (task: FlowTaskSummary) => {
    const isCurrent = task.id === currentTaskId
    const baseStyles =
      'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200'

    if (isCurrent) {
      return cn(baseStyles, 'bg-blue-50 border-blue-300 shadow-sm')
    }
    if (task.status === 'Resolved') {
      return cn(baseStyles, 'bg-green-50/50 border-green-200 hover:bg-green-50')
    }
    if (task.status === 'Needs Modification') {
      return cn(baseStyles, 'bg-amber-50 border-amber-200 hover:bg-amber-100')
    }
    if (task.status === 'Open') {
      return cn(baseStyles, 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100 opacity-70')
    }
    return cn(baseStyles, 'bg-white border-neutral-200 hover:bg-neutral-50')
  }

  // Get location display
  const locationDisplay = flowInfo.leaseInfo
    ? flowInfo.leaseInfo.roomTitle
      ? `${flowInfo.leaseInfo.roomTitle} - ${flowInfo.leaseInfo.propertyCode}`
      : flowInfo.leaseInfo.propertyCode
    : ''

  return (
    <div className='bg-white border border-(--border-default) rounded-xl p-5 mb-6'>
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <div>
          <h2 className='texts-body-large-medium text-(--text-primary)'>
            {flowInfo.flowType}
          </h2>
          {locationDisplay && (
            <p className='texts-body-small text-(--text-secondary)'>
              {locationDisplay}
              {flowInfo.leaseInfo?.tenantName && ` • ${flowInfo.leaseInfo.tenantName}`}
            </p>
          )}
        </div>
        <div className='flex items-center gap-2'>
          <div className='texts-body-small text-(--text-secondary)'>
            {completedTasks} of {totalTasks} done
          </div>
          {flowInfo.flowStatus === 'Completed' && (
            <span className='texts-label-small text-green-700 bg-green-100 px-2 py-0.5 rounded-full'>
              Completed
            </span>
          )}
        </div>
      </div>

      {/* Task Groups */}
      <div className='space-y-4'>
        {groups.map(group => {
          const isPreparation = group.label === 'PREPARATION'
          const showExpandToggle = isPreparation && group.tasks.length > 3

          return (
            <fieldset
              key={group.label}
              className='border border-dashed border-neutral-300 rounded-lg p-3 pt-0'
            >
              <legend className='px-2 texts-label-small text-(--text-secondary) uppercase tracking-wide flex items-center gap-2'>
                {group.label}
                {group.totalCount > 1 && (
                  <span className='text-(--text-muted)'>
                    ({group.completedCount} of {group.totalCount})
                  </span>
                )}
                {showExpandToggle && (
                  <button
                    type='button'
                    onClick={() => setExpandedPreparation(!expandedPreparation)}
                    className='ml-1 p-0.5 hover:bg-neutral-100 rounded'
                  >
                    {expandedPreparation ? (
                      <ChevronUp size={14} className='text-(--text-secondary)' />
                    ) : (
                      <ChevronDown size={14} className='text-(--text-secondary)' />
                    )}
                  </button>
                )}
              </legend>
              <div className='flex flex-wrap gap-2 mt-2'>
                {(isPreparation && !expandedPreparation
                  ? group.tasks.slice(0, 3)
                  : group.tasks
                ).map(task => {
                  const isCurrent = task.id === currentTaskId
                  return (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className={getTaskStyles(task)}
                    >
                      {getStatusIcon(task.status, isCurrent)}
                      <span
                        className={cn(
                          'texts-body-small-medium',
                          isCurrent
                            ? 'text-blue-700'
                            : task.status === 'Resolved'
                              ? 'text-green-700'
                              : task.status === 'Needs Modification'
                                ? 'text-amber-700'
                                : 'text-(--text-primary)'
                        )}
                      >
                        {task.title}
                      </span>
                      {isCurrent && (
                        <span className='texts-label-small text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full ml-1'>
                          Current
                        </span>
                      )}
                    </Link>
                  )
                })}
                {isPreparation && !expandedPreparation && group.tasks.length > 3 && (
                  <button
                    type='button'
                    onClick={() => setExpandedPreparation(true)}
                    className='texts-body-small text-(--text-secondary) hover:text-(--text-primary) px-2 py-1'
                  >
                    +{group.tasks.length - 3} more
                  </button>
                )}
              </div>
            </fieldset>
          )
        })}
      </div>
    </div>
  )
}
