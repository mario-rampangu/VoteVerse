import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Group, groupApi } from '../services/api';
import { Button, Card, Container, Form, Modal, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import Layout from './common/Layout';

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

  // Fetch groups on component mount
  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await groupApi.list();
      setGroups(response.data || []);
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
      setGroups(response.data || []);
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
      } else {
        toast.error(error.message || 'Failed to create group');
      }
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      await groupApi.join(groupId);
      toast.success('Successfully joined group');
      fetchGroups();
    } catch (error: any) {
      console.error('Error joining group:', error);
      toast.error(error.message || 'Failed to join group');
    }
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
          {groups.map((group) => (
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
                    <Button
                      variant="outline-primary"
                      onClick={() => handleJoinGroup(group.id)}
                    >
                      Join Group
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
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