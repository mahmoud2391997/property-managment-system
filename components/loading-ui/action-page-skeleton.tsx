import { Skeleton } from '../ui/skeleton'

const ActionPageSkeleton = () => {
  return (

      <div className='flex flex-col gap-5'>
        {/* Head skeleton */}
        <section className='flex flex-col gap-2.5'>
          <Skeleton className='h-5 w-48' />
          <div className='flex items-center justify-between w-full'>
            <div>
              <Skeleton className='h-8 w-64 mb-2' />
              <Skeleton className='h-5 w-80' />
            </div>
            <Skeleton className='h-10 w-24' />
          </div>
        </section>
        {/* Content skeleton */}
        <Skeleton className='h-64 w-full rounded-lg' />
        <Skeleton className='h-64 w-full rounded-lg' />
        <Skeleton className='h-48 w-full rounded-lg' />
      </div>
  )
}

export default ActionPageSkeleton