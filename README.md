# VoteVerse

**VoteVerse** (by StrawHats) is a group-based polling platform. It allows users to create and join groups, post polls with questions, images, and voting options, and receive notifications when polls conclude. Built using React for the frontend and Golang for the backend, the platform emphasizes scalability, responsiveness, and real-time updates. This project demonstrates the integration of modern web technologies to enable seamless group interactions and collective decision-making.

## Members

- **Mario Vishal Rampangu**: Backend Developer.
- **Sai Kiran Patwari**: Frontend Developer.

# VoteVerse: Requirements and Features

---

## 1. Product Requirements Document (PRD)

### 1.1. Overview

**Title:** VoteVerse  
**Description:**  
VoteVerse is a community-driven polling and discussion platform. It enables users to create and join groups, launch polls with multiple options (including images), and engage in rich interactions via comments and direct messaging. Real-time updates, theme customization (dark/light modes), and scalability using a React/Golang/MongoDB stack are key pillars of the product.

### 1.2. Target Audience

- **Social Media Enthusiasts:** Users who enjoy interactive content.
- **Community Groups:** Organizations or interest groups that want to engage members.
- **Brands/Businesses:** For rapid opinion polls and market feedback.
- **Administrators:** Individuals responsible for managing user accounts, groups, and platform settings.

### 1.3. Key Features & Requirements

1. **User Management & Authentication**

   - **User Profiles:** Create, edit, and manage personal profiles.
   - **Group Accounts:** Ability to create and administer group accounts.
   - **Authentication Flows:**
     - **Signup/Login/Password Recovery:** Secure methods.
     - **Account Switching & Sign-Out:** Easy transitions between multiple accounts.
   - **Roles & Permissions:**
     - **Admin Role:** Full access to manage users, groups, and polls via an admin console.

2. **Group and Poll Management**

   - **Group Creation:** Users can create groups with descriptions.
   - **Follow/Unfollow Groups:** Manage subscriptions to group content.
   - **Home Feed:** Display polls from groups the user follows.
   - **Poll Creation:**
     - Multiple-choice options.
     - Optionally attach images.
     - Set a voting duration.
   - **Poll Lifecycle:**
     - Real-time poll voting.
     - Automatic notifications when a poll ends.

3. **Interaction & Engagement**

   - **Comments:** Users can comment on polls/posts.
   - **Messaging:** Direct messaging between users.
   - **Notifications:**
     - Poll completion alerts.
     - New comment or message notifications.

4. **Admin Console**

   - **User Management:**
     - View, enable/disable, or delete user accounts.
     - Edit user roles.
   - **Group Management:**
     - Oversee and modify group information.
   - **Poll Oversight:**
     - Delete or manage inappropriate polls.
   - **Analytics/Reports** (Optional):
     - View usage statistics, active polls, etc.

5. **Search & Navigation**

   - **Universal Search:** Find groups and posts using keywords.
   - **Sidebar Navigation:**
     - **Home:** Main feed.
     - **Account:** Manage profile, sign-out, account switching.
     - **Settings:** Toggle between dark/light themes.
     - **My Groups:** List of groups the user belongs to.
     - **Recently Viewed Groups (Optional):** Quick access to recently visited groups.

6. **UI & Theme Customization**

   - **Theme Support:** Dark and Light mode options.
   - **Consistent UI:** Polished interface with a unified color scheme.
   - **Profile Image Upload:** For user personalization.

7. **Scalability & Performance**
   - **Real-time Updates:** Ensure live polling and interactions.
   - **Tech Stack:**
     - **Frontend:** React
     - **Backend:** Golang
     - **Database:** MongoDB (document-based for flexibility and scalability)
   - **Responsive Architecture:** Designed to handle growth and high concurrent usage.

### 1.4. User Stories

- **User Registration & Management**  
  _"As a new user, I want to sign up, create a profile, and manage my account settings easily."_
- **Group Interaction**  
  _"As a user, I want to create groups and follow/unfollow groups to control the content I see."_
