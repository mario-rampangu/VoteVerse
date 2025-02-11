package handlers

import (
	"bytes"
	"context"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
	"voteverse/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

const bcryptCost = 12

type SignUpRequest struct {
	Username string `json:"username" binding:"required,min=3"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type SignInRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

func generateToken(userID primitive.ObjectID) (string, error) {
	expiryHours, err := strconv.Atoi(os.Getenv("JWT_EXPIRY_HOURS"))
	if err != nil {
		expiryHours = 24 // default to 24 hours if not set
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID.Hex(),
		"exp":     time.Now().Add(time.Hour * time.Duration(expiryHours)).Unix(),
	})
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

func SignUp(c *gin.Context, db *mongo.Database) {
	// Log raw request body
	body, err := c.GetRawData()
	if err != nil {
		log.Printf("Error reading raw body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Could not read request body"})
		return
	}
	log.Printf("Raw request body: %s", string(body))

	// Since we read the body, we need to restore it for binding
	c.Request.Body = io.NopCloser(bytes.NewBuffer(body))

	var req SignUpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Validation failed",
			"details": gin.H{
				"message": "Please ensure all fields are filled correctly",
				"requirements": gin.H{
					"username": "At least 3 characters required",
					"email":    "Valid email address required",
					"password": "At least 6 characters required",
				},
			},
		})
		return
	}

	// Check if user already exists
	var existingUser models.User
	usersCollection := db.Collection("users")
	err = usersCollection.FindOne(context.Background(), bson.M{
		"$or": []bson.M{
			{"email": req.Email},
			{"username": req.Username},
		},
	}).Decode(&existingUser)

	if err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": "User already exists",
			"details": gin.H{
				"message": "A user with this email or username already exists",
			},
		})
		return
	}

	if err != mongo.ErrNoDocuments {
		log.Printf("Database error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcryptCost)
	if err != nil {
		log.Printf("Password hashing error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Create new user
	now := primitive.NewDateTimeFromTime(time.Now())
	user := models.User{
		ID:        primitive.NewObjectID(),
		Username:  req.Username,
		Email:     req.Email,
		Password:  string(hashedPassword),
		Role:      models.RoleUser, // Default role is user
		CreatedAt: now,
		UpdatedAt: now,
	}

	// Special case: First user in the system becomes admin
	count, err := usersCollection.CountDocuments(context.Background(), bson.M{})
	if err != nil {
		log.Printf("Error counting users: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if count == 0 {
		user.Role = models.RoleAdmin
	}

	_, err = usersCollection.InsertOne(context.Background(), user)
	if err != nil {
		log.Printf("User creation error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Generate JWT token
	token, err := generateToken(user.ID)
	if err != nil {
		log.Printf("Token generation error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	user.Password = "" // Don't send password back
	c.JSON(http.StatusCreated, AuthResponse{
		Token: token,
		User:  user,
	})
}

func SignIn(c *gin.Context, db *mongo.Database) {
	var req SignInRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find user by email
	var user models.User
	usersCollection := db.Collection("users")
	err := usersCollection.FindOne(context.Background(), bson.M{"email": req.Email}).Decode(&user)
	if err == mongo.ErrNoDocuments {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// Generate JWT token
	token, err := generateToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	user.Password = "" // Don't send password back
	c.JSON(http.StatusOK, AuthResponse{
		Token: token,
		User:  user,
	})
}

// GetProfile handles GET /api/user/profile requests
func GetProfile(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Convert string ID to ObjectID
	userID, err := primitive.ObjectIDFromHex(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get user from database
	var user models.User
	err = c.MustGet("db").(*mongo.Database).Collection("users").
		FindOne(context.Background(), bson.M{"_id": userID}).
		Decode(&user)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Clear sensitive data
	user.Password = ""

	c.JSON(http.StatusOK, user)
}

// AuthMiddleware verifies the JWT token and sets user_id in context
func AuthMiddleware(db *mongo.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>"
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		token := tokenParts[1]
		claims := jwt.MapClaims{}

		// Parse and validate token
		parsedToken, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if err != nil || !parsedToken.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Set user_id in context
		if userID, ok := claims["user_id"].(string); ok {
			c.Set("user_id", userID)
			c.Set("db", db)
			c.Next()
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}
	}
}
