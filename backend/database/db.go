package database

import (
	"context"
	"log"
	"os"
	"time"
	"voteverse/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

// Collection names
const (
	UsersCollection    = "users"
	GroupsCollection   = "groups"
	PollsCollection    = "polls"
	VotesCollection    = "votes"
	CommentsCollection = "comments"
	MembersCollection  = "group_members"
)

// getDefaultAdminCredentials retrieves admin credentials from environment variables
// or falls back to default values if not set
func getDefaultAdminCredentials() (username, email, password string) {
	username = os.Getenv("DEFAULT_ADMIN_USERNAME")
	if username == "" {
		username = "admin"
	}

	email = os.Getenv("DEFAULT_ADMIN_EMAIL")
	if email == "" {
		email = "admin@voteverse.com"
	}

	password = os.Getenv("DEFAULT_ADMIN_PASSWORD")
	if password == "" {
		password = "admin123"
		log.Println("WARNING: Using default admin password. Please set DEFAULT_ADMIN_PASSWORD environment variable in production!")
	}

	return username, email, password
}

// createCollectionIndexes creates indexes for a specific collection
func createCollectionIndexes(db *mongo.Database) error {
	ctx := context.Background()

	// Users Collection Indexes
	usersIndexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "email", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys:    bson.D{{Key: "username", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
	}
	_, err := db.Collection(UsersCollection).Indexes().CreateMany(ctx, usersIndexes)
	if err != nil {
		return err
	}

	// Groups Collection Indexes
	groupsIndexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "name", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{{Key: "created_at", Value: -1}},
		},
		{
			Keys: bson.D{{Key: "created_by", Value: 1}},
		},
	}
	_, err = db.Collection(GroupsCollection).Indexes().CreateMany(ctx, groupsIndexes)
	if err != nil {
		return err
	}

	// Polls Collection Indexes
	pollsIndexes := []mongo.IndexModel{
		{
			Keys: bson.D{
				{Key: "group_id", Value: 1},
				{Key: "created_at", Value: -1},
			},
		},
		{
			Keys: bson.D{{Key: "created_by", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "end_time", Value: 1}},
		},
	}
	_, err = db.Collection(PollsCollection).Indexes().CreateMany(ctx, pollsIndexes)
	if err != nil {
		return err
	}

	// Votes Collection Indexes
	votesIndexes := []mongo.IndexModel{
		{
			Keys: bson.D{
				{Key: "poll_id", Value: 1},
				{Key: "user_id", Value: 1},
			},
			Options: options.Index().SetUnique(true), // One vote per user per poll
		},
	}
	_, err = db.Collection(VotesCollection).Indexes().CreateMany(ctx, votesIndexes)
	if err != nil {
		return err
	}

	// Comments Collection Indexes
	commentsIndexes := []mongo.IndexModel{
		{
			Keys: bson.D{
				{Key: "poll_id", Value: 1},
				{Key: "created_at", Value: -1},
			},
		},
		{
			Keys: bson.D{{Key: "created_by", Value: 1}},
		},
	}
	_, err = db.Collection(CommentsCollection).Indexes().CreateMany(ctx, commentsIndexes)
	if err != nil {
		return err
	}

	// Group Members Collection Indexes
	membersIndexes := []mongo.IndexModel{
		{
			Keys: bson.D{
				{Key: "group_id", Value: 1},
				{Key: "user_id", Value: 1},
			},
			Options: options.Index().SetUnique(true), // Unique membership
		},
		{
			Keys: bson.D{{Key: "joined_at", Value: -1}},
		},
	}
	_, err = db.Collection(MembersCollection).Indexes().CreateMany(ctx, membersIndexes)
	if err != nil {
		return err
	}

	log.Println("Successfully created all collection indexes")
	return nil
}

// EnsureDefaultAdmin checks if there's an admin user in the system
// If not, creates one with credentials from environment variables
func EnsureDefaultAdmin(db *mongo.Database) error {
	ctx := context.Background()
	usersCollection := db.Collection(UsersCollection)

	// Check if any admin exists
	count, err := usersCollection.CountDocuments(ctx, bson.M{"role": models.RoleAdmin})
	if err != nil {
		return err
	}

	// If admin exists, return
	if count > 0 {
		log.Println("Admin user already exists")
		return nil
	}

	// Get admin credentials from environment variables
	username, email, password := getDefaultAdminCredentials()

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// Create default admin user
	now := primitive.NewDateTimeFromTime(time.Now())
	adminUser := models.User{
		ID:        primitive.NewObjectID(),
		Username:  username,
		Email:     email,
		Password:  string(hashedPassword),
		Role:      models.RoleAdmin,
		CreatedAt: now,
		UpdatedAt: now,
	}

	// Insert admin user
	_, err = usersCollection.InsertOne(ctx, adminUser)
	if err != nil {
		return err
	}

	log.Printf("Created default admin user with username: %s and email: %s", username, email)
	log.Println("IMPORTANT: Please change the default admin password immediately!")
	return nil
}

// InitializeDatabase sets up the database with required indexes and default data
func InitializeDatabase(db *mongo.Database) error {
	// Create indexes for all collections
	if err := createCollectionIndexes(db); err != nil {
		return err
	}

	// Ensure default admin exists
	if err := EnsureDefaultAdmin(db); err != nil {
		return err
	}

	return nil
}
