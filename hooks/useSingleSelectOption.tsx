import { useState } from 'react'

export type SingleSelectItem = {
  label: string
  isSelected: boolean
  isDisabled?: boolean
  Icon?: React.ComponentType<any>
}

export function useSingleSelectOption(items: SingleSelectItem[]) {
  const [options, setOptions] = useState<SingleSelectItem[]>(items)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    items.findIndex(i => i.isSelected) ?? null
  )
  const selectByIndex = (index: number) => {
    setOptions(prev =>
      prev.map((option, i) => ({
        ...option,
        isSelected: i === index
      }))
    )
    setSelectedIndex(index)
  }

  return { options, selectByIndex, selectedIndex }
}
