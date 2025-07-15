/**
 * Seat Preference Widget - Comprehensive airline seat preference management system
 *
 * Features:
 * - Passenger-based preference groups (1, 2, 3, 4+ passengers)
 * - Priority-based strategy system with drag-and-drop reordering
 * - Multiple seat preference types (window, aisle, together, custom)
 * - Interactive seat map visualization
 * - Strategy validation and success rate indicators
 * - Export/import functionality for preference backup
 * - Mobile-responsive design
 * - Real-time seat map preview
 *
 * Usage:
 * - Configure different strategies for different passenger counts
 * - Drag strategies to reorder priority
 * - Use custom arrangement for complex seating needs
 * - Export preferences for backup or sharing
 *
 * @author Augment Agent
 * @version 1.0.0
 */

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Users
} from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import SeatStrategyEditor from './SeatStrategyEditor'
import SeatMapVisualization from './SeatMapVisualization'

export interface SeatStrategy {
  id: string
  priority: number
  preference: string
  description: string
  seats: string[]
  isActive: boolean
}

export interface SeatPreferences {
  [passengerCount: number]: SeatStrategy[]
}

const defaultPreferences: SeatPreferences = {
  1: [
    {
      id: 'strategy_1_1',
      priority: 1,
      preference: 'near_window',
      description: 'Window seat preferred',
      seats: ['A'],
      isActive: true
    },
    {
      id: 'strategy_1_2',
      priority: 2,
      preference: 'near_aisle',
      description: 'Aisle seat as backup',
      seats: ['C', 'D'],
      isActive: true
    },
    {
      id: 'strategy_1_3',
      priority: 3,
      preference: 'any_seat',
      description: 'Any available seat',
      seats: [],
      isActive: true
    }
  ],
  2: [
    {
      id: 'strategy_2_1',
      priority: 1,
      preference: 'together_window',
      description: 'Together near window',
      seats: ['A', 'B'],
      isActive: true
    },
    {
      id: 'strategy_2_2',
      priority: 2,
      preference: 'seats_together',
      description: 'Any seats together',
      seats: ['C', 'D'],
      isActive: true
    }
  ],
  3: [
    {
      id: 'strategy_3_1',
      priority: 1,
      preference: 'seats_together',
      description: 'Three seats in a row',
      seats: ['A', 'B', 'C'],
      isActive: true
    },
    {
      id: 'strategy_3_2',
      priority: 2,
      preference: 'custom_arrangement',
      description: '2+1 arrangement',
      seats: ['1A', '1B', '2A'],
      isActive: true
    }
  ],
  4: [
    {
      id: 'strategy_4_1',
      priority: 1,
      preference: 'custom_arrangement',
      description: '2+2 window arrangement',
      seats: ['1A', '1B', '2A', '2B'],
      isActive: true
    },
    {
      id: 'strategy_4_2',
      priority: 2,
      preference: 'seats_together',
      description: 'Four seats together if possible',
      seats: [],
      isActive: true
    }
  ]
}

// Sortable Strategy Item Component
interface SortableStrategyItemProps {
  strategy: SeatStrategy
  onEdit: () => void
  onDelete: () => void
  getPreferenceColor: (preference: string) => string
  getStrategySuccessRate: (preference: string) => number
  existingStrategies: SeatStrategy[]
  validateStrategy: (strategy: SeatStrategy, existingStrategies: SeatStrategy[]) => { isValid: boolean; errors: string[] }
}

