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

// Card skeleton that matches the PaymentCard component structure
function CardSkeleton({ index }: { index: number }) {
  return (
    <div
      className={cn(
        'bg-(--background-primary) rounded-xl border border-(--border-default)',
        'p-4 space-y-3',
        'animate-in fade-in slide-in-from-bottom-2 duration-300'
      )}
      style={{ animationDelay: `${150 + index * 75}ms` }}
    >
      {/* Header: ID, Status, Actions */}
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          <div className='flex items-center gap-2 mb-1'>
            <Skeleton className='h-5 w-28 bg-neutral-200' />
            <Skeleton className='h-5 w-16 rounded-full bg-neutral-200' />
          </div>
          <Skeleton className='h-4 w-20 bg-neutral-200/70' />
        </div>
        <Skeleton className='h-8 w-8 rounded bg-neutral-200' />
      </div>

      {/* Amount - Prominent display */}
      <div className='flex items-baseline gap-2'>
        <Skeleton className='h-8 w-28 bg-neutral-200' />
        <Skeleton className='h-5 w-20 rounded-full bg-neutral-200/70' />
      </div>

      {/* Info Grid */}
      <div className='grid grid-cols-2 gap-3'>
        {/* Property */}
        <div className='flex items-start gap-2'>
          <Skeleton className='w-4 h-4 rounded bg-neutral-200/70 shrink-0' />
          <div className='flex-1'>
            <Skeleton className='h-3 w-14 mb-1 bg-neutral-200/50' />
            <Skeleton className='h-4 w-20 mb-0.5 bg-neutral-200' />
            <Skeleton className='h-3 w-16 bg-neutral-200/70' />
          </div>
        </div>

        {/* Due Date */}
        <div className='flex items-start gap-2'>
          <Skeleton className='w-4 h-4 rounded bg-neutral-200/70 shrink-0' />
          <div className='flex-1'>
            <Skeleton className='h-3 w-14 mb-1 bg-neutral-200/50' />
            <Skeleton className='h-4 w-24 bg-neutral-200' />
          </div>
        </div>
      </div>

      {/* Payment Progress */}
      <div className='pt-2 border-t border-(--border-default)'>
        <div className='flex items-center justify-between mb-2'>
          <div className='flex items-center gap-1.5'>
            <Skeleton className='w-4 h-4 rounded bg-neutral-200/70' />
            <Skeleton className='h-4 w-16 bg-neutral-200' />
          </div>
          <Skeleton className='h-3 w-24 bg-neutral-200/70' />
        </div>
        <Skeleton className='h-2 w-full rounded-full bg-neutral-200' />
      </div>
    </div>
  )
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

      {/* Actions Bar Skeleton - Desktop */}
      <div
        className={cn(
          'hidden sm:flex justify-between items-center',
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

      {/* Actions Bar Skeleton - Mobile */}
      <div
        className={cn(
          'flex sm:hidden flex-col gap-3',
          'w-full',
          'animate-in slide-in-from-top-2 duration-300 delay-75'
        )}
      >
        {/* Search Input Skeleton - Full width on mobile */}
        {showSearch && <Skeleton className='w-full h-10 rounded-lg bg-neutral-200' />}

        {/* Action Buttons Skeleton - Side by side on mobile */}
        <div className='flex items-center gap-2.5 py-2'>
          {Array.from({ length: actionButtons }).map((_, i) => (
            <Skeleton
              key={i}
              className='h-10 flex-1 bg-neutral-200'
              style={{ animationDelay: `${100 + i * 50}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Desktop Table Skeleton */}
      <div
        className={cn(
          'hidden md:block overflow-hidden rounded-xl border',
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

      {/* Desktop Pagination */}
      <div className='hidden md:flex justify-between items-center w-full'>
        <Skeleton className='h-5 w-25 rounded-full bg-neutral-200' />
        <div className='flex gap-3 items-center'>
          <Skeleton className='h-7 w-13 rounded bg-neutral-200' />
          <Skeleton className='h-7 w-13 rounded bg-neutral-200' />
        </div>
      </div>

      {/* Mobile Card Skeletons */}
      <div className='md:hidden space-y-3'>
        {Array.from({ length: Math.min(rows, 3) }).map((_, index) => (
          <CardSkeleton key={index} index={index} />
        ))}

        {/* Mobile pagination info */}
        <div className='text-center py-4 animate-in fade-in duration-300 delay-300'>
          <Skeleton className='h-4 w-32 mx-auto bg-neutral-200/70' />
        </div>
      </div>
    </div>
  )
}
