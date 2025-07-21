import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SeatStrategy } from './SeatPreferenceWidgetSimple'

interface SeatStrategyEditorSimpleProps {
  isOpen: boolean
  onClose: () => void
  strategy?: SeatStrategy
  passengerCount: number
  onSave: (strategy: SeatStrategy) => void
}

const preferenceOptions = [
  { value: 'any_seat', label: 'Any seat', description: 'Most flexible option' },
  { value: 'near_window', label: 'Near the window', description: 'Window seats preferred' },
  { value: 'near_aisle', label: 'Near the aisle', description: 'Aisle seats preferred' },
  { value: 'together_window', label: 'Together near the window', description: 'Group seating by window' },
  { value: 'together_aisle', label: 'Together near the aisle', description: 'Group seating by aisle' },
  { value: 'seats_together', label: 'Seats together in a row', description: 'Consecutive seating' },
  { value: 'custom_arrangement', label: 'Custom arrangement', description: 'User-defined positioning' },
]

const SeatStrategyEditorSimple: React.FC<SeatStrategyEditorSimpleProps> = ({
  isOpen,
  onClose,
  strategy,
  passengerCount,
  onSave,
}) => {
  const [formData, setFormData] = useState<SeatStrategy>({
    id: '',
    priority: 1,
    preference: 'any_seat',
    description: 'Any seat',
    seats: [],
    isActive: true,
  })

  useEffect(() => {
    if (strategy) {
      setFormData(strategy)
    } else {
      setFormData({
        id: `strategy_${passengerCount}_${Date.now()}`,
        priority: 1,
        preference: 'any_seat',
        description: 'Any seat',
        seats: [],
        isActive: true,
      })
    }
  }, [strategy, passengerCount])

  const handlePreferenceChange = (value: string) => {
    const option = preferenceOptions.find(opt => opt.value === value)
    setFormData(prev => ({
      ...prev,
      preference: value,
      description: option?.label || value,
    }))
  }

  const handleSave = () => {
    if (!formData.description.trim()) {
      return
    }
    onSave(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {strategy ? 'Edit Strategy' : 'Add New Strategy'} - {passengerCount} Passenger{passengerCount > 1 ? 's' : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Input
              id="priority"
              type="number"
              min="1"
              max="5"
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                priority: parseInt(e.target.value) || 1
              }))}
            />
            <p className="text-xs text-gray-500">
              Lower numbers have higher priority (1 = highest)
            </p>
          </div>

          {/* Preference Type */}
          <div className="space-y-2">
            <Label htmlFor="preference">Preference Type</Label>
            <Select value={formData.preference} onValueChange={handlePreferenceChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select preference type" />
              </SelectTrigger>
              <SelectContent>
                {preferenceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                description: e.target.value
              }))}
              placeholder="Enter strategy description"
            />
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm">
                <div className="font-medium">Strategy {formData.priority}</div>
                <div className="text-gray-600">{formData.description}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Type: {formData.preference.replace('_', ' ')}
                </div>
                {formData.seats.length > 0 && (
                  <div className="text-xs text-gray-500">
                    Seats: {formData.seats.join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!formData.description.trim()}>
            {strategy ? 'Update Strategy' : 'Add Strategy'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SeatStrategyEditorSimple
