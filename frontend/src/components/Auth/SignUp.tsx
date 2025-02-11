import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup, saveAuthData } from '../../services/auth';
import './Auth.css';

interface ErrorDetails {
  message?: string;
  details?: {
    message?: string;
    requirements?: {
      username?: string;
      email?: string;
      password?: string;
    };
  };
}

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | ErrorDetails>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error
    setError('');

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await signup(
        formData.username,
        formData.email,
        formData.password
      );

      // Save auth data
      saveAuthData(response);

      // Redirect based on user role
      if (response.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Signup error:', err.response?.data);
      if (err.response?.data) {
        setError(err.response.data);
      } else {
        setError('Error creating account. Please try again.');
      }
    }
  };

  const renderError = () => {
    if (!error) return null;

    if (typeof error === 'string') {
      return <div className="error-message">{error}</div>;
    }

    const errorObj = error as ErrorDetails;
    return (
      <div className="error-message">
        {errorObj.details?.message || errorObj.message || 'Validation error'}
        {errorObj.details?.requirements && (
          <ul>
            {Object.entries(errorObj.details.requirements).map(([key, value]) => (
              <li key={key}>{`${key}: ${value}`}</li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Create VoteVerse Account</h2>
        {renderError()}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
              minLength={3}
            />
          </div>
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
              placeholder="Password (min. 6 characters)"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="auth-button">Sign Up</button>
        </form>
        <p className="auth-link">
          Already have an account? <span onClick={() => navigate('/signin')}>Sign In</span>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
