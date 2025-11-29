import { SaveButtonIcon } from './icon'
import Button from './button'
import Breadcrumb from './breadcrumb'
import { Crumb } from '@/types'
import { Skeleton } from '../ui/skeleton'

type Props = {
  crumb_items: Crumb[]
  isCrumbLoading?: boolean
  crumbSkeletonWidth?: string
  title: string
  subtitle: string
  isSubmitting?: boolean
  className?: string
}
const AddPageHead = ({
  crumb_items,
  isCrumbLoading = false,
  crumbSkeletonWidth,
  title,
  subtitle,
  isSubmitting = false,
  className
}: Props) => {
  return (
    <section className={`flex flex-col gap-2.5 ${className}`}>
      {isCrumbLoading ? (
        <Skeleton className={`h-4 ${crumbSkeletonWidth ? crumbSkeletonWidth : 'w-55'} bg-neutral-300`} />
      ) : (
        <Breadcrumb items={crumb_items} />
      )}
      <div className='flex items-center justify-between w-full'>
        <div>
          <h2>{title}</h2>
          <span className='texts-body-medium text-(--text-secondary)'>
            {subtitle}
          </span>
        </div>
        <Button
          type='submit'
          icon={<SaveButtonIcon />}
          label={isSubmitting ? 'Saving...' : 'Save'}
          disabled={isSubmitting}
        />
      </div>
    </section>
  )
}

export default AddPageHead
