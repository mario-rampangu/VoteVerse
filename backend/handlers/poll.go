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
)

// CreatePollRequest represents the request body for creating a poll
type CreatePollRequest struct {
	GroupID     string       `json:"group_id,omitempty"`
	Title       string       `json:"title" binding:"required"`
	Description string       `json:"description"`
	Options     []PollOption `json:"options" binding:"required,min=2"`
	StartTime   time.Time    `json:"start_time"`
	EndTime     time.Time    `json:"end_time"`
	Visibility  string       `json:"visibility" binding:"required,oneof=public group"`
}

type PollOption struct {
	Text     string `json:"text" binding:"required"`
	ImageURL string `json:"image_url"`
}

// CreatePoll handles the creation of a new poll
func CreatePoll(c *gin.Context) {
	var req CreatePollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userIDStr, _ := c.Get("user_id")
	userID, _ := primitive.ObjectIDFromHex(userIDStr.(string))
	db := c.MustGet("db").(*mongo.Database)

	// Check group membership if it's a group poll
	var groupID primitive.ObjectID
	if req.Visibility == "group" {
		if req.GroupID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Group ID is required for group polls"})
			return
		}

		var err error
		groupID, err = primitive.ObjectIDFromHex(req.GroupID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid group ID"})
			return
		}

		// Check if user is a member of the group
		count, err := db.Collection("group_members").CountDocuments(context.Background(), bson.M{
			"group_id": groupID,
			"user_id":  userID,
		})
		if err != nil || count == 0 {
			c.JSON(http.StatusForbidden, gin.H{"error": "Not a member of this group"})
			return
		}
	}

	// Create poll options
	now := primitive.NewDateTimeFromTime(time.Now())
	var pollOptions []models.PollOption
	for _, opt := range req.Options {
		pollOptions = append(pollOptions, models.PollOption{
			ID:        primitive.NewObjectID(),
			Text:      opt.Text,
			ImageURL:  opt.ImageURL,
			VoteCount: 0,
		})
	}

	// Create poll
	poll := models.Poll{
		ID:          primitive.NewObjectID(),
		GroupID:     groupID,
		CreatedBy:   userID,
		Title:       req.Title,
		Description: req.Description,
		Options:     pollOptions,
		StartTime:   primitive.NewDateTimeFromTime(req.StartTime),
		EndTime:     primitive.NewDateTimeFromTime(req.EndTime),
		CreatedAt:   now,
		UpdatedAt:   now,
		IsActive:    true,
		Visibility:  req.Visibility,
	}

	_, err := db.Collection("polls").InsertOne(context.Background(), poll)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create poll"})
		return
	}

	// Send WebSocket notification for group polls
	if req.Visibility == "group" {
		NotifyPollUpdate(req.GroupID, poll.ID.Hex(), "created")
	}

	c.JSON(http.StatusCreated, poll)
}

// ListPolls returns a list of polls based on visibility and group
func ListPolls(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		log.Println("User ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userID, _ := primitive.ObjectIDFromHex(userIDStr.(string))
	db := c.MustGet("db").(*mongo.Database)

	// Check if group_id is provided
	groupIDStr := c.Query("group_id")
	if groupIDStr != "" {
		// Group-specific polls
		groupID, err := primitive.ObjectIDFromHex(groupIDStr)
		if err != nil {
			log.Printf("Invalid group ID format: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid group ID format"})
			return
		}

		// Check if user is a member of the group
		count, err := db.Collection("group_members").CountDocuments(context.Background(), bson.M{
			"group_id": groupID,
			"user_id":  userID,
		})
		if err != nil {
			log.Printf("Error checking group membership: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check group membership"})
			return
		}
		if count == 0 {
			log.Printf("User %s is not a member of group %s", userID, groupID)
			c.JSON(http.StatusForbidden, gin.H{"error": "Not a member of this group"})
			return
		}

		// Fetch polls for the group
		cursor, err := db.Collection("polls").Find(context.Background(), bson.M{"group_id": groupID})
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

		c.JSON(http.StatusOK, polls)
		return
	}

	// Get all accessible polls for the user
	// 1. Get user's group memberships
	cursor, err := db.Collection("group_members").Find(context.Background(), bson.M{
		"user_id": userID,
	})
	if err != nil {
		log.Printf("Error fetching group memberships: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch group memberships"})
		return
	}
	defer cursor.Close(context.Background())

	var memberships []models.GroupMember
	if err = cursor.All(context.Background(), &memberships); err != nil {
		log.Printf("Error decoding group memberships: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode group memberships"})
		return
	}

	// Get group IDs
	var groupIDs []primitive.ObjectID
	for _, membership := range memberships {
		groupIDs = append(groupIDs, membership.GroupID)
	}

	// Build query for polls
	filter := bson.M{
		"$or": []bson.M{
			{"visibility": "public"},
			{
				"$and": []bson.M{
					{"visibility": "group"},
					{"group_id": bson.M{"$in": groupIDs}},
				},
			},
		},
	}

	// Fetch polls
	cursor, err = db.Collection("polls").Find(context.Background(), filter)
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

	c.JSON(http.StatusOK, polls)
}

