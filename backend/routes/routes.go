package routes

import (
	"voteverse/handlers"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
)

func SetupRoutes(r *gin.Engine, db *mongo.Database) {
	// Public routes
	r.POST("/api/auth/signup", wrapHandler(handlers.SignUp))
	r.POST("/api/auth/signin", wrapHandler(handlers.SignIn))

	// Protected routes
	api := r.Group("/api")
	api.Use(handlers.AuthMiddleware(db))
	{
		// WebSocket
		api.GET("/ws", handlers.HandleWebSocket)

		// Groups
		api.GET("/groups", handlers.ListGroups)
		api.POST("/groups", handlers.CreateGroup)
		api.GET("/groups/search", handlers.SearchGroups)
		api.POST("/groups/:id/join", handlers.JoinGroup)

		// Polls
		api.GET("/polls", handlers.ListPolls)
		api.GET("/polls/group/:groupId", handlers.ListPolls)
		api.POST("/polls", handlers.CreatePoll)
		api.POST("/polls/:id/vote", handlers.Vote)
		api.GET("/polls/:id", handlers.GetPoll)

		// Comments
		api.POST("/comments/poll/:pollId", handlers.CreateComment)
		api.GET("/comments/poll/:pollId", handlers.ListComments)
		api.DELETE("/comments/:id", handlers.DeleteComment)

		// User Profile
		api.GET("/user/profile", handlers.GetProfile)
	}
}

// wrapHandler converts a handler that needs db to a gin.HandlerFunc
func wrapHandler(h func(*gin.Context, *mongo.Database)) gin.HandlerFunc {
	return func(c *gin.Context) {
		db := c.MustGet("db").(*mongo.Database)
		h(c, db)
	}
}
