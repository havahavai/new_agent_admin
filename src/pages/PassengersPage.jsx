import React from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper,
  Card,
  CardContent
} from '@mui/material';
import { PersonIcon } from '@mui/icons-material';
import BottomNavbar from '../components/BottomNavbar';

/**
 * Passengers page component
 * @returns {JSX.Element} PassengersPage component
 */
const PassengersPage = () => {
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
            background: 'linear-gradient(135deg, #388e3c 0%, #66bb6a 100%)',
            color: 'white'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PersonIcon sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold">
                Passengers
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Manage passenger information
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Content */}
        <Card elevation={2}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <PersonIcon 
              sx={{ 
                fontSize: 80, 
                color: '#388e3c', 
                mb: 2,
                opacity: 0.7
              }} 
            />
            <Typography variant="h5" component="h2" gutterBottom>
              Passenger Management
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              This is the passengers page where you can manage and view all passenger information.
              Passenger management features will be implemented here.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Features coming soon:
            </Typography>
            <Box component="ul" sx={{ textAlign: 'left', maxWidth: 300, mx: 'auto', mt: 2 }}>
              <Typography component="li" variant="body2" color="text.secondary">
                View all passengers
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Add new passengers
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Edit passenger details
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Passenger document management
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
      
      <BottomNavbar />
    </Box>
  );
};

export default PassengersPage;
