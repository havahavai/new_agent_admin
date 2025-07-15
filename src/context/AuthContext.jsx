import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, logoutUser } from '../services/authService';

// Create context
const AuthContext = createContext(null);

/**
 * Provider component for authentication
 * @param {Object} props - Component props
 * @returns {JSX.Element} Provider component
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuthStatus = () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      const loginTimestamp = localStorage.getItem('loginTimestamp');

      if (token && userData && loginTimestamp) {
        try {
          // Check if the session has expired (1 hour = 3600000 milliseconds)
          const currentTime = new Date().getTime();
          const sessionTime = parseInt(loginTimestamp, 10);
          const sessionDuration = currentTime - sessionTime;

          if (sessionDuration > 3600000) {
            // Session expired, log the user out
            console.log('Session expired. Please log in again.');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            localStorage.removeItem('loginTimestamp');
          } else {
            setUser(JSON.parse(userData));
          }
        } catch (err) {
          // If userData is corrupted, clear it
          localStorage.removeItem('userData');
          localStorage.removeItem('authToken');
          localStorage.removeItem('loginTimestamp');
        }
      }

      setLoading(false);
    };

    checkAuthStatus();

    // Set up interval to check session expiration every minute
    const sessionCheckInterval = setInterval(() => {
      checkAuthStatus();
    }, 60000);

    // Clean up interval on component unmount
    return () => clearInterval(sessionCheckInterval);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const result = await loginUser(email, password);

      // Store authentication data with timestamp first
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('userData', JSON.stringify(result.user));
      localStorage.setItem('loginTimestamp', new Date().getTime().toString());

      // Verify the token was properly set
      const storedToken = localStorage.getItem('authToken');
      if (!storedToken) {
        throw new Error('Failed to store authentication token');
      }

      console.log('Authentication successful, token stored');

      // Only update state after storage is confirmed
      setUser(result.user);

      return result;
    } catch (err) {
      setError(err.message || 'Failed to login');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);

    try {
      await logoutUser();
      setUser(null);

      // Clear all possible storage mechanisms
      // 1. LocalStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('loginTimestamp');

      // 2. SessionStorage
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('userData');
      sessionStorage.removeItem('loginTimestamp');

      // 3. Cookies
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });

      // 4. IndexedDB (if used)
      if (window.indexedDB) {
        try {
          indexedDB.deleteDatabase('authData');
        } catch (e) {
          console.log('IndexedDB not in use or error clearing it:', e);
        }
      }

      // Clear history state if relevant
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, document.title, window.location.pathname);
      }

      return true;
    } catch (err) {
      console.error('Logout error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use the auth context
 * @returns {Object} Auth context value
*/
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default AuthContext;
