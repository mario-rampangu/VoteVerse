import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signin, saveAuthData, isAuthenticated, isAdmin } from '../../services/auth';
import { toast } from 'react-toastify';
import './Auth.css';

interface LocationState {
  from?: string;
}

const SignIn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      redirectToAppropriateRoute();
    }
  }, []);

  const redirectToAppropriateRoute = () => {
    const state = location.state as LocationState;
    const returnPath = state?.from;

    if (returnPath) {
      navigate(returnPath);
    } else {
      // Get admin view mode from localStorage
      const adminViewMode = localStorage.getItem('adminViewMode');
      
      // Redirect based on role and view mode
      if (isAdmin()) {
        // If admin view mode is set to 'user', go to user dashboard
        if (adminViewMode === 'user') {
          navigate('/dashboard');
        } else {
          // Default for admins is admin dashboard
          navigate('/admin');
        }
      } else {
        navigate('/dashboard');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await signin(formData.email, formData.password);
      saveAuthData(response);
      toast.success('Successfully signed in!');
      redirectToAppropriateRoute();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'An error occurred during sign in';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Sign In</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary w-100"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
