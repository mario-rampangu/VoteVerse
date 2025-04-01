package integration_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"
	"voteverse/handlers"
	"voteverse/models"
	"voteverse/testutils/helpers"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type AuthIntegrationTestSuite struct {
	suite.Suite
	router *gin.Engine
	db     *mongo.Database
	client *mongo.Client
}

func (suite *AuthIntegrationTestSuite) SetupSuite() {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	// Get MongoDB connection string from environment or use a default for testing
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017"
	}

	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "voteverse_test"
	}

	// Connect to MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		suite.T().Fatalf("Failed to connect to MongoDB: %v", err)
	}

	// Ping the database
	err = client.Ping(ctx, nil)
	if err != nil {
		suite.T().Fatalf("Failed to ping MongoDB: %v", err)
	}

	suite.client = client
	suite.db = client.Database(dbName)

	// Create a test router
	router := gin.New()
	router.Use(gin.Recovery())

	// Register auth routes
	router.POST("/api/auth/signup", func(c *gin.Context) {
		handlers.SignUp(c, suite.db)
	})
	router.POST("/api/auth/signin", func(c *gin.Context) {
		handlers.SignIn(c, suite.db)
	})

	// Register a protected route
	authMiddleware := handlers.AuthMiddleware(suite.db)
	router.GET("/api/protected", authMiddleware, func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID not found in context"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"user_id": userID})
	})

	suite.router = router
}

func (suite *AuthIntegrationTestSuite) TearDownSuite() {
	// Drop the test database
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err := suite.db.Drop(ctx)
	if err != nil {
		suite.T().Logf("Failed to drop test database: %v", err)
	}

	// Disconnect from MongoDB
	err = suite.client.Disconnect(ctx)
	if err != nil {
		suite.T().Logf("Failed to disconnect from MongoDB: %v", err)
	}
}

func (suite *AuthIntegrationTestSuite) SetupTest() {
	// Clear the users collection before each test
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := suite.db.Collection("users").DeleteMany(ctx, bson.M{})
	if err != nil {
		suite.T().Logf("Failed to clear users collection: %v", err)
	}
}

