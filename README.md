# Web Check-in Portal

A modern web application for managing flight check-ins, built with React and Material UI.

## Features

- Dashboard with filtering and sorting capabilities
- Detailed view of check-in information
- Flight details, ticket information, and boarding pass management
- Material Design UI components for a consistent and professional look

## Technology Stack

- **React**: Frontend library for building user interfaces
- **React Router**: Handling navigation between pages
- **Material UI**: Component library implementing Google's Material Design
- **Context API**: State management for the application

## Architecture

The application follows a component-based architecture with the following structure:

- **Layout**: The main layout component with the navigation drawer and app bar
- **Pages**: Main page components (Dashboard, Check-in Details)
- **Components**: Reusable UI components (StatusBadge, BoardingPassUploader, etc.)
- **Context**: State management using React Context API
- **Utils**: Utility functions for formatting, status handling, etc.

## Material UI Implementation

The application uses Material UI throughout, with the following key components:

- **AppBar**: For the top navigation bar
- **Drawer**: For the persistent navigation drawer
- **Tabs**: For organizing content in the Check-in Details page
- **Tables**: For displaying check-in data in the Dashboard
- **Cards**: For containing related information
- **Chips**: For status indicators
- **Grid**: For responsive layouts
- **Typography**: For consistent text styling
- **Paper**: For creating surface elevation and depth

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Start the development server with `npm start`
4. Navigate to http://localhost:3000

## Development Guidelines

- All UI components should use Material UI
- Follow Material Design guidelines for spacing, typography, and color
- Use theme variables for consistent styling
- Keep components small and focused on a single responsibility
- Use TSDoc/JSDoc comments for documentation

## Project Structure

```
src/
├── components/       # Reusable UI components
│   └── ui/           # Basic UI components
├── context/          # Context providers
├── pages/            # Page components
├── styles/           # Global styles
├── utils/            # Utility functions
└── App.jsx           # Main application component
```

## License

MIT 