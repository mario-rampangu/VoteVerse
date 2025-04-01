package mocks

import (
	"context"
	"voteverse/models"

	"github.com/stretchr/testify/mock"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// UserRepository is a mock implementation of the user repository
type UserRepository struct {
	mock.Mock
}

// FindByID mocks the FindByID method
func (m *UserRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*models.User, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

// FindByEmail mocks the FindByEmail method
func (m *UserRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

// FindByUsername mocks the FindByUsername method
func (m *UserRepository) FindByUsername(ctx context.Context, username string) (*models.User, error) {
	args := m.Called(ctx, username)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

// Create mocks the Create method
func (m *UserRepository) Create(ctx context.Context, user *models.User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

// Update mocks the Update method
func (m *UserRepository) Update(ctx context.Context, user *models.User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

// Delete mocks the Delete method
func (m *UserRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

// Count mocks the Count method
func (m *UserRepository) Count(ctx context.Context) (int64, error) {
	args := m.Called(ctx)
	return args.Get(0).(int64), args.Error(1)
}

// GroupRepository is a mock implementation of the group repository
type GroupRepository struct {
	mock.Mock
}

// FindByID mocks the FindByID method
func (m *GroupRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*models.Group, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Group), args.Error(1)
}

// FindByUserID mocks the FindByUserID method
func (m *GroupRepository) FindByUserID(ctx context.Context, userID primitive.ObjectID) ([]models.Group, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).([]models.Group), args.Error(1)
}

// Create mocks the Create method
func (m *GroupRepository) Create(ctx context.Context, group *models.Group) error {
	args := m.Called(ctx, group)
	return args.Error(0)
}

// Update mocks the Update method
func (m *GroupRepository) Update(ctx context.Context, group *models.Group) error {
	args := m.Called(ctx, group)
	return args.Error(0)
}

// Delete mocks the Delete method
func (m *GroupRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

// PollRepository is a mock implementation of the poll repository
type PollRepository struct {
	mock.Mock
}

// FindByID mocks the FindByID method
func (m *PollRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*models.Poll, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Poll), args.Error(1)
}

// FindByGroupID mocks the FindByGroupID method
func (m *PollRepository) FindByGroupID(ctx context.Context, groupID primitive.ObjectID) ([]models.Poll, error) {
	args := m.Called(ctx, groupID)
	return args.Get(0).([]models.Poll), args.Error(1)
}

// Create mocks the Create method
func (m *PollRepository) Create(ctx context.Context, poll *models.Poll) error {
	args := m.Called(ctx, poll)
	return args.Error(0)
}

// Update mocks the Update method
func (m *PollRepository) Update(ctx context.Context, poll *models.Poll) error {
	args := m.Called(ctx, poll)
	return args.Error(0)
}

// Delete mocks the Delete method
func (m *PollRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}
