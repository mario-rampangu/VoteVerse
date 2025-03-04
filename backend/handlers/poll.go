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
		log.Printf("Error binding JSON for poll creation: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("Received poll creation request: %+v", req)

	userIDStr, _ := c.Get("user_id")
	userID, _ := primitive.ObjectIDFromHex(userIDStr.(string))
	db := c.MustGet("db").(*mongo.Database)

	// Check group membership if it's a group poll
	var groupID primitive.ObjectID
	if req.Visibility == "group" {
		if req.GroupID == "" {
			log.Printf("Group ID is required for group polls")
			c.JSON(http.StatusBadRequest, gin.H{"error": "Group ID is required for group polls"})
			return
		}

		var err error
		groupID, err = primitive.ObjectIDFromHex(req.GroupID)
		if err != nil {
			log.Printf("Invalid group ID: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid group ID"})
			return
		}

		// Check if user is a member of the group
		count, err := db.Collection("group_members").CountDocuments(context.Background(), bson.M{
			"group_id": groupID,
			"user_id":  userID,
		})
		if err != nil || count == 0 {
			log.Printf("User %s is not a member of group %s", userID.Hex(), groupID.Hex())
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

	log.Printf("Created %d poll options", len(pollOptions))

	// Set default start time to now if not provided
	startTime := req.StartTime
	if startTime.IsZero() {
		startTime = time.Now()
	}

	// Set default end time to 24 hours from start time if not provided
	endTime := req.EndTime
	if endTime.IsZero() {
		endTime = startTime.Add(24 * time.Hour)
	}

	log.Printf("Poll timing: Start=%v, End=%v", startTime, endTime)

	// Create poll
	poll := models.Poll{
		ID:          primitive.NewObjectID(),
		GroupID:     groupID,
		CreatedBy:   userID,
		Title:       req.Title,
		Description: req.Description,
		Options:     pollOptions,
		StartTime:   primitive.NewDateTimeFromTime(startTime),
		EndTime:     primitive.NewDateTimeFromTime(endTime),
		CreatedAt:   now,
		UpdatedAt:   now,
		IsActive:    true,
		Visibility:  req.Visibility,
	}

	_, err := db.Collection("polls").InsertOne(context.Background(), poll)
	if err != nil {
		log.Printf("Failed to create poll: %v", err)
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

	log.Printf("ListPolls called by user: %s", userIDStr)
	userID, _ := primitive.ObjectIDFromHex(userIDStr.(string))
	db := c.MustGet("db").(*mongo.Database)

	// Check if user is admin
	var user models.User
	err := db.Collection("users").FindOne(context.Background(), bson.M{"_id": userID}).Decode(&user)
	if err == nil && user.Role == models.RoleAdmin {
		// Admin users can see all polls
		// Call the admin function to list all polls
		AdminListAllPolls(c, db)
		return
	}

	// Get query parameters
	groupIDStr := c.Query("group_id")
	sortBy := c.Query("sort")
	limitStr := c.Query("limit")
	
	log.Printf("ListPolls parameters: group_id=%s, sort=%s, limit=%s", groupIDStr, sortBy, limitStr)
	
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
			"end_time": bson.M{"$lt": nowTime},
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
	
	var filter bson.M
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

		filter = bson.M{"group_id": groupID}
	} else {
		// Get user's group memberships
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
		filter = bson.M{
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
	}

	// Fetch polls
	cursor, err := db.Collection("polls").Find(context.Background(), filter, findOptions)
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
			log.Printf("Adding user vote to poll %s: %s", poll.ID.Hex(), optionID.Hex())
		}
		
		pollsWithVotes[i] = pollWithVote
	}

	log.Printf("Returning %d polls", len(pollsWithVotes))
	c.JSON(http.StatusOK, pollsWithVotes)
}

// VoteRequest represents the request body for casting a vote
type VoteRequest struct {
	OptionID string `json:"option_id" binding:"required"`
}