- **Poll Engagement**  
  _"As a user, I want to post polls with multiple options and images, set a time limit, and get notified when the poll ends."_
- **Social Interaction**  
  _"As a user, I want to comment on polls and send direct messages to interact with others."_
- **Theme Customization**  
  _"As a user, I want to switch between dark and light modes for a personalized experience."_
- **Navigation & Search**  
  _"As a user, I want to search for groups and posts and navigate the app easily using a sidebar."_
- **Admin Control**  
  _"As an admin, I want to oversee users, groups, and polls to ensure the platform remains safe and organized."_

### 1.5. Non-Functional Requirements

- **Performance:** Fast load times and real-time data synchronization.
- **Scalability:** Handle a growing number of users and content.
- **Security:** Secure authentication, data encryption, and privacy controls.
- **Responsiveness:** Mobile-friendly design that adapts to different screen sizes.
- **Role-based Access Control (RBAC):** Ensure users can only access features allowed by their role.

---

## 2. Database Design Using MongoDB

MongoDB’s document-based approach is well-suited for the flexible and interconnected data of VoteVerse. Below is an outline of the collections and sample schemas, reflecting the **Admin** role and management features.

### 2.1. Collections & Schemas

#### **Users Collection**

Each user document stores personal data, role, settings, and references to groups.

```json
{
  "_id": ObjectId,
  "username": "johndoe",
  "email": "john@example.com",
  "passwordHash": "hashed_password",
  "role": "user",             // "user" or "admin"
  "isActive": true,           // Admins can disable a user by setting this to false
  "profileImageUrl": "https://cdn.voteverse.com/profiles/johndoe.png",
  "groups": [ObjectId],       // Array of Group IDs the user is a member of
  "recentlyViewedGroups": [ObjectId], // (Optional) Array of Group IDs
  "settings": {
    "theme": "light"          // "light" or "dark"
  },
  "createdAt": ISODate("2025-01-15T08:00:00Z"),
  "updatedAt": ISODate("2025-01-15T08:00:00Z")
}

```

### **Groups Collection**

Stores group information and memberships.

```json
{
  "_id": ObjectId,
  "groupName": "Tech Enthusiasts",
  "description": "A group for discussing the latest in tech.",
  "createdBy": ObjectId,                // User ID of the group creator
  "members": [ObjectId],                // Array of User IDs who are members
  "followers": [ObjectId],              // Array of User IDs following the group
  "createdAt": ISODate("2025-01-16T10:00:00Z"),
  "updatedAt": ISODate("2025-01-16T10:00:00Z"),
  "recentlyViewedBy": [ObjectId]        // (Optional) Track users who viewed the group
}

```

### **Polls Collection**

Contains poll data including options, duration, and status.

```json
{
  "_id": ObjectId,
  "groupId": ObjectId,                  // ID of the group where the poll is posted
  "createdBy": ObjectId,                // User ID of the poll creator
  "question": "What is your favorite programming language?",
  "options": [
    {
      "optionText": "JavaScript",
      "votes": 120,
      "imageUrl": "https://cdn.voteverse.com/polls/js.png"
    },
    {
      "optionText": "Python",
      "votes": 150,
      "imageUrl": ""
    }
  ],
  "duration": 3600,                     // Duration in seconds (e.g., 1 hour)
  "startTime": ISODate("2025-01-20T12:00:00Z"),
  "endTime": ISODate("2025-01-20T13:00:00Z"),
  "isActive": true,                     // Tracks if poll is still active
  "createdAt": ISODate("2025-01-20T11:55:00Z"),
  "updatedAt": ISODate("2025-01-20T11:55:00Z")
}

```

### **Messages Collection**

Handles direct messages between users.

```json
{
  "_id": ObjectId,
  "conversationId": ObjectId,           // ID for the conversation thread
  "participants": [ObjectId],           // Array of User IDs
  "messages": [
    {
      "senderId": ObjectId,
      "messageText": "Hey, did you see the new poll?",
      "sentAt": ISODate("2025-01-21T09:00:00Z"),
      "readBy": [ObjectId]              // Array of User IDs who have read this message
    }
  ]
}


```

