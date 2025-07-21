"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

function formatDate(date: Date | undefined) {
  if (!date) {
    return ""
  }

  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()

  return `${day}-${month}-${year}`
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false
  }
  return !isNaN(date.getTime())
}

function parseDate(dateString: string): Date | undefined {
  if (!dateString) return undefined

  // Try to parse DD-MM-YYYY format
  const ddmmyyyyRegex = /^(\d{1,2})-(\d{1,2})-(\d{4})$/
  const match = dateString.match(ddmmyyyyRegex)

  if (match) {
    const [, day, month, year] = match
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return isValidDate(date) ? date : undefined
  }

  // Fallback to standard Date parsing
  const date = new Date(dateString)
  return isValidDate(date) ? date : undefined
}

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  isRequired?: boolean
  label?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "DD-MM-YYYY",
  className,
  disabled = false,
  isRequired = false,
  label
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(value)
  const [month, setMonth] = React.useState<Date | undefined>(value)
  const [inputValue, setInputValue] = React.useState(formatDate(value))
  const isEmpty = isRequired && !date

  React.useEffect(() => {
    setDate(value)
    setMonth(value)
    setInputValue(formatDate(value))
  }, [value])

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <Label htmlFor="date" className="text-sm font-medium text-gray-700">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
          <Input
            id="date"
            value={inputValue}
            placeholder={placeholder}
            disabled={disabled}
            className={`bg-background pl-10 h-9 text-sm ${isEmpty ? 'border-red-500 border-2 focus:border-red-500 focus:ring-red-500' : ''}`}
            onChange={(e) => {
              const inputVal = e.target.value
              setInputValue(inputVal)

              if (inputVal === '') {
                setDate(undefined)
                onChange?.(undefined)
              } else {
                const newDate = parseDate(inputVal)
                if (newDate) {
                  setDate(newDate)
                  setMonth(newDate)
                  onChange?.(newDate)
                }
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault()
                setOpen(true)
              }
            }}
          />
        </div>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              disabled={disabled}
              size="sm"
              className="px-2 h-9"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('Calendar button clicked, current open state:', open)
                setOpen(!open)
              }}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden p-0 z-50"
            align="start"
            sideOffset={4}
          >
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              onSelect={(selectedDate) => {
                setDate(selectedDate)
                setInputValue(formatDate(selectedDate))
                onChange?.(selectedDate)
                setOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