// VoteRequest represents the request body for casting a vote
type VoteRequest struct {
	OptionID string `json:"option_id" binding:"required"`
}

// Vote handles a user casting a vote on a poll
func Vote(c *gin.Context) {
	pollID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid poll ID"})
		return
	}

	var req VoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	optionID, err := primitive.ObjectIDFromHex(req.OptionID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid option ID"})
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

	// Check if option belongs to poll
	validOption := false
	for _, opt := range poll.Options {
		if opt.ID == optionID {
			validOption = true
			break
		}
	}
	if !validOption {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid option for this poll"})
		return
	}

	// Start a session for the transaction
	session, err := db.Client().StartSession()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer session.EndSession(context.Background())

	// Execute the transaction
	_, err = session.WithTransaction(context.Background(), func(ctx mongo.SessionContext) (interface{}, error) {
		// Check if user has already voted
		var existingVote models.Vote
		err := db.Collection("votes").FindOne(ctx, bson.M{
			"poll_id": pollID,
			"user_id": userID,
		}).Decode(&existingVote)

		now := primitive.NewDateTimeFromTime(time.Now())
		if err == mongo.ErrNoDocuments {
			// Create new vote
			vote := models.Vote{
				ID:        primitive.NewObjectID(),
				PollID:    pollID,
				UserID:    userID,
				OptionID:  optionID,
				CreatedAt: now,
				UpdatedAt: now,
			}

			_, err = db.Collection("votes").InsertOne(ctx, vote)
			if err != nil {
				return nil, err
			}

			// Increment vote count for the option
			_, err = db.Collection("polls").UpdateOne(ctx,
				bson.M{"_id": pollID, "options.id": optionID},
				bson.M{"$inc": bson.M{"options.$.vote_count": 1}},
			)
			return nil, err
		} else if err != nil {
			return nil, err
		}

		// Update existing vote
		if existingVote.OptionID != optionID {
			// Decrement old option's vote count
			_, err = db.Collection("polls").UpdateOne(ctx,
				bson.M{"_id": pollID, "options.id": existingVote.OptionID},
				bson.M{"$inc": bson.M{"options.$.vote_count": -1}},
			)
			if err != nil {
				return nil, err
			}

			// Increment new option's vote count
			_, err = db.Collection("polls").UpdateOne(ctx,
				bson.M{"_id": pollID, "options.id": optionID},
				bson.M{"$inc": bson.M{"options.$.vote_count": 1}},
			)
			if err != nil {
				return nil, err
			}

			// Update vote record
			_, err = db.Collection("votes").UpdateOne(ctx,
				bson.M{"_id": existingVote.ID},
				bson.M{
					"$set": bson.M{
						"option_id":  optionID,
						"updated_at": now,
					},
				},
			)
			return nil, err
		}

		return nil, nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process vote"})
		return
	}

	// Send WebSocket notification
	NotifyVoteUpdate(poll.GroupID.Hex(), pollID.Hex())

	c.JSON(http.StatusOK, gin.H{"message": "Vote recorded successfully"})
}

// GetPoll returns a single poll by ID
func GetPoll(c *gin.Context) {
	pollID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid poll ID"})
		return
	}

	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userID, _ := primitive.ObjectIDFromHex(userIDStr.(string))
	db := c.MustGet("db").(*mongo.Database)

	// Get the poll
	var poll models.Poll
	err = db.Collection("polls").FindOne(context.Background(), bson.M{
		"_id": pollID,
	}).Decode(&poll)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Poll not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch poll"})
		}
		return
	}

	// If it's a group poll, check if user is a member
	if poll.GroupID != primitive.NilObjectID {
		count, err := db.Collection("group_members").CountDocuments(context.Background(), bson.M{
			"group_id": poll.GroupID,
			"user_id":  userID,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check group membership"})
			return
		}
		if count == 0 {
			c.JSON(http.StatusForbidden, gin.H{"error": "Not a member of this group"})
			return
		}
	}

	// Get user's vote if any
	var vote models.Vote
	err = db.Collection("votes").FindOne(context.Background(), bson.M{
		"poll_id": pollID,
		"user_id": userID,
	}).Decode(&vote)

	// Add user's vote to the response
	response := gin.H{
		"poll":      poll,
		"user_vote": nil,
	}
	if err == nil {
		response["user_vote"] = vote.OptionID
	}

	c.JSON(http.StatusOK, response)
}
