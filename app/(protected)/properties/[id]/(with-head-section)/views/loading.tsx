import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const Loading = () => {
  return (
    <section className='flex flex-col gap-5 -mx-7.5 -mb-7.5 p-7.5 py-5 bg-(--background-tertiary) min-h-full h-fit'>
        <div
          className={cn(
            'flex flex-col gap-5',
            'p-5 py-2.5 rounded-[12px]',
            'bg-(--background-primary)',
            'animate-in fade-in duration-300 delay-200'
          )}
        >
          {/* Section Header Skeleton */}
          <div className={cn('flex justify-between items-center', 'w-full')}>
            <Skeleton className='h-7 w-20 rounded bg-neutral-200' />
            <div className={cn('flex items-center gap-2.5', 'py-5')}>
              <Skeleton className='h-10 w-24 rounded bg-neutral-200' />
              <Skeleton className='h-10 w-28 rounded bg-neutral-200' />
            </div>
          </div>

          {/* Table Skeleton */}
          <div className='overflow-hidden rounded-xl border -mx-5 border-x-0'>
            {/* Table Header */}
            <div className='flex items-center gap-4 p-4 border-b border-(--border-strong) bg-(--background-secondary)'>
              <Skeleton className='h-4 w-4 bg-neutral-200' />
              <Skeleton className='h-4 w-24 bg-neutral-200' />
              <Skeleton className='h-4 w-32 bg-neutral-200' />
              <Skeleton className='h-4 w-28 bg-neutral-200' />
              <Skeleton className='h-4 w-20 ml-auto bg-neutral-200' />
            </div>

            {/* Table Rows */}
            {Array.from({ length: 3 }).map((_, rowIndex) => (
              <div
                key={rowIndex}
                className={cn(
                  'flex justify-between items-center gap-10 p-4 border-b border-(--border-strong) last:border-b-0',
                  'animate-in fade-in duration-300'
                )}
                style={{ animationDelay: `${300 + rowIndex * 50}ms` }}
              >
                <Skeleton className='h-4 w-4 bg-neutral-200' />
                <Skeleton className='h-4 w-full bg-neutral-200' />
                <Skeleton className='h-4 w-full bg-neutral-200' />
                <Skeleton className='h-4 w-full bg-neutral-200' />
                <Skeleton className='h-4 w-8 bg-neutral-200' />
              </div>
            ))}
          </div>
        </div>
      </section>
  )
}

export default Loading