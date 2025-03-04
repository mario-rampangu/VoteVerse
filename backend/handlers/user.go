package handlers

import (
	"context"
	"log"
	"net/http"
	"time"
	"voteverse/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

// ListUsers handles GET /api/admin/users requests
func ListUsers(c *gin.Context, db *mongo.Database) {
	// Check if the user is an admin
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get the user from the database
	var user models.User
	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	err = db.Collection("users").FindOne(context.Background(), bson.M{"_id": userObjID}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user"})
		return
	}

	// Check if the user is an admin
	if user.Role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Admin access required"})
		return
	}

	// Get all users
	findOptions := options.Find()
	findOptions.SetSort(bson.D{{Key: "created_at", Value: -1}})

	cursor, err := db.Collection("users").Find(context.Background(), bson.M{}, findOptions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get users"})
		return
	}
	defer cursor.Close(context.Background())

	var users []models.User
	if err = cursor.All(context.Background(), &users); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse users"})
		return
	}

	// Don't return password hashes
	for i := range users {
		users[i].Password = ""
	}

	c.JSON(http.StatusOK, users)
}

// UpdateUserRole handles PUT /api/admin/users/:id/role requests
func UpdateUserRole(c *gin.Context, db *mongo.Database) {
	// Check if the user is an admin
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get the user from the database
	var adminUser models.User
	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	err = db.Collection("users").FindOne(context.Background(), bson.M{"_id": userObjID}).Decode(&adminUser)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user"})
		return
	}

	// Check if the user is an admin
	if adminUser.Role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Admin access required"})
		return
	}

	// Get the user ID from the URL
	targetUserID := c.Param("id")
	targetUserObjID, err := primitive.ObjectIDFromHex(targetUserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid target user ID"})
		return
	}

	// Get the role from the request body
	var req struct {
		Role string `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate the role
	if req.Role != models.RoleAdmin && req.Role != models.RoleUser {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role"})
		return
	}

	// Don't allow changing your own role
	if targetUserObjID == userObjID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot change your own role"})
		return
	}

	// Update the user's role
	update := bson.M{
		"$set": bson.M{
			"role":       req.Role,
			"updated_at": primitive.NewDateTimeFromTime(time.Now()),
		},
	}

	result, err := db.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": targetUserObjID},
		update,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User role updated successfully"})
}

// DeleteUser handles DELETE /api/admin/users/:id requests
func DeleteUser(c *gin.Context, db *mongo.Database) {
	// Check if the user is an admin
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get the user from the database
	var adminUser models.User
	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	err = db.Collection("users").FindOne(context.Background(), bson.M{"_id": userObjID}).Decode(&adminUser)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user"})
		return
	}

	// Check if the user is an admin
	if adminUser.Role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Admin access required"})
		return
	}

	// Get the user ID from the URL
	targetUserID := c.Param("id")
	targetUserObjID, err := primitive.ObjectIDFromHex(targetUserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid target user ID"})
		return
	}

	// Don't allow deleting yourself
	if targetUserObjID == userObjID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete your own account"})
		return
	}

	// Delete the user
	result, err := db.Collection("users").DeleteOne(context.Background(), bson.M{"_id": targetUserObjID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Also delete user's votes, comments, etc.
	// This would be a good place to use transactions, but for simplicity, we'll just delete them one by one
	_, err = db.Collection("votes").DeleteMany(context.Background(), bson.M{"user_id": targetUserObjID})
	if err != nil {
		log.Printf("Failed to delete user's votes: %v", err)
	}

	_, err = db.Collection("comments").DeleteMany(context.Background(), bson.M{"user_id": targetUserObjID})
	if err != nil {
		log.Printf("Failed to delete user's comments: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// CreateUser handles POST /api/admin/users requests
func CreateUser(c *gin.Context, db *mongo.Database) {
	// Check if the user is an admin
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get the user from the database
	var adminUser models.User
	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	err = db.Collection("users").FindOne(context.Background(), bson.M{"_id": userObjID}).Decode(&adminUser)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user"})
		return
	}

	// Check if the user is an admin
	if adminUser.Role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Admin access required"})
		return
	}

	// Get the user data from the request body
	var req struct {
		Username string `json:"username" binding:"required,min=3"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
		Role     string `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Validation failed",
			"details": gin.H{
				"message": "Please ensure all fields are filled correctly",
				"requirements": gin.H{
					"username": "At least 3 characters required",
					"email":    "Valid email address required",
					"password": "At least 6 characters required",
					"role":     "Must be 'admin' or 'user'",
				},
			},
		})
		return
	}

	// Validate the role
	if req.Role != models.RoleAdmin && req.Role != models.RoleUser {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role"})
		return
	}

	// Check if user already exists
	var existingUser models.User
	err = db.Collection("users").FindOne(context.Background(), bson.M{
		"$or": []bson.M{
			{"email": req.Email},
			{"username": req.Username},
		},
	}).Decode(&existingUser)

	if err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": "User already exists",
			"details": gin.H{
				"message": "A user with this email or username already exists",
			},
		})
		return
	}

	if err != mongo.ErrNoDocuments {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Create new user
	now := primitive.NewDateTimeFromTime(time.Now())
	newUser := models.User{
		ID:        primitive.NewObjectID(),
		Username:  req.Username,
		Email:     req.Email,
		Password:  string(hashedPassword),
		Role:      req.Role,
		CreatedAt: now,
		UpdatedAt: now,
	}

	_, err = db.Collection("users").InsertOne(context.Background(), newUser)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	newUser.Password = "" // Don't send password back
	c.JSON(http.StatusCreated, newUser)
}
