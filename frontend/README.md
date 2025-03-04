# VoteVerse Frontend

A modern voting platform frontend built with React, TypeScript, and TailwindCSS.

## Tech Stack

- React 18
- TypeScript 5
- TailwindCSS
- Shadcn UI Components
- Axios for API calls
- WebSocket for real-time updates
- React Router for navigation
- React Query for data fetching
- React Hook Form for form handling

## Features Implemented

### Authentication
- [x] User signup with validation
- [x] User signin with JWT
- [x] Protected routes
- [x] Persistent authentication
- [x] Automatic token refresh
- [x] Logout functionality

### Dashboard
- [x] User dashboard with statistics
- [x] Recent polls display
- [x] Active polls count
- [x] Total votes tracking
- [x] Real-time updates

### Groups
- [x] Create groups
- [x] List user's groups
- [x] Search groups
- [x] Join groups
- [x] Group details view
- [x] Group member list

### Polls
- [x] Create polls (public/group)
- [x] List polls (all/group-specific)
- [x] Vote on polls
- [x] Real-time vote updates
- [x] Poll details view
- [x] Vote statistics
- [x] Poll sharing

### Comments
- [x] Add comments to polls
- [x] List comments
- [x] Delete own comments
- [x] Real-time comment updates

### UI/UX
- [x] Responsive design
- [x] Dark/Light mode
- [x] Loading states
- [x] Error handling
- [x] Toast notifications
- [x] Form validation
- [x] Accessibility features

## Pending Features

### Authentication
- [ ] Social login integration
- [ ] Password reset
- [ ] Email verification
- [ ] Profile settings
- [ ] Account deletion

### Dashboard
- [ ] Customizable dashboard layout
- [ ] Advanced analytics
- [ ] Export data functionality
- [ ] Activity timeline
- [ ] Notification center

### Groups
- [ ] Leave group functionality
- [ ] Update group settings
- [ ] Delete groups
- [ ] Group roles management
- [ ] Group invitations
- [ ] Group chat

### Polls
- [ ] Edit polls
- [ ] Delete polls
- [ ] Poll templates
- [ ] Advanced poll types
- [ ] Poll scheduling
- [ ] Poll result visualization
- [ ] Poll embedding

### Comments
- [ ] Edit comments
- [ ] Rich text formatting
- [ ] Comment reactions
- [ ] Comment threading
- [ ] Comment moderation

### UI/UX
- [ ] Animations and transitions
- [ ] Keyboard shortcuts
- [ ] Offline support
- [ ] Mobile app features
- [ ] Internationalization
- [ ] Theme customization

### General
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance optimization
- [ ] PWA support
- [ ] Documentation
- [ ] CI/CD pipeline

## Setup Instructions

1. Clone the repository
2. Copy `.env.example` to `.env` and update the values
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── services/      # API services
├── hooks/         # Custom hooks
├── context/       # React context
├── utils/         # Utility functions
├── types/         # TypeScript types
├── styles/        # Global styles
└── assets/        # Static assets
```

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
