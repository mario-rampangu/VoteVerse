package mocks

import (
	"context"
	"voteverse/models"

	"github.com/stretchr/testify/mock"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// UserService is a mock implementation of the user service
type UserService struct {
	mock.Mock
}

// GetByID mocks the GetByID method
func (m *UserService) GetByID(ctx context.Context, id primitive.ObjectID) (*models.User, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

// GetByEmail mocks the GetByEmail method
func (m *UserService) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

// Create mocks the Create method
func (m *UserService) Create(ctx context.Context, user *models.User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

// Update mocks the Update method
func (m *UserService) Update(ctx context.Context, user *models.User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

// Delete mocks the Delete method
func (m *UserService) Delete(ctx context.Context, id primitive.ObjectID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

// IsFirstUser mocks the IsFirstUser method
func (m *UserService) IsFirstUser(ctx context.Context) (bool, error) {
	args := m.Called(ctx)
	return args.Bool(0), args.Error(1)
}

// AuthService is a mock implementation of the authentication service
type AuthService struct {
	mock.Mock
}

// GenerateToken mocks the GenerateToken method
func (m *AuthService) GenerateToken(userID primitive.ObjectID) (string, error) {
	args := m.Called(userID)
	return args.String(0), args.Error(1)
}

// ValidateToken mocks the ValidateToken method
func (m *AuthService) ValidateToken(token string) (primitive.ObjectID, error) {
	args := m.Called(token)
	return args.Get(0).(primitive.ObjectID), args.Error(1)
}

// HashPassword mocks the HashPassword method
func (m *AuthService) HashPassword(password string) (string, error) {
	args := m.Called(password)
	return args.String(0), args.Error(1)
}

// ComparePasswords mocks the ComparePasswords method
func (m *AuthService) ComparePasswords(hashedPassword, password string) error {
	args := m.Called(hashedPassword, password)
	return args.Error(0)
}

// GroupService is a mock implementation of the group service
type GroupService struct {
	mock.Mock
}

// GetByID mocks the GetByID method
func (m *GroupService) GetByID(ctx context.Context, id primitive.ObjectID) (*models.Group, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Group), args.Error(1)
}

// GetByUserID mocks the GetByUserID method
func (m *GroupService) GetByUserID(ctx context.Context, userID primitive.ObjectID) ([]models.Group, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).([]models.Group), args.Error(1)
}

// Create mocks the Create method
func (m *GroupService) Create(ctx context.Context, group *models.Group) error {
	args := m.Called(ctx, group)
	return args.Error(0)
}

// Update mocks the Update method
func (m *GroupService) Update(ctx context.Context, group *models.Group) error {
	args := m.Called(ctx, group)
	return args.Error(0)
}

// Delete mocks the Delete method
func (m *GroupService) Delete(ctx context.Context, id primitive.ObjectID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

// IsMember mocks the IsMember method
func (m *GroupService) IsMember(ctx context.Context, groupID, userID primitive.ObjectID) (bool, error) {
	args := m.Called(ctx, groupID, userID)
	return args.Bool(0), args.Error(1)
}

// PollService is a mock implementation of the poll service
type PollService struct {
	mock.Mock
}

// GetByID mocks the GetByID method
func (m *PollService) GetByID(ctx context.Context, id primitive.ObjectID) (*models.Poll, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Poll), args.Error(1)
}

// GetByGroupID mocks the GetByGroupID method
func (m *PollService) GetByGroupID(ctx context.Context, groupID primitive.ObjectID) ([]models.Poll, error) {
	args := m.Called(ctx, groupID)
	return args.Get(0).([]models.Poll), args.Error(1)
}

// Create mocks the Create method
func (m *PollService) Create(ctx context.Context, poll *models.Poll) error {
	args := m.Called(ctx, poll)
	return args.Error(0)
}

// Update mocks the Update method
func (m *PollService) Update(ctx context.Context, poll *models.Poll) error {
	args := m.Called(ctx, poll)
	return args.Error(0)
}

// Delete mocks the Delete method
func (m *PollService) Delete(ctx context.Context, id primitive.ObjectID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

// Vote mocks the Vote method
func (m *PollService) Vote(ctx context.Context, pollID, userID, optionID primitive.ObjectID) error {
	args := m.Called(ctx, pollID, userID, optionID)
	return args.Error(0)
}
