import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signin, saveAuthData, isAuthenticated, isAdmin } from '../../services/auth';
import './Auth.css';

interface LocationState {
  from?: {
    pathname: string;
  };
}

const SignIn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      redirectToAppropriateRoute();
    }
  }, []);

  const redirectToAppropriateRoute = () => {
    const locationState = location.state as LocationState;
    if (locationState?.from) {
      navigate(locationState.from.pathname);
    } else {
      // Redirect based on role
      if (isAdmin()) {
        navigate('/admin/dashboard');
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
    setError('');

    try {
      const response = await signin(formData.email, formData.password);
      
      // Save auth data
      saveAuthData(response);

      // Redirect user
      redirectToAppropriateRoute();
    } catch (err: any) {
      console.error('Signin error:', err.response?.data);
      setError(err.response?.data?.error || 'Error signing in. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Sign In to VoteVerse</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="auth-button">Sign In</button>
        </form>
        <p className="auth-link">
          Don't have an account? <span onClick={() => navigate('/signup')}>Sign Up</span>
        </p>
      </div>
    </div>
  );
};

export default SignIn;
