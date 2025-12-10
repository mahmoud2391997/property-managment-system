import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

type Props = {
  defaultOption: number
  options: string[]
  onChange?: (value: number) => void
  value?: number // Optional controlled value
}
const RadioGroup = ({ defaultOption, options, onChange, value }: Props) => {
  const [selected, setSelected] = useState<number>(value ?? defaultOption)

  // Sync with controlled value when it changes
  useEffect(() => {
    if (value !== undefined) {
      setSelected(value)
    }
  }, [value])

  return (
    <div className='flex gap-3'>
      {options.map((option, index) => (
        <button
          key={index}
          type='button'
          onClick={() => {
            setSelected(index)
            onChange?.(index)
          }}
          className={cn(
            `flex items-center gap-2 px-5 h-10 w-fit rounded-[5px] border transition-all duration-100 ${
              selected === index
                ? 'border-(--secondary-color) bg-(--secondary-color)/10'
                : 'border-neutral-400 hover:bg-neutral-50 cursor-pointer'
            }`,
            'transition-colors duration-200',
          )}
        >
          <div
            className={`w-4 h-4 rounded-full border transition-all duration-100 ${
              selected === index
                ? 'border-(--secondary-color) border-[3px] bg-(--background-primary)'
                : 'border-neutral-400'
            }`}
          />
          <span className='texts-body-small leading-0!'>{option}</span>
        </button>
      ))}
    </div>
  )
}

export default RadioGroup
