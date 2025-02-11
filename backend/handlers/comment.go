package handlers

import (
	"context"
	"net/http"
	"time"
	"voteverse/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// CreateCommentRequest represents the request body for creating a comment
type CreateCommentRequest struct {
	Text string `json:"text" binding:"required"`
}

// CreateComment handles the creation of a new comment on a poll
func CreateComment(c *gin.Context) {
	pollID, err := primitive.ObjectIDFromHex(c.Param("pollId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid poll ID"})
		return
	}

	var req CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userIDStr, _ := c.Get("user_id")
	userID, _ := primitive.ObjectIDFromHex(userIDStr.(string))
	db := c.MustGet("db").(*mongo.Database)

	// Check if poll exists and is active
	var poll models.Poll
	err = db.Collection("polls").FindOne(context.Background(), bson.M{
		"_id":       pollID,
		"is_active": true,
	}).Decode(&poll)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poll not found"})
		return
	}

	// Check if user is a member of the group
	count, err := db.Collection("group_members").CountDocuments(context.Background(), bson.M{
		"group_id": poll.GroupID,
		"user_id":  userID,
	})
	if err != nil || count == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not a member of this group"})
		return
	}

	// Create comment
	now := primitive.NewDateTimeFromTime(time.Now())
	comment := models.Comment{
		ID:        primitive.NewObjectID(),
		PollID:    pollID,
		UserID:    userID,
		Text:      req.Text,
		CreatedAt: now,
		UpdatedAt: now,
	}

	_, err = db.Collection("comments").InsertOne(context.Background(), comment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create comment"})
		return
	}

	// Send WebSocket notification
	NotifyCommentUpdate(poll.GroupID.Hex(), pollID.Hex(), "created")

	c.JSON(http.StatusCreated, comment)
}

// ListComments returns a list of comments for a specific poll
func ListComments(c *gin.Context) {
	pollID, err := primitive.ObjectIDFromHex(c.Param("pollId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid poll ID"})
		return
	}

	userIDStr, _ := c.Get("user_id")
	userID, _ := primitive.ObjectIDFromHex(userIDStr.(string))
	db := c.MustGet("db").(*mongo.Database)

	// Check if poll exists and user has access
	var poll models.Poll
	err = db.Collection("polls").FindOne(context.Background(), bson.M{
		"_id":       pollID,
		"is_active": true,
	}).Decode(&poll)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poll not found"})
		return
	}

	// Check if user is a member of the group
	count, err := db.Collection("group_members").CountDocuments(context.Background(), bson.M{
		"group_id": poll.GroupID,
		"user_id":  userID,
	})
	if err != nil || count == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not a member of this group"})
		return
	}

	// Get comments with user details
	pipeline := []bson.M{
		{
			"$match": bson.M{
				"poll_id": pollID,
			},
		},
		{
			"$lookup": bson.M{
				"from":         "users",
				"localField":   "user_id",
				"foreignField": "_id",
				"as":           "user",
			},
		},
		{
			"$unwind": "$user",
		},
		{
			"$project": bson.M{
				"_id":        1,
				"text":       1,
				"created_at": 1,
				"updated_at": 1,
				"user": bson.M{
					"_id":      1,
					"username": 1,
				},
			},
		},
		{
			"$sort": bson.M{
				"created_at": -1,
			},
		},
	}

	cursor, err := db.Collection("comments").Aggregate(context.Background(), pipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch comments"})
		return
	}
	defer cursor.Close(context.Background())

	var comments []bson.M
	if err := cursor.All(context.Background(), &comments); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode comments"})
		return
	}

	c.JSON(http.StatusOK, comments)
}

// DeleteComment handles the deletion of a comment
func DeleteComment(c *gin.Context) {
	commentID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid comment ID"})
		return
	}

	userIDStr, _ := c.Get("user_id")
	userID, _ := primitive.ObjectIDFromHex(userIDStr.(string))
	db := c.MustGet("db").(*mongo.Database)

	// Get comment and poll details
	var comment models.Comment
	err = db.Collection("comments").FindOne(context.Background(), bson.M{
		"_id": commentID,
	}).Decode(&comment)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
		return
	}

	// Check if user is the comment author
	if comment.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to delete this comment"})
		return
	}

	// Get poll details for WebSocket notification
	var poll models.Poll
	err = db.Collection("polls").FindOne(context.Background(), bson.M{
		"_id": comment.PollID,
	}).Decode(&poll)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poll not found"})
		return
	}

	// Delete comment
	_, err = db.Collection("comments").DeleteOne(context.Background(), bson.M{
		"_id": commentID,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete comment"})
		return
	}

	// Send WebSocket notification
	NotifyCommentUpdate(poll.GroupID.Hex(), poll.ID.Hex(), "deleted")

	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted successfully"})
}
