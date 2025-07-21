# Seat Preference Widget Demo Guide

## 🎯 Overview
The Seat Preference Widget is now fully functional in the Account section of the flight admin dashboard. This guide will walk you through all the features and how to test them.

## 🚀 Getting Started

1. **Access the Widget**
   - Navigate to `http://localhost:5173/account`
   - Scroll down to see the "Seat Preferences" widget below the balance card

## ✨ Key Features to Test

### 1. **Passenger Group Management**
- **What to test**: Click on different passenger count sections (1, 2, 3, 4 passengers)
- **Expected behavior**: Each section expands to show strategies specific to that passenger count
- **Default data**: Pre-populated with realistic strategies for each passenger count

### 2. **Drag & Drop Reordering**
- **What to test**: Use the grip handle (⋮⋮) to drag strategies up and down
- **Expected behavior**: 
  - Strategies reorder smoothly
  - Priority numbers update automatically (1 = highest priority)
  - Visual feedback during dragging (opacity change)

### 3. **Strategy Management**
- **Add Strategy**: Click "Add Strategy" button
- **Edit Strategy**: Click the edit (pencil) icon
- **Delete Strategy**: Click the delete (trash) icon
- **Expected behavior**: Modal opens for editing with all preference options

### 4. **Strategy Editor Modal**
- **Priority Setting**: Adjust strategy priority (1-5)
- **Preference Types**: Choose from 7 different seat preference types:
  - Any seat (95% success rate)
  - Near the window (70% success rate)
  - Near the aisle (75% success rate)
  - Together near the window (60% success rate)
  - Together near the aisle (65% success rate)
  - Seats together in a row (80% success rate)
  - Custom arrangement (45% success rate)
- **Description**: Custom description for each strategy
- **Preview**: Real-time preview of the strategy

### 5. **Success Rate Indicators**
- **What to test**: Look at the colored badges next to each strategy
- **Color coding**:
  - Green: 80%+ success rate
  - Yellow: 60-79% success rate
  - Red: Below 60% success rate

### 6. **Export/Import Functionality**
- **Export**: Click "Export" button to download preferences as JSON
- **Import**: Click "Import" and select a previously exported JSON file
- **Expected behavior**: Preferences save/load correctly

### 7. **Visual Seat Map Preview**
- **What to test**: Look at the simplified seat map in each passenger section
- **Expected behavior**: Shows airplane layout with seat letters and aisle separation

### 8. **Summary Section**
- **What to test**: Check the blue summary box at the bottom
- **Expected behavior**: Shows overview of top strategy for each passenger count

### 9. **Mobile Responsiveness**
- **What to test**: Resize browser window or test on mobile device
- **Expected behavior**: Layout adapts with proper spacing and touch-friendly controls

## 🧪 Test Scenarios

### Scenario 1: Basic Strategy Management
1. Open "1 Passenger" section
2. Click "Add Strategy"
3. Select "Near the aisle" preference
4. Change description to "Aisle seat for easy bathroom access"
5. Save the strategy
6. Verify it appears in the list with correct success rate (75%)

### Scenario 2: Drag & Drop Reordering
1. Open "2 Passengers" section
2. Drag the second strategy above the first one
3. Verify priority numbers update (new order: 1, 2)
4. Check that the summary section reflects the new top strategy

### Scenario 3: Export/Import Workflow
1. Configure some custom strategies
2. Click "Export" and save the file
3. Delete some strategies
4. Click "Import" and select the saved file
5. Verify all strategies are restored

### Scenario 4: Strategy Validation
1. Try to add multiple strategies with the same preference type
2. Verify the system handles duplicates appropriately
3. Test the maximum limit of 5 strategies per passenger group

## 🎨 Visual Elements to Notice

### Color Coding
- **Blue**: Window seat preferences
- **Green**: Aisle seat preferences  
- **Purple**: Together near window
- **Orange**: Together near aisle
- **Yellow**: Seats together
- **Pink**: Custom arrangement
- **Gray**: Any seat

### Interactive Elements
- **Hover effects**: Buttons and draggable items respond to hover
- **Drag feedback**: Items become semi-transparent when dragging
- **Loading states**: Smooth transitions between states

### Responsive Design
- **Desktop**: Full layout with side-by-side elements
- **Tablet**: Adjusted spacing and button sizes
- **Mobile**: Stacked layout with touch-friendly controls

## 🔧 Technical Features

### Performance Optimizations
- **Hot Module Replacement**: Changes update instantly during development
- **Efficient Re-rendering**: Only affected components update
- **Smooth Animations**: CSS transitions for all interactions

### Accessibility
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Focus Indicators**: Clear visual focus states

### Data Persistence
- **Local State**: Preferences maintained during session
- **Export/Import**: Manual backup and restore functionality
- **Validation**: Input validation and error handling

## 🐛 Known Limitations

1. **Seat Map**: Currently shows simplified 3-3 configuration
2. **Success Rates**: Based on simulated data, not real airline statistics
3. **Custom Arrangements**: Seat selection interface is basic
4. **Validation**: Limited conflict detection between strategies

## 🚀 Future Enhancements

1. **Real Airline Integration**: Connect to actual booking systems
2. **Advanced Seat Maps**: Support for different aircraft configurations
3. **Machine Learning**: Improve success rate predictions
4. **Group Coordination**: Multi-user preference sharing
5. **Analytics Dashboard**: Track preference effectiveness

## 📱 Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🎉 Success Indicators

If everything is working correctly, you should see:
- ✅ Smooth drag and drop functionality
- ✅ Modal dialogs opening and closing properly
- ✅ Success rate badges with appropriate colors
- ✅ Export downloads a JSON file
- ✅ Import restores preferences correctly
- ✅ Responsive layout on different screen sizes
- ✅ Real-time updates in the summary section

Enjoy exploring the comprehensive seat preference management system!