### **Notifications Collection**

Stores notifications for various events.

```json
{
  "_id": ObjectId,
  "userId": ObjectId,                   // Recipient User ID
  "type": "pollCompleted",              // Type of notification
  "referenceId": ObjectId,              // E.g., Poll ID for which the notification is relevant
  "message": "The poll 'Favorite Programming Language' has ended.",
  "isRead": false,
  "createdAt": ISODate("2025-01-20T13:01:00Z")
}

```

### **Comments Collection**

Stores comments linked to polls.

```json
{
  "_id": ObjectId,
  "pollId": ObjectId,                   // Reference to the Poll
  "createdBy": ObjectId,                // User ID of the commenter
  "commentText": "I love Python because of its simplicity.",
  "createdAt": ISODate("2025-01-20T12:15:00Z"),
  "updatedAt": ISODate("2025-01-20T12:15:00Z")
}

```

### 2.2. Indexing & Relationships

#### **Indexes:**

- **Users**: Index on `email` and `username` for quick lookup.
- **Groups**: Text index on `groupName` and `description` for search.
- **Polls**: Index on `groupId` and `createdAt` to optimize feed queries.
- **Comments**: Index on `pollId` for efficient comment retrieval.
- **Notifications**: Index on `userId` to quickly fetch unread notifications.

#### **Relationships:**

Use references (ObjectIds) to link:

- **Users → Groups** (membership, following).
- **Polls → Groups** (for grouping) and **Polls → Users** (creator).
- **Comments → Polls** and **Comments → Users**.
- **Messages →** Conversation threads (participants).
- **Notifications → Users** (recipient) and possibly **Polls** or **Groups** (context).

#### **Scalability Considerations:**

- **Sharding**: Use sharding on high-volume collections (e.g., Polls, Messages).
- **Aggregation**: Use MongoDB’s aggregation framework for real-time statistics (e.g., vote counts).

---

## 3. UI Color Palette

A consistent color scheme helps maintain a polished look. Here are two palettes tailored for light and dark themes:

#### **Light Mode**

| Element            | Color Name | Hex Code  | Usage                                       |
| ------------------ | ---------- | --------- | ------------------------------------------- |
| **Primary**        | Indigo     | `#3F51B5` | Buttons, active elements, links             |
| **Secondary**      | Amber      | `#FFC107` | Accents, highlights, call-to-action buttons |
| **Background**     | White      | `#FFFFFF` | Main background                             |
| **Surface**        | Light Gray | `#F5F5F5` | Cards, panels                               |
| **Text Primary**   | Dark Gray  | `#212121` | Main text                                   |
| **Text Secondary** | Gray       | `#757575` | Secondary information text                  |
| **Borders**        | Soft Gray  | `#E0E0E0` | Dividers, input borders                     |

#### **Dark Mode**

| Element            | Color Name   | Hex Code  | Usage                                        |
| ------------------ | ------------ | --------- | -------------------------------------------- |
| **Primary**        | Light Indigo | `#7986CB` | Buttons, active elements on dark background  |
| **Secondary**      | Light Amber  | `#FFD54F` | Accents, highlights, call-to-action elements |
| **Background**     | Almost Black | `#121212` | Main background                              |
| **Surface**        | Dark Gray    | `#1E1E1E` | Cards, panels                                |
| **Text Primary**   | Light Gray   | `#E0E0E0` | Main text                                    |
| **Text Secondary** | Medium Gray  | `#B0B0B0` | Secondary information text                   |
| **Borders**        | Darker Gray  | `#333333` | Dividers, input borders                      |

#### **Additional Accent Colors**

| Element     | Color Name | Hex Code  | Usage                  |
| ----------- | ---------- | --------- | ---------------------- |
| **Error**   | Red        | `#F44336` | Error messages, alerts |
| **Success** | Green      | `#4CAF50` | Success notifications  |

---

## 4. Project Structure and Implementation Guide

### 4.1. Getting Started