// Vote handles a user casting a vote on a poll
func Vote(c *gin.Context) {
	pollID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		log.Printf("Invalid poll ID format: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid poll ID"})
		return
	}

	var req VoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Invalid vote request: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("Vote request received: Poll ID: %s, Option ID: %s", pollID.Hex(), req.OptionID)

	optionID, err := primitive.ObjectIDFromHex(req.OptionID)
	if err != nil {
		log.Printf("Invalid option ID format: %v", err)
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
		log.Printf("Poll not found or not active: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Poll not found or not active"})
		return
	}

	// Check if poll has ended
	now := time.Now()
	endTime := poll.EndTime.Time()
	if now.After(endTime) {
		log.Printf("Poll has ended. End time: %v, Current time: %v", endTime, now)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Poll has ended"})
		return
	}

	log.Printf("Poll found: %s, Options count: %d", poll.Title, len(poll.Options))

	// Check if option belongs to poll
	validOption := false
	for _, opt := range poll.Options {
		log.Printf("Checking option: %s (ID: %s) against requested option ID: %s", opt.Text, opt.ID.Hex(), optionID.Hex())
		if opt.ID.Hex() == optionID.Hex() {
			validOption = true
			break
		}
	}
	if !validOption {
		log.Printf("Invalid option for poll: %s", optionID.Hex())
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid option for this poll"})
		return
	}

	// Start a session for the transaction
	session, err := db.Client().StartSession()
	if err != nil {
		log.Printf("Failed to start transaction: %v", err)
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
				log.Printf("Failed to insert vote: %v", err)
				return nil, err
			}

			// Increment vote count for the option
			_, err = db.Collection("polls").UpdateOne(ctx,
				bson.M{"_id": pollID, "options._id": optionID},
				bson.M{"$inc": bson.M{"options.$.vote_count": 1}},
			)
			if err != nil {
				log.Printf("Failed to increment vote count: %v", err)
			}
			return nil, err
		} else if err != nil {
			log.Printf("Error checking for existing vote: %v", err)
			return nil, err
		}

		// Update existing vote
		if existingVote.OptionID.Hex() != optionID.Hex() {
			// Decrement old option's vote count
			_, err = db.Collection("polls").UpdateOne(ctx,
				bson.M{"_id": pollID, "options._id": existingVote.OptionID},
				bson.M{"$inc": bson.M{"options.$.vote_count": -1}},
			)
			if err != nil {
				log.Printf("Failed to decrement old option vote count: %v", err)
				return nil, err
			}

			// Increment new option's vote count
			_, err = db.Collection("polls").UpdateOne(ctx,
				bson.M{"_id": pollID, "options._id": optionID},
				bson.M{"$inc": bson.M{"options.$.vote_count": 1}},
			)
			if err != nil {
				log.Printf("Failed to increment new option vote count: %v", err)
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
			if err != nil {
				log.Printf("Failed to update vote record: %v", err)
			}
			return nil, err
		}

		return nil, nil
	})

	if err != nil {
		log.Printf("Transaction failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process vote"})
		return
	}

	// Get the updated poll to return to the client
	var updatedPoll models.Poll
	err = db.Collection("polls").FindOne(context.Background(), bson.M{"_id": pollID}).Decode(&updatedPoll)
	if err != nil {
		log.Printf("Failed to fetch updated poll: %v", err)
	}

	// Add user_vote field to the response
	type PollWithUserVote struct {
		models.Poll
		UserVote string `json:"user_vote"`
	}

	pollWithVote := PollWithUserVote{
		Poll:     updatedPoll,
		UserVote: optionID.Hex(),
	}

	// Send WebSocket notification
	NotifyVoteUpdate(poll.GroupID.Hex(), pollID.Hex())

	c.JSON(http.StatusOK, pollWithVote)
}

// GetPoll returns details of a specific poll
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

	// Create response with poll data and user vote
	type PollWithUserVote struct {
		models.Poll
		UserVote string `json:"user_vote,omitempty"`
	}

	pollWithVote := PollWithUserVote{
		Poll: poll,
	}

	// Add user's vote if exists
	if err == nil {
		pollWithVote.UserVote = vote.OptionID.Hex()
	}

	c.JSON(http.StatusOK, pollWithVote)
}
