import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Nav, Navbar } from 'react-bootstrap';
import { clearAuthData } from '../services/auth';

const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  const handleLogout = () => {
    clearAuthData();
    navigate('/signin');
  };

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand>VoteVerse</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link onClick={() => navigate('/dashboard')}>Dashboard</Nav.Link>
              <Nav.Link onClick={() => navigate('/groups')}>Groups</Nav.Link>
            </Nav>
            <Nav>
              <Navbar.Text className="me-3">
                Welcome, {username}!
              </Navbar.Text>
              <Button variant="outline-light" onClick={handleLogout}>
                Logout
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="py-4">
        <div className="text-center">
          <h1>Welcome to VoteVerse</h1>
          <p className="lead">
            Join groups and participate in polls to make your voice heard!
          </p>
          <div className="d-grid gap-3 col-6 mx-auto">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/groups')}
            >
              Browse Groups
            </Button>
          </div>
        </div>
      </Container>
    </>
  );
};

export default UserDashboard; 