func (suite *AuthIntegrationTestSuite) TestSignUpSignInFlow() {
	t := suite.T()

	// Step 1: Sign up a new user
	signupRequest := map[string]interface{}{
		"username": "testuser",
		"email":    "test@example.com",
		"password": "password123",
	}

	signupBody, _ := json.Marshal(signupRequest)
	req, _ := http.NewRequest("POST", "/api/auth/signup", bytes.NewBuffer(signupBody))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	suite.router.ServeHTTP(resp, req)

	// Assert the signup response
	assert.Equal(t, http.StatusCreated, resp.Code)

	var signupResponse map[string]interface{}
	err := json.Unmarshal(resp.Body.Bytes(), &signupResponse)
	assert.NoError(t, err)

	// Check that token and user are present
	assert.Contains(t, signupResponse, "token")
	assert.Contains(t, signupResponse, "user")

	// Extract the token
	token := signupResponse["token"].(string)
	assert.NotEmpty(t, token)

	// Step 2: Sign in with the created user
	signinRequest := map[string]interface{}{
		"email":    "test@example.com",
		"password": "password123",
	}

	signinBody, _ := json.Marshal(signinRequest)
	req, _ = http.NewRequest("POST", "/api/auth/signin", bytes.NewBuffer(signinBody))
	req.Header.Set("Content-Type", "application/json")
	resp = httptest.NewRecorder()

	suite.router.ServeHTTP(resp, req)

	// Assert the signin response
	assert.Equal(t, http.StatusOK, resp.Code)

	var signinResponse map[string]interface{}
	err = json.Unmarshal(resp.Body.Bytes(), &signinResponse)
	assert.NoError(t, err)

	// Check that token and user are present
	assert.Contains(t, signinResponse, "token")
	assert.Contains(t, signinResponse, "user")

	// Extract the token
	token = signinResponse["token"].(string)
	assert.NotEmpty(t, token)

	// Step 3: Access a protected route with the token
	req, _ = http.NewRequest("GET", "/api/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	resp = httptest.NewRecorder()

	suite.router.ServeHTTP(resp, req)

	// Assert the protected route response
	assert.Equal(t, http.StatusOK, resp.Code)

	var protectedResponse map[string]interface{}
	err = json.Unmarshal(resp.Body.Bytes(), &protectedResponse)
	assert.NoError(t, err)

	// Check that user_id is present
	assert.Contains(t, protectedResponse, "user_id")
}

func (suite *AuthIntegrationTestSuite) TestSignUpWithExistingEmail() {
	t := suite.T()

	// Create a user in the database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	authHelper := helpers.NewAuthHelper()
	hashedPassword, _ := authHelper.HashPassword("password123")
	now := primitive.NewDateTimeFromTime(time.Now())

	user := models.User{
		ID:        primitive.NewObjectID(),
		Username:  "existinguser",
		Email:     "existing@example.com",
		Password:  hashedPassword,
		Role:      models.RoleUser,
		CreatedAt: now,
		UpdatedAt: now,
	}

	_, err := suite.db.Collection("users").InsertOne(ctx, user)
	assert.NoError(t, err)

	// Try to sign up with the same email
	signupRequest := map[string]interface{}{
		"username": "newuser",
		"email":    "existing@example.com",
		"password": "password123",
	}

	signupBody, _ := json.Marshal(signupRequest)
	req, _ := http.NewRequest("POST", "/api/auth/signup", bytes.NewBuffer(signupBody))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	suite.router.ServeHTTP(resp, req)

	// Assert the response
	assert.Equal(t, http.StatusConflict, resp.Code)

	var response map[string]interface{}
	err = json.Unmarshal(resp.Body.Bytes(), &response)
	assert.NoError(t, err)

	// Check that error is present
	assert.Contains(t, response, "error")
}

func (suite *AuthIntegrationTestSuite) TestSignInWithInvalidCredentials() {
	t := suite.T()

	// Create a user in the database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	authHelper := helpers.NewAuthHelper()
	hashedPassword, _ := authHelper.HashPassword("password123")
	now := primitive.NewDateTimeFromTime(time.Now())

	user := models.User{
		ID:        primitive.NewObjectID(),
		Username:  "validuser",
		Email:     "valid@example.com",
		Password:  hashedPassword,
		Role:      models.RoleUser,
		CreatedAt: now,
		UpdatedAt: now,
	}

	_, err := suite.db.Collection("users").InsertOne(ctx, user)
	assert.NoError(t, err)

	// Try to sign in with wrong password
	signinRequest := map[string]interface{}{
		"email":    "valid@example.com",
		"password": "wrongpassword",
	}

	signinBody, _ := json.Marshal(signinRequest)
	req, _ := http.NewRequest("POST", "/api/auth/signin", bytes.NewBuffer(signinBody))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	suite.router.ServeHTTP(resp, req)

	// Assert the response
	assert.Equal(t, http.StatusUnauthorized, resp.Code)

	var response map[string]interface{}
	err = json.Unmarshal(resp.Body.Bytes(), &response)
	assert.NoError(t, err)

	// Check that error is present
	assert.Contains(t, response, "error")
}

func (suite *AuthIntegrationTestSuite) TestProtectedRouteWithInvalidToken() {
	t := suite.T()

	// Try to access a protected route with an invalid token
	req, _ := http.NewRequest("GET", "/api/protected", nil)
	req.Header.Set("Authorization", "Bearer invalidtoken")
	resp := httptest.NewRecorder()

	suite.router.ServeHTTP(resp, req)

	// Assert the response
	assert.Equal(t, http.StatusUnauthorized, resp.Code)

	var response map[string]interface{}
	err := json.Unmarshal(resp.Body.Bytes(), &response)
	assert.NoError(t, err)

	// Check that error is present
	assert.Contains(t, response, "error")
}

func TestAuthIntegrationTestSuite(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration tests in short mode")
	}
	suite.Run(t, new(AuthIntegrationTestSuite))
}
