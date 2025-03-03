import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Group, groupApi, adminApi } from '../services/api';
import { Button, Card, Container, Form, Modal, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import Layout from './common/Layout';
import { isAdmin } from '../services/auth';

const GroupList: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [isAdminView, setIsAdminView] = useState(() => {
    // Check if admin view mode is enabled in localStorage
    const savedViewMode = localStorage.getItem('adminViewMode');
    return savedViewMode === 'admin';
  });

  // Fetch groups on component mount
  useEffect(() => {
    fetchGroups();
  }, [isAdminView]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      let response;
      
      // Use admin API if in admin view mode
      if (isAdminView) {
        response = await adminApi.getAllGroups();
        console.log('Admin view: Groups received from API:', response.data);
      } else {
        response = await groupApi.list();
        console.log('User view: Groups received from API:', response.data);
      }
      
      // Ensure is_member is set for each group
      const processedGroups = response.data.map((group: any) => ({
        ...group,
        is_member: group.is_member === true
      }));
      
      console.log('Processed groups with is_member:', processedGroups);
      setGroups(processedGroups || []);
    } catch (error: any) {
      console.error('Error fetching groups:', error);
      toast.error(error.message || 'Failed to fetch groups');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchGroups();
      return;
    }

    try {
      setLoading(true);
      const response = await groupApi.search(searchQuery);
      console.log('Search results from API:', response.data);
      
      // Ensure is_member is set for each group
      const processedGroups = response.data.map((group: any) => ({
        ...group,
        is_member: group.is_member === true
      }));
      
      console.log('Processed search results with is_member:', processedGroups);
      setGroups(processedGroups || []);
    } catch (error: any) {
      console.error('Error searching groups:', error);
      toast.error(error.message || 'Failed to search groups');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await groupApi.create(formData);
      toast.success('Group created successfully');
      setShowCreateModal(false);
      setFormData({ name: '', description: '' });
      fetchGroups();
    } catch (error: any) {
      console.error('Error creating group:', error);
      if (error.details?.requirements) {
        // Show specific validation errors
        Object.entries(error.details.requirements).forEach(([field, message]) => {
          toast.error(`${field}: ${message}`);
        });
      } else if (error.message && error.message.includes('Failed to create group')) {
        // Check if it's a duplicate group name error
        toast.error('Group with same name already exists');
      } else {
        toast.error(error.message || 'Failed to create group');
      }
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      const updatedGroup = await groupApi.join(groupId);
      console.log('Join group response:', updatedGroup);
      toast.success('Successfully joined group');
      
      // Update the groups list with the updated group
      setGroups(groups.map(group => 
        group.id === groupId 
          ? { ...group, is_member: true } 
          : group
      ));
    } catch (error: any) {
      console.error('Error joining group:', error);
      toast.error(error.message || 'Failed to join group');
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      await groupApi.leave(groupId);
      toast.success('Successfully left group');
      
      // Update the groups list with the updated group
      setGroups(groups.map(group => 
        group.id === groupId 
          ? { ...group, is_member: false } 
          : group
      ));
    } catch (error: any) {
      console.error('Error leaving group:', error);
      toast.error(error.message || 'Failed to leave group');
    }
  };

  const toggleViewMode = () => {
    const newViewMode = !isAdminView;
    setIsAdminView(newViewMode);
    // Save view mode to localStorage
    localStorage.setItem('adminViewMode', newViewMode ? 'admin' : 'user');
    setLoading(true);
  };

  if (loading) {
    return (
      <Layout>
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
          <Spinner animation="border" />
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container className="py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Groups</h2>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            Create Group
          </Button>
        </div>

        <Form className="mb-4">
          <Form.Group className="d-flex gap-2">
            <Form.Control
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button variant="outline-primary" onClick={handleSearch}>
              Search
            </Button>
          </Form.Group>
        </Form>

        <div className="row g-4">
          {groups.map((group) => {
            console.log(`Group ${group.name} - is_member:`, group.is_member);
            const isMember = Boolean(group.is_member);
            console.log(`Group ${group.name} - isMember (converted):`, isMember);
            
            return (
              <div key={group.id} className="col-md-6 col-lg-4">
                <Card>
                  <Card.Body>
                    <Card.Title>{group.name}</Card.Title>
                    <Card.Text>{group.description}</Card.Text>
                    <div className="d-flex justify-content-between align-items-center">
                      <Button
                        variant="primary"
                        onClick={() => navigate(`/groups/${group.id}`)}
                      >
                        View Polls
                      </Button>
                      {isMember ? (
                        <div className="d-flex gap-2">
                          <Button
                            variant="success"
                            disabled
                          >
                            Joined
                          </Button>
                          <Button
                            variant="outline-danger"
                            onClick={() => handleLeaveGroup(group.id)}
                          >
                            Leave
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline-primary"
                          onClick={() => handleJoinGroup(group.id)}
                        >
                          Join Group
                        </Button>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Create Group Modal */}
        <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Create New Group</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleCreateGroup}>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter group name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Enter group description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                />
              </Form.Group>
              <div className="d-flex justify-content-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Create
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

        {groups.length === 0 && !loading && (
          <div className="text-center py-5">
            <p className="text-muted">No groups found</p>
          </div>
        )}
      </Container>
    </Layout>
  );
};

export default GroupList;