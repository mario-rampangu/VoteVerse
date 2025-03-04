import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Row, Col, ProgressBar, Badge, Spinner } from 'react-bootstrap';
import { pollApi, Poll } from '../services/api';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaCheck, FaClock } from 'react-icons/fa';

// Define PollOption interface locally to add the id property
interface PollOption {
  _id: string;
  id?: string;  // Add optional id property
  text: string;
  vote_count: number;
  image_url?: string;
}

// Extend Poll interface to include both _id and id
interface ExtendedPoll extends Poll {
  id?: string;  // Add optional id property
}

const PollDetails: React.FC = () => {
  const { pollId } = useParams<{ pollId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [poll, setPoll] = useState<ExtendedPoll | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentTime] = useState(new Date());
  
  useEffect(() => {
    // Add more detailed logging for the pollId parameter
    console.log('[PollDetails] pollId parameter:', {
      pollId,
      type: typeof pollId,
      isUndefined: pollId === undefined,
      isUndefinedString: pollId === "undefined",
      isEmpty: pollId === "",
      route: window.location.pathname
    });
    
    // Check if pollId exists and is not the string "undefined"
    if (pollId && pollId !== "undefined") {
      fetchPollDetails();
    } else {
      setLoading(false);
      toast.error('Invalid Poll ID');
      navigate('/polls');
    }
  }, [pollId, navigate]);
  
  const fetchPollDetails = async () => {
    try {
      console.log('[PollDetails] Fetching poll details for ID:', pollId);
      setLoading(true);
      
      if (!pollId || pollId === 'undefined') {
        throw new Error('Invalid poll ID');
      }
      
      const response = await pollApi.get(pollId);
      const pollData = response.data;
      
      // Process poll to ensure consistent ID format
      if (!pollData._id && pollData.id) {
        pollData._id = pollData.id;
      } else if (!pollData.id && pollData._id) {
        pollData.id = pollData._id;
      }
      
      // Also ensure options have consistent IDs
      if (pollData.options && Array.isArray(pollData.options)) {
        pollData.options = pollData.options.map((option: any) => {
          if (!option._id && option.id) {
            option._id = option.id;
          } else if (!option.id && option._id) {
            option.id = option._id;
          }
          return option;
        });
      }
      
      console.log('[PollDetails] Poll data received:', {
        poll: pollData,
        _id: pollData._id,
        id: pollData.id,
        options: pollData.options
      });
      
      setPoll(pollData);
      
      // If user has already voted, select that option
      if (pollData.user_vote) {
        setSelectedOption(pollData.user_vote);
      }
      
      setLoading(false);
    } catch (error: any) {
      console.error('[PollDetails] Error fetching poll details:', error);
      toast.error('Failed to fetch poll details');
    } finally {
      setLoading(false);
    }
  };
  
  const handleVote = async () => {
    if (!selectedOption || !poll || !pollId) return;
    
    try {
      setSubmitting(true);
      console.log(`[PollDetails] Submitting vote for poll ${pollId}, option: ${selectedOption}`);
      
      const response = await pollApi.vote(pollId, selectedOption);
      console.log('[PollDetails] Vote response:', response);
      
      toast.success('Vote submitted successfully!');
      
      // Refresh poll data to get updated vote counts
      fetchPollDetails();
    } catch (error: any) {
      console.error('[PollDetails] Error submitting vote:', error);
      toast.error('Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Check if poll has ended
  const isPollEnded = () => {
    if (!poll?.end_time) return false;
    return new Date(poll.end_time) < currentTime;
  };
  
  // Check if poll has started
  const isPollStarted = () => {
    if (!poll?.start_time) return true;
    return new Date(poll.start_time) <= currentTime;
  };
  
  // Calculate total votes
  const calculateTotalVotes = (): number => {
    if (!poll) return 0;
    return poll.options.reduce((sum, option) => sum + option.vote_count, 0);
  };
  
  // Format time remaining
  const formatTimeRemaining = (): string => {
    if (!poll?.end_time) return 'No end time set';
    
    const endTime = new Date(poll.end_time);
    const now = new Date();
    
    if (endTime <= now) return 'Poll has ended';
    
    const diff = endTime.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  };
  
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading poll details...</p>
      </Container>
    );
  }
  
  if (!poll) {
    return (
      <Container className="py-5">
        <Card className="shadow-sm">
          <Card.Body className="text-center">
            <h4 className="mb-3">Poll Not Found</h4>
            <p>The poll you're looking for doesn't exist or has been removed.</p>
            <Button variant="primary" onClick={() => navigate('/polls')}>
              <FaArrowLeft className="me-2" /> Back to Polls
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }
  
  const totalVotes = calculateTotalVotes();
  const ended = isPollEnded();
  const started = isPollStarted();
  const hasVoted = !!selectedOption;
  
  return (
    <Container className="py-4">
      <Button 
        variant="outline-secondary" 
        className="mb-3"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft className="me-2" /> Back
      </Button>
      
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">{poll.title}</h4>
            <div>
              {poll.visibility === 'group' && (
                <Badge bg="info" className="me-2">Group Poll</Badge>
              )}
              {!started ? (
                <Badge bg="warning">Not Started</Badge>
              ) : ended ? (
                <Badge bg="secondary">Ended</Badge>
              ) : (
                <Badge bg="success">Active</Badge>
              )}
            </div>
          </div>
        </Card.Header>
        
        <Card.Body>
          {poll.description && (
            <p className="mb-4">{poll.description}</p>
          )}
          
          <div className="mb-4">
            <div className="d-flex align-items-center mb-2">
              <FaClock className="text-muted me-2" />
              <span>
                {ended ? 'Poll ended' : !started ? 'Poll not started yet' : formatTimeRemaining() + ' remaining'}
              </span>
            </div>
            <div className="d-flex align-items-center">
              <FaCheck className="text-muted me-2" />
              <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''} total</span>
            </div>
          </div>
          
          <h5 className="mb-3">Options</h5>
          
          {poll.options.map((option) => {
            const percentage = totalVotes > 0 ? Math.round((option.vote_count / totalVotes) * 100) : 0;
            const isSelected = option._id === selectedOption;
            
            return (
              <Card 
                key={option._id} 
                className={`mb-3 ${isSelected ? 'border-primary' : ''}`}
                onClick={() => {
                  if (!ended && started && !submitting) {
                    setSelectedOption(option._id);
                  }
                }}
                style={{ cursor: !ended && started && !submitting ? 'pointer' : 'default' }}
              >
                <Card.Body>
                  <Row className="align-items-center">
                    <Col xs={12} md={6} className="mb-2 mb-md-0">
                      <div className="d-flex align-items-center">
                        {!ended && started && !submitting && (
                          <div 
                            className={`me-3 rounded-circle border ${isSelected ? 'bg-primary border-primary' : 'border-secondary'}`}
                            style={{ width: '20px', height: '20px' }}
                          />
                        )}
                        <span className={isSelected ? 'fw-bold' : ''}>{option.text}</span>
                      </div>
                    </Col>
                    <Col xs={12} md={6}>
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1 me-2">
                          <ProgressBar 
                            now={percentage} 
                            variant={isSelected ? 'primary' : 'secondary'} 
                            className="rounded-pill"
                          />
                        </div>
                        <div style={{ minWidth: '50px' }} className="text-end">
                          {percentage}%
                        </div>
                      </div>
                      <div className="small text-muted text-end mt-1">
                        {option.vote_count} vote{option.vote_count !== 1 ? 's' : ''}
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            );
          })}
          
          {!ended && started && (
            <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
              <Button 
                variant="primary" 
                disabled={!selectedOption || submitting || hasVoted}
                onClick={handleVote}
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
                    Submitting...
                  </>
                ) : hasVoted ? (
                  <>
                    <FaCheck className="me-2" />
                    Voted
                  </>
                ) : (
                  'Submit Vote'
                )}
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PollDetails;
