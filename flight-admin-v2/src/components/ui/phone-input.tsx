import * as React from "react"
import PhoneInput from "react-phone-number-input"
import "react-phone-number-input/style.css"
import { cn } from "@/lib/utils"

interface PhoneInputFieldProps {
  value?: string
  onChange?: (value: string | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  isRequired?: boolean
  label?: string
}

export function PhoneInputField({
  value,
  onChange,
  placeholder = "Enter phone number",
  className,
  disabled = false,
  isRequired = false,
  label
}: PhoneInputFieldProps) {
  const isEmpty = isRequired && (!value || value.trim() === '')

  const handleChange = (phoneValue?: string) => {
    if (onChange) {
      onChange(phoneValue || undefined)
    }
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="mt-1">
        <PhoneInput
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          defaultCountry="US"
          className={cn(
            "phone-input-wrapper",
            isEmpty && "phone-input-error"
          )}
        />
      </div>
    </div>
  )
}
