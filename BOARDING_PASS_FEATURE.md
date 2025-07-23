# Boarding Pass Feature

## Overview
Added a new boarding pass section to the Trip Details page that displays available boarding passes with PDF preview functionality for passengers who have completed check-in.

## Features

### Boarding Pass Section
- **Conditional Display**: Shows when boarding passes are available (either official ticket documents or generated passes)
- **Accordion Layout**: Integrated as a new accordion section in the Trip Details page
- **Pass Count**: Shows the total number of available boarding passes in the section header
- **Dual Support**: Handles both official PDF boarding passes and generated boarding passes

### PDF Boarding Pass Preview
For official boarding passes (from `ticketDocuments` or `boardingPassUrl`):
- **Embedded PDF Viewer**: Shows PDF boarding passes directly in the page using iframe
- **Fallback Support**: Graceful fallback when PDF preview fails
- **Full View Option**: Button to open PDF in new tab for better viewing
- **Download Support**: Direct download of official boarding pass files

### Generated Boarding Pass Support
For passengers with generated boarding passes:
- **Placeholder Display**: Shows when boarding pass is available but no PDF URL
- **Download Options**: HTML, print, and text format downloads
- **Action Buttons**: Multiple format options for generated passes

### Action Buttons
For official boarding passes:
1. **Download**: Download the official PDF boarding pass
2. **View Full Size**: Open PDF in new tab for better viewing

For generated boarding passes:
1. **Download Official Pass**: If `boardingPassUrl` is available from the API
2. **Download HTML**: Generate and download a formatted HTML boarding pass
3. **Print**: Open print dialog with a print-optimized boarding pass
4. **View Full Size**: Open boarding pass URL in new tab (if available)

## Technical Implementation

### Data Structure
The boarding pass functionality uses the existing `BoardingPass` interface from `src/data/flights.ts`:

```typescript
interface BoardingPass {
  id: string;
  passengerId: string;
  flightId: string;
  passengerName: string;
  flightNumber: string;
  date: string;
  departure: string;
  arrival: string;
  route: {
    from: string;
    to: string;
    fromCode: string;
    toCode: string;
  };
  seatNumber: string;
  gate: string;
  boardingGroup: string;
  ticketClass: string;
  barcode: string;
  qrCode: string;
  issuedAt: string;
  boardingPassUrl?: string; // URL to actual boarding pass from API
}
```

### Component Integration
- **Location**: Added as a new accordion item in `src/pages/TripDetails.tsx`
- **Conditional Rendering**: Displays when `passengers.some(p => p.boardingPass)` OR `bookingDetails.ticketDocuments?.length` is true
- **Dual Layout**: Separate cards for official documents (blue theme) and generated passes (green theme)
- **PDF Integration**: Uses iframe for PDF preview with error handling

### Icons Used
- `CreditCard`: Main boarding pass icon
- `Download`: Download actions
- `Printer`: Print action (for generated passes)
- `FileText`: Text format download and PDF fallback
- `Eye`: View full size/preview actions

## User Experience

### Visual Design
- **Dual Color Scheme**:
  - Blue theme for official boarding passes (from ticket documents)
  - Green theme for generated boarding passes (ready to board status)
- **Card Layout**: Each boarding pass is displayed in a card with colored left border
- **PDF Preview**: Embedded iframe showing actual PDF content with 384px height
- **Responsive**: Works on both desktop and mobile devices
- **Error Handling**: Graceful fallback when PDF preview fails

### Accessibility
- **Clear Labels**: All buttons have descriptive text
- **Status Indicators**: Visual badges indicate boarding status
- **Keyboard Navigation**: All interactive elements are keyboard accessible

## Usage

### When Boarding Passes Appear
The boarding pass section will be shown when:
1. **Official Documents**: `bookingDetails.ticketDocuments` contains boarding pass files
2. **Generated Passes**: Passengers have a `boardingPass` object in their data
3. **Check-in Status**: Typically for passengers with "Checked In" or "Boarded" status

### Preview Options
- **PDF Preview**: Embedded iframe preview for PDF boarding passes
- **Full View**: Open PDF in new browser tab for better viewing
- **Download**: Direct download of official boarding pass files
- **Fallback Display**: Placeholder when PDF preview is not available

### Download Options (Generated Passes)
- **Official Pass**: Downloads the actual boarding pass file from the airline (if `boardingPassUrl` available)
- **HTML Format**: Creates a styled, printable HTML version
- **Print**: Opens print dialog with optimized boarding pass layout

## Technical Notes

### PDF Preview Implementation
- Uses iframe with `#toolbar=0&navpanes=0&scrollbar=0` parameters to hide PDF controls
- Implements error handling with fallback display when iframe fails to load
- Height set to 384px (h-96) for optimal preview size
- Supports both PDF files and other document types

### Error Handling
- PDF preview failures are caught and handled gracefully
- Fallback UI shows when iframe cannot load the PDF
- Console logging for debugging PDF loading issues
- Alternative "View PDF" button when preview fails

## Future Enhancements
- Add QR code generation for mobile boarding passes
- Implement boarding pass sharing via email
- Add boarding pass validation status
- Support for multiple boarding pass formats (PDF, mobile wallet)
- Improve PDF preview with zoom controls
- Add boarding pass rotation/orientation options
