import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuthData } from '../../services/auth';
import { groupApi, pollApi, Poll, Group, PollOption } from '../../services/api';
import { Container, Navbar, Nav, Card, Row, Col, Button, Offcanvas } from 'react-bootstrap';
import { FaPoll, FaUsers, FaComments, FaBars, FaSignOutAlt, FaBell } from 'react-icons/fa';
import { toast } from 'react-toastify';

const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activePolls: 0,
    userGroups: 0,
    notifications: 0,
    totalVotes: 0
  });
  const [recentPolls, setRecentPolls] = useState<Poll[]>([]);
  const [userGroups, setUserGroups] = useState<Group[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch user's groups
      const groupsResponse = await groupApi.list();
      setUserGroups(groupsResponse.data);

      // Fetch recent polls
      const pollsResponse = await pollApi.list();
      const polls = pollsResponse.data || [];
      setRecentPolls(polls.slice(0, 5)); // Show only 5 most recent polls

      // Calculate stats
      setStats({
        activePolls: polls.length,
        userGroups: groupsResponse.data.length,
        notifications: 0, // This would come from a notifications service
        totalVotes: polls.reduce((total: number, poll: Poll) => 
          total + poll.options.reduce((sum: number, opt: PollOption) => sum + opt.vote_count, 0), 0)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthData();
    navigate('/signin');
  };

  const activities = [
    {
      title: 'Active Polls',
      value: stats.activePolls.toString(),
      description: 'Polls you can vote on',
      icon: <FaPoll className="text-primary" />,
      color: 'primary'
    },
    {
      title: 'Your Groups',
      value: stats.userGroups.toString(),
      description: 'Groups you\'re a member of',
      icon: <FaUsers className="text-success" />,
      color: 'success'
    },
    {
      title: 'Notifications',
      value: stats.notifications.toString(),
      description: 'Unread notifications',
      icon: <FaBell className="text-warning" />,
      color: 'warning'
    },
    {
      title: 'Total Votes',
      value: stats.totalVotes.toString(),
      description: 'Across all polls',
      icon: <FaComments className="text-info" />,
      color: 'info'
    }
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
        {/* Activity Cards */}
        <Row className="g-3 mb-4">
          {activities.map((activity, index) => (
            <Col key={index} xs={12} sm={6} lg={3}>
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="h3 mb-2">{activity.icon}</div>
                      <h6 className="text-muted mb-1">{activity.title}</h6>
                      <h3 className="mb-0">{activity.value}</h3>
                      <small className="text-muted">{activity.description}</small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Recent Polls */}
        <Row className="mb-4">
          <Col xs={12}>
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Recent Polls</h5>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Poll Title</th>
                        <th>Total Votes</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPolls.map((poll) => {
                        const totalVotes = poll.options.reduce((sum, opt) => sum + opt.vote_count, 0);
                        const hasEnded = poll.end_time ? new Date(poll.end_time) < new Date() : false;
                        const hasStarted = poll.start_time ? new Date(poll.start_time) <= new Date() : true;
                        
                        return (
                          <tr key={poll._id}>
                            <td>{poll.title}</td>
                            <td>{totalVotes}</td>
                            <td>
                              {hasEnded ? (
                                <span className="badge bg-secondary">Ended</span>
                              ) : !hasStarted ? (
                                <span className="badge bg-warning">Not Started</span>
                              ) : (
                                <span className="badge bg-success">Active</span>
                              )}
                            </td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={() => navigate(`/polls/${poll._id}`)}
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {recentPolls.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted mb-0">No polls available</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* User Groups */}
        <Row>
          <Col xs={12}>
            <Card className="shadow-sm">
              <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Your Groups</h5>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => navigate('/groups')}
                >
                  View All
                </Button>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  {userGroups.slice(0, 3).map((group) => (
                    <Col key={group.id} md={4}>
                      <Card>
                        <Card.Body>
                          <h6>{group.name}</h6>
                          <p className="text-muted small mb-2">{group.description}</p>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => navigate(`/groups/${group.id}`)}
                          >
                            View Polls
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
                {userGroups.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted mb-0">You haven't joined any groups yet</p>
                    <Button 
                      variant="primary" 
                      className="mt-2"
                      onClick={() => navigate('/groups')}
                    >
                      Browse Groups
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default UserDashboard; 