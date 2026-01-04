import { Skeleton } from '@/components/ui/skeleton'

interface MobileCardSkeletonProps {
  count?: number
}

export default function MobileCardSkeleton ({ count = 10 }: MobileCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className='bg-white rounded-lg border border-(--border-default) p-4'>
          <div className='flex justify-between items-start mb-3'>
            <Skeleton className='h-5 w-24' />
            <Skeleton className='h-6 w-16 rounded-full' />
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-4 w-40' />
            <Skeleton className='h-4 w-28' />
          </div>
        </div>
      ))}
    </>
  )
}
