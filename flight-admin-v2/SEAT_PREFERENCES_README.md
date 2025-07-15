# Seat Preference System

A comprehensive airline seat preference management system built with React, TypeScript, and shadcn/ui components.

## Features

### 🎯 Core Functionality
- **Passenger-Based Groups**: Configure preferences for 1, 2, 3, or 4+ passengers
- **Priority System**: Rank strategies by priority (1 = highest priority)
- **Drag & Drop**: Reorder strategies with intuitive drag-and-drop interface
- **Real-time Validation**: Automatic conflict detection and success rate indicators

### 🪑 Seat Preference Types
- **Any Seat**: Most flexible option (95% success rate)
- **Near Window**: Window seats preferred (70% success rate)
- **Near Aisle**: Aisle seats preferred (75% success rate)
- **Together Near Window**: Group seating by window (60% success rate)
- **Together Near Aisle**: Group seating by aisle (65% success rate)
- **Seats Together**: Consecutive seating (80% success rate)
- **Custom Arrangement**: User-defined positioning (45% success rate)

### 🗺️ Interactive Seat Map
- Visual airplane layout (3-3 configuration)
- Color-coded seat types (window/middle/aisle)
- Real-time preference highlighting
- Availability status indicators
- Mobile-responsive design

### 📊 Advanced Features
- **Strategy Validation**: Automatic conflict detection
- **Success Rate Indicators**: Data-driven preference recommendations
- **Export/Import**: Backup and share preference configurations
- **Mobile Responsive**: Touch-friendly interface for all devices
- **Quick Summary**: Overview of all passenger group preferences

## Usage

### Adding a Strategy
1. Navigate to the desired passenger count section
2. Click "Add Strategy" button
3. Select preference type from dropdown
4. Configure description and custom seats (if applicable)
5. Save the strategy

### Reordering Strategies
1. Use the grip handle (⋮⋮) to drag strategies
2. Drop in desired position
3. Priorities automatically update based on order

### Custom Arrangements
1. Select "Custom arrangement" preference type
2. Use the interactive seat map to select specific seats
3. Click seats to select/deselect (numbered by selection order)
4. Save the custom configuration

### Export/Import Preferences
- **Export**: Click "Export" button to download JSON file
- **Import**: Click "Import" and select previously exported JSON file

## Technical Implementation

### Components Structure
```
SeatPreferenceWidget (Main container)
├── SeatStrategyEditor (Modal for editing strategies)
├── SeatMapVisualization (Preview seat map)
├── SeatMapSelector (Interactive seat selection)
└── SortableStrategyItem (Draggable strategy items)
```

### Data Structure
```typescript
interface SeatStrategy {
  id: string
  priority: number
  preference: string
  description: string
  seats: string[]
  isActive: boolean
}

interface SeatPreferences {
  [passengerCount: number]: SeatStrategy[]
}
```

### Dependencies
- `@dnd-kit/core` - Drag and drop functionality
- `@dnd-kit/sortable` - Sortable list implementation
- `@radix-ui/react-dialog` - Modal dialogs
- `lucide-react` - Icons
- `shadcn/ui` - UI components

## Mobile Responsiveness

The system is fully responsive with:
- Collapsible accordion sections for small screens
- Touch-friendly drag handles
- Responsive seat map scaling
- Mobile-optimized button layouts
- Flexible grid layouts

## Validation Rules

- Maximum 5 strategies per passenger group
- Duplicate preference type detection
- Custom arrangement seat requirement validation
- Priority conflict resolution

## Success Rate Calculation

Success rates are calculated based on:
- Seat availability patterns
- Preference complexity
- Historical booking data simulation
- Passenger count considerations

## Future Enhancements

- Integration with real airline booking systems
- Machine learning-based success rate predictions
- Advanced seat map configurations (2-4-2, etc.)
- Group booking coordination
- Preference sharing between users
- Analytics dashboard for preference effectiveness

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- Lazy loading for large seat maps
- Debounced preference updates
- Memoized strategy calculations
- Efficient re-rendering patterns
