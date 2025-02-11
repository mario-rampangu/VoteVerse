import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Welcome.css';

const AdminWelcome = () => {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPolls: 0,
    activeGroups: 0
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'admin') {
      navigate('/signin');
      return;
    }

    // Fetch admin data and statistics
    const fetchAdminData = async () => {
      try {
        const [profileRes, statsRes] = await Promise.all([
          axios.get('http://localhost:8085/api/admin/profile', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:8085/api/admin/stats', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setAdminName(profileRes.data.name);
        setStats(statsRes.data);
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/signin');
      }
    };

    fetchAdminData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/signin');
  };

  return (
    <div className="welcome-container admin">
      <div className="welcome-content">
        <h1>Admin Dashboard</h1>
        <p className="admin-greeting">Welcome, {adminName}</p>
        
        <div className="stats-grid">
          <div className="stat-box">
            <h3>Total Users</h3>
            <p>{stats.totalUsers}</p>
          </div>
          <div className="stat-box">
            <h3>Total Polls</h3>
            <p>{stats.totalPolls}</p>
          </div>
          <div className="stat-box">
            <h3>Active Groups</h3>
            <p>{stats.activeGroups}</p>
          </div>
        </div>

        <div className="welcome-actions">
          <button onClick={() => navigate('/admin/users')}>Manage Users</button>
          <button onClick={() => navigate('/admin/polls')}>Manage Polls</button>
          <button onClick={() => navigate('/admin/groups')}>Manage Groups</button>
          <button onClick={() => navigate('/admin/settings')}>System Settings</button>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </div>
    </div>
  );
};

export default AdminWelcome;
