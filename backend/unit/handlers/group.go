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

// simulateContext sets up the Gin context with user_id and a mock DB
func simulateContext() (*gin.Engine, *mongo.Database) {
	router := gin.Default()

	// Inject fake user_id and mock db into context
	router.Use(func(c *gin.Context) {
		c.Set("user_id", primitive.NewObjectID().Hex())
		c.Set("db", new(mongo.Database)) // use a nil DB for now
		c.Next()
	})

	return router, nil
}

func TestCreateGroup_InvalidPayload(t *testing.T) {
	router, _ := simulateContext()
	router.POST("/groups", CreateGroup)

	body := `{"name": "", "description": ""}`
	req, _ := http.NewRequest("POST", "/groups", bytes.NewBuffer([]byte(body)))
	req.Header.Set("Content-Type", "application/json")

	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusBadRequest, resp.Code)
	assert.Contains(t, resp.Body.String(), "Invalid request")
}

func TestCreateGroup_Unauthorized(t *testing.T) {
	router := gin.Default()
	router.POST("/groups", func(c *gin.Context) {
		CreateGroup(c) // no middleware to set user_id
	})

	body := `{"name": "MyGroup", "description": "Description"}`
	req, _ := http.NewRequest("POST", "/groups", bytes.NewBuffer([]byte(body)))
	req.Header.Set("Content-Type", "application/json")

	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusUnauthorized, resp.Code)
	assert.Contains(t, resp.Body.String(), "Unauthorized")
}

func TestJoinGroup_InvalidGroupID(t *testing.T) {
	router, _ := simulateContext()
	router.POST("/groups/join/:id", JoinGroup)

	req, _ := http.NewRequest("POST", "/groups/join/invalid_id", nil)
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)
	assert.Equal(t, http.StatusBadRequest, resp.Code)
	assert.Contains(t, resp.Body.String(), "Invalid group ID")
}

func TestGetGroup_InvalidID(t *testing.T) {
	router, _ := simulateContext()
	router.GET("/groups/:id", GetGroup)

	req, _ := http.NewRequest("GET", "/groups/invalid_id", nil)
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)
	assert.Equal(t, http.StatusBadRequest, resp.Code)
	assert.Contains(t, resp.Body.String(), "Invalid group ID")
}

func TestLeaveGroup_InvalidID(t *testing.T) {
	router, _ := simulateContext()
	router.DELETE("/groups/leave/:id", LeaveGroup)

	req, _ := http.NewRequest("DELETE", "/groups/leave/invalid_id", nil)
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)
	assert.Equal(t, http.StatusBadRequest, resp.Code)
	assert.Contains(t, resp.Body.String(), "Invalid group ID")
}

func TestSearchGroups_NoQuery(t *testing.T) {
	router, _ := simulateContext()
	router.GET("/groups/search", SearchGroups)

	req, _ := http.NewRequest("GET", "/groups/search", nil)
	resp := httptest.NewRecorder()

	router.ServeHTTP(resp, req)
	assert.Equal(t, http.StatusBadRequest, resp.Code)
	assert.Contains(t, resp.Body.String(), "Search query is required")
}
