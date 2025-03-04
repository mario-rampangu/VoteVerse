package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
	"voteverse/models"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/inmemory"
)

// Mock MongoDB instance
func setupMockDB() *mongo.Database {
	db, _ := inmemory.NewMongoDB()
	return db.Database("testdb")
}

// Test CreatePoll function
func TestCreatePoll(t *testing.T) {
	db := setupMockDB()
	router := gin.Default()
	router.POST("/polls", func(c *gin.Context) {
		c.Set("user_id", primitive.NewObjectID().Hex()) // Mock user ID
		c.Set("db", db)
		CreatePoll(c)
	})

	requestBody := `{
		"title": "Best Programming Language?",
		"description": "Vote for your favorite programming language.",
		"options": [{"text": "Go"}, {"text": "Python"}],
		"visibility": "public"
	}`

	req, _ := http.NewRequest("POST", "/polls", bytes.NewBufferString(requestBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code, "CreatePoll should return 201 Created")

	var response models.Poll
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err, "Response should be valid JSON")
	assert.Equal(t, "Best Programming Language?", response.Title, "Title should match")
	assert.Len(t, response.Options, 2, "Poll should have 2 options")
}

// Test CreatePoll with invalid input
func TestCreatePollInvalidInput(t *testing.T) {
	db := setupMockDB()
	router := gin.Default()
	router.POST("/polls", func(c *gin.Context) {
		c.Set("user_id", primitive.NewObjectID().Hex()) // Mock user ID
		c.Set("db", db)
		CreatePoll(c)
	})

	requestBody := `{"title": ""}` // Missing required fields

	req, _ := http.NewRequest("POST", "/polls", bytes.NewBufferString(requestBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code, "Invalid input should return 400 Bad Request")
}

// Test ListPolls function
func TestListPolls(t *testing.T) {
	db := setupMockDB()
	pollsCollection := db.Collection("polls")

	// Insert mock poll
	poll := models.Poll{
		ID:         primitive.NewObjectID(),
		Title:      "Favorite Sport?",
		CreatedAt:  primitive.NewDateTimeFromTime(time.Now()),
		UpdatedAt:  primitive.NewDateTimeFromTime(time.Now()),
		Visibility: "public",
		Options: []models.PollOption{
			{ID: primitive.NewObjectID(), Text: "Football"},
			{ID: primitive.NewObjectID(), Text: "Basketball"},
		},
	}
	_, err := pollsCollection.InsertOne(context.Background(), poll)
	assert.NoError(t, err, "Poll should be inserted into mock DB")

	router := gin.Default()
	router.GET("/polls", func(c *gin.Context) {
		c.Set("user_id", primitive.NewObjectID().Hex()) // Mock user ID
		c.Set("db", db)
		ListPolls(c)
	})

	req, _ := http.NewRequest("GET", "/polls", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code, "ListPolls should return 200 OK")

	var response []models.Poll
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err, "Response should be valid JSON")
	assert.Len(t, response, 1, "Should return 1 poll")
	assert.Equal(t, "Favorite Sport?", response[0].Title, "Poll title should match")
}

// Test Vote function
func TestVote(t *testing.T) {
	db := setupMockDB()
	pollsCollection := db.Collection("polls")
	votesCollection := db.Collection("votes")

	// Insert mock poll
	optionID := primitive.NewObjectID()
	poll := models.Poll{
		ID:       primitive.NewObjectID(),
		Title:    "Favorite Color?",
		IsActive: true,
		Options: []models.PollOption{
			{ID: optionID, Text: "Blue"},
			{ID: primitive.NewObjectID(), Text: "Red"},
		},
	}
	_, err := pollsCollection.InsertOne(context.Background(), poll)
	assert.NoError(t, err, "Poll should be inserted into mock DB")

	router := gin.Default()
	router.POST("/polls/:id/vote", func(c *gin.Context) {
		c.Set("user_id", primitive.NewObjectID().Hex()) // Mock user ID
		c.Set("db", db)
		Vote(c)
	})

	requestBody := `{"option_id": "` + optionID.Hex() + `"}`

	req, _ := http.NewRequest("POST", "/polls/"+poll.ID.Hex()+"/vote", bytes.NewBufferString(requestBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code, "Vote should return 200 OK")

	var updatedPoll models.Poll
	err = pollsCollection.FindOne(context.Background(), bson.M{"_id": poll.ID}).Decode(&updatedPoll)
	assert.NoError(t, err, "Poll should exist in DB")
	assert.Equal(t, int64(1), updatedPoll.Options[0].VoteCount, "Vote count should be incremented")
}

// Test Vote with invalid poll ID
func TestVoteInvalidPollID(t *testing.T) {
	db := setupMockDB()
	router := gin.Default()
	router.POST("/polls/:id/vote", func(c *gin.Context) {
		c.Set("user_id", primitive.NewObjectID().Hex()) // Mock user ID
		c.Set("db", db)
		Vote(c)
	})

	requestBody := `{"option_id": "invalid"}`

	req, _ := http.NewRequest("POST", "/polls/invalid/vote", bytes.NewBufferString(requestBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code, "Invalid poll ID should return 400 Bad Request")
}

// Test GetPoll function
func TestGetPoll(t *testing.T) {
	db := setupMockDB()
	pollsCollection := db.Collection("polls")

	// Insert mock poll
	poll := models.Poll{
		ID:         primitive.NewObjectID(),
		Title:      "Best Car Brand?",
		Visibility: "public",
		Options: []models.PollOption{
			{ID: primitive.NewObjectID(), Text: "Toyota"},
			{ID: primitive.NewObjectID(), Text: "Ford"},
		},
	}
	_, err := pollsCollection.InsertOne(context.Background(), poll)
	assert.NoError(t, err, "Poll should be inserted into mock DB")

	router := gin.Default()
	router.GET("/polls/:id", func(c *gin.Context) {
		c.Set("user_id", primitive.NewObjectID().Hex()) // Mock user ID
		c.Set("db", db)
		GetPoll(c)
	})

	req, _ := http.NewRequest("GET", "/polls/"+poll.ID.Hex(), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code, "GetPoll should return 200 OK")

	var response models.Poll
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err, "Response should be valid JSON")
	assert.Equal(t, "Best Car Brand?", response.Title, "Poll title should match")
}
