import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

// Single notification item skeleton
function NotificationItemSkeleton({ index }: { index: number }) {
  return (
    <div
      className={cn(
        'flex items-start gap-4 py-5 px-4 -mx-4',
        'border-b border-(--border-default) last:border-b-0',
        'animate-in fade-in slide-in-from-left-1 duration-300'
      )}
      style={{ animationDelay: `${200 + index * 75}ms` }}
    >
      {/* Avatar */}
      <Skeleton className='h-11 w-11 rounded-full bg-neutral-200 shrink-0' />

      {/* Content */}
      <div className='flex-1 min-w-0'>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex-1'>
            {/* Title */}
            <Skeleton className='h-5 w-48 bg-neutral-200 mb-2' />
            {/* Message */}
            <Skeleton className='h-4 w-full max-w-md bg-neutral-200/70 mb-1' />
            <Skeleton className='h-4 w-3/4 max-w-xs bg-neutral-200/70' />
            {/* Timestamp */}
            <Skeleton className='h-3 w-20 bg-neutral-200/50 mt-2' />
          </div>

          {/* Chevron */}
          <Skeleton className='h-5 w-5 rounded bg-neutral-200/70 shrink-0 mt-1' />
        </div>
      </div>
    </div>
  )
}

type NotificationsSkeletonProps = {
  /**
   * Number of notification items to show
   * @default 5
   */
  items?: number
}

export default function NotificationsSkeleton({
  items = 5
}: NotificationsSkeletonProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2.5',
        'h-full',
        'animate-in fade-in duration-300'
      )}
    >
      {/* Heading with badge */}
      <div
        className={cn(
          'flex items-center gap-3',
          'animate-in slide-in-from-top-2 duration-300'
        )}
      >
        <Skeleton className='h-8 w-36 rounded-full bg-neutral-200' />
        <Skeleton className='h-6 w-16 rounded-full bg-neutral-200/70' />
      </div>

      {/* Search Input */}
      <div
        className={cn(
          'flex flex-col sm:flex-row justify-between sm:items-center gap-3',
          'w-full',
          'animate-in slide-in-from-top-2 duration-300 delay-75'
        )}
      >
        <Skeleton className='w-full sm:w-80 h-10 rounded-lg bg-neutral-200' />
      </div>

      {/* Filter Tabs */}
      <div
        className={cn(
          'flex gap-1 p-1 bg-(--background-secondary) rounded-lg w-fit',
          'animate-in slide-in-from-top-2 duration-300 delay-100'
        )}
      >
        <Skeleton className='h-10 w-16 rounded-md bg-neutral-200' />
        <Skeleton className='h-10 w-20 rounded-md bg-neutral-200/70' />
        <Skeleton className='h-10 w-16 rounded-md bg-neutral-200/70' />
      </div>

      {/* Notifications List */}
      <div
        className={cn(
          'flex flex-col mt-2',
          'animate-in slide-in-from-top-2 duration-300 delay-150'
        )}
      >
        {Array.from({ length: items }).map((_, index) => (
          <NotificationItemSkeleton key={index} index={index} />
        ))}
      </div>
    </div>
  )
}
