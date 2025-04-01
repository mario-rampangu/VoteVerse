package helpers

import (
	"context"
	"os"
	"time"
	"voteverse/models"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"
)

// AuthHelper provides utility functions for authentication in tests
type AuthHelper struct {
	JWTSecret string
}

// NewAuthHelper creates a new AuthHelper
func NewAuthHelper() *AuthHelper {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "test-jwt-secret"
	}

	return &AuthHelper{
		JWTSecret: jwtSecret,
	}
}

// GenerateToken generates a JWT token for a user ID
func (h *AuthHelper) GenerateToken(userID primitive.ObjectID) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID.Hex(),
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})
	return token.SignedString([]byte(h.JWTSecret))
}

// HashPassword hashes a password for testing
func (h *AuthHelper) HashPassword(password string) (string, error) {
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashedBytes), nil
}

// CreateTestUser creates a test user with the given email and password
func (h *AuthHelper) CreateTestUser(email, password string) (primitive.ObjectID, string) {
	userID := primitive.NewObjectID()
	token, _ := h.GenerateToken(userID)
	return userID, token
}

// GetContextWithUserID creates a context with a user ID for testing
func (h *AuthHelper) GetContextWithUserID(userID primitive.ObjectID) context.Context {
	ctx := context.Background()
	return context.WithValue(ctx, "user_id", userID.Hex())
}

// CreateTestUserModel creates a test user model
func (h *AuthHelper) CreateTestUserModel(email, password string, role string) *models.User {
	hashedPassword, _ := h.HashPassword(password)
	now := primitive.NewDateTimeFromTime(time.Now())
	
	if role == "" {
		role = models.RoleUser
	}

	return &models.User{
		ID:        primitive.NewObjectID(),
		Username:  "testuser",
		Email:     email,
		Password:  hashedPassword,
		Role:      role,
		CreatedAt: now,
		UpdatedAt: now,
	}
}
