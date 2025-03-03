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
		api.GET("/groups/:id", handlers.GetGroup)
		api.POST("/groups/:id/join", handlers.JoinGroup)
		api.POST("/groups/:id/leave", handlers.LeaveGroup)

		// Polls
		api.GET("/polls", handlers.ListPolls)
		// Keep the old route for backward compatibility
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
		
		// Admin User Management
		api.GET("/admin/users", wrapHandler(handlers.ListUsers))
		api.POST("/admin/users", wrapHandler(handlers.CreateUser))
		api.PUT("/admin/users/:id/role", wrapHandler(handlers.UpdateUserRole))
		api.DELETE("/admin/users/:id", wrapHandler(handlers.DeleteUser))
		
		// Admin Group and Poll Management
		api.DELETE("/admin/groups/:id", wrapHandler(handlers.AdminDeleteGroup))
		api.DELETE("/admin/polls/:id", wrapHandler(handlers.AdminDeletePoll))
		
		// Explicit Admin routes for getting all groups and polls
		// These are optional as the regular routes now check for admin role
		api.GET("/admin/groups/all", wrapHandler(handlers.AdminListAllGroups))
		api.GET("/admin/polls/all", wrapHandler(handlers.AdminListAllPolls))
	}
}

// wrapHandler converts a handler that needs db to a gin.HandlerFunc
func wrapHandler(h func(*gin.Context, *mongo.Database)) gin.HandlerFunc {
	return func(c *gin.Context) {
		db := c.MustGet("db").(*mongo.Database)
		h(c, db)
	}
}
