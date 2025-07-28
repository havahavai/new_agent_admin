import React, { memo } from 'react'
import { TableRow, TableCell } from '@/components/ui/table'
import { MemoizedCheckbox } from '@/components/ui/MemoizedCheckbox'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'

interface PassengerTableRowProps {
  passenger: {
    id: string
    firstName: string
    lastName: string
    hasDocuments: boolean
  }
  isSelected: boolean
  onSelectionChange: (checked: boolean) => void
}

export const PassengerTableRow = memo<PassengerTableRowProps>(({ 
  passenger, 
  isSelected, 
  onSelectionChange 
}) => {
  const navigate = useNavigate()

  const handleRowClick = () => {
    navigate(`/passengers/${passenger.id}`)
  }

  return (
    <TableRow className="hover:bg-gray-50 transition-colors">
      <TableCell className="w-12">
        <MemoizedCheckbox
          checked={isSelected}
          onCheckedChange={onSelectionChange}
          ariaLabel={`Select ${passenger.firstName} ${passenger.lastName}`}
        />
      </TableCell>
      <TableCell
        className="font-medium cursor-pointer"
        onClick={handleRowClick}
      >
        <span>{passenger.firstName}</span>
      </TableCell>
      <TableCell
        className="font-medium cursor-pointer"
        onClick={handleRowClick}
      >
        <span>{passenger.lastName}</span>
      </TableCell>
      <TableCell>
        <div className="flex justify-start">
          {!passenger.hasDocuments && (
            <Badge variant="destructive" className="text-xs">
              Document Missing
            </Badge>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
})

PassengerTableRow.displayName = 'PassengerTableRow'
