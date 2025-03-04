import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, isAdmin, getProfile } from '../../services/auth';
import LoadingSpinner from '../common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Log the current location and path
    console.log('[ProtectedRoute] Current location:', {
      pathname: location.pathname,
      search: location.search,
      state: location.state,
      params: new URLSearchParams(location.search).toString()
    });

    const verifyAuth = async () => {
      try {
        if (!isAuthenticated()) {
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }

        // Verify token by fetching profile
        await getProfile();
        
        // Check admin requirement
        if (requiredRole === 'admin' && !isAdmin()) {
          setIsAuthorized(false);
        } else {
          setIsAuthorized(true);
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        setIsAuthorized(false);
        // Clear any invalid auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, [requiredRole]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthorized) {
    console.log('[ProtectedRoute] Not authorized, redirecting to signin');
    // Redirect to login with return path
    return (
      <Navigate
        to="/signin"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  console.log('[ProtectedRoute] Authorized, rendering children');
  return <>{children}</>;
};

export default ProtectedRoute; 