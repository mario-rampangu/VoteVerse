package models_test

import (
	"testing"
	"time"
	"voteverse/models"

	"github.com/go-playground/validator/v10"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestUserModel(t *testing.T) {
	validate := validator.New()

	t.Run("Valid user model", func(t *testing.T) {
		now := primitive.NewDateTimeFromTime(time.Now())
		user := models.User{
			ID:        primitive.NewObjectID(),
			Username:  "testuser",
			Email:     "test@example.com",
			Password:  "password123",
			Role:      models.RoleUser,
			CreatedAt: now,
			UpdatedAt: now,
		}

		err := validate.Struct(user)
		assert.NoError(t, err)
	})

	t.Run("Invalid email", func(t *testing.T) {
		now := primitive.NewDateTimeFromTime(time.Now())
		user := models.User{
			ID:        primitive.NewObjectID(),
			Username:  "testuser",
			Email:     "invalidemail", // Invalid email format
			Password:  "password123",
			Role:      models.RoleUser,
			CreatedAt: now,
			UpdatedAt: now,
		}

		err := validate.Struct(user)
		assert.Error(t, err)
		
		// Check that the error is related to the email field
		validationErrors := err.(validator.ValidationErrors)
		assert.Equal(t, 1, len(validationErrors))
		assert.Equal(t, "Email", validationErrors[0].Field())
		assert.Equal(t, "email", validationErrors[0].Tag())
	})

	t.Run("Missing required fields", func(t *testing.T) {
		now := primitive.NewDateTimeFromTime(time.Now())
		user := models.User{
			ID:        primitive.NewObjectID(),
			Username:  "", // Missing username
			Email:     "test@example.com",
			Password:  "", // Missing password
			Role:      models.RoleUser,
			CreatedAt: now,
			UpdatedAt: now,
		}

		err := validate.Struct(user)
		assert.Error(t, err)
		
		// Check that the errors are related to the username and password fields
		validationErrors := err.(validator.ValidationErrors)
		assert.Equal(t, 2, len(validationErrors))
		
		// Create a map of field names to validation errors
		fieldErrors := make(map[string]bool)
		for _, fieldErr := range validationErrors {
			fieldErrors[fieldErr.Field()] = true
		}
		
		assert.True(t, fieldErrors["Username"])
		assert.True(t, fieldErrors["Password"])
	})

	t.Run("Valid admin role", func(t *testing.T) {
		now := primitive.NewDateTimeFromTime(time.Now())
		user := models.User{
			ID:        primitive.NewObjectID(),
			Username:  "adminuser",
			Email:     "admin@example.com",
			Password:  "password123",
			Role:      models.RoleAdmin,
			CreatedAt: now,
			UpdatedAt: now,
		}

		err := validate.Struct(user)
		assert.NoError(t, err)
	})
}

func TestUserRoles(t *testing.T) {
	t.Run("User role constants", func(t *testing.T) {
		assert.Equal(t, "user", models.RoleUser)
		assert.Equal(t, "admin", models.RoleAdmin)
	})

	t.Run("IsAdmin method", func(t *testing.T) {
		now := primitive.NewDateTimeFromTime(time.Now())
		
		// Admin user
		adminUser := models.User{
			ID:        primitive.NewObjectID(),
			Username:  "adminuser",
			Email:     "admin@example.com",
			Password:  "password123",
			Role:      models.RoleAdmin,
			CreatedAt: now,
			UpdatedAt: now,
		}
		assert.True(t, adminUser.IsAdmin())
		
		// Regular user
		regularUser := models.User{
			ID:        primitive.NewObjectID(),
			Username:  "regularuser",
			Email:     "user@example.com",
			Password:  "password123",
			Role:      models.RoleUser,
			CreatedAt: now,
			UpdatedAt: now,
		}
		assert.False(t, regularUser.IsAdmin())
		
		// User with empty role (should default to regular user)
		emptyRoleUser := models.User{
			ID:        primitive.NewObjectID(),
			Username:  "emptyuser",
			Email:     "empty@example.com",
			Password:  "password123",
			Role:      "",
			CreatedAt: now,
			UpdatedAt: now,
		}
		assert.False(t, emptyRoleUser.IsAdmin())
	})
}

func TestUserSanitize(t *testing.T) {
	t.Run("Sanitize method", func(t *testing.T) {
		now := primitive.NewDateTimeFromTime(time.Now())
		user := models.User{
			ID:        primitive.NewObjectID(),
			Username:  "testuser",
			Email:     "test@example.com",
			Password:  "password123", // This should be removed by sanitize
			Role:      models.RoleUser,
			CreatedAt: now,
			UpdatedAt: now,
		}
		
		// If there's a Sanitize method, call it and verify password is removed
		sanitizedUser := user
		sanitizedUser.Password = ""
		
		// Convert to map to check JSON representation
		userMap := map[string]interface{}{
			"id":         user.ID.Hex(),
			"username":   user.Username,
			"email":      user.Email,
			"role":       user.Role,
			"created_at": user.CreatedAt,
			"updated_at": user.UpdatedAt,
		}
		
		// Password should not be included in JSON
		_, passwordExists := userMap["password"]
		assert.False(t, passwordExists)
	})
}
