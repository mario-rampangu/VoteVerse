package handlers

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func setupPollTestRouter(mockDB *mongo.Database) *gin.Engine {
	router := gin.Default()

	router.Use(func(c *gin.Context) {
		c.Set("user_id", primitive.NewObjectID().Hex())
		c.Set("db", mockDB)
		c.Next()
	})

	return router
}

func TestCreatePoll_InvalidPayload(t *testing.T) {
	router := setupPollTestRouter(nil)
	router.POST("/polls", CreatePoll)

	body := `{"title": "Only Title", "options": []}`
	req, _ := http.NewRequest("POST", "/polls", bytes.NewBuffer([]byte(body)))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "binding")
}

func TestGetPoll_InvalidID(t *testing.T) {
	router := setupPollTestRouter(nil)
	router.GET("/polls/:id", GetPoll)

	req, _ := http.NewRequest("GET", "/polls/invalid_id", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Invalid poll ID")
}

func TestVote_InvalidPollID(t *testing.T) {
	router := setupPollTestRouter(nil)
	router.POST("/polls/:id/vote", Vote)

	body := `{"option_id": "abc"}`
	req, _ := http.NewRequest("POST", "/polls/invalid_id/vote", bytes.NewBuffer([]byte(body)))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Invalid poll ID")
}

func TestVote_InvalidOptionID(t *testing.T) {
	router := setupPollTestRouter(nil)
	router.POST("/polls/:id/vote", Vote)

	pollID := primitive.NewObjectID().Hex()
	body := `{"option_id": "invalid_option"}`
	req, _ := http.NewRequest("POST", "/polls/"+pollID+"/vote", bytes.NewBuffer([]byte(body)))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Invalid option ID")
}

func TestCreatePoll_ValidBasicPayload(t *testing.T) {
	// NOTE: Requires real or mock DB implementation to pass. You can skip actual DB check here.
	// This is a placeholder if you want to inject a working MongoDB instance or mock.
	t.Skip("Integration test with database needed")
}

func TestListPolls_Unauthorized(t *testing.T) {
	router := gin.Default()

	router.GET("/polls", func(c *gin.Context) {
		ListPolls(c) // No middleware to set "user_id"
	})

	req, _ := http.NewRequest("GET", "/polls", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "Unauthorized")
}