The project should begin with the backend implementation, as it will define the core data structures and APIs that the frontend will consume. Here's the recommended order:

#### Phase 1: Initial Setup and Planning (1-2 days)

1. Set up version control (Git)
2. Create project documentation
3. Define API endpoints and data schemas
4. Set up development environment

#### Phase 2: Backend Development (2-3 weeks)

##### Step 1: Project Structure Setup (Day 1)

```bash
backend/
├── cmd/
│   └── server/
│       └── main.go          # Application entry point
├── internal/
│   ├── config/             # Configuration management
│   │   ├── config.go       # Configuration struct definitions
│   │   └── loader.go       # Environment/file config loader
│   ├── constants/          # Application constants
│   ├── models/             # Database models
│   ├── handlers/           # HTTP request handlers
│   ├── middleware/         # HTTP middleware
│   ├── repository/         # Database operations
│   ├── services/           # Business logic
│   └── utils/              # Helper functions
├── pkg/                    # Shared packages
├── api/                    # API documentation
└── scripts/               # Development scripts
```

##### Step 2: Database Schema Definition (Days 2-3)

1. Define MongoDB schemas in `internal/models/`:

```go
// user.go
type User struct {
    ID              primitive.ObjectID `bson:"_id,omitempty"`
    Username        string            `bson:"username"`
    Email           string            `bson:"email"`
    HashedPassword  string            `bson:"passwordHash"`
    Role            string            `bson:"role"`
    IsActive        bool              `bson:"isActive"`
    CreatedAt       time.Time         `bson:"createdAt"`
    UpdatedAt       time.Time         `bson:"updatedAt"`
}

// Additional models (group.go, poll.go, etc.)
```

##### Step 3: Core Infrastructure (Days 4-5)

1. Database connection setup
2. Configuration management
3. Logger setup
4. Error handling utilities
5. Basic middleware (CORS, logging, recovery)

##### Step 4: Authentication System (Days 6-8)

1. User registration and login
2. JWT token generation and validation
3. Password hashing and verification
4. Role-based authorization middleware

##### Step 5: Core Features Implementation (Days 9-15)

1. User management APIs
2. Group management
3. Poll creation and management
4. Voting system
5. Comment system
6. Real-time notifications (WebSocket)

##### Step 6: Testing and Documentation (Days 16-20)

1. Unit tests
2. Integration tests
3. API documentation
4. Performance testing
5. Security testing

#### Phase 3: Frontend Development (3-4 weeks)

##### Step 1: Project Setup (Days 1-2)

```bash
frontend/
├── src/
│   ├── assets/            # Static assets
│   ├── components/        # Reusable components
│   │   ├── common/       # Shared components
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   └── Modal/
│   │   ├── auth/         # Authentication components
│   │   ├── groups/
│   │   └── polls/
│   ├── hooks/            # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useWebSocket.ts
│   │   └── useTheme.ts
│   ├── pages/           # Page components
│   ├── services/        # API services
│   ├── store/           # State management
│   ├── types/           # TypeScript definitions
│   └── utils/           # Helper functions
```

##### Step 2: Foundation Setup (Days 3-5)

1. Theme system implementation
2. Routing setup
3. State management configuration
4. API service setup
5. Authentication context

##### Step 3: Core Features Implementation (Days 6-20)

1. Authentication UI (Days 6-8)

   - Login form
   - Registration form
   - Password recovery
   - Profile management

2. Group Features (Days 9-12)

   - Group creation
   - Group listing
   - Group management
   - Member management

3. Poll Features (Days 13-16)

   - Poll creation
   - Voting interface
   - Results display
   - Real-time updates

4. Admin Dashboard (Days 17-20)
   - User management
   - Group oversight
   - Analytics dashboard
   - System settings

##### Step 4: Polish and Testing (Days 21-25)

1. UI/UX refinement
2. Responsive design
3. Accessibility improvements
4. Performance optimization
5. End-to-end testing

### 4.2. Development Best Practices

#### Backend Best Practices

