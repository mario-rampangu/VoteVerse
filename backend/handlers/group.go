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
)

// CreateGroupRequest represents the request body for creating a group
type CreateGroupRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description" binding:"required"`
}

// CreateGroup handles the creation of a new group
func CreateGroup(c *gin.Context) {
	var req CreateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Invalid request body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request",
			"details": gin.H{
				"message": "Please ensure all fields are filled correctly",
				"requirements": gin.H{
					"name":        "Group name is required",
					"description": "Group description is required",
				},
			},
		})
		return
	}

	// Get user ID from context (set by auth middleware)
	userIDStr, exists := c.Get("user_id")
	if !exists {
		log.Println("User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userID, err := primitive.ObjectIDFromHex(userIDStr.(string))
	if err != nil {
		log.Printf("Invalid user ID format: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Create new group
	now := primitive.NewDateTimeFromTime(time.Now())
	group := models.Group{
		ID:          primitive.NewObjectID(),
		Name:        req.Name,
		Description: req.Description,
		CreatedBy:   userID,
		CreatedAt:   now,
		UpdatedAt:   now,
		IsActive:    true,
	}

	// Get database from context
	db, ok := c.MustGet("db").(*mongo.Database)
	if !ok {
		log.Println("Failed to get database from context")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Insert group into database
	_, err = db.Collection("groups").InsertOne(context.Background(), group)
	if err != nil {
		log.Printf("Failed to create group: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create group"})
		return
	}

	// Create group membership for creator (as admin)
	member := models.GroupMember{
		ID:        primitive.NewObjectID(),
		GroupID:   group.ID,
		UserID:    userID,
		Role:      "admin",
		JoinedAt:  now,
		UpdatedAt: now,
	}

	_, err = db.Collection("group_members").InsertOne(context.Background(), member)
	if err != nil {
		log.Printf("Failed to create group membership: %v", err)
		// Try to rollback group creation
		_, deleteErr := db.Collection("groups").DeleteOne(context.Background(), bson.M{"_id": group.ID})
		if deleteErr != nil {
			log.Printf("Failed to rollback group creation: %v", deleteErr)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create group membership"})
		return
	}

	log.Printf("Successfully created group: %s", group.ID.Hex())
	c.JSON(http.StatusCreated, group)
}

// ListGroups returns a list of groups the user is a member of
func ListGroups(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		log.Println("User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userID, err := primitive.ObjectIDFromHex(userIDStr.(string))
	if err != nil {
		log.Printf("Invalid user ID format: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	db, ok := c.MustGet("db").(*mongo.Database)
	if !ok {
		log.Println("Failed to get database from context")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Get user's group memberships
	cursor, err := db.Collection("group_members").Find(context.Background(), bson.M{
		"user_id": userID,
	})
	if err != nil {
		log.Printf("Failed to fetch group memberships: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch groups"})
		return
	}
	defer cursor.Close(context.Background())

	var memberships []models.GroupMember
	if err := cursor.All(context.Background(), &memberships); err != nil {
		log.Printf("Failed to decode group memberships: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode groups"})
		return
	}

	// Get group IDs
	var groupIDs []primitive.ObjectID
	for _, membership := range memberships {
		groupIDs = append(groupIDs, membership.GroupID)
	}

	// Fetch group details
	var groups []models.Group
	if len(groupIDs) > 0 {
		cursor, err = db.Collection("groups").Find(context.Background(), bson.M{
			"_id": bson.M{"$in": groupIDs},
		})
		if err != nil {
			log.Printf("Failed to fetch group details: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch group details"})
			return
		}
		defer cursor.Close(context.Background())

		if err := cursor.All(context.Background(), &groups); err != nil {
			log.Printf("Failed to decode group details: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode group details"})
			return
		}
	}

	log.Printf("Successfully fetched %d groups for user %s", len(groups), userID.Hex())
	c.JSON(http.StatusOK, groups)
}

// JoinGroup handles a user joining a group
func JoinGroup(c *gin.Context) {
	groupID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid group ID"})
		return
	}

	userIDStr, _ := c.Get("user_id")
	userID, _ := primitive.ObjectIDFromHex(userIDStr.(string))
	db := c.MustGet("db").(*mongo.Database)

	// Check if group exists
	var group models.Group
	err = db.Collection("groups").FindOne(context.Background(), bson.M{
		"_id":       groupID,
		"is_active": true,
	}).Decode(&group)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
		return
	}

	// Check if user is already a member
	count, err := db.Collection("group_members").CountDocuments(context.Background(), bson.M{
		"group_id": groupID,
		"user_id":  userID,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check membership"})
		return
	}
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Already a member of this group"})
		return
	}

	// Add user to group
	now := primitive.NewDateTimeFromTime(time.Now())
	member := models.GroupMember{
		ID:        primitive.NewObjectID(),
		GroupID:   groupID,
		UserID:    userID,
		Role:      "member",
		JoinedAt:  now,
		UpdatedAt: now,
	}

	_, err = db.Collection("group_members").InsertOne(context.Background(), member)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to join group"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully joined group"})
}

// SearchGroups returns a list of groups matching the search criteria
func SearchGroups(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search query is required"})
		return
	}

	db := c.MustGet("db").(*mongo.Database)
	filter := bson.M{
		"$or": []bson.M{
			{"name": bson.M{"$regex": query, "$options": "i"}},
			{"description": bson.M{"$regex": query, "$options": "i"}},
		},
		"is_active": true,
	}

	opts := options.Find().SetLimit(20) // Limit results to 20 groups
	cursor, err := db.Collection("groups").Find(context.Background(), filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search groups"})
		return
	}
	defer cursor.Close(context.Background())

	var groups []models.Group
	if err := cursor.All(context.Background(), &groups); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode groups"})
		return
	}

	c.JSON(http.StatusOK, groups)
}
