package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"voteverse/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/inmemory"
	"golang.org/x/crypto/bcrypt"
)

// Mock MongoDB instance
func setupMockDB() *mongo.Database {
	db, _ := inmemory.NewMongoDB()
	return db.Database("testdb")
}

// Test GenerateToken function
func TestGenerateToken(t *testing.T) {
	os.Setenv("JWT_SECRET", "testsecret")
	os.Setenv("JWT_EXPIRY_HOURS", "1")

	userID := primitive.NewObjectID()
	token, err := generateToken(userID)

	assert.NoError(t, err, "Token generation should not return an error")
	assert.NotEmpty(t, token, "Generated token should not be empty")

	// Validate token
	parsedToken, err := jwt.Parse(token, func(token *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("JWT_SECRET")), nil
	})

	assert.NoError(t, err, "Token parsing should not return an error")
	assert.True(t, parsedToken.Valid, "Generated token should be valid")
}

// Test SignUp function
func TestSignUp(t *testing.T) {
	db := setupMockDB()
	router := gin.Default()
	router.POST("/signup", func(c *gin.Context) {
		SignUp(c, db)
	})

	requestBody := `{
		"username": "testuser",
		"email": "test@example.com",
		"password": "password123"
	}`

	req, _ := http.NewRequest("POST", "/signup", bytes.NewBufferString(requestBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code, "SignUp should return 201 Created")

	var response AuthResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err, "Response should be valid JSON")
	assert.NotEmpty(t, response.Token, "Token should be generated")
	assert.Equal(t, "testuser", response.User.Username, "Username should match")
}

// Test SignIn function
func TestSignIn(t *testing.T) {
	db := setupMockDB()
	usersCollection := db.Collection("users")

	// Hash password
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)

	// Insert mock user
	user := models.User{
		ID:       primitive.NewObjectID(),
		Email:    "test@example.com",
		Username: "testuser",
		Password: string(hashedPassword),
	}

	_, err := usersCollection.InsertOne(context.Background(), user)
	assert.NoError(t, err, "User should be inserted into mock DB")

	router := gin.Default()
	router.POST("/signin", func(c *gin.Context) {
		SignIn(c, db)
	})

	requestBody := `{
		"email": "test@example.com",
		"password": "password123"
	}`

	req, _ := http.NewRequest("POST", "/signin", bytes.NewBufferString(requestBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code, "SignIn should return 200 OK")

	var response AuthResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err, "Response should be valid JSON")
	assert.NotEmpty(t, response.Token, "Token should be generated")
}

// Test SignIn failure with incorrect password
func TestSignInInvalidPassword(t *testing.T) {
	db := setupMockDB()
	usersCollection := db.Collection("users")

	// Hash password
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)

	// Insert mock user
	user := models.User{
		ID:       primitive.NewObjectID(),
		Email:    "test@example.com",
		Username: "testuser",
		Password: string(hashedPassword),
	}

	_, err := usersCollection.InsertOne(context.Background(), user)
	assert.NoError(t, err, "User should be inserted into mock DB")

	router := gin.Default()
	router.POST("/signin", func(c *gin.Context) {
		SignIn(c, db)
	})

	requestBody := `{
		"email": "test@example.com",
		"password": "wrongpassword"
	}`

	req, _ := http.NewRequest("POST", "/signin", bytes.NewBufferString(requestBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code, "SignIn with wrong password should return 401 Unauthorized")
}

// Test AuthMiddleware function
func TestAuthMiddleware(t *testing.T) {
	os.Setenv("JWT_SECRET", "testsecret")

	db := setupMockDB()
	router := gin.Default()
	router.Use(AuthMiddleware(db))
	router.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "Access granted"})
	})

	// Generate a valid token
	userID := primitive.NewObjectID()
	token, _ := generateToken(userID)

	req, _ := http.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code, "Valid token should grant access")
}

// Test AuthMiddleware with invalid token
func TestAuthMiddlewareInvalidToken(t *testing.T) {
	db := setupMockDB()
	router := gin.Default()
	router.Use(AuthMiddleware(db))
	router.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "Access granted"})
	})

	req, _ := http.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer invalidtoken")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code, "Invalid token should deny access")
}
