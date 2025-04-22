package handlers

import (
	"context"
	"log"
	"net/http"
	"strconv"
	"time"
	"voteverse/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// AdminDeleteGroup handles DELETE /api/admin/groups/:id requests
func AdminDeleteGroup(c *gin.Context, db *mongo.Database) {
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

	// Get the group ID from the URL
	groupID := c.Param("id")
	groupObjID, err := primitive.ObjectIDFromHex(groupID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid group ID"})
		return
	}

	// Get the reason from the request body
	var req struct {
		Reason string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		// If no reason is provided, we'll still proceed with deletion
		log.Printf("No reason provided for group deletion: %v", err)
	}

	// Delete the group
	result, err := db.Collection("groups").DeleteOne(context.Background(), bson.M{"_id": groupObjID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete group"})
		return
	}

	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
		return
	}

	// Also delete all polls in this group
	deleteResult, err := db.Collection("polls").DeleteMany(context.Background(), bson.M{"group_id": groupID})
	if err != nil {
		log.Printf("Failed to delete polls in group: %v", err)
		// Continue anyway, we've already deleted the group
	} else {
		log.Printf("Deleted %d polls in group %s", deleteResult.DeletedCount, groupID)
	}

	// Also delete all memberships for this group
	_, err = db.Collection("group_members").DeleteMany(context.Background(), bson.M{"group_id": groupObjID})
	if err != nil {
		log.Printf("Failed to delete group memberships: %v", err)
		// Continue anyway, we've already deleted the group
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Group deleted successfully",
		"reason":        req.Reason,
		"deleted_polls": deleteResult.DeletedCount,
	})
}

// AdminDeletePoll handles DELETE /api/admin/polls/:id requests
func AdminDeletePoll(c *gin.Context, db *mongo.Database) {
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

	// Get the poll ID from the URL
	pollID := c.Param("id")
	pollObjID, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid poll ID"})
		return
	}

	// Get the reason from the request body
	var req struct {
		Reason string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		// If no reason is provided, we'll still proceed with deletion
		log.Printf("No reason provided for poll deletion: %v", err)
	}

	// Delete the poll
	result, err := db.Collection("polls").DeleteOne(context.Background(), bson.M{"_id": pollObjID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete poll"})
		return
	}

	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poll not found"})
		return
	}

	// Also delete all votes for this poll
	deleteVotesResult, err := db.Collection("votes").DeleteMany(context.Background(), bson.M{"poll_id": pollObjID})
	if err != nil {
		log.Printf("Failed to delete votes for poll: %v", err)
		// Continue anyway, we've already deleted the poll
	} else {
		log.Printf("Deleted %d votes for poll %s", deleteVotesResult.DeletedCount, pollID)
	}

	// Also delete all comments for this poll
	deleteCommentsResult, err := db.Collection("comments").DeleteMany(context.Background(), bson.M{"poll_id": pollObjID})
	if err != nil {
		log.Printf("Failed to delete comments for poll: %v", err)
		// Continue anyway, we've already deleted the poll
	} else {
		log.Printf("Deleted %d comments for poll %s", deleteCommentsResult.DeletedCount, pollID)
	}

	c.JSON(http.StatusOK, gin.H{
		"message":          "Poll deleted successfully",
		"reason":           req.Reason,
		"deleted_votes":    deleteVotesResult.DeletedCount,
		"deleted_comments": deleteCommentsResult.DeletedCount,
	})
}

// IsAdmin checks if a user is an admin and returns the user object if they are
func IsAdmin(userID primitive.ObjectID, db *mongo.Database) (models.User, bool) {
	var user models.User
	err := db.Collection("users").FindOne(context.Background(), bson.M{"_id": userID}).Decode(&user)
	if err != nil {
		return models.User{}, false
	}

	return user, user.Role == models.RoleAdmin
}

// AdminListAllGroups returns all groups in the system for admin users
func AdminListAllGroups(c *gin.Context, db *mongo.Database) {
	// Get user ID from context
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userID, err := primitive.ObjectIDFromHex(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Check if user is admin
	user, isAdmin := IsAdmin(userID, db)
	if !isAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Admin access required"})
		return
	}

	// Fetch all groups
	cursor, err := db.Collection("groups").Find(context.Background(), bson.M{})
	if err != nil {
		log.Printf("Failed to fetch groups: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch groups"})
		return
	}
	defer cursor.Close(context.Background())

	var groups []models.Group
	if err := cursor.All(context.Background(), &groups); err != nil {
		log.Printf("Failed to decode groups: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode groups"})
		return
	}

	// Get user's group memberships to mark which groups the admin is a member of
	membershipCursor, err := db.Collection("group_members").Find(context.Background(), bson.M{
		"user_id": userID,
	})

	membershipMap := make(map[primitive.ObjectID]bool)
	if err == nil {
		defer membershipCursor.Close(context.Background())
		var memberships []models.GroupMember
		if err := membershipCursor.All(context.Background(), &memberships); err == nil {
			for _, membership := range memberships {
				membershipMap[membership.GroupID] = true
			}
		}
	}

	// Mark groups where the admin is a member
	for i := range groups {
		groups[i].IsMember = membershipMap[groups[i].ID]
	}

	log.Printf("Admin %s (%s) fetched all %d groups", user.Username, user.ID.Hex(), len(groups))
	c.JSON(http.StatusOK, groups)
}