const SortableStrategyItem: React.FC<SortableStrategyItemProps> = ({
  strategy,
  onEdit,
  onDelete,
  getPreferenceColor,
  getStrategySuccessRate,
  existingStrategies,
  validateStrategy,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: strategy.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const validation = validateStrategy(strategy, existingStrategies)
  const successRate = getStrategySuccessRate(strategy.preference)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg bg-gray-50 space-y-3 sm:space-y-0 ${
        isDragging ? 'shadow-lg' : ''
      } ${!validation.isValid ? 'border-red-200 bg-red-50' : ''}`}
    >
      <div className="flex items-center space-x-3 flex-1">
        <div className="flex items-center space-x-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-move hover:text-gray-600"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
          <Badge variant="outline" className="text-xs">
            {strategy.priority}
          </Badge>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{strategy.description}</div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge className={`text-xs ${getPreferenceColor(strategy.preference)}`}>
              {strategy.preference.replace('_', ' ')}
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs ${
                successRate >= 80 ? 'text-green-600' :
                successRate >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}
            >
              {successRate}% success
            </Badge>
          </div>
          {!validation.isValid && (
            <div className="text-xs text-red-600 mt-1">
              {validation.errors.join(', ')}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2 sm:ml-4">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

const SeatPreferenceWidget: React.FC = () => {
  const [preferences, setPreferences] = useState<SeatPreferences>(defaultPreferences)
  const [selectedPassengerCount, setSelectedPassengerCount] = useState<number>(1)
  const [editingStrategy, setEditingStrategy] = useState<string | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleAddStrategy = (passengerCount: number) => {
    const existingStrategies = preferences[passengerCount] || []
    const newStrategy: SeatStrategy = {
      id: `strategy_${passengerCount}_${Date.now()}`,
      priority: existingStrategies.length + 1,
      preference: 'any_seat',
      description: 'Any seat',
      seats: [],
      isActive: true
    }

    setPreferences(prev => ({
      ...prev,
      [passengerCount]: [...existingStrategies, newStrategy]
    }))
  }

  const handleEditStrategy = (strategyId: string) => {
    setEditingStrategy(strategyId)
    setIsEditorOpen(true)
  }

  const handleDeleteStrategy = (passengerCount: number, strategyId: string) => {
    setPreferences(prev => ({
      ...prev,
      [passengerCount]: prev[passengerCount]?.filter(s => s.id !== strategyId) || []
    }))
  }

  const handleDragEnd = (event: DragEndEvent, passengerCount: number) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const strategies = preferences[passengerCount] || []
      const oldIndex = strategies.findIndex(s => s.id === active.id)
      const newIndex = strategies.findIndex(s => s.id === over?.id)

      const reorderedStrategies = arrayMove(strategies, oldIndex, newIndex)

      // Update priorities based on new order
      const updatedStrategies = reorderedStrategies.map((strategy, index) => ({
        ...strategy,
        priority: index + 1
      }))

      setPreferences(prev => ({
        ...prev,
        [passengerCount]: updatedStrategies
      }))
    }
  }

  const handleSaveStrategy = (strategy: SeatStrategy) => {
    const passengerCount = selectedPassengerCount
    setPreferences(prev => ({
      ...prev,
      [passengerCount]: prev[passengerCount]?.map(s => 
        s.id === strategy.id ? strategy : s
      ) || [strategy]
    }))
    setIsEditorOpen(false)
    setEditingStrategy(null)
  }

  const validateStrategy = (strategy: SeatStrategy, existingStrategies: SeatStrategy[]) => {
    const errors: string[] = []

    // Check for conflicting preferences
    const conflictingStrategies = existingStrategies.filter(s =>
      s.id !== strategy.id && s.preference === strategy.preference
    )

    if (conflictingStrategies.length > 0) {
      errors.push(`Similar preference already exists in strategy ${conflictingStrategies[0].priority}`)
    }

    // Validate seat selection for custom arrangements
    if (strategy.preference === 'custom_arrangement' && strategy.seats.length === 0) {
      errors.push('Custom arrangement requires seat selection')
    }

    return { isValid: errors.length === 0, errors }
  }

  const getPreferenceColor = (preference: string) => {
    const colors: { [key: string]: string } = {
      'any_seat': 'bg-gray-100 text-gray-800',
      'near_window': 'bg-blue-100 text-blue-800',
      'near_aisle': 'bg-green-100 text-green-800',
      'together_window': 'bg-purple-100 text-purple-800',
      'together_aisle': 'bg-orange-100 text-orange-800',
      'seats_together': 'bg-yellow-100 text-yellow-800',
      'custom_arrangement': 'bg-pink-100 text-pink-800'
    }
    return colors[preference] || 'bg-gray-100 text-gray-800'
  }

  const getStrategySuccessRate = (preference: string) => {
    // Simulated success rates for different preferences
    const rates: { [key: string]: number } = {
      'any_seat': 95,
      'near_window': 70,
      'near_aisle': 75,
      'together_window': 60,
      'together_aisle': 65,
      'seats_together': 80,
      'custom_arrangement': 45
    }
    return rates[preference] || 50
  }

  const exportPreferences = () => {
    const dataStr = JSON.stringify(preferences, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)

    const exportFileDefaultName = 'seat-preferences.json'

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const importPreferences = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedPreferences = JSON.parse(e.target?.result as string)
          setPreferences(importedPreferences)
        } catch (error) {
          alert('Invalid file format')
        }
      }
      reader.readAsText(file)
    }
  }

  const getTotalStrategies = () => {
    return Object.values(preferences).reduce((total, strategies) => total + strategies.length, 0)
  }

  const passengerCounts = [1, 2, 3, 4]

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Seat Preferences</span>
            </CardTitle>
            <p className="text-sm text-gray-600">
              Configure your preferred seating arrangements based on passenger count
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <Badge variant="outline" className="text-xs">
              {getTotalStrategies()} total strategies
            </Badge>
            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={exportPreferences}
                className="text-xs"
              >
                Export
              </Button>
              <label className="cursor-pointer">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  asChild
                >
                  <span>Import</span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={importPreferences}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Accordion type="single" collapsible defaultValue="passengers-1" className="w-full">
          {passengerCounts.map(count => {
            const strategies = preferences[count] || []
            return (
              <AccordionItem key={count} value={`passengers-${count}`}>
                <AccordionTrigger className="text-left">
                  <div className="flex items-center space-x-3">
                    <Users className="h-4 w-4" />
                    <span>{count} Passenger{count > 1 ? 's' : ''}</span>
                    <Badge variant="secondary" className="ml-2">
                      {strategies.length} strateg{strategies.length === 1 ? 'y' : 'ies'}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    {/* Strategy List */}
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event) => handleDragEnd(event, count)}
                    >
                      <SortableContext
                        items={strategies.map(s => s.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {strategies.map((strategy) => (
                            <SortableStrategyItem
                              key={strategy.id}
                              strategy={strategy}
                              onEdit={() => {
                                setSelectedPassengerCount(count)
                                handleEditStrategy(strategy.id)
                              }}
                              onDelete={() => handleDeleteStrategy(count, strategy.id)}
                              getPreferenceColor={getPreferenceColor}
                              getStrategySuccessRate={getStrategySuccessRate}
                              existingStrategies={strategies}
                              validateStrategy={validateStrategy}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>

                    {/* Add Strategy Button */}
                    {strategies.length < 5 && (
                      <Button
                        variant="outline"
                        onClick={() => handleAddStrategy(count)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Strategy
                      </Button>
                    )}

                    {/* Seat Map Preview */}
                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-3">Seat Map Preview</h4>
                      <SeatMapVisualization
                        strategies={strategies}
                        passengerCount={count}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>

        {/* Quick Summary */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Preference Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {passengerCounts.map(count => {
              const strategies = preferences[count] || []
              const topStrategy = strategies.find(s => s.priority === 1)
              return (
                <div key={count} className="text-center">
                  <div className="font-medium text-blue-800">{count} Passenger{count > 1 ? 's' : ''}</div>
                  <div className="text-blue-600">
                    {topStrategy ? topStrategy.description : 'No strategy'}
                  </div>
                  <div className="text-blue-500">
                    {strategies.length} strateg{strategies.length === 1 ? 'y' : 'ies'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Strategy Editor Modal */}
        <SeatStrategyEditor
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false)
            setEditingStrategy(null)
          }}
          strategy={editingStrategy ?
            preferences[selectedPassengerCount]?.find(s => s.id === editingStrategy) :
            undefined
          }
          passengerCount={selectedPassengerCount}
          onSave={handleSaveStrategy}
        />
      </CardContent>
    </Card>
  )
}

export default SeatPreferenceWidget
