import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAdmin, clearAuthData } from '../../services/auth';
import { 
  Container, 
  Card, 
  Row, 
  Col, 
  Button, 
  Table, 
  Tabs, 
  Tab, 
  Modal, 
  Form, 
  Spinner 
} from 'react-bootstrap';
import { 
  FaUsers, 
  FaLayerGroup, 
  FaPoll, 
  FaBars, 
  FaSignOutAlt, 
  FaChartBar, 
  FaTrash, 
  FaExclamationTriangle, 
  FaExchangeAlt 
} from 'react-icons/fa';
import { 
  groupApi, 
  pollApi, 
  userApi, 
  adminApi, 
  Poll, 
  Group 
} from '../../services/api';
import { toast } from 'react-toastify';
import UserManagement from '../Admin/UserManagement';
import Layout from '../common/Layout';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdminView, setIsAdminView] = useState(() => {
    // Initialize from localStorage or default to true (admin view)
    const savedViewMode = localStorage.getItem('adminViewMode');
    return savedViewMode ? savedViewMode === 'admin' : true;
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeGroups: 0,
    activePolls: 0,
    totalVotes: 0
  });
  const [recentPolls, setRecentPolls] = useState<Poll[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [activeTab, setActiveTab] = useState('users');
  
  // Content moderation state
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
  const [showDeletePollModal, setShowDeletePollModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // If view mode is set to 'user', redirect to user dashboard
    if (localStorage.getItem('adminViewMode') === 'user') {
      navigate('/dashboard');
      return;
    }
    
    fetchDashboardData();
  }, [isAdminView, navigate]);

  const fetchDashboardData = async () => {
    try {
      // Fetch groups - use admin API or regular API based on view mode
      let groupsResponse;
      if (isAdminView) {
        groupsResponse = await adminApi.getAllGroups();
      } else {
        groupsResponse = await groupApi.list();
      }
      setAllGroups(groupsResponse.data);

      // Fetch polls - use admin API or regular API based on view mode
      let pollsResponse;
      if (isAdminView) {
        pollsResponse = await adminApi.getAllPolls({ sort: 'recent' });
      } else {
        pollsResponse = await pollApi.list();
      }
      const polls = pollsResponse.data || [];
      
      // Process polls to ensure they have proper IDs
      const processedPolls = polls.map((poll: Poll) => {
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
        
        return poll;
      });
      
      setRecentPolls(processedPolls);

      // Fetch users for the total count
      let totalUsers = 0;
      try {
        const usersResponse = await userApi.list();
        totalUsers = usersResponse.data.length;
      } catch (error) {
        console.error('Error fetching users:', error);
        // Don't show an error toast here, just log it
      }

      // Calculate stats
      setStats({
        totalUsers,
        activeGroups: groupsResponse.data.length,
        activePolls: processedPolls.filter((poll: Poll) => {
          const hasEnded = poll.end_time ? new Date(poll.end_time) < new Date() : false;
          return !hasEnded;
        }).length,
        totalVotes: processedPolls.reduce((total: number, poll: Poll) => 
          total + poll.options.reduce((sum: number, opt) => sum + opt.vote_count, 0), 0)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Content moderation functions
  const openDeleteGroupModal = (group: Group) => {
    setSelectedGroup(group);
    setDeleteReason('');
    setShowDeleteGroupModal(true);
  };
  
  const openDeletePollModal = (poll: Poll) => {
    setSelectedPoll(poll);
    setDeleteReason('');
    setShowDeletePollModal(true);
  };
  
  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    
    try {
      setSubmitting(true);
      await adminApi.deleteGroup(selectedGroup.id, deleteReason);
      toast.success('Group deleted successfully');
      setShowDeleteGroupModal(false);
      fetchDashboardData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete group');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDeletePoll = async () => {
    if (!selectedPoll) return;
    
    try {
      setSubmitting(true);
      await adminApi.deletePoll(selectedPoll._id, deleteReason);
      toast.success('Poll deleted successfully');
      setShowDeletePollModal(false);
      fetchDashboardData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete poll');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleViewMode = () => {
    const newViewMode = !isAdminView;
    setIsAdminView(newViewMode);
    // Save view mode to localStorage
    localStorage.setItem('adminViewMode', newViewMode ? 'admin' : 'user');
    setLoading(true);
  };

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
            {/* View Mode Indicator */}
            <div className="alert alert-info mb-4">
              <div className="d-flex justify-content-between align-items-center">
                <span>
                  <strong>Current Mode:</strong> {isAdminView ? 'Admin View (All Content)' : 'User View (Your Content Only)'}
                </span>
              </div>
            </div>

            {/* Stats Cards */}
            <Row className="g-3 mb-4">
              <Col xs={12} sm={6} lg={3}>
                <Card className="h-100 shadow-sm">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="text-primary h3 mb-2"><FaUsers /></div>
                        <h6 className="text-muted mb-1">Total Users</h6>
                        <h3 className="mb-0">{stats.totalUsers}</h3>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={12} sm={6} lg={3}>
                <Card className="h-100 shadow-sm">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="text-success h3 mb-2"><FaLayerGroup /></div>
                        <h6 className="text-muted mb-1">Active Groups</h6>
                        <h3 className="mb-0">{stats.activeGroups}</h3>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={12} sm={6} lg={3}>
                <Card className="h-100 shadow-sm">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="text-info h3 mb-2"><FaPoll /></div>
                        <h6 className="text-muted mb-1">Active Polls</h6>
                        <h3 className="mb-0">{stats.activePolls}</h3>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={12} sm={6} lg={3}>
                <Card className="h-100 shadow-sm">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="text-warning h3 mb-2"><FaChartBar /></div>
                        <h6 className="text-muted mb-1">Total Votes</h6>
                        <h3 className="mb-0">{stats.totalVotes}</h3>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Main Content Tabs */}
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k || 'users')}
              className="mb-4"
            >
              <Tab eventKey="users" title="User Management">
                <Card className="shadow-sm">
                  <Card.Body>
                    <UserManagement />
                  </Card.Body>
                </Card>
              </Tab>
              <Tab eventKey="polls" title="Polls">
                <Card className="shadow-sm">
                  <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">All Polls</h5>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => navigate('/polls')}
                    >
                      View All
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    <div className="table-responsive">
                      <Table hover>
                        <thead>
                          <tr>
                            <th>Poll Title</th>
                            <th>Group</th>
                            <th>Total Votes</th>
                            <th>Created</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentPolls.slice(0, 5).map((poll) => {
                            const totalVotes = poll.options.reduce((sum, opt) => sum + opt.vote_count, 0);
                            const hasEnded = poll.end_time ? new Date(poll.end_time) < new Date() : false;
                            const hasStarted = poll.start_time ? new Date(poll.start_time) <= new Date() : true;
                            
                            // Find group name
                            const group = allGroups.find(g => g.id === poll.group_id);
                            
                            return (
                              <tr key={poll._id}>
                                <td>{poll.title}</td>
                                <td>{group ? group.name : 'Public'}</td>
                                <td>{totalVotes}</td>
                                <td>{formatDate(poll.created_at)}</td>
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
                                    className="me-2"
                                    onClick={() => navigate(`/polls/${poll._id}`)}
                                  >
                                    View
                                  </Button>
                                  <Button 
                                    variant="outline-danger" 
                                    size="sm"
                                    onClick={() => openDeletePollModal(poll)}
                                  >
                                    <FaTrash />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </div>
                    {recentPolls.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-muted mb-0">No polls available</p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Tab>
              <Tab eventKey="groups" title="Groups">
                <Card className="shadow-sm">
                  <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">All Groups</h5>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => navigate('/groups')}
                    >
                      View All
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    <div className="table-responsive">
                      <Table hover>
                        <thead>
                          <tr>
                            <th>Group Name</th>
                            <th>Description</th>
                            <th>Created</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allGroups.slice(0, 5).map((group) => (
                            <tr key={group.id}>
                              <td>{group.name}</td>
                              <td>{group.description.length > 50 ? `${group.description.substring(0, 50)}...` : group.description}</td>
                              <td>{formatDate(group.created_at)}</td>
                              <td>
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  className="me-2"
                                  onClick={() => navigate(`/groups/${group.id}`)}
                                >
                                  View
                                </Button>
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  onClick={() => openDeleteGroupModal(group)}
                                >
                                  <FaTrash />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                    {allGroups.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-muted mb-0">No groups available</p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Tab>
            </Tabs>
            
            {/* Delete Group Modal */}
            <Modal show={showDeleteGroupModal} onHide={() => setShowDeleteGroupModal(false)}>
              <Modal.Header closeButton>
                <Modal.Title>
                  <FaExclamationTriangle className="text-danger me-2" />
                  Delete Group
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <p>Are you sure you want to delete the group <strong>{selectedGroup?.name}</strong>?</p>
                <p className="text-danger">This action cannot be undone and will delete all polls within this group.</p>
                <Form.Group className="mb-3">
                  <Form.Label>Reason for deletion (TOS violation)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="Specify the terms of service violation..."
                    required
                  />
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowDeleteGroupModal(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="danger" 
                  onClick={handleDeleteGroup}
                  disabled={submitting || !deleteReason.trim()}
                >
                  {submitting ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FaTrash className="me-2" /> Delete Group
                    </>
                  )}
                </Button>
              </Modal.Footer>
            </Modal>
            
            {/* Delete Poll Modal */}
            <Modal show={showDeletePollModal} onHide={() => setShowDeletePollModal(false)}>
              <Modal.Header closeButton>
                <Modal.Title>
                  <FaExclamationTriangle className="text-danger me-2" />
                  Delete Poll
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <p>Are you sure you want to delete the poll <strong>{selectedPoll?.title}</strong>?</p>
                <p className="text-danger">This action cannot be undone and will delete all votes and comments for this poll.</p>
                <Form.Group className="mb-3">
                  <Form.Label>Reason for deletion (TOS violation)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="Specify the terms of service violation..."
                    required
                  />
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowDeletePollModal(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="danger" 
                  onClick={handleDeletePoll}
                  disabled={submitting || !deleteReason.trim()}
                >
                  {submitting ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FaTrash className="me-2" /> Delete Poll
                    </>
                  )}
                </Button>
              </Modal.Footer>
            </Modal>
          </>
        )}
      </Container>
    </Layout>
  );
};

export default AdminDashboard;