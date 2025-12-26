'use client'

import { useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import SearchInput from './costume-ui/search-input'
import TasksTable from './tables/tasks-table'
import { Task } from '@/types'
import { formatDate } from '@/utils/formatTime'
import AddTaskDialog from './dialogs/add-task-dialog'

type Props = {
  initialTasks: Task[]
}

export default function TasksSection({ initialTasks }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch('/api/tasks')
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }, [])

  const handleRefresh = () => {
    fetchTasks()
  }

  const filteredTasks = useMemo(() => {
    if (!searchTerm.trim()) {
      return tasks
    }

    const lowerSearch = searchTerm.toLowerCase().trim()

    return tasks.filter(task => {
      // Search by task ID (reference_id)
      const idMatch = task.id?.toLowerCase().includes(lowerSearch)

      // Search by type
      const typeMatch = task.type?.toLowerCase().includes(lowerSearch)

      // Search by title
      const titleMatch = task.title?.toLowerCase().includes(lowerSearch)

      // Search by description
      const descriptionMatch = task.description?.toLowerCase().includes(lowerSearch)

      // Search by property
      const propertyMatch = task.property?.toLowerCase().includes(lowerSearch)

      // Search by room
      const roomMatch = task.room?.toLowerCase().includes(lowerSearch)

      // Search by priority
      const priorityMatch = task.priority?.toLowerCase().includes(lowerSearch)

      // Search by due date (formatted)
      const dueDateFormatted = task.due_date ? formatDate(task.due_date).toLowerCase() : ''
      const dueDateMatch = dueDateFormatted.includes(lowerSearch)

      // Search by created date (formatted)
      const createdDateFormatted = task.created_at ? formatDate(task.created_at).toLowerCase() : ''
      const createdDateMatch = createdDateFormatted.includes(lowerSearch)

      // Search by created by name
      const createdByMatch = task.created_by_name?.toLowerCase().includes(lowerSearch)

      // Search by staff name (assigned to)
      const staffNameMatch = task.staff_name?.toLowerCase().includes(lowerSearch)

      // Search by status
      const statusMatch = task.status?.toLowerCase().replace(/_/g, ' ').includes(lowerSearch)

      return idMatch || typeMatch || titleMatch || descriptionMatch || propertyMatch ||
             roomMatch || priorityMatch || dueDateMatch || createdDateMatch ||
             createdByMatch || staffNameMatch || statusMatch
    })
  }, [tasks, searchTerm])

  return (
    <div className={cn('flex flex-col gap-2.5', 'h-full')}>
      {/* Heading */}
      <div>
        <h1>Tasks</h1>
      </div>
      {/* Actions */}
      <div
        className={cn(
          'flex flex-col sm:flex-row justify-between sm:items-center gap-3',
          'w-full'
        )}
      >
        <SearchInput
          placeholder='Search tasks'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <AddTaskDialog onSuccess={handleRefresh} />
      </div>
      {/* Table */}
      <TasksTable data={filteredTasks} onDataRefresh={handleRefresh} />
    </div>
  )
}
