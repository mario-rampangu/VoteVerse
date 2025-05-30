import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuthData, isAdmin } from '../../services/auth';
import { groupApi, pollApi, Poll, Group, PollOption } from '../../services/api';
import { Container, Navbar, Nav, Card, Row, Col, Button, Offcanvas } from 'react-bootstrap';
import { FaPoll, FaUsers, FaComments, FaBars, FaSignOutAlt, FaBell } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Layout from '../common/Layout';

const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activePolls: 0,
    userGroups: 0,
    notifications: 0,
    totalVotes: 0
  });
  const [recentPolls, setRecentPolls] = useState<Poll[]>([]);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // If user is admin and view mode is set to 'admin', redirect to admin dashboard
    if (isAdmin() && localStorage.getItem('adminViewMode') === 'admin') {
      navigate('/admin');
      return;
    }
    
    fetchDashboardData();
    
    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      // Fetch user's groups
      const groupsResponse = await groupApi.list();
      setUserGroups(groupsResponse.data);

      // Fetch recent polls
      const pollsResponse = await pollApi.list();
      const polls = pollsResponse.data || [];
      
      // Process polls to ensure they have proper IDs
      const processedPolls = polls.map((poll: Poll) => {
        console.log('[Dashboard] Processing poll:', {
          before: poll,
          hasId: !!poll.id,
          has_id: !!poll._id
        });
        
        // Ensure poll has _id
        if (!poll._id && poll.id) {
          poll._id = poll.id;
        } else if (!poll.id && poll._id) {
          poll.id = poll._id;
        }
        
        // Also ensure options have consistent IDs
        if (poll.options && Array.isArray(poll.options)) {
          poll.options = poll.options.map(option => {
            if (!option._id && option.id) {
              option._id = option.id;
            } else if (!option.id && option._id) {
              option.id = option._id;
            }
            return option;
          });
        }
        
        console.log('[Dashboard] Poll after processing:', {
          after: poll,
          _id: poll._id,
          id: poll.id
        });
        
        return poll;
      });
      
      setRecentPolls(processedPolls.slice(0, 5)); // Show only 5 most recent polls

      // Calculate stats
      setStats({
        activePolls: processedPolls.filter((poll: Poll) => {
          const hasEnded = poll.end_time ? new Date(poll.end_time) < new Date() : false;
          return !hasEnded;
        }).length,
        userGroups: groupsResponse.data.length,
        notifications: 0, // This would come from a notifications service
        totalVotes: processedPolls.reduce((total: number, poll: Poll) => 
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

  // Calculate time remaining for a poll
  const calculateTimeRemaining = (endTime: string | undefined): number => {
    if (!endTime) return 0;
    
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    return Math.max(0, diff);
  };

  // Format time remaining in a human-readable format
  const formatTimeRemaining = (timeRemaining: number): string => {
    if (timeRemaining <= 0) return 'Ended';
    
    const seconds = Math.floor((timeRemaining / 1000) % 60);
    const minutes = Math.floor((timeRemaining / (1000 * 60)) % 60);
    const hours = Math.floor((timeRemaining / (1000 * 60 * 60)) % 24);
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
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
    <Layout>
      <Container fluid className="py-3">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading dashboard data...</p>
          </div>
        ) : (
          <>
            {/* Admin View Indicator - only show if user is admin */}
            {isAdmin() && (
              <div className="alert alert-info mb-4">
                <div className="d-flex justify-content-between align-items-center">
                  <span>
                    <strong>Current Mode:</strong> User View (Your Content Only)
                  </span>
                </div>
              </div>
            )}

            {/* User Dashboard Content */}
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
                            <th>Time Left</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentPolls.map((poll) => {
                            const totalVotes = poll.options.reduce((sum, opt) => sum + opt.vote_count, 0);
                            const timeRemaining = calculateTimeRemaining(poll.end_time);
                            const hasEnded = timeRemaining <= 0;
                            const hasStarted = poll.start_time ? new Date(poll.start_time) <= currentTime : true;
                            
                            return (
                              <tr key={poll._id}>
                                <td>{poll.title}</td>
                                <td>{totalVotes}</td>
                                <td>
                                  {hasEnded ? (
                                    <span className="text-muted">Ended</span>
                                  ) : !hasStarted ? (
                                    <span className="text-warning">Not Started</span>
                                  ) : (
                                    <span className="text-success">{formatTimeRemaining(timeRemaining)}</span>
                                  )}
                                </td>
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
                                    onClick={() => {
                                      const pollId = poll._id || poll.id;
                                      console.log('[Dashboard] Navigating to poll details:', {
                                        poll,
                                        pollId,
                                        _id: poll._id,
                                        id: poll.id,
                                        url: `/polls/${pollId}`
                                      });
                                      
                                      if (!pollId) {
                                        toast.error('Invalid poll ID');
                                        return;
                                      }
                                      
                                      navigate(`/polls/${pollId}`);
                                    }}
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
          </>
        )}
      </Container>
    </Layout>
  );
};

export default UserDashboard;