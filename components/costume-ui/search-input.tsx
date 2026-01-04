'use client'
import { cn } from '@/lib/utils'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group'
import { Search } from 'lucide-react'
import { forwardRef, useState } from 'react'

type SearchInputProps = React.InputHTMLAttributes<HTMLInputElement>

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (props, ref) => {
    const [isFocus, setIsFocus] = useState<boolean>(false)
    return (
      <InputGroup
        className={cn(
          'w-full sm:w-80 h-10',
          isFocus ? 'ring-2! ring-neutral-300' : '',
          'bg-(--background-primary) border-(--border-default)'
        )}
      >
        {/* Attach forwarded ref to the actual input */}
        <InputGroupInput
          ref={ref}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          className='w-70 border-none ring-0 texts-label-large'
          {...props}
        />
        <InputGroupAddon>
          <div className='flex items-center w-5 h-auto'>
            <Search size={20} strokeWidth={1.5} className='text-neutral-400' />{' '}
            {/* visually clipped/scaled to ~20px */}
          </div>
        </InputGroupAddon>
      </InputGroup>
    )
  }
)

SearchInput.displayName = 'SearchInput'

export default SearchInput
