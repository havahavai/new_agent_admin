# Spotify-Style Web Check-in Dashboard System Prompt

Create a modern, Spotify-inspired admin dashboard system with the following components and specifications:

## Global Structure
- Implement a dark-themed interface similar to Spotify's admin panel
- Create a persistent sidebar menu for navigation between different dashboard sections
- Include placeholder menu items for future dashboard expansions
- Use a responsive design that works on both desktop and mobile devices

## Sidebar Menu
- Design a fixed sidebar with Spotify-like styling (dark background with accent color highlights)
- Include the following menu items:
  - Web Check-in Dashboard (default/home view)
  - Web Check-in Details (activates when a check-in is selected)
  - Analytics (placeholder for future implementation)
  - User Management (placeholder for future implementation)
  - Settings (placeholder for future implementation)
- Add collapsible/expandable functionality for mobile view
- Include company logo/branding at the top
- Add user profile section at the bottom with avatar and name

## Page 1: Web Check-in Dashboard
- Create a main content area displaying all web check-in requests as interactive cards
- Implement a header with:
  - Page title "Web Check-in Requests"
  - Search bar for finding specific requests
  - Filter dropdown (by status, date, airline)
  - Sort options (newest, oldest, status)
- Design check-in request cards with:
  - Booking reference prominently displayed
  - Passenger name
  - Flight details (airline code, flight number)
  - Travel date in user-friendly format
  - Status badge with color coding:
    - SCHEDULED (blue)
    - Auto COMPLETED (green)
    - IN_PROGRESS (orange/amber)
    - Tech Failed (red)
    - Manually Completed (green)
    - Manually Failed (red)
- Add hover effects and smooth transitions between states
- Implement infinite scroll or pagination with Spotify-like minimalist styling
- Include quick-action buttons on each card

## Page 2: Web Check-in Details
- Create a detailed view that opens when a check-in card is clicked
- Include a header with:
  - Back button to return to dashboard
  - Booking reference number
  - Current status with update options
- Display comprehensive passenger information section:
  ```
  {
    "bookingReference": "PGHYIH",
    "airline": "6E",
    "email": "gopalkrushnas063@gmail.com",
    "phoneNumber": "919937220643",
    "passport": "",
    "passportExpiry": "",
    "nationality": "",
    "flightNumber": "6E1407",
    "travelDate": "2025-03-07",
    "arrivalAirport": "AUH",
    "departureAirport": "HYD",
    "firstName": "Gopal Krushna",
    "lastName": "Sahoo"
  }
  ```
- Create a boarding pass section with:
  - Drag-and-drop upload area for files
  - Preview of uploaded boarding passes
  - Download button for existing boarding passes
  - Version history if multiple uploads exist
- Add a check-in history timeline showing status changes with timestamps
- Include an agent notes/comments section
- Implement action buttons for manual status updates

## Technical Implementation
- Use React/Next.js for front-end development
- Implement styled-components or Tailwind CSS for styling
- Create a responsive grid system for different screen sizes
- Ensure keyboard accessibility and screen reader compatibility
- Use skeleton loading states for improved perceived performance
- Implement proper authentication and route protection
- Create RESTful API endpoints for all data operations
- Add error handling with user-friendly error messages
- Include real-time updates using WebSockets or polling

## Visual Design Elements
- Use Spotify's color palette as inspiration:
  - Primary background: #121212
  - Secondary background: #181818
  - Highlight elements: #1DB954 (Spotify green) or a custom brand color
  - Text: #FFFFFF (primary), #B3B3B3 (secondary)
- Implement subtle hover states and transitions
- Use modern, clean typography
- Include minimal animations for state changes
- Design empty states for lists with no data
