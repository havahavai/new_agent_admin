import React from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper,
  Card,
  CardContent,
  Button,
  Divider,
  Avatar
} from '@mui/material';
import { AccountCircleIcon, ExitToAppIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import BottomNavbar from '../components/BottomNavbar';

/**
 * Account page component
 * @returns {JSX.Element} AccountPage component
 */
const AccountPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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
            background: 'linear-gradient(135deg, #7b1fa2 0%, #ab47bc 100%)',
            color: 'white'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AccountCircleIcon sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold">
                Account
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Manage your account settings
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* User Info Card */}
        <Card elevation={2} sx={{ mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
              <Avatar 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: '#7b1fa2',
                  fontSize: '2rem'
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Avatar>
              <Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  {user?.name || 'User'}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {user?.email || 'user@example.com'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Role: {user?.role || 'Admin'}
                </Typography>
              </Box>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom>
              Account Actions
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<ExitToAppIcon />}
                onClick={handleLogout}
                sx={{ minWidth: 120 }}
              >
                Logout
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Features Card */}
        <Card elevation={2}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <AccountCircleIcon 
              sx={{ 
                fontSize: 80, 
                color: '#7b1fa2', 
                mb: 2,
                opacity: 0.7
              }} 
            />
            <Typography variant="h5" component="h2" gutterBottom>
              Account Management
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Manage your account settings and preferences.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Features coming soon:
            </Typography>
            <Box component="ul" sx={{ textAlign: 'left', maxWidth: 300, mx: 'auto', mt: 2 }}>
              <Typography component="li" variant="body2" color="text.secondary">
                Profile settings
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Password change
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Notification preferences
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Security settings
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
      
      <BottomNavbar />
    </Box>
  );
};

export default AccountPage;
