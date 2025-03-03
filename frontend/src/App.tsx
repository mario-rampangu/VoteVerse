import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './components/Auth/SignIn';
import SignUp from './components/Auth/SignUp';
import UserDashboard from './components/Dashboard/UserDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import GroupList from './components/GroupList';
import PollList from './components/PollList';
import PollDetails from './components/PollDetails';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { isAuthenticated } from './services/auth';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminDebug from './components/Debug/AdminDebug';

// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <ToastContainer position="top-right" />
      <Routes>
        {/* Public routes */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Root path redirect */}
        <Route
          path="/"
          element={
            isAuthenticated() ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />

        {/* Protected routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/debug"
          element={<AdminDebug />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/groups"
          element={
            <ProtectedRoute>
              <GroupList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/groups/:groupId"
          element={
            <ProtectedRoute>
              <PollList />
            </ProtectedRoute>
          }
        />

        {/* Poll routes */}
        <Route
          path="/polls"
          element={
            <ProtectedRoute>
              <PollList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/polls/:pollId"
          element={
            <ProtectedRoute>
              <PollDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/groups/:groupId/polls"
          element={
            <ProtectedRoute>
              <PollList />
            </ProtectedRoute>
          }
        />

        {/* Catch all route - redirect to signin */}
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