// AdminListAllPolls returns all polls in the system for admin users
func AdminListAllPolls(c *gin.Context, db *mongo.Database) {
	// Get user ID from context
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userID, err := primitive.ObjectIDFromHex(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Check if user is admin
	user, isAdmin := IsAdmin(userID, db)
	if !isAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Admin access required"})
		return
	}

	// Get query parameters
	sortBy := c.Query("sort")
	limitStr := c.Query("limit")

	// Parse limit parameter
	var limit int64 = 0 // 0 means no limit
	if limitStr != "" {
		limit64, err := strconv.ParseInt(limitStr, 10, 64)
		if err != nil {
			log.Printf("Invalid limit parameter: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid limit parameter"})
			return
		}
		limit = limit64
	}

	// Update expired polls
	now := time.Now()
	nowTime := primitive.NewDateTimeFromTime(now)
	_, err = db.Collection("polls").UpdateMany(
		context.Background(),
		bson.M{
			"is_active": true,
			"end_time":  bson.M{"$lt": nowTime},
		},
		bson.M{"$set": bson.M{"is_active": false}},
	)
	if err != nil {
		log.Printf("Error updating expired polls: %v", err)
	}

	// Build find options
	findOptions := options.Find()
	if limit > 0 {
		findOptions.SetLimit(limit)
	}

	// Set sort order
	if sortBy == "recent" {
		findOptions.SetSort(bson.D{{"created_at", -1}})
	} else {
		// Default sort by creation time, newest first
		findOptions.SetSort(bson.D{{"created_at", -1}})
	}

	// Fetch all polls
	cursor, err := db.Collection("polls").Find(context.Background(), bson.M{}, findOptions)
	if err != nil {
		log.Printf("Error fetching polls: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch polls"})
		return
	}
	defer cursor.Close(context.Background())

	var polls []models.Poll
	if err = cursor.All(context.Background(), &polls); err != nil {
		log.Printf("Error decoding polls: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode polls"})
		return
	}

	// Get user's votes for these polls
	pollIDs := make([]primitive.ObjectID, len(polls))
	for i, poll := range polls {
		pollIDs[i] = poll.ID
	}

	// Find all votes by this user for these polls
	votesCursor, err := db.Collection("votes").Find(context.Background(), bson.M{
		"poll_id": bson.M{"$in": pollIDs},
		"user_id": userID,
	})

	// Create a map of poll ID to vote option ID
	userVotes := make(map[primitive.ObjectID]primitive.ObjectID)
	if err == nil {
		defer votesCursor.Close(context.Background())
		var votes []models.Vote
		if err = votesCursor.All(context.Background(), &votes); err == nil {
			for _, vote := range votes {
				userVotes[vote.PollID] = vote.OptionID
			}
		}
	}

	// Create response with user votes
	type PollWithUserVote struct {
		models.Poll
		UserVote string `json:"user_vote,omitempty"`
	}

	pollsWithVotes := make([]PollWithUserVote, len(polls))
	for i, poll := range polls {
		pollWithVote := PollWithUserVote{
			Poll: poll,
		}

		// Add user's vote if exists
		if optionID, ok := userVotes[poll.ID]; ok {
			pollWithVote.UserVote = optionID.Hex()
		}

		pollsWithVotes[i] = pollWithVote
	}

	log.Printf("Admin %s (%s) fetched all %d polls", user.Username, user.ID.Hex(), len(pollsWithVotes))
	c.JSON(http.StatusOK, pollsWithVotes)
}

// AdminHealthCheck provides a simple health status for the admin module
func AdminHealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "admin service is up",
		"uptime":  time.Since(startTime).String(),
		"version": "v1.0.0",
	})
}

// AdminGetStats returns basic stats about admins in the system
func AdminGetStats(c *gin.Context, db *mongo.Database) {
	count, err := db.Collection("users").CountDocuments(context.Background(), bson.M{"role": models.RoleAdmin})
	if err != nil {
		log.Printf("Failed to count admin users: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get stats"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total_admins": count,
	})
}

// Track server start time for uptime calculation (used in health check)
var startTime = time.Now()
