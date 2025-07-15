import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FlightIcon,
  PersonIcon,
  AccountCircleIcon
} from '@mui/icons-material';
import { 
  BottomNavigation, 
  BottomNavigationAction, 
  Paper 
} from '@mui/material';

/**
 * Bottom navigation component for mobile and desktop
 * @returns {JSX.Element} BottomNavbar component
 */
const BottomNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine current tab based on pathname
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path === '/trips') return 0;
    if (path === '/passengers') return 1;
    if (path === '/account') return 2;
    return 0; // Default to trips
  };

  const handleTabChange = (event, newValue) => {
    switch (newValue) {
      case 0:
        navigate('/trips');
        break;
      case 1:
        navigate('/passengers');
        break;
      case 2:
        navigate('/account');
        break;
      default:
        navigate('/trips');
    }
  };

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0,
        zIndex: 1000,
        borderTop: '1px solid #e0e0e0'
      }} 
      elevation={3}
    >
      <BottomNavigation
        value={getCurrentTab()}
        onChange={handleTabChange}
        showLabels
        sx={{
          height: 70,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '6px 12px 8px',
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.75rem',
            marginTop: '4px',
          },
        }}
      >
        <BottomNavigationAction
          label="Trips"
          icon={<FlightIcon />}
        />
        <BottomNavigationAction 
          label="Passengers" 
          icon={<PersonIcon />} 
        />
        <BottomNavigationAction 
          label="Account" 
          icon={<AccountCircleIcon />} 
        />
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNavbar;
