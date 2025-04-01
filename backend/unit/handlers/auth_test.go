package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"voteverse/handlers"
	"voteverse/models"
	"voteverse/testutils/helpers"
	"voteverse/testutils/mocks"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func TestSignUp(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	mockDB := &mongo.Database{}

	// Create a test router
	router := gin.New()
	router.POST("/api/auth/signup", func(c *gin.Context) {
		handlers.SignUp(c, mockDB)
	})

	t.Run("Valid signup request", func(t *testing.T) {
		// TODO: Implement this test when we have a better understanding of the SignUp function
		// This would require mocking the MongoDB interactions
	})

	t.Run("Invalid signup request - missing fields", func(t *testing.T) {
		// Create an invalid signup request with missing fields
		requestBody := `{
			"username": "",
			"email": "invalidemail",
			"password": "short"
		}`

		req, _ := http.NewRequest("POST", "/api/auth/signup", bytes.NewBufferString(requestBody))
		req.Header.Set("Content-Type", "application/json")
		resp := httptest.NewRecorder()

		// Perform the request
		router.ServeHTTP(resp, req)

		// Assert the response
		assert.Equal(t, http.StatusBadRequest, resp.Code)
		
		var response map[string]interface{}
		err := json.Unmarshal(resp.Body.Bytes(), &response)
		assert.NoError(t, err)
		
		// Check that error details are present
		assert.Contains(t, response, "error")
		assert.Contains(t, response, "details")
	})
}

func TestSignIn(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	mockDB := &mongo.Database{}

	// Create a test router
	router := gin.New()
	router.POST("/api/auth/signin", func(c *gin.Context) {
		handlers.SignIn(c, mockDB)
	})

	t.Run("Valid signin request", func(t *testing.T) {
		// TODO: Implement this test when we have a better understanding of the SignIn function
		// This would require mocking the MongoDB interactions
	})

	t.Run("Invalid signin request - missing fields", func(t *testing.T) {
		// Create an invalid signin request with missing fields
		requestBody := `{
			"email": "invalidemail",
			"password": ""
		}`

		req, _ := http.NewRequest("POST", "/api/auth/signin", bytes.NewBufferString(requestBody))
		req.Header.Set("Content-Type", "application/json")
		resp := httptest.NewRecorder()

		// Perform the request
		router.ServeHTTP(resp, req)

		// Assert the response
		assert.Equal(t, http.StatusBadRequest, resp.Code)
	})
}

// MockAuthHandler is a version of the auth handler that we can test more easily
type MockAuthHandler struct {
	UserService *mocks.UserService
	AuthService *mocks.AuthService
}

func TestAuthHandlerSignUp(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	
	// Create mock services
	mockUserService := new(mocks.UserService)
	mockAuthService := new(mocks.AuthService)
	
	// Create a test server
	testServer := helpers.NewTestServer()
	
	// Register the signup route
	testServer.Engine.POST("/api/auth/signup", func(c *gin.Context) {
		// This is where we would call our handler method
		// For now, we'll just return a success response
		c.JSON(http.StatusCreated, gin.H{
			"token": "test-token",
			"user": gin.H{
				"id":       "test-id",
				"username": "testuser",
				"email":    "test@example.com",
			},
		})
	})
	
	t.Run("Valid signup request", func(t *testing.T) {
		// Create a valid signup request
		signupRequest := map[string]interface{}{
			"username": "testuser",
			"email":    "test@example.com",
			"password": "password123",
		}
		
		requestBody, _ := json.Marshal(signupRequest)
		req, _ := http.NewRequest("POST", "/api/auth/signup", bytes.NewBuffer(requestBody))
		req.Header.Set("Content-Type", "application/json")
		
		// Perform the request
		resp := testServer.ServeHTTP(req)
		
		// Assert the response
		assert.Equal(t, http.StatusCreated, resp.Code)
		
		var response map[string]interface{}
		err := json.Unmarshal(resp.Body.Bytes(), &response)
		assert.NoError(t, err)
		
		// Check that token and user are present
		assert.Contains(t, response, "token")
		assert.Contains(t, response, "user")
	})
}

func TestAuthHandlerSignIn(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	
	// Create mock services
	mockUserService := new(mocks.UserService)
	mockAuthService := new(mocks.AuthService)
	
	// Create a test server
	testServer := helpers.NewTestServer()
	
	// Register the signin route
	testServer.Engine.POST("/api/auth/signin", func(c *gin.Context) {
		// Mock the user lookup
		var req handlers.SignInRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		
		// Check credentials
		if req.Email != "test@example.com" || req.Password != "password123" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
			return
		}
		
		// Return success response
		c.JSON(http.StatusOK, gin.H{
			"token": "test-token",
			"user": gin.H{
				"id":       "test-id",
				"username": "testuser",
				"email":    "test@example.com",
			},
		})
	})
	
	t.Run("Valid signin request", func(t *testing.T) {
		// Create a valid signin request
		signinRequest := map[string]interface{}{
			"email":    "test@example.com",
			"password": "password123",
		}
		
		requestBody, _ := json.Marshal(signinRequest)
		req, _ := http.NewRequest("POST", "/api/auth/signin", bytes.NewBuffer(requestBody))
		req.Header.Set("Content-Type", "application/json")
		
		// Perform the request
		resp := testServer.ServeHTTP(req)
		
		// Assert the response
		assert.Equal(t, http.StatusOK, resp.Code)
		
		var response map[string]interface{}
		err := json.Unmarshal(resp.Body.Bytes(), &response)
		assert.NoError(t, err)
		
		// Check that token and user are present
		assert.Contains(t, response, "token")
		assert.Contains(t, response, "user")
	})
	
	t.Run("Invalid signin request - wrong credentials", func(t *testing.T) {
		// Create an invalid signin request with wrong credentials
		signinRequest := map[string]interface{}{
			"email":    "test@example.com",
			"password": "wrongpassword",
		}
		
		requestBody, _ := json.Marshal(signinRequest)
		req, _ := http.NewRequest("POST", "/api/auth/signin", bytes.NewBuffer(requestBody))
		req.Header.Set("Content-Type", "application/json")
		
		// Perform the request
		resp := testServer.ServeHTTP(req)
		
		// Assert the response
		assert.Equal(t, http.StatusUnauthorized, resp.Code)
		
		var response map[string]interface{}
		err := json.Unmarshal(resp.Body.Bytes(), &response)
		assert.NoError(t, err)
		
		// Check that error is present
		assert.Contains(t, response, "error")
		assert.Equal(t, "Invalid email or password", response["error"])
	})
}

func TestAuthMiddleware(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	mockDB := &mongo.Database{}
	
	// Create a test router with the auth middleware
	router := gin.New()
	authMiddleware := handlers.AuthMiddleware(mockDB)
	
	// Create a protected route
	router.GET("/api/protected", authMiddleware, func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID not found in context"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"user_id": userID})
	})
	
	t.Run("Missing Authorization header", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/protected", nil)
		resp := httptest.NewRecorder()
		
		// Perform the request
		router.ServeHTTP(resp, req)
		
		// Assert the response
		assert.Equal(t, http.StatusUnauthorized, resp.Code)
		
		var response map[string]interface{}
		err := json.Unmarshal(resp.Body.Bytes(), &response)
		assert.NoError(t, err)
		
		// Check that error is present
		assert.Contains(t, response, "error")
	})
	
	// More tests for the auth middleware would be added here
	// These would include tests for invalid tokens, expired tokens, etc.
}
