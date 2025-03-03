import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { commentApi, Comment, Poll, PollOption } from '../services/api';
import wsService from '../services/websocket';
import {
  Button,
  Card,
  Container,
  Form,
  Modal,
  Spinner,
  ListGroup,
  ButtonGroup,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import Layout from './common/Layout';
import { fetchPollsForGroup, votePoll } from '../services/api';

const PollList: React.FC = () => {
  const { groupId } = useParams<{ groupId?: string }>();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    options: ['', ''],
    group_id: groupId || '',
  });

  const fetchPolls = async () => {
    try {
      const response = await fetchPollsForGroup(groupId || '');
      setPolls(response.data || []);
    } catch (error) {
      console.error('Error fetching polls:', error);
      toast.error('Failed to fetch polls');
      setPolls([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePollUpdate = (data: Poll) => {
    setPolls(currentPolls => {
      const updatedPolls = [...currentPolls];
      const index = updatedPolls.findIndex(p => p._id === data._id);
      if (index !== -1) {
        updatedPolls[index] = { ...updatedPolls[index], ...data };
      } else {
        updatedPolls.push(data);
      }
      return updatedPolls;
    });
  };

  const handleVoteUpdate = (data: { poll_id: string; option: PollOption }) => {
    setPolls(currentPolls => {
      const updatedPolls = [...currentPolls];
      const index = updatedPolls.findIndex(p => p._id === data.poll_id);
      if (index !== -1) {
        const updatedPoll = { ...updatedPolls[index] };
        const optionIndex = updatedPoll.options.findIndex(opt => opt._id === data.option._id);
        if (optionIndex !== -1) {
          updatedPoll.options[optionIndex] = data.option;
        }
        updatedPolls[index] = updatedPoll;
      }
      return updatedPolls;
    });
  };

  useEffect(() => {
    const connectWebSocket = async () => {
      if (!groupId) return;

      try {
        await wsService.connect();
        wsService.send({ type: 'join_group', group_id: groupId });
        
        wsService.subscribe('poll_update', handlePollUpdate);
        wsService.subscribe('vote_update', handleVoteUpdate);
        
        await fetchPolls();
      } catch (error) {
        console.error('WebSocket connection error:', error);
        toast.error('Failed to connect to real-time updates');
        await fetchPolls();
      }
    };

    connectWebSocket();

    return () => {
      if (groupId) {
        wsService.send({ type: 'leave_group', group_id: groupId });
        wsService.unsubscribe('poll_update', handlePollUpdate);
        wsService.unsubscribe('vote_update', handleVoteUpdate);
        wsService.disconnect();
      }
    };
  }, [groupId]);

  const handleShowComments = async (poll: Poll) => {
    setSelectedPoll(poll);
    try {
      const response = await commentApi.list(poll._id);
      setComments(response.data);
      setShowCommentsModal(true);
    } catch (error) {
      toast.error('Failed to fetch comments');
    }
  };

  const handleAddComment = async () => {
    if (!selectedPoll || !newComment.trim()) return;

    try {
      await commentApi.create(selectedPoll._id, newComment);
      setNewComment('');
      toast.success('Comment added successfully');
      // Refresh comments
      const response = await commentApi.list(selectedPoll._id);
      setComments(response.data);
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleVote = async (pollId: string, option: string) => {
    try {
      await votePoll(pollId, option);
      toast.success('Vote recorded successfully');
      await fetchPolls(); // Refresh polls to get updated vote counts
    } catch (error) {
      toast.error('Failed to record vote');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container className="py-4">
        <h1 className="text-3xl font-bold mb-8">Polls</h1>
        {polls.length === 0 ? (
          <div className="text-center text-gray-500">
            No polls available in this group yet.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {polls.map((poll) => (
              <div
                key={poll._id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <h2 className="text-xl font-semibold mb-4">{poll.title}</h2>
                <p className="text-gray-600 mb-4">{poll.description}</p>
                <div className="space-y-2">
                  {poll.options.map((option) => (
                    <div
                      key={option._id}
                      className="flex justify-between items-center bg-gray-50 p-2 rounded"
                    >
                      <span>{option.text}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-500 font-medium">
                          {option.vote_count} votes
                        </span>
                        <Button
                          variant={poll.user_vote === option._id ? 'success' : 'outline-primary'}
                          size="sm"
                          onClick={() => handleVote(poll._id, option._id)}
                        >
                          {poll.user_vote === option._id ? 'Voted' : 'Vote'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => handleShowComments(poll)}
                  >
                    View Comments
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comments Modal */}
        <Modal show={showCommentsModal} onHide={() => setShowCommentsModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Comments</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <ListGroup className="mb-3">
              {comments.map((comment) => (
                <ListGroup.Item
                  key={comment._id}
                  className="d-flex justify-content-between align-items-start"
                >
                  <div>
                    <div className="fw-bold">{comment.user.username}</div>
                    {comment.text}
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
            <Form.Group>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <Button
                variant="primary"
                className="mt-2"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
              >
                Add Comment
              </Button>
            </Form.Group>
          </Modal.Body>
        </Modal>
      </Container>
    </Layout>
  );
};

export default PollList; 