import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuthData } from '../../services/auth';
import { Container, Navbar, Nav, Button, Offcanvas } from 'react-bootstrap';
import { FaBars, FaSignOutAlt } from 'react-icons/fa';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);

  const handleLogout = () => {
    clearAuthData();
    navigate('/signin');
  };

  return (
    <div className="min-vh-100 bg-light">
      {/* Navbar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container fluid>
          <Button 
            variant="outline-light" 
            className="d-lg-none me-2"
            onClick={() => setShowSidebar(true)}
          >
            <FaBars />
          </Button>
          <Navbar.Brand>VoteVerse</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link onClick={() => navigate('/dashboard')}>Dashboard</Nav.Link>
              <Nav.Link onClick={() => navigate('/polls')}>All Polls</Nav.Link>
              <Nav.Link onClick={() => navigate('/groups')}>Groups</Nav.Link>
            </Nav>
            <Button 
              variant="outline-light" 
              onClick={handleLogout}
              className="d-flex align-items-center gap-2"
            >
              <FaSignOutAlt /> Logout
            </Button>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Sidebar for mobile */}
      <Offcanvas show={showSidebar} onHide={() => setShowSidebar(false)} responsive="lg">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Nav className="flex-column">
            <Nav.Link onClick={() => navigate('/dashboard')}>Dashboard</Nav.Link>
            <Nav.Link onClick={() => navigate('/polls')}>All Polls</Nav.Link>
            <Nav.Link onClick={() => navigate('/groups')}>Groups</Nav.Link>
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Main Content */}
      <Container fluid className="py-3">
        {children}
      </Container>
    </div>
  );
};

export default Layout; 