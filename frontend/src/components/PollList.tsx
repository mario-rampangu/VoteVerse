import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Button,
  Card,
  Container,
  Form,
  Modal,
  Spinner,
  ListGroup,
  ButtonGroup,
  Tab,
  Tabs,
  Badge,
  Alert,
  Row,
  Col
} from 'react-bootstrap';
import Layout from './common/Layout';
import { pollApi, groupApi, adminApi } from '../services/api';
import { Poll as PollType } from '../types';
import { isAdmin } from '../services/auth';
import wsService from '../services/websocket';
import { toast } from 'react-toastify';

interface PollOption {
  _id?: string;
  id?: string;
  text: string;
  vote_count: number;
  image_url?: string;
}

interface Poll {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  options: PollOption[];
  created_at: string;
  updated_at: string;
  created_by: string;
  group_id?: string;
  visibility: 'public' | 'group';
  user_vote?: string;
  end_time: string;
  is_active: boolean;
}

const PollList: React.FC = () => {
  const { groupId } = useParams<{ groupId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [isAdminView, setIsAdminView] = useState(() => {
    // Check if admin view mode is enabled in localStorage
    const savedViewMode = localStorage.getItem('adminViewMode');
    return savedViewMode === 'admin';
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [groupName, setGroupName] = useState<string>('');
  const [groupDetails, setGroupDetails] = useState<{ is_member?: boolean }>({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    options: ['', ''],
    group_id: groupId || '',
    visibility: groupId ? 'group' : 'public' as 'public' | 'group',
    end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16) // Default to 24 hours from now
  });

  const fetchPolls = async () => {
    try {
      setLoading(true);
      let response;

      if (groupId) {
        // If we're viewing polls for a specific group
        response = await pollApi.fetchForGroup(groupId);
      } else {
        // If we're viewing all polls
        if (isAdminView) {
          // Use admin API in admin view mode
          response = await adminApi.getAllPolls();
          console.log('Admin view: Polls received from API:', response.data);
        } else {
          // Use regular API in user view mode
          response = await pollApi.list();
          console.log('User view: Polls received from API:', response.data);
        }
      }

      // Ensure response.data is an array
      const pollsData = Array.isArray(response.data) ? response.data : [];

      console.log('[PollList] Polls data after processing:', {
        isArray: Array.isArray(pollsData),
        count: pollsData.length,
        groupId,
        activeTab
      });

      // Process polls to ensure they have proper IDs
      const processedPolls = pollsData.map((poll: any) => {
        console.log('[PollList] Processing poll:', {
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
          poll.options = poll.options.map((option: any) => {
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

      // Sort polls by creation date, newest first
      processedPolls.sort((a: Poll, b: Poll) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      console.log('[PollList] Valid polls after processing:', {
        count: processedPolls.length,
        sample: processedPolls.length > 0 ? processedPolls[0] : null,
        groupId,
        activeTab
      });

      setPolls(processedPolls);
    } catch (error: any) {
      console.error('[PollList] Error fetching polls:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        groupId,
        activeTab
      });
      toast.error('Failed to fetch polls');
      setPolls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[PollList] Component mounted/updated:', {
      groupId,
      activeTab,
      wsConnected
    });

    fetchPolls();

    const handleVoteUpdate = (data: { poll_id: string; option: PollOption }) => {
      console.log('[PollList] Vote update received:', data);
      setPolls(currentPolls => {
        const updatedPolls = [...currentPolls];
        const pollIndex = updatedPolls.findIndex((p: Poll) => p._id === data.poll_id);
        if (pollIndex !== -1) {
          const poll = { ...updatedPolls[pollIndex] };
          const optionIndex = poll.options.findIndex((o: PollOption) => o._id === data.option._id);
          if (optionIndex !== -1) {
            poll.options[optionIndex] = data.option;
            updatedPolls[pollIndex] = poll;
          }
        }
        return updatedPolls;
      });
    };

    const handlePollUpdate = (data: Poll) => {
      setPolls(currentPolls => {
        const index = currentPolls.findIndex((p: Poll) => p._id === data._id);
        if (index === -1) {
          return [...currentPolls, data];
        }
        const updatedPolls = [...currentPolls];
        updatedPolls[index] = data;
        return updatedPolls;
      });
    };

    // Setup WebSocket connection
    const setupWebSocket = () => {
      console.log('[PollList] Setting up WebSocket connection');
      const socket = wsService.connect();
      if (socket) {
        socket.onopen = () => {
          console.log('[PollList] WebSocket connected, joining group:', groupId);
          setWsConnected(true);

          // Join group channel if in a group
          if (groupId) {
            console.log('[PollList] Sending join_group message:', groupId);
            wsService.send({
              type: 'join_group',
              data: { group_id: groupId }
            });
          }
        };

        socket.onclose = () => {
          console.log('[PollList] WebSocket disconnected');
          setWsConnected(false);
        };

        wsService.on('pollUpdate', handlePollUpdate);
        wsService.on('voteUpdate', handleVoteUpdate);
      } else {
        console.warn('[PollList] Failed to establish WebSocket connection');
      }
    };

    setupWebSocket();

    // Cleanup function
    return () => {
      console.log('[PollList] Component cleanup');
      if (groupId && wsService.isConnected()) {
        console.log('[PollList] Leaving group:', groupId);
        wsService.send({
          type: 'leave_group',
          data: { group_id: groupId }
        });
      }
      wsService.off('pollUpdate', handlePollUpdate);
      wsService.off('voteUpdate', handleVoteUpdate);
      wsService.disconnect();
      setWsConnected(false);
    };
  }, [groupId, isAdminView]);

  // Fetch group name if groupId is provided
  useEffect(() => {
    if (groupId) {
      const fetchGroupName = async () => {
        try {
          const response = await groupApi.get(groupId);
          setGroupName(response.name || 'Group Polls');
          setGroupDetails({ is_member: response.is_member });
        } catch (error) {
          console.error('Error fetching group details:', error);
          setGroupName('Group Polls');
        }
      };

      fetchGroupName();
    }
  }, [groupId]);

  const handleVote = async (pollId: string, optionId: string) => {
    try {
      // Validate inputs
      if (!pollId || !optionId) {
        console.error('[PollList] Invalid poll ID or option ID:', { pollId, optionId });
        toast.error('Invalid poll or option');
        return;
      }

      console.log('[PollList] Voting on poll:', { pollId, optionId });

      // Find the poll in the current state
      const poll = polls.find((p: Poll) =>
        (p._id === pollId || p.id === pollId)
      );

      if (!poll) {
        console.error('[PollList] Poll not found:', pollId);
        toast.error('Poll not found');
        return;
      }

      // Check if user has already voted
      if (poll.user_vote) {
        console.error('[PollList] User has already voted:', { pollId, userVote: poll.user_vote });
        toast.error('You have already voted on this poll');
        return;
      }

      // Check if poll is active
      if (!poll.is_active) {
        console.error('[PollList] Poll is not active:', pollId);
        toast.error('This poll has ended');
        return;
      }

      // Check if poll has ended based on end_time
      const now = new Date();
      const endTime = new Date(poll.end_time);
      if (now > endTime) {
        console.error('[PollList] Poll has ended:', { pollId, endTime, now });
        toast.error('This poll has ended');

        // Update poll status locally
        setPolls(currentPolls => {
          return currentPolls.map((p: Poll) => {
            if (p._id === pollId || p.id === pollId) {
              return { ...p, is_active: false };
            }
            return p;
          });
        });
        return;
      }

      // Log the poll and its options for debugging
      console.log('[PollList] Poll details:', {
        pollId,
        title: poll.title,
        options: poll.options.map((o: PollOption) => ({ id: o._id || o.id || '', text: o.text }))
      });

      const response = await pollApi.vote(pollId, optionId);
      console.log('[PollList] Vote response:', response);
      toast.success('Vote recorded successfully!');

      // Update the local state instead of refetching
      setPolls(currentPolls => {
        return currentPolls.map((poll: Poll) => {
          if (poll._id === pollId || poll.id === pollId) {
            // Update the poll with the new vote count
            const updatedOptions = poll.options.map((option: PollOption) => {
              if (option._id === optionId || option.id === optionId) {
                return { ...option, vote_count: option.vote_count + 1 };
              }
              return option;
            });

            return { ...poll, options: updatedOptions, user_vote: optionId };
          }
          return poll;
        });
      });
    } catch (error: any) {
      console.error('[PollList] Vote failed:', {
        pollId,
        optionId,
        error,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(error.response?.data?.error || 'Failed to record vote');
    }
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate form data
      if (!formData.title.trim()) {
        toast.error('Please enter a title');
        return;
      }
      if (!formData.description.trim()) {
        toast.error('Please enter a description');
        return;
      }
      if (formData.options.some(opt => !opt.trim())) {
        toast.error('Please fill in all options');
        return;
      }

      // If we're in a group context, force the visibility to 'group' and set the group_id
      const pollData = {
        ...formData,
        visibility: groupId ? 'group' : formData.visibility,
        group_id: groupId || (formData.visibility === 'group' ? formData.group_id : undefined)
      };

      console.log('[PollList] Creating poll:', pollData);

      const response = await pollApi.create(pollData);
      console.log('[PollList] Poll created:', response);

      toast.success('Poll created successfully');
      setShowCreateModal(false);

      // Reset form data
      setFormData({
        title: '',
        description: '',
        options: ['', ''],
        group_id: groupId || '',
        visibility: groupId ? 'group' : 'public',
        end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
      });

      // Refresh polls
      fetchPolls();
    } catch (error: any) {
      console.error('[PollList] Error creating poll:', error);
      toast.error(error.message || 'Failed to create poll');
    }
  };

  const renderCreatePollModal = () => (
    <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>{groupId ? `Create Poll in ${groupName}` : 'Create New Poll'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleCreatePoll}>
          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter poll title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Enter poll description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Options</Form.Label>
            {formData.options.map((option, index) => (
              <div key={index} className="d-flex mb-2">
                <Form.Control
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...formData.options];
                    newOptions[index] = e.target.value;
                    setFormData({ ...formData, options: newOptions });
                  }}
                />
                {formData.options.length > 2 && (
                  <Button
                    variant="outline-danger"
                    className="ms-2"
                    onClick={() => {
                      const newOptions = formData.options.filter((_, i) => i !== index);
                      setFormData({ ...formData, options: newOptions });
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline-primary"
              className="mt-2"
              onClick={() => {
                setFormData({
                  ...formData,
                  options: [...formData.options, '']
                });
              }}
            >
              Add Option
            </Button>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>End Time</Form.Label>
            <Form.Control
              type="datetime-local"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            />
          </Form.Group>

          {!groupId && (
            <Form.Group className="mb-3">
              <Form.Label>Visibility</Form.Label>
              <Form.Select
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value as 'public' | 'group' })}
              >
                <option value="public">Public</option>
                <option value="group">Group</option>
              </Form.Select>
            </Form.Group>
          )}

          <div className="d-flex justify-content-end">
            <Button variant="secondary" className="me-2" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Poll
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );

  const toggleViewMode = () => {
    const newViewMode = !isAdminView;
    setIsAdminView(newViewMode);
    // Save view mode to localStorage
    localStorage.setItem('adminViewMode', newViewMode ? 'admin' : 'user');
    setLoading(true);
  };

  // Function to calculate time remaining
  const getTimeRemaining = (endTime: string) => {
    // Handle invalid or missing end time
    if (!endTime || endTime === "0001-01-01T00:00:00Z") {
      return {
        total: -1,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
      };
    }

    const total = new Date(endTime).getTime() - Date.now();
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));

    return {
      total,
      days,
      hours,
      minutes,
      seconds
    };
  };

  // Function to format the countdown
  const formatCountdown = (endTime: string) => {
    // Handle invalid or missing end time
    if (!endTime || endTime === "0001-01-01T00:00:00Z") {
      return 'No end time set';
    }

    const time = getTimeRemaining(endTime);

    if (time.total <= 0) {
      return 'Poll ended';
    }

    if (time.days > 0) {
      return `${time.days}d ${time.hours}h remaining`;
    } else if (time.hours > 0) {
      return `${time.hours}h ${time.minutes}m remaining`;
    } else {
      return `${time.minutes}m ${time.seconds}s remaining`;
    }
  };

  // Update countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      setPolls(currentPolls => {
        // Only trigger a re-render if any poll is about to change status
        const shouldUpdate = currentPolls.some(poll => {
          const timeLeft = getTimeRemaining(poll.end_time).total;
          return timeLeft <= 0 && poll.is_active;
        });

        if (shouldUpdate) {
          return [...currentPolls];
        }
        return currentPolls;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Layout>
      <Container className="py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>{groupId ? `${groupName} Polls` : 'Polls'}</h2>
          <div className="d-flex gap-2">
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              disabled={groupId ? !groupDetails.is_member : false}
            >
              Create Poll
            </Button>
          </div>
        </div>

        {/* View Mode Indicator for admins */}
        {!groupId && localStorage.getItem('user_role') === 'admin' && (
          <div className={`alert ${isAdminView ? 'alert-info' : 'alert-secondary'} mb-4`}>
            <strong>Current Mode:</strong> {isAdminView ? 'Admin View (All Polls)' : 'User View (Your Polls Only)'}
          </div>
        )}

        {!groupId && (
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => k && setActiveTab(k)}
            className="mb-4"
          >
            <Tab eventKey="all" title="All Polls">
              {/* Content will be rendered below */}
            </Tab>
            <Tab eventKey="recent" title="Recent Polls">
              {/* Content will be rendered below */}
            </Tab>
          </Tabs>
        )}

        {loading ? (
          <div className="text-center">
            <Spinner animation="border" />
          </div>
        ) : polls.length === 0 ? (
          <p className="text-center">No polls found</p>
        ) : (
          <ListGroup>
            {polls.map((poll: Poll) => {
              // Ensure we have a valid poll ID
              const pollId = poll._id || poll.id || '';

              // Debug the poll object
              console.log('[PollList] Rendering poll:', {
                pollId,
                title: poll.title,
                _id: poll._id,
                id: poll.id,
                optionsCount: poll.options.length
              });

              return (
                <ListGroup.Item key={pollId} className="mb-3">
                  <Card>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <Card.Title>{poll.title}</Card.Title>
                        {!poll.is_active && (
                          <Badge bg="secondary">Ended</Badge>
                        )}
                      </div>
                      <Card.Text>{poll.description}</Card.Text>
                      <p className={getTimeRemaining(poll.end_time).total <= 0 ? 'text-danger' : 'text-info'}>
                        {formatCountdown(poll.end_time)}
                      </p>
                      <ButtonGroup vertical className="w-100">
                        {poll.options.map((option: PollOption, index: number) => {
                          const optionId = option._id || option.id || '';
                          console.log('[PollList] Rendering option:', {
                            pollId,
                            optionId,
                            text: option.text
                          });

                          return (
                            <Button
                              key={optionId}
                              variant={poll.user_vote === optionId ? 'primary' : 'outline-primary'}
                              onClick={() => {
                                console.log('[PollList] Vote button clicked:', {
                                  pollId,
                                  optionId,
                                  currentUserVote: poll.user_vote
                                });
                                handleVote(pollId, optionId);
                              }}
                              className="mb-2 text-start"
                              disabled={!!poll.user_vote || !poll.is_active}
                            >
                              {option.text} ({option.vote_count} votes)
                            </Button>
                          );
                        })}
                      </ButtonGroup>

                      <div className="d-flex justify-content-end mt-3">
                        <Button
                          variant="info"
                          size="sm"
                          onClick={() => {
                            // Ensure we have a valid poll ID before navigation
                            if (!pollId || pollId === 'undefined') {
                              console.error('[PollList] Cannot navigate to poll details - invalid poll ID:', pollId);
                              toast.error('Invalid poll ID');
                              return;
                            }

                            console.log('[PollList] Navigating to poll details:', {
                              pollId,
                              pollObject: poll,
                              _id: poll._id,
                              id: poll.id,
                              url: `/polls/${pollId}`
                            });
                            navigate(`/polls/${pollId}`);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        )}

        {renderCreatePollModal()}
      </Container>
    </Layout>
  );
};

export default PollList;