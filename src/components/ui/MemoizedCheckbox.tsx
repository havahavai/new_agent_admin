import React, { memo } from 'react'
import { Checkbox } from './checkbox'

interface MemoizedCheckboxProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  ariaLabel: string
  disabled?: boolean
}

export const MemoizedCheckbox = memo<MemoizedCheckboxProps>(({ 
  checked, 
  onCheckedChange, 
  ariaLabel, 
  disabled = false 
}) => {
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={ariaLabel}
      disabled={disabled}
    />
  )
})

MemoizedCheckbox.displayName = 'MemoizedCheckbox'
