import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Welcome.css';

const UserWelcome = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/signin');
      return;
    }

    // Fetch user data
    const fetchUserData = async () => {
      try {
        const response = await axios.get('http://localhost:8085/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserName(response.data.name);
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/signin');
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/signin');
  };

  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <h1>Welcome to VoteVerse, {userName}!</h1>
        <div className="welcome-actions">
          <button onClick={() => navigate('/polls')}>View Polls</button>
          <button onClick={() => navigate('/groups')}>My Groups</button>
          <button onClick={() => navigate('/profile')}>My Profile</button>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </div>
    </div>
  );
};

export default UserWelcome;
