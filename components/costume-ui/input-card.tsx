import { cn } from '@/lib/utils'
import { Trash2 } from 'lucide-react'

type Props = {
  children: React.ReactNode
  isRemoveable?: boolean
  onRemove?: () => void
  asChild?: boolean
  className?: string
}

const InputCard = ({
  children,
  isRemoveable = true,
  onRemove,
  asChild = false,
  className = ''
}: Props) => {
  return (
    <div
      className={cn(
        'relative flex items-center',
        'h-27.5 w-full p-5',
        'border border-(--border-default) bg-(--background-secondary)',
        'rounded-md',
        className
      )}
    >
      {asChild ? (
        <>{children}</>
      ) : (
        <div className={'flex items-end gap-2.5 w-full'}>{children}</div>
      )}
      {isRemoveable && (
        <button
        type='button'
          onClick={onRemove}
          className={cn(
            'absolute right-3 top-4',
            'text-(--error-main) hover:text-(--error-dark)',
            'cursor-pointer'
          )}
        >
          <Trash2 size={18} />
        </button>
      )}
    </div>
  )
}

export default InputCard
