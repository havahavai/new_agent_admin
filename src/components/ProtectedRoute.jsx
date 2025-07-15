import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * Protected route component that redirects to login if user is not authenticated
 * @param {Object} props - Component props
 * @returns {JSX.Element} Protected route component
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Enhanced authentication check with history management
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // The replace:true prevents going back to this route with the back button
      navigate('/login', { 
        state: { from: location },
        replace: true 
      });
      
      // Extra measure: Clear browser history state to prevent back navigation
      if (window.history && window.history.pushState) {
        window.history.pushState(null, document.title, window.location.href);
        window.addEventListener('popstate', function() {
          window.history.pushState(null, document.title, window.location.href);
        });
      }
    }
  }, [isAuthenticated, loading, location, navigate]);
  
  // Show loading spinner while checking authentication status
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Box>
    );
  }
  
  // Return null during the navigation process
  if (!isAuthenticated) {
    return null;
  }
  
  // Render children if authenticated
  return children;
};

export default ProtectedRoute;
