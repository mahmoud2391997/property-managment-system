import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

type Props = {
  isSidebarOpen: boolean
}

export function AppSidebarSkeleton({ isSidebarOpen }: Props) {
  return (
    <>
      {/* Menu Section Skeleton */}
      <div className="space-y-2.5">
        {/* Menu Label Skeleton */}
        <Skeleton className="h-3 w-12 bg-neutral-200/70" />

        {/* Menu Items Skeleton - 3 items */}
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className={cn(
              'h-11 px-4 rounded-lg',
              'flex items-center gap-2',
              'bg-neutral-200/30'
            )}
          >
            {/* Icon skeleton */}
            <Skeleton className="h-5 w-5 bg-neutral-200/70 shrink-0" />

            {/* Label skeleton */}
            <div
              className={cn(
                'transition-opacity duration-200',
                !isSidebarOpen && 'opacity-0'
              )}
              style={{
                width: isSidebarOpen ? '120px' : '0px',
                overflow: 'hidden'
              }}
            >
              <Skeleton className="h-4 w-full bg-neutral-200/70" />
            </div>
          </div>
        ))}
      </div>

      {/* Help & Support Section Skeleton */}
      <div className="space-y-2.5 mt-4">
        {/* Help Label Skeleton */}
        <Skeleton className="h-3 w-24 bg-neutral-200/70" />

        {/* Help Items Skeleton - 2 items */}
        {[1, 2].map((item) => (
          <div
            key={item}
            className={cn(
              'h-11 px-4 rounded-lg',
              'flex items-center gap-2',
              'bg-neutral-200/30'
            )}
          >
            {/* Icon skeleton */}
            <Skeleton className="h-5 w-5 bg-neutral-200/70 shrink-0" />

            {/* Label skeleton */}
            <div
              className={cn(
                'transition-opacity duration-200',
                !isSidebarOpen && 'opacity-0'
              )}
              style={{
                width: isSidebarOpen ? '100px' : '0px',
                overflow: 'hidden'
              }}
            >
              <Skeleton className="h-4 w-full bg-neutral-200/70" />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
