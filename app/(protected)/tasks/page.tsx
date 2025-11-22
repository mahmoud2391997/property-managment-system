import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import Button from '@/components/costume-ui/button'
import { AddButtonIcon, DeleteButtonIcon } from '@/components/costume-ui/icon'
import TasksTable from '@/components/tables/tasks-table'
import Dialog from '@/components/costume-ui/dialog'
import AddTask from '@/components/add-task'

const Tasks = () => {
  return (
    <div className={cn('flex flex-col gap-2.5', 'h-full')}>
      {/* Heading */}
      <div>
        <h1>Tasks</h1>
      </div>
      {/* Actions */}
      <div className={cn('flex justify-between items-center', 'w-full')}>
        <SearchInput placeholder='Search tasks' />
        {/* Buttons */}
        <div className={cn('flex items-center gap-2.5', 'py-5')}>
          <Button
            icon={<DeleteButtonIcon />}
            label='Delete'
            className='bg-(--error-main)!'
          />

          <Dialog
            openDialogButton={
              <Button
                icon={<AddButtonIcon className='text-neutral-300' />}
                label='Add Task'
              />
            }
            title='Add Task'
            saveButtonLabel='Save'
            className='max-w-150!'
          >
            <AddTask />
          </Dialog>
        </div>
      </div>
      {/* Table */}
      <TasksTable />
    </div>
  )
}

export default Tasks
