package repositories_test

import (
	"context"
	"testing"
	"time"
	"voteverse/models"
	"voteverse/repositories"
	"voteverse/testutils/helpers"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UserRepositoryTestSuite struct {
	suite.Suite
	dbHelper *helpers.DBHelper
	repo     *repositories.UserRepository
}

func (suite *UserRepositoryTestSuite) SetupSuite() {
	suite.dbHelper = helpers.NewDBHelper()
	suite.repo = repositories.NewUserRepository(suite.dbHelper.DB)
}

func (suite *UserRepositoryTestSuite) TearDownSuite() {
	suite.dbHelper.Cleanup()
}

func (suite *UserRepositoryTestSuite) SetupTest() {
	// Clear the users collection before each test
	err := suite.dbHelper.ClearCollection("users")
	assert.NoError(suite.T(), err)
}

func (suite *UserRepositoryTestSuite) TestCreateUser() {
	t := suite.T()
	ctx := context.Background()

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

	// Create the user in the database
	err := suite.repo.Create(ctx, user)
	assert.NoError(t, err)

	// Retrieve the user from the database
	retrievedUser, err := suite.repo.FindByID(ctx, user.ID)
	assert.NoError(t, err)
	assert.NotNil(t, retrievedUser)
	assert.Equal(t, user.ID, retrievedUser.ID)
	assert.Equal(t, user.Username, retrievedUser.Username)
	assert.Equal(t, user.Email, retrievedUser.Email)
	assert.Equal(t, user.Password, retrievedUser.Password)
	assert.Equal(t, user.Role, retrievedUser.Role)
}

func (suite *UserRepositoryTestSuite) TestFindByEmail() {
	t := suite.T()
	ctx := context.Background()

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

	// Create the user in the database
	err := suite.repo.Create(ctx, user)
	assert.NoError(t, err)

	// Find the user by email
	retrievedUser, err := suite.repo.FindByEmail(ctx, user.Email)
	assert.NoError(t, err)
	assert.NotNil(t, retrievedUser)
	assert.Equal(t, user.ID, retrievedUser.ID)
	assert.Equal(t, user.Email, retrievedUser.Email)

	// Try to find a non-existent user
	nonExistentUser, err := suite.repo.FindByEmail(ctx, "nonexistent@example.com")
	assert.Error(t, err)
	assert.Nil(t, nonExistentUser)
}

func (suite *UserRepositoryTestSuite) TestFindByUsername() {
	t := suite.T()
	ctx := context.Background()

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

	// Create the user in the database
	err := suite.repo.Create(ctx, user)
	assert.NoError(t, err)

	// Find the user by username
	retrievedUser, err := suite.repo.FindByUsername(ctx, user.Username)
	assert.NoError(t, err)
	assert.NotNil(t, retrievedUser)
	assert.Equal(t, user.ID, retrievedUser.ID)
	assert.Equal(t, user.Username, retrievedUser.Username)

	// Try to find a non-existent user
	nonExistentUser, err := suite.repo.FindByUsername(ctx, "nonexistentuser")
	assert.Error(t, err)
	assert.Nil(t, nonExistentUser)
}

func (suite *UserRepositoryTestSuite) TestUpdateUser() {
	t := suite.T()
	ctx := context.Background()

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

	// Create the user in the database
	err := suite.repo.Create(ctx, user)
	assert.NoError(t, err)

	// Update the user
	updatedUsername := "updateduser"
	user.Username = updatedUsername
	user.UpdatedAt = primitive.NewDateTimeFromTime(time.Now())

	err = suite.repo.Update(ctx, user)
	assert.NoError(t, err)

	// Retrieve the updated user
	retrievedUser, err := suite.repo.FindByID(ctx, user.ID)
	assert.NoError(t, err)
	assert.NotNil(t, retrievedUser)
	assert.Equal(t, updatedUsername, retrievedUser.Username)
}

func (suite *UserRepositoryTestSuite) TestDeleteUser() {
	t := suite.T()
	ctx := context.Background()

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

	// Create the user in the database
	err := suite.repo.Create(ctx, user)
	assert.NoError(t, err)

	// Delete the user
	err = suite.repo.Delete(ctx, user.ID)
	assert.NoError(t, err)

	// Try to retrieve the deleted user
	retrievedUser, err := suite.repo.FindByID(ctx, user.ID)
	assert.Error(t, err)
	assert.Nil(t, retrievedUser)
}

func (suite *UserRepositoryTestSuite) TestCount() {
	t := suite.T()
	ctx := context.Background()

	// Initially, the collection should be empty
	count, err := suite.repo.Count(ctx)
	assert.NoError(t, err)
	assert.Equal(t, int64(0), count)

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

	// Create the user in the database
	err = suite.repo.Create(ctx, user)
	assert.NoError(t, err)

	// Count should now be 1
	count, err = suite.repo.Count(ctx)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), count)

	// Create another user
	user2 := &models.User{
		ID:        primitive.NewObjectID(),
		Username:  "testuser2",
		Email:     "test2@example.com",
		Password:  "hashedpassword2",
		Role:      models.RoleUser,
		CreatedAt: now,
		UpdatedAt: now,
	}

	// Create the second user in the database
	err = suite.repo.Create(ctx, user2)
	assert.NoError(t, err)

	// Count should now be 2
	count, err = suite.repo.Count(ctx)
	assert.NoError(t, err)
	assert.Equal(t, int64(2), count)
}

func TestUserRepositoryTestSuite(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration tests in short mode")
	}
	suite.Run(t, new(UserRepositoryTestSuite))
}
