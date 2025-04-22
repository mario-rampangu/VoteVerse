package handlers

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/inmemory"
)

func setupRouterWithMockDB() (*gin.Engine, *inmemory.Database) {
	gin.SetMode(gin.TestMode)
	router := gin.Default()

	// Create a mock in-memory database (you can replace with a real mock strategy)
	db := inmemory.NewDatabase()

	router.Use(func(c *gin.Context) {
		c.Set("user_id", primitive.NewObjectID().Hex())
		c.Set("db", db)
		c.Next()
	})

	return router, db
}

func TestCommentHealthCheck(t *testing.T) {
	router, _ := setupRouterWithMockDB()
	router.GET("/api/comment/health", CommentHealthCheck)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/comment/health", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "comment service is active")
}

func TestCreateComment_BadPollID(t *testing.T) {
	router, _ := setupRouterWithMockDB()
	router.POST("/api/comment/create/:pollId", CreateComment)

	body := `{"text": "Nice poll!"}`
	req, _ := http.NewRequest("POST", "/api/comment/create/invalidID", bytes.NewBuffer([]byte(body)))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Invalid poll ID")
}

func TestDeleteComment_InvalidCommentID(t *testing.T) {
	router, _ := setupRouterWithMockDB()
	router.DELETE("/api/comment/delete/:id", DeleteComment)

	req, _ := http.NewRequest("DELETE", "/api/comment/delete/badID", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Invalid comment ID")
}

// You can expand this file with more thorough unit tests by mocking DB interactions
