import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuthData } from '../../services/auth';
import { Container, Navbar, Nav, Card, Row, Col, Button, Offcanvas } from 'react-bootstrap';
import { FaUsers, FaLayerGroup, FaPoll, FaBars, FaSignOutAlt, FaChartBar } from 'react-icons/fa';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);

  const handleLogout = () => {
    clearAuthData();
    navigate('/signin');
  };

  const stats = [
    { title: 'Total Users', value: '1,234', icon: <FaUsers />, color: 'primary' },
    { title: 'Active Groups', value: '56', icon: <FaLayerGroup />, color: 'success' },
    { title: 'Active Polls', value: '89', icon: <FaPoll />, color: 'info' },
    { title: 'Total Votes', value: '12,345', icon: <FaChartBar />, color: 'warning' },
  ];

  const features = [
    {
      title: 'User Management',
      description: 'Manage user accounts and permissions',
      icon: <FaUsers className="mb-3 text-primary" size={24} />,
    },
    {
      title: 'Group Management',
      description: 'Oversee and modify group information',
      icon: <FaLayerGroup className="mb-3 text-success" size={24} />,
    },
    {
      title: 'Poll Management',
      description: 'Monitor and manage active polls',
      icon: <FaPoll className="mb-3 text-info" size={24} />,
    },
  ];

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
          <Navbar.Brand href="#home">VoteVerse Admin</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Button 
                variant="outline-light" 
                onClick={handleLogout}
                className="d-flex align-items-center gap-2"
              >
                <FaSignOutAlt /> Logout
              </Button>
            </Nav>
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
            <Nav.Link href="#users">Users</Nav.Link>
            <Nav.Link href="#groups">Groups</Nav.Link>
            <Nav.Link href="#polls">Polls</Nav.Link>
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Main Content */}
      <Container fluid className="py-3">
        {/* Stats Cards */}
        <Row className="g-3 mb-4">
          {stats.map((stat, index) => (
            <Col key={index} xs={12} sm={6} lg={3}>
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className={`text-${stat.color} h3 mb-2`}>{stat.icon}</div>
                      <h6 className="text-muted mb-1">{stat.title}</h6>
                      <h3 className="mb-0">{stat.value}</h3>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Feature Cards */}
        <Row className="g-3">
          {features.map((feature, index) => (
            <Col key={index} xs={12} md={6} lg={4}>
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center p-4">
                  {feature.icon}
                  <h5 className="mb-2">{feature.title}</h5>
                  <p className="text-muted mb-0">{feature.description}</p>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
};

export default AdminDashboard; 