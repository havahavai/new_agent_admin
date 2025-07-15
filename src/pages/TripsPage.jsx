import React from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper,
  Card,
  CardContent
} from '@mui/material';
import { FlightIcon } from '@mui/icons-material';
import BottomNavbar from '../components/BottomNavbar';

/**
 * Trips page component
 * @returns {JSX.Element} TripsPage component
 */
const TripsPage = () => {
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5',
      paddingBottom: '80px' // Space for bottom navbar
    }}>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Header */}
        <Paper 
          elevation={1} 
          sx={{ 
            p: 3, 
            mb: 3, 
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            color: 'white'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FlightIcon sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold">
                Trips
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Manage and view all trips
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Content */}
        <Card elevation={2}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <FlightIcon
              sx={{
                fontSize: 80,
                color: '#1976d2',
                mb: 2,
                opacity: 0.7
              }}
            />
            <Typography variant="h5" component="h2" gutterBottom>
              Trips Management
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              This is the trips page where you can manage and view all trip information.
              Trip management features will be implemented here.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Features coming soon:
            </Typography>
            <Box component="ul" sx={{ textAlign: 'left', maxWidth: 300, mx: 'auto', mt: 2 }}>
              <Typography component="li" variant="body2" color="text.secondary">
                View all trips
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Create new trips
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Edit trip details
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Trip status management
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
      
      <BottomNavbar />
    </Box>
  );
};

export default TripsPage;
