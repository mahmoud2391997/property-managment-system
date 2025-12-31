'use client'

import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, Clock } from 'lucide-react'

type TaskNavigationItem = {
  id: string
  title: string
  status: 'Open' | 'In Progress' | 'Resolved'
  referenceId: string
  isCurrent: boolean
}

type TaskGroup = {
  label: string
  tasks: TaskNavigationItem[]
}

type Props = {
  currentTask: TaskNavigationItem
  onTaskSelect?: (taskId: string) => void
}

export default function TaskNavigation({ currentTask, onTaskSelect }: Props) {
  // Placeholder groups - you can expand this to show actual related tasks
  const groups: TaskGroup[] = [
    {
      label: 'MY TASKS',
      tasks: [currentTask]
    }
  ]

  const getStatusIcon = (status: string, isCurrent: boolean) => {
    if (status === 'Resolved') {
      return <CheckCircle2 size={18} className={isCurrent ? 'text-blue-500' : 'text-green-500'} />
    }
    if (status === 'In Progress') {
      return <Clock size={18} className='text-blue-500' />
    }
    return <Circle size={18} className={isCurrent ? 'text-blue-500' : 'text-neutral-300'} />
  }

  const getTaskStyles = (task: TaskNavigationItem) => {
    const baseStyles =
      'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 cursor-pointer'

    if (task.isCurrent) {
      return cn(baseStyles, 'bg-blue-50 border-blue-300 shadow-sm')
    }
    if (task.status === 'Resolved') {
      return cn(
        baseStyles,
        'bg-green-50/50 border-green-200 hover:bg-green-50'
      )
    }
    if (task.status === 'Open') {
      return cn(
        baseStyles,
        'bg-neutral-50 border-neutral-200 hover:bg-neutral-100'
      )
    }
    return cn(baseStyles, 'bg-white border-neutral-200 hover:bg-neutral-50')
  }

  return (
    <div className='bg-white border border-(--border-default) rounded-xl p-5'>
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <div>
          <h2 className='texts-body-large-medium text-(--text-primary)'>
            Task Navigation
          </h2>
          <p className='texts-body-small text-(--text-secondary)'>
            Browse related tasks
          </p>
        </div>
        <div className='texts-body-small text-(--text-secondary)'>
          Task #{currentTask.referenceId}
        </div>
      </div>

      {/* Task Groups */}
      <div className='space-y-4'>
        {groups.map((group) => (
          <fieldset
            key={group.label}
            className='border border-dashed border-neutral-300 rounded-lg p-3 pt-0'
          >
            <legend className='px-2 texts-label-small text-(--text-secondary) uppercase tracking-wide'>
              {group.label}
            </legend>
            <div className='flex flex-wrap gap-2 mt-2'>
              {group.tasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => onTaskSelect?.(task.id)}
                  className={getTaskStyles(task)}
                >
                  {getStatusIcon(task.status, task.isCurrent)}
                  <span
                    className={cn(
                      'texts-body-small-medium',
                      task.isCurrent
                        ? 'text-blue-700'
                        : task.status === 'Resolved'
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
