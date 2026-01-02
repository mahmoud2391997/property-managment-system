import { Skeleton } from '../ui/skeleton'

export default function TaskDetailsSkeleton () {
  return (
    <div>
      {/* Breadcrumb */}
      <Skeleton className='h-5 w-32 mb-4 bg-neutral-200' />

      <div className='bg-white border border-(--border-default) rounded-xl p-5 mb-6'>
        {/* Header */}
        <div className='flex items-center justify-between mb-4'>
          <div>
            <Skeleton className='h-5 w-40 mb-2 bg-neutral-200' />
            <Skeleton className='h-4 w-56 bg-neutral-200' />
          </div>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-4 w-20 bg-neutral-200' />
            <Skeleton className='h-6 w-20 rounded-full bg-neutral-200' />
          </div>
        </div>

        {/* Task Groups */}
        <div className='space-y-4'>
          {[1, 2, 3].map(group => (
            <fieldset
              key={group}
              className='border border-dashed border-neutral-300 rounded-lg p-3 pt-0'
            >
              <legend className='px-2'>
                <Skeleton className='h-4 w-32 bg-neutral-200' />
              </legend>

              <div className='flex flex-wrap gap-2 mt-3'>
                {[1, 2, 3, 4].map(task => (
                  <div
                    key={task}
                    className='flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50'
                  >
                    <Skeleton className='w-[18px] h-[18px] rounded-full bg-neutral-200' />
                    <Skeleton className='h-4 w-28 bg-neutral-200' />
                  </div>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </div>
      
      {/* Header */}
      <Skeleton className='h-8 w-96 mb-2 bg-neutral-200' />

      {/* Status Badge & Info */}
      <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-6 sm:mb-8'>
        <Skeleton className='h-7 w-24 rounded-full bg-neutral-200' />
        <div className='flex items-center gap-2'>
          <Skeleton className='h-5 w-16 rounded bg-neutral-200' />
          <Skeleton className='h-5 w-20 rounded bg-neutral-200' />
        </div>
        <Skeleton className='h-5 w-64' />
      </div>

      {/* Main Content */}
      <div className='flex flex-col lg:flex-row gap-6 lg:gap-10'>
        {/* Timeline */}
        <div className='flex-1'>
          {/* Timeline events */}
          <div className='space-y-6'>
            {/* Event 1 - Created */}
            <div className='flex gap-4'>
              <Skeleton className='w-10 h-10 rounded-full shrink-0 bg-neutral-200' />
              <div className='flex-1'>
                <Skeleton className='h-5 w-48 mb-2 bg-neutral-200' />
                <Skeleton className='h-4 w-32 mb-3 bg-neutral-200' />
                <Skeleton className='h-24 w-full rounded-lg bg-neutral-200' />
              </div>
            </div>

            {/* Event 2 */}
            <div className='flex gap-4'>
              <Skeleton className='w-10 h-10 rounded-full shrink-0 bg-neutral-200' />
              <div className='flex-1'>
                <Skeleton className='h-5 w-56 mb-2 bg-neutral-200' />
                <Skeleton className='h-4 w-28 bg-neutral-200' />
              </div>
            </div>

            {/* Event 3 */}
            <div className='flex gap-4'>
              <Skeleton className='w-10 h-10 rounded-full shrink-0 bg-neutral-200' />
              <div className='flex-1'>
                <Skeleton className='h-5 w-40 mb-2 bg-neutral-200' />
                <Skeleton className='h-4 w-32 mb-3 bg-neutral-200' />
                <Skeleton className='h-16 w-full rounded-lg bg-neutral-200' />
              </div>
            </div>
          </div>

          {/* Add Comment Section */}
          <div className='mt-6 pt-6 border-t border-(--border-default)'>
            <div className='flex gap-4'>
              <Skeleton className='w-10 h-10 rounded-full shrink-0 hidden sm:block bg-neutral-200' />
              <div className='flex-1'>
                <Skeleton className='h-40 w-full rounded-lg bg-neutral-200' />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className='w-full lg:w-[260px] lg:shrink-0 order-first lg:order-last'>
          <div className='space-y-6 p-4 lg:p-0 bg-(--background-secondary) lg:bg-transparent rounded-xl lg:rounded-none'>
            {/* Assigned To */}
            <div className='pb-5 border-b border-(--border-light)'>
              <Skeleton className='h-4 w-24 mb-3 bg-neutral-200' />
              <Skeleton className='h-12 w-full rounded-lg bg-neutral-200' />
            </div>

            {/* Type */}
            <div className='pb-5 border-b border-(--border-light)'>
              <Skeleton className='h-4 w-12 mb-3 bg-neutral-200' />
              <Skeleton className='h-10 w-full rounded-md bg-neutral-200' />
            </div>

            {/* Priority */}
            <div className='pb-5 border-b border-(--border-light)'>
              <Skeleton className='h-4 w-16 mb-3 bg-neutral-200' />
              <Skeleton className='h-10 w-full rounded-md bg-neutral-200' />
            </div>

            {/* Status */}
            <div className='pb-5 border-b border-(--border-light)'>
              <Skeleton className='h-4 w-14 mb-3 bg-neutral-200' />
              <Skeleton className='h-7 w-24 rounded-full mb-4 bg-neutral-200' />
              <Skeleton className='h-10 w-full rounded-md bg-neutral-200' />
            </div>

            {/* Due Date */}
            <div className='pb-5 border-b border-(--border-light)'>
              <Skeleton className='h-4 w-20 mb-3 bg-neutral-200' />
              <Skeleton className='h-10 w-full rounded-lg bg-neutral-200' />
            </div>

            {/* Created By */}
            <div>
              <Skeleton className='h-4 w-24 mb-3' />
              <div className='flex items-center gap-3'>
                <Skeleton className='w-8 h-8 rounded-full bg-neutral-200' />
                <div>
                  <Skeleton className='h-4 w-28 mb-1 bg-neutral-200' />
                  <Skeleton className='h-3 w-36 bg-neutral-200' />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
