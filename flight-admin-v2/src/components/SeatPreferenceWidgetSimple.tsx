import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Settings, Plus, Edit, Trash2, Users, GripVertical, Plane } from 'lucide-react'
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
import SeatStrategyEditorSimple from './SeatStrategyEditorSimple'

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
  passengerCount: number
}

const SortableStrategyItem: React.FC<SortableStrategyItemProps> = ({
  strategy,
  onEdit,
  onDelete,
  getPreferenceColor,
  getStrategySuccessRate,
  passengerCount,
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-4 border rounded-lg bg-gray-50 ${
        isDragging ? 'shadow-lg' : ''
      }`}
    >
      <div className="flex items-center space-x-3">
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
        <div>
          <div className="font-medium text-sm">{strategy.description}</div>
          <div className="flex items-center space-x-2 mt-1">
            <Badge className={`text-xs ${getPreferenceColor(strategy.preference)}`}>
              {strategy.preference.replace('_', ' ')}
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs ${
                getStrategySuccessRate(strategy.preference) >= 80 ? 'text-green-600' :
                getStrategySuccessRate(strategy.preference) >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}
            >
              {getStrategySuccessRate(strategy.preference)}% success
            </Badge>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center space-x-1 text-xs"
          onClick={() => window.location.href = `/seat-selection?passengers=${passengerCount}&strategy=${strategy.preference}`}
        >
          <Plane className="h-3 w-3" />
          <span>Select Seats</span>
        </Button>
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

const SeatPreferenceWidgetSimple: React.FC = () => {
  const navigate = useNavigate()
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

  const handleDeleteStrategy = (passengerCount: number, strategyId: string) => {
    setPreferences(prev => ({
      ...prev,
      [passengerCount]: prev[passengerCount]?.filter(s => s.id !== strategyId) || []
    }))
  }

  const handleEditStrategy = (strategyId: string) => {
    setEditingStrategy(strategyId)
    setIsEditorOpen(true)
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
                              passengerCount={count}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => navigate(`/seat-selection?passengers=${count}&strategy=any_seat`)}
                        className="flex-1 flex items-center justify-center space-x-2"
                      >
                        <Plane className="h-4 w-4" />
                        <span>Select Seats for {count} Passenger{count > 1 ? 's' : ''}</span>
                      </Button>
                      {strategies.length < 5 && (
                        <Button
                          variant="outline"
                          onClick={() => handleAddStrategy(count)}
                          className="flex items-center justify-center space-x-2"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add Strategy</span>
                        </Button>
                      )}
                    </div>

                    {/* Simple Seat Map Preview */}
                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-3">Seat Map Preview</h4>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="text-center text-xs text-gray-500 mb-2">
                          ✈️ Front of Aircraft
                        </div>
                        <div className="space-y-1">
                          {Array.from({ length: 3 }, (_, rowIndex) => {
                            const row = rowIndex + 1
                            return (
                              <div key={row} className="flex items-center justify-center space-x-1">
                                <div className="w-6 text-xs text-gray-500 text-center">{row}</div>
                                <div className="flex space-x-1">
                                  {['A', 'B', 'C'].map(letter => (
                                    <div
                                      key={letter}
                                      className="w-8 h-8 rounded text-xs flex items-center justify-center font-medium bg-blue-100 text-blue-800"
                                    >
                                      {letter}
                                    </div>
                                  ))}
                                </div>
                                <div className="w-4 text-center text-xs text-gray-400">|</div>
                                <div className="flex space-x-1">
                                  {['D', 'E', 'F'].map(letter => (
                                    <div
                                      key={letter}
                                      className="w-8 h-8 rounded text-xs flex items-center justify-center font-medium bg-green-100 text-green-800"
                                    >
                                      {letter}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
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
        <SeatStrategyEditorSimple
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

export default SeatPreferenceWidgetSimple
