import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

type TablePageSkeletonProps = {
  /**
   * Number of rows to show in the skeleton table
   * @default 5
   */
  rows?: number
  /**
   * Whether to show the search input skeleton
   * @default true
   */
  showSearch?: boolean
  /**
   * Number of action buttons to show
   * @default 3
   */
  actionButtons?: number
}

export default function TablePageSkeleton ({
  rows = 5,
  showSearch = true,
  actionButtons = 2
}: TablePageSkeletonProps) {
  return (
    <div
      className={cn(
        'mt-1 flex flex-col gap-2.5',
        'h-full',
        'animate-in fade-in duration-300'
      )}
    >
      {/* Heading Skeleton */}
      <div className='animate-in slide-in-from-top-2 duration-300'>
        <Skeleton className='h-8 w-32 rounded-full bg-neutral-200' />
      </div>

      {/* Actions Bar Skeleton */}
      <div
        className={cn(
          'flex justify-between items-center',
          'w-full',
          'animate-in slide-in-from-top-2 duration-300 delay-75'
        )}
      >
        {/* Search Input Skeleton */}
        {showSearch && <Skeleton className='w-80 h-10 rounded-lg bg-neutral-200' />}

        {/* Action Buttons Skeleton */}
        <div
          className={cn(
            'flex items-center gap-2.5',
            'py-5',
            !showSearch && 'ml-auto'
          )}
        >
          {Array.from({ length: actionButtons }).map((_, i) => (
            <Skeleton
              key={i}
              className='h-10 w-28 bg-neutral-200'
              style={{ animationDelay: `${100 + i * 50}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Table Skeleton */}
      <div
        className={cn(
          'overflow-hidden rounded-xl border',
          'animate-in slide-in-from-top-2 duration-300 delay-150'
        )}
      >
        {/* Table Header */}
        <div className='flex items-center gap-4 p-4 border-b border-(--border-strong) bg-(--background-secondary)'>
          <Skeleton className='h-4 w-4 bg-neutral-200' /> {/* Checkbox */}
          <Skeleton className='h-4 w-32 bg-neutral-200' />
          <Skeleton className='h-4 w-24 bg-neutral-200' />
          <Skeleton className='h-4 w-24 bg-neutral-200' />
          <Skeleton className='h-4 w-20 ml-auto bg-neutral-200' />
        </div>

        {/* Table Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className={cn(
              'flex justify-between items-center gap-10 p-4 border-b border-(--border-strong) last:border-b-0',
              'animate-in fade-in slide-in-from-left-1 duration-300'
            )}
            style={{ animationDelay: `${200 + rowIndex * 50}ms` }}
          >
            <Skeleton className='h-4 w-20 bg-neutral-200' /> {/* Checkbox */}
            <Skeleton className='h-4 w-full bg-neutral-200' />
            <Skeleton className='h-4 w-full bg-neutral-200' />
            <Skeleton className='h-4 w-full bg-neutral-200' />
            <Skeleton className='h-4 w-full bg-neutral-200' />
            <Skeleton className='h-4 w-25! rounded bg-neutral-200' />{' '}
            {/* Actions button */}
          </div>
        ))}
      </div>
      <div className='flex justify-between items-center w-full'>
        <Skeleton className='h-5 w-25 rounded-full bg-neutral-200' />
        <div className='flex gap-3 items-center'>
          <Skeleton className='h-7 w-13 rounded bg-neutral-200' />
          <Skeleton className='h-7 w-13 rounded bg-neutral-200' />
        </div>
      </div>
    </div>
  )
}
