// API base URL
const API_BASE_URL = 'https://prod-api.flyo.ai/core/v1/admin';

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Promise resolving to user data and token
 */
export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/adminLogin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        role: 'admin'
      })
    });

    const data = await response.json();

    // Handle different status codes
    switch (response.status) {
      case 200:
        if (!data.success) {
          throw new Error(data.message || 'Login failed');
        }

        // Store the token and user data from the API response
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('userData', JSON.stringify(data.data.user));
        localStorage.setItem('loginTimestamp', new Date().getTime().toString());
        
        return {
          success: true,
          token: data.data.token,
          user: data.data.user,
          message: data.message
        };

      case 401:
        throw new Error('Invalid email or password. Please check your credentials.');

      case 500:
        throw new Error('Server error. Please try again later.');

      default:
        throw new Error(data.message || 'Login failed. Please try again.');
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Logout user
 * @returns {Promise<Object>} Promise resolving to logout result
 */
export const logoutUser = async () => {
  try {
    // For development purposes, we'll simulate a successful logout
    // In production, this would be a real API call
    if (process.env.NODE_ENV === 'development') {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clear all auth related data
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('loginTimestamp');
      
      return { success: true };
    }
    
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      return { success: true };
    }
    
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Logout failed');
    }

    const data = await response.json();
    
    // Clear all auth related data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('loginTimestamp');
    
    return data;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Check if the current auth token is valid
 * @returns {Promise<boolean>} Promise resolving to token validity
 */
export const validateToken = async () => {
  try {
    const token = localStorage.getItem('authToken');
    const loginTimestamp = localStorage.getItem('loginTimestamp');
    
    if (!token || !loginTimestamp) {
      return false;
    }
    
    // Check if the session has expired (1 hour = 3600000 milliseconds)
    const currentTime = new Date().getTime();
    const sessionTime = parseInt(loginTimestamp, 10);
    const sessionDuration = currentTime - sessionTime;
    
    if (sessionDuration > 3600000) {
      // Session expired, clear auth data
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('loginTimestamp');
      return false;
    }
    
    // For development purposes, we'll simulate a valid token
    // In production, this would be a real API call
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    
    const response = await fetch(`${API_BASE_URL}/auth/validate`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    
    return data.success === true;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};