1. Use dependency injection
2. Implement proper error handling
3. Add comprehensive logging
4. Write unit tests for critical paths
5. Use interfaces for flexibility
6. Document all public APIs
7. Implement rate limiting
8. Use proper validation

#### Frontend Best Practices

1. Implement proper code splitting
2. Use React.memo for performance
3. Implement error boundaries
4. Use TypeScript strictly
5. Follow atomic design principles
6. Implement proper loading states
7. Add error handling
8. Use proper form validation

### 4.3. Deployment Considerations

#### Backend Deployment

1. Set up CI/CD pipeline
2. Configure environment variables
3. Set up monitoring
4. Configure backup system
5. Implement health checks

#### Frontend Deployment

1. Set up build optimization
2. Configure CDN
3. Implement caching strategy
4. Set up error tracking
5. Configure analytics

### 4.4. Testing Strategy

#### Backend Testing

1. Unit tests for business logic
2. Integration tests for APIs
3. Performance testing
4. Security testing
5. Load testing

#### Frontend Testing

1. Component testing
2. Integration testing
3. End-to-end testing
4. Visual regression testing
5. Accessibility testing

This implementation plan ensures a systematic approach to building the application while maintaining code quality and following best practices. The backend-first approach allows for proper API design and testing before frontend implementation begins.

---

## 5. TECH STACK

- **Frontend:** React
- **Backend:** Golang
- **Database:** MongoDB (document-based for flexibility and scalability)
- **Authentication:** JWT

---

### 6.MONGO DB CONNECTION STRING

```bash
MONGO_URI=mongodb+srv://naveenbusiraju:eTCOiVsIiqPoNzVL@cluster0.gmx8b.mongodb.net/
```

# VoteVerse

VoteVerse is a modern voting and polling platform built with Go and MongoDB, featuring real-time updates through WebSocket connections.

## Features

- User Authentication & Authorization
- Real-time Group Polls
- Live Chat & Messaging
- User Theme Preferences
- Group Management
- Real-time Updates via WebSocket
- RESTful API
- MongoDB Integration

## Project Structure

```
backend/
├── handlers/        # HTTP and WebSocket request handlers
├── middleware/      # Authentication and request middleware
├── models/          # Data models and types
├── repositories/    # Database access layer
├── router/         # Route definitions and setup
├── services/       # Business logic layer
└── config/         # Application configuration
```

## Recent Changes

1. Improved User Management:

   - Added proper ObjectID handling in handlers
   - Enhanced password update security
   - Added theme preference support
   - Improved user statistics tracking

2. Enhanced WebSocket Implementation:

   - Structured handler with dependency injection
   - Improved connection management
   - Better error handling and logging
   - Added support for group and conversation channels

3. Improved Message System:

   - Added unread message counting
   - Enhanced conversation management
   - Improved message broadcasting

4. Code Organization:
   - Implemented proper dependency injection
   - Enhanced error handling
   - Improved logging
   - Better type safety

## API Endpoints

### Authentication

- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - User login

### Users

- GET `/api/users/me` - Get current user profile
- PUT `/api/users/me` - Update user profile
- PUT `/api/users/me/theme` - Update user theme
- GET `/api/users/me/groups` - Get user's groups
- GET `/api/users/me/stats` - Get user statistics

### Groups

- POST `/api/groups` - Create new group
- GET `/api/groups/:id` - Get group details
- PUT `/api/groups/:id` - Update group
- DELETE `/api/groups/:id` - Delete group
- POST `/api/groups/:id/join` - Join group
- POST `/api/groups/:id/leave` - Leave group
- GET `/api/groups/search` - Search groups

### WebSocket

- GET `/api/ws` - WebSocket connection endpoint

## Development Setup

1. Install dependencies:

```bash
go mod download
```

2. Set up MongoDB:

- Install MongoDB
- Create a database
- Update configuration in `config/config.yaml`

3. Run the application:

```bash
go run main.go
```

## Environment Variables

Create a `.env` file with the following variables:

```
MONGODB_URI=mongodb://localhost:27017
DB_NAME=voteverse
JWT_SECRET=your_jwt_secret
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
