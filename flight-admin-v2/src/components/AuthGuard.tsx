import React, { useEffect, useState } from 'react';
import { isAuthenticated } from '../api/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = isAuthenticated();
      setAuthenticated(authStatus);
      setIsChecking(false);

      // If not authenticated, redirect to login
      if (!authStatus) {
        window.location.href = '/login';
      }
    };

    checkAuth();
  }, []);

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render children (redirect will happen)
  if (!authenticated) {
    return null;
  }

  // If authenticated, render the protected content
  return <>{children}</>;
};

export default AuthGuard;
