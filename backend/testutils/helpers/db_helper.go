package helpers

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
)

// DBHelper provides utility functions for database operations in tests
type DBHelper struct {
	Client *mongo.Client
	DB     *mongo.Database
}

// NewDBHelper creates a new DBHelper
func NewDBHelper() *DBHelper {
	// Get MongoDB connection string from environment or use a default for testing
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017"
	}

	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "voteverse_test"
	}

	// Connect to MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}

	// Ping the database
	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatalf("Failed to ping MongoDB: %v", err)
	}

	return &DBHelper{
		Client: client,
		DB:     client.Database(dbName),
	}
}

// Cleanup cleans up test data and disconnects from the database
func (h *DBHelper) Cleanup() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Drop the test database
	err := h.DB.Drop(ctx)
	if err != nil {
		log.Printf("Failed to drop test database: %v", err)
	}

	// Disconnect from MongoDB
	err = h.Client.Disconnect(ctx)
	if err != nil {
		log.Printf("Failed to disconnect from MongoDB: %v", err)
	}
}

// InsertTestUser inserts a test user into the database
func (h *DBHelper) InsertTestUser(user *models.User) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := h.DB.Collection("users").InsertOne(ctx, user)
	return err
}

// InsertTestGroup inserts a test group into the database
func (h *DBHelper) InsertTestGroup(group *models.Group) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := h.DB.Collection("groups").InsertOne(ctx, group)
	return err
}

// InsertTestPoll inserts a test poll into the database
func (h *DBHelper) InsertTestPoll(poll *models.Poll) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := h.DB.Collection("polls").InsertOne(ctx, poll)
	return err
}

// InsertTestGroupMember inserts a test group member into the database
func (h *DBHelper) InsertTestGroupMember(groupMember *models.GroupMember) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := h.DB.Collection("group_members").InsertOne(ctx, groupMember)
	return err
}

// FindUserByID finds a user by ID
func (h *DBHelper) FindUserByID(id primitive.ObjectID) (*models.User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User
	err := h.DB.Collection("users").FindOne(ctx, bson.M{"_id": id}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// FindGroupByID finds a group by ID
func (h *DBHelper) FindGroupByID(id primitive.ObjectID) (*models.Group, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var group models.Group
	err := h.DB.Collection("groups").FindOne(ctx, bson.M{"_id": id}).Decode(&group)
	if err != nil {
		return nil, err
	}
	return &group, nil
}

// FindPollByID finds a poll by ID
func (h *DBHelper) FindPollByID(id primitive.ObjectID) (*models.Poll, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var poll models.Poll
	err := h.DB.Collection("polls").FindOne(ctx, bson.M{"_id": id}).Decode(&poll)
	if err != nil {
		return nil, err
	}
	return &poll, nil
}

// ClearCollection clears a collection in the database
func (h *DBHelper) ClearCollection(collectionName string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := h.DB.Collection(collectionName).DeleteMany(ctx, bson.M{})
	return err
}
