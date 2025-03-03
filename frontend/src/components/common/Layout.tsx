import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuthData } from '../../services/auth';
import { Container, Navbar, Nav, Button, Offcanvas } from 'react-bootstrap';
import { FaBars, FaSignOutAlt, FaUserCog, FaUser } from 'react-icons/fa';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  
  // Get user role and admin view mode from localStorage
  const userRole = localStorage.getItem('user_role');
  const isAdminUser = userRole === 'admin';
  
  const [isAdminView, setIsAdminView] = useState(() => {
    const savedViewMode = localStorage.getItem('adminViewMode');
    return savedViewMode === 'admin';
  });

  // Set default admin view mode if not set
  useEffect(() => {
    if (isAdminUser && localStorage.getItem('adminViewMode') === null) {
      localStorage.setItem('adminViewMode', 'admin');
      setIsAdminView(true);
    }
  }, [isAdminUser]);

  // Handle user logout
  const handleLogout = () => {
    clearAuthData();
    navigate('/signin');
  };

  // Toggle between admin and user view modes
  const toggleViewMode = () => {
    const newMode = isAdminView ? 'user' : 'admin';
    localStorage.setItem('adminViewMode', newMode);
    setIsAdminView(!isAdminView);
    
    // Navigate to the appropriate dashboard
    navigate(newMode === 'admin' ? '/admin' : '/dashboard');
  };

  // Get dashboard link based on user role and view mode
  const getDashboardLink = () => {
    if (isAdminUser && isAdminView) {
      return '/admin';
    }
    return '/dashboard';
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
              <Nav.Link onClick={() => navigate(getDashboardLink())}>Dashboard</Nav.Link>
              <Nav.Link onClick={() => navigate('/polls')}>All Polls</Nav.Link>
              <Nav.Link onClick={() => navigate('/groups')}>Groups</Nav.Link>
            </Nav>
            <div className="d-flex align-items-center">
              {/* Admin View Toggle Button */}
              {isAdminUser && (
                <Button
                  variant={isAdminView ? "success" : "outline-light"}
                  onClick={toggleViewMode}
                  className="me-3 d-flex align-items-center gap-2"
                >
                  {isAdminView ? <FaUserCog /> : <FaUser />}
                  {isAdminView ? 'Admin View' : 'User View'}
                </Button>
              )}
              {/* Logout Button */}
              <Button 
                variant="outline-light" 
                onClick={handleLogout}
                className="d-flex align-items-center gap-2"
              >
                <FaSignOutAlt /> Logout
              </Button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Admin View Banner */}
      {isAdminUser && isAdminView && (
        <div className="bg-success text-white text-center py-2 mb-4">
          <strong>Admin View Mode:</strong> Viewing all content across the platform
        </div>
      )}

      {/* Mobile Sidebar */}
      <Offcanvas 
        show={showSidebar} 
        onHide={() => setShowSidebar(false)} 
        placement="start"
        className="d-lg-none"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Nav className="flex-column">
            <Nav.Link onClick={() => {
              navigate(getDashboardLink());
              setShowSidebar(false);
            }}>
              Dashboard
            </Nav.Link>
            <Nav.Link onClick={() => {
              navigate('/polls');
              setShowSidebar(false);
            }}>
              All Polls
            </Nav.Link>
            <Nav.Link onClick={() => {
              navigate('/groups');
              setShowSidebar(false);
            }}>
              Groups
            </Nav.Link>
            
            {/* Admin View Toggle Button (Mobile) */}
            {isAdminUser && (
              <Button
                variant={isAdminView ? "success" : "outline-dark"}
                onClick={toggleViewMode}
                className="mt-3 d-flex align-items-center gap-2 justify-content-center"
              >
                {isAdminView ? <FaUserCog /> : <FaUser />}
                {isAdminView ? 'Admin View' : 'User View'}
              </Button>
            )}
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