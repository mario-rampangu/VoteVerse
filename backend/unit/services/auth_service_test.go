package services_test

import (
	"os"
	"testing"
	"time"
	"voteverse/services"

	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestAuthService(t *testing.T) {
	// Set a test JWT secret
	originalJWTSecret := os.Getenv("JWT_SECRET")
	os.Setenv("JWT_SECRET", "test-jwt-secret")
	defer os.Setenv("JWT_SECRET", originalJWTSecret)

	// Set a test JWT expiry
	originalJWTExpiry := os.Getenv("JWT_EXPIRY_HOURS")
	os.Setenv("JWT_EXPIRY_HOURS", "24")
	defer os.Setenv("JWT_EXPIRY_HOURS", originalJWTExpiry)

	authService := services.NewAuthService()

	t.Run("GenerateToken and ValidateToken", func(t *testing.T) {
		// Generate a token for a user ID
		userID := primitive.NewObjectID()
		token, err := authService.GenerateToken(userID)
		assert.NoError(t, err)
		assert.NotEmpty(t, token)

		// Validate the token
		validatedUserID, err := authService.ValidateToken(token)
		assert.NoError(t, err)
		assert.Equal(t, userID, validatedUserID)
	})

	t.Run("ValidateToken with invalid token", func(t *testing.T) {
		// Try to validate an invalid token
		_, err := authService.ValidateToken("invalid-token")
		assert.Error(t, err)
	})

	t.Run("ValidateToken with expired token", func(t *testing.T) {
		// Set a very short expiry time for testing
		os.Setenv("JWT_EXPIRY_HOURS", "0")
		shortExpiryAuthService := services.NewAuthService()

		// Generate a token that will expire immediately
		userID := primitive.NewObjectID()
		token, err := shortExpiryAuthService.GenerateToken(userID)
		assert.NoError(t, err)

		// Wait a moment to ensure the token expires
		time.Sleep(1 * time.Second)

		// Try to validate the expired token
		_, err = shortExpiryAuthService.ValidateToken(token)
		assert.Error(t, err)

		// Reset the expiry time
		os.Setenv("JWT_EXPIRY_HOURS", "24")
	})

	t.Run("HashPassword and ComparePasswords", func(t *testing.T) {
		// Hash a password
		password := "test-password"
		hashedPassword, err := authService.HashPassword(password)
		assert.NoError(t, err)
		assert.NotEqual(t, password, hashedPassword)

		// Compare the password with the hash
		err = authService.ComparePasswords(hashedPassword, password)
		assert.NoError(t, err)

		// Compare with an incorrect password
		err = authService.ComparePasswords(hashedPassword, "wrong-password")
		assert.Error(t, err)
	})
}
