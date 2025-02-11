# VoteVerse Backend

A modern voting platform backend built with Go, MongoDB, and WebSocket support.

## Tech Stack

- Go 1.22
- MongoDB
- Gin Web Framework
- JWT Authentication
- WebSocket (Gorilla WebSocket)
- Environment Configuration (godotenv)

## Features Implemented

### Authentication
- [x] User signup with validation
- [x] User signin with JWT
- [x] Protected routes with middleware
- [x] Role-based authorization (Admin/User)
- [x] Token-based WebSocket authentication

### Groups
- [x] Create groups
- [x] List user's groups
- [x] Search groups
- [x] Join groups
- [x] Group membership validation

### Polls
- [x] Create polls (public/group)
- [x] List polls (all/group-specific)
- [x] Vote on polls
- [x] Real-time vote updates via WebSocket
- [x] Poll visibility control (public/group)
- [x] Vote tracking and statistics

### Comments
- [x] Add comments to polls
- [x] List comments for a poll
- [x] Delete comments
- [x] Real-time comment updates

### WebSocket Integration
- [x] Real-time updates for polls
- [x] Real-time updates for votes
- [x] Real-time updates for comments
- [x] Group-based message broadcasting
- [x] Connection management and cleanup

## Pending Features

### Authentication
- [ ] Password reset functionality
- [ ] Email verification
- [ ] OAuth integration
- [ ] Session management
- [ ] Rate limiting

### Groups
- [ ] Leave group functionality
- [ ] Update group details
- [ ] Delete groups
- [ ] Group roles and permissions
- [ ] Group invitations

### Polls
- [ ] Update poll details
- [ ] Delete polls
- [ ] Poll templates
- [ ] Advanced poll types (ranked choice, multiple selection)
- [ ] Poll result analytics
- [ ] Poll scheduling

### Comments
- [ ] Edit comments
- [ ] Comment moderation
- [ ] Rich text comments
- [ ] Comment reactions

### General
- [ ] API documentation (Swagger)
- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance optimization
- [ ] Caching layer
- [ ] Logging and monitoring
- [ ] Docker containerization
- [ ] CI/CD pipeline

## Setup Instructions

1. Clone the repository
2. Copy `.env.example` to `.env` and update the values
3. Install dependencies:
   ```bash
   go mod download
   ```
4. Run the server:
   ```bash
   go run main.go
   ```

## API Documentation

The API endpoints are organized as follows:

### Public Endpoints
- POST `/api/auth/signup` - Create new user account
- POST `/api/auth/signin` - Authenticate user and get JWT

### Protected Endpoints
All protected endpoints require Bearer token authentication.

#### Groups
- GET `/api/groups` - List user's groups
- POST `/api/groups` - Create new group
- GET `/api/groups/search` - Search groups
- POST `/api/groups/:id/join` - Join a group

#### Polls
- GET `/api/polls` - List all accessible polls
- GET `/api/polls/group/:groupId` - List group-specific polls
- POST `/api/polls` - Create new poll
- POST `/api/polls/:id/vote` - Vote on a poll
- GET `/api/polls/:id` - Get poll details

#### Comments
- POST `/api/comments/poll/:pollId` - Add comment to poll
- GET `/api/comments/poll/:pollId` - List poll comments
- DELETE `/api/comments/:id` - Delete comment

#### WebSocket
- GET `/api/ws` - WebSocket connection endpoint

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 