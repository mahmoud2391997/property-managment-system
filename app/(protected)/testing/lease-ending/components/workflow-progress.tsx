'use client'

import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, Clock } from 'lucide-react'
import { LeaseEndingWorkflow, PreparationTask, LeaseEndingTask, TaskStatus } from '../types'

type TaskItem = {
  id: string
  title: string
  status: TaskStatus
  isCurrent: boolean
  type: 'inspection' | 'preparation' | 'refund_request' | 'refund_finalization'
}

type TaskGroup = {
  label: string
  tasks: TaskItem[]
  completedCount: number
  totalCount: number
}

type Props = {
  workflow: LeaseEndingWorkflow
  currentTaskId: string
  onTaskSelect: (taskId: string, taskType: string) => void
}

export default function WorkflowProgress({
  workflow,
  currentTaskId,
  onTaskSelect
}: Props) {
  // Build task groups
  const groups: TaskGroup[] = []

  // Inspection group
  const inspectionTask = workflow.inspectionTask
  groups.push({
    label: 'INSPECTION',
    tasks: [
      {
        id: inspectionTask.id,
        title: inspectionTask.title,
        status: inspectionTask.status,
        isCurrent: currentTaskId === inspectionTask.id,
        type: 'inspection'
      }
    ],
    completedCount: inspectionTask.status === 'completed' ? 1 : 0,
    totalCount: 1
  })

  // Preparation group (if exists)
  if (workflow.preparationTasks.length > 0) {
    const completedCount = workflow.preparationTasks.filter(
      t => t.status === 'completed'
    ).length
    groups.push({
      label: 'PREPARATION',
      tasks: workflow.preparationTasks.map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        isCurrent: currentTaskId === task.id,
        type: 'preparation' as const
      })),
      completedCount,
      totalCount: workflow.preparationTasks.length
    })
  }

  // Refund group
  const refundTasks: TaskItem[] = []
  if (workflow.refundRequestTask) {
    refundTasks.push({
      id: workflow.refundRequestTask.id,
      title: workflow.refundRequestTask.title,
      status: workflow.refundRequestTask.status,
      isCurrent: currentTaskId === workflow.refundRequestTask.id,
      type: 'refund_request'
    })
  }
  if (workflow.refundFinalizationTask) {
    refundTasks.push({
      id: workflow.refundFinalizationTask.id,
      title: workflow.refundFinalizationTask.title,
      status: workflow.refundFinalizationTask.status,
      isCurrent: currentTaskId === workflow.refundFinalizationTask.id,
      type: 'refund_finalization'
    })
  }
  if (refundTasks.length > 0) {
    const completedCount = refundTasks.filter(t => t.status === 'completed').length
    groups.push({
      label: 'REFUND',
      tasks: refundTasks,
      completedCount,
      totalCount: refundTasks.length
    })
  }

  const getStatusIcon = (status: TaskStatus, isCurrent: boolean) => {
    if (status === 'completed') {
      return <CheckCircle2 size={18} className={isCurrent ? 'text-blue-500' : 'text-green-500'} />
    }
    if (status === 'in_progress') {
      return <Clock size={18} className='text-blue-500' />
    }
    return <Circle size={18} className={isCurrent ? 'text-blue-500' : 'text-neutral-300'} />
  }

  const getTaskStyles = (task: TaskItem) => {
    const baseStyles =
      'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 cursor-pointer'

    if (task.isCurrent) {
      return cn(baseStyles, 'bg-blue-50 border-blue-300 shadow-sm')
    }
    if (task.status === 'completed') {
      return cn(
        baseStyles,
        'bg-green-50/50 border-green-200 hover:bg-green-50'
      )
    }
    if (task.status === 'pending' || task.status === 'awaiting_response') {
      return cn(
        baseStyles,
        'bg-neutral-50 border-neutral-200 hover:bg-neutral-100 opacity-70'
      )
    }
    return cn(baseStyles, 'bg-white border-neutral-200 hover:bg-neutral-50')
  }

  return (
    <div className='bg-white border border-(--border-default) rounded-xl p-5 mb-6'>
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <div>
          <h2 className='texts-body-large-medium text-(--text-primary)'>
            Lease Ending
          </h2>
          <p className='texts-body-small text-(--text-secondary)'>
            {workflow.unitName} - {workflow.propertyName}
          </p>
        </div>
        <div className='texts-body-small text-(--text-secondary)'>
          {workflow.completedTasksCount} of {workflow.totalTasksCount} done
        </div>
      </div>

      {/* Task Groups */}
      <div className='space-y-4'>
        {groups.map((group, groupIndex) => (
          <fieldset
            key={group.label}
            className='border border-dashed border-neutral-300 rounded-lg p-3 pt-0'
          >
            <legend className='px-2 texts-label-small text-(--text-secondary) uppercase tracking-wide'>
              {group.label}{' '}
              {group.totalCount > 1 && (
                <span className='text-(--text-muted)'>
                  ({group.completedCount} of {group.totalCount})
                </span>
              )}
            </legend>
            <div className='flex flex-wrap gap-2 mt-2'>
              {group.tasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => onTaskSelect(task.id, task.type)}
                  className={getTaskStyles(task)}
                >
                  {getStatusIcon(task.status, task.isCurrent)}
                  <span
                    className={cn(
                      'texts-body-small-medium',
                      task.isCurrent
                        ? 'text-blue-700'
                        : task.status === 'completed'
                          ? 'text-green-700'
                          : 'text-(--text-primary)'
                    )}
                  >
                    {task.title}
                  </span>
                  {task.isCurrent && (
                    <span className='texts-label-small text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full ml-1'>
                      Current
                    </span>
                  )}
                </button>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
    </div>
  )
}
