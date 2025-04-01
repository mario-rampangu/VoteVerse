package services_test

import (
	"context"
	"testing"
	"time"
	"voteverse/models"
	"voteverse/services"
	"voteverse/testutils/mocks"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestUserService(t *testing.T) {
	// Create a mock user repository
	mockUserRepo := new(mocks.UserRepository)
	
	// Create the user service with the mock repository
	userService := services.NewUserService(mockUserRepo)
	
	// Create a test context
	ctx := context.Background()
	
	t.Run("GetByID", func(t *testing.T) {
		// Create a test user
		userID := primitive.NewObjectID()
		now := primitive.NewDateTimeFromTime(time.Now())
		expectedUser := &models.User{
			ID:        userID,
			Username:  "testuser",
			Email:     "test@example.com",
			Password:  "hashedpassword",
			Role:      models.RoleUser,
			CreatedAt: now,
			UpdatedAt: now,
		}
		
		// Set up the mock repository to return the test user
		mockUserRepo.On("FindByID", ctx, userID).Return(expectedUser, nil).Once()
		
		// Call the service method
		user, err := userService.GetByID(ctx, userID)
		
		// Assert the result
		assert.NoError(t, err)
		assert.Equal(t, expectedUser, user)
		
		// Verify that the mock was called
		mockUserRepo.AssertExpectations(t)
	})
	
	t.Run("GetByEmail", func(t *testing.T) {
		// Create a test user
		email := "test@example.com"
		now := primitive.NewDateTimeFromTime(time.Now())
		expectedUser := &models.User{
			ID:        primitive.NewObjectID(),
			Username:  "testuser",
			Email:     email,
			Password:  "hashedpassword",
			Role:      models.RoleUser,
			CreatedAt: now,
			UpdatedAt: now,
		}
		
		// Set up the mock repository to return the test user
		mockUserRepo.On("FindByEmail", ctx, email).Return(expectedUser, nil).Once()
		
		// Call the service method
		user, err := userService.GetByEmail(ctx, email)
		
		// Assert the result
		assert.NoError(t, err)
		assert.Equal(t, expectedUser, user)
		
		// Verify that the mock was called
		mockUserRepo.AssertExpectations(t)
	})
	
	t.Run("Create", func(t *testing.T) {
		// Create a test user
		now := primitive.NewDateTimeFromTime(time.Now())
		user := &models.User{
			ID:        primitive.NewObjectID(),
			Username:  "testuser",
			Email:     "test@example.com",
			Password:  "hashedpassword",
			Role:      models.RoleUser,
			CreatedAt: now,
			UpdatedAt: now,
		}
		
		// Set up the mock repository to expect the Create call
		mockUserRepo.On("Create", ctx, user).Return(nil).Once()
		
		// Call the service method
		err := userService.Create(ctx, user)
		
		// Assert the result
		assert.NoError(t, err)
		
		// Verify that the mock was called
		mockUserRepo.AssertExpectations(t)
	})
	
	t.Run("Update", func(t *testing.T) {
		// Create a test user
		now := primitive.NewDateTimeFromTime(time.Now())
		user := &models.User{
			ID:        primitive.NewObjectID(),
			Username:  "testuser",
			Email:     "test@example.com",
			Password:  "hashedpassword",
			Role:      models.RoleUser,
			CreatedAt: now,
			UpdatedAt: now,
		}
		
		// Set up the mock repository to expect the Update call
		mockUserRepo.On("Update", ctx, user).Return(nil).Once()
		
		// Call the service method
		err := userService.Update(ctx, user)
		
		// Assert the result
		assert.NoError(t, err)
		
		// Verify that the mock was called
		mockUserRepo.AssertExpectations(t)
	})
	
	t.Run("Delete", func(t *testing.T) {
		// Create a test user ID
		userID := primitive.NewObjectID()
		
		// Set up the mock repository to expect the Delete call
		mockUserRepo.On("Delete", ctx, userID).Return(nil).Once()
		
		// Call the service method
		err := userService.Delete(ctx, userID)
		
		// Assert the result
		assert.NoError(t, err)
		
		// Verify that the mock was called
		mockUserRepo.AssertExpectations(t)
	})
	
	t.Run("IsFirstUser - true", func(t *testing.T) {
		// Set up the mock repository to return a count of 0 (no users)
		mockUserRepo.On("Count", ctx).Return(int64(0), nil).Once()
		
		// Call the service method
		isFirst, err := userService.IsFirstUser(ctx)
		
		// Assert the result
		assert.NoError(t, err)
		assert.True(t, isFirst)
		
		// Verify that the mock was called
		mockUserRepo.AssertExpectations(t)
	})
	
	t.Run("IsFirstUser - false", func(t *testing.T) {
		// Set up the mock repository to return a count of 1 (one user exists)
		mockUserRepo.On("Count", ctx).Return(int64(1), nil).Once()
		
		// Call the service method
		isFirst, err := userService.IsFirstUser(ctx)
		
		// Assert the result
		assert.NoError(t, err)
		assert.False(t, isFirst)
		
		// Verify that the mock was called
		mockUserRepo.AssertExpectations(t)
	})
}

func TestUserServiceWithMockFailures(t *testing.T) {
	// Create a mock user repository
	mockUserRepo := new(mocks.UserRepository)
	
	// Create the user service with the mock repository
	userService := services.NewUserService(mockUserRepo)
	
	// Create a test context
	ctx := context.Background()
	
	t.Run("GetByID - repository error", func(t *testing.T) {
		// Create a test user ID
		userID := primitive.NewObjectID()
		
		// Set up the mock repository to return an error
		expectedError := assert.AnError
		mockUserRepo.On("FindByID", ctx, userID).Return(nil, expectedError).Once()
		
		// Call the service method
		user, err := userService.GetByID(ctx, userID)
		
		// Assert the result
		assert.Error(t, err)
		assert.Equal(t, expectedError, err)
		assert.Nil(t, user)
		
		// Verify that the mock was called
		mockUserRepo.AssertExpectations(t)
	})
	
	t.Run("GetByEmail - repository error", func(t *testing.T) {
		// Create a test email
		email := "test@example.com"
		
		// Set up the mock repository to return an error
		expectedError := assert.AnError
		mockUserRepo.On("FindByEmail", ctx, email).Return(nil, expectedError).Once()
		
		// Call the service method
		user, err := userService.GetByEmail(ctx, email)
		
		// Assert the result
		assert.Error(t, err)
		assert.Equal(t, expectedError, err)
		assert.Nil(t, user)
		
		// Verify that the mock was called
		mockUserRepo.AssertExpectations(t)
	})
	
	t.Run("Create - repository error", func(t *testing.T) {
		// Create a test user
		now := primitive.NewDateTimeFromTime(time.Now())
		user := &models.User{
			ID:        primitive.NewObjectID(),
			Username:  "testuser",
			Email:     "test@example.com",
			Password:  "hashedpassword",
			Role:      models.RoleUser,
			CreatedAt: now,
			UpdatedAt: now,
		}
		
		// Set up the mock repository to return an error
		expectedError := assert.AnError
		mockUserRepo.On("Create", ctx, user).Return(expectedError).Once()
		
		// Call the service method
		err := userService.Create(ctx, user)
		
		// Assert the result
		assert.Error(t, err)
		assert.Equal(t, expectedError, err)
		
		// Verify that the mock was called
		mockUserRepo.AssertExpectations(t)
	})
}
