package models

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	RoleUser  = "user"
	RoleAdmin = "admin"
)

// User represents a user in the system
type User struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Username  string             `bson:"username" json:"username" binding:"required"`
	Email     string             `bson:"email" json:"email" binding:"required,email"`
	Password  string             `bson:"password" json:"-" binding:"required"`
	Role      string             `bson:"role" json:"role"`
	CreatedAt primitive.DateTime `bson:"created_at" json:"created_at"`
	UpdatedAt primitive.DateTime `bson:"updated_at" json:"updated_at"`
}

// Group represents a group where polls can be created
type Group struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Name        string             `bson:"name" json:"name" binding:"required"`
	Description string             `bson:"description" json:"description"`
	CreatedBy   primitive.ObjectID `bson:"created_by" json:"created_by"`
	CreatedAt   primitive.DateTime `bson:"created_at" json:"created_at"`
	UpdatedAt   primitive.DateTime `bson:"updated_at" json:"updated_at"`
	IsActive    bool               `bson:"is_active" json:"is_active"`
}

// GroupMember represents a user's membership in a group
type GroupMember struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	GroupID   primitive.ObjectID `bson:"group_id" json:"group_id"`
	UserID    primitive.ObjectID `bson:"user_id" json:"user_id"`
	Role      string             `bson:"role" json:"role"` // "admin" or "member"
	JoinedAt  primitive.DateTime `bson:"joined_at" json:"joined_at"`
	UpdatedAt primitive.DateTime `bson:"updated_at" json:"updated_at"`
}

// Poll represents a poll in a group
type Poll struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	GroupID     primitive.ObjectID `bson:"group_id,omitempty" json:"group_id,omitempty"` // Optional for public polls
	CreatedBy   primitive.ObjectID `bson:"created_by" json:"created_by"`
	Title       string             `bson:"title" json:"title" binding:"required"`
	Description string             `bson:"description" json:"description"`
	Options     []PollOption       `bson:"options" json:"options" binding:"required,min=2"`
	StartTime   primitive.DateTime `bson:"start_time" json:"start_time"`
	EndTime     primitive.DateTime `bson:"end_time" json:"end_time"`
	CreatedAt   primitive.DateTime `bson:"created_at" json:"created_at"`
	UpdatedAt   primitive.DateTime `bson:"updated_at" json:"updated_at"`
	IsActive    bool               `bson:"is_active" json:"is_active"`
	Visibility  string             `bson:"visibility" json:"visibility"` // "public" or "group"
}

// PollOption represents an option in a poll
type PollOption struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Text      string             `bson:"text" json:"text" binding:"required"`
	ImageURL  string             `bson:"image_url,omitempty" json:"image_url,omitempty"`
	VoteCount int                `bson:"vote_count" json:"vote_count"`
}

// Vote represents a user's vote on a poll option
type Vote struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	PollID    primitive.ObjectID `bson:"poll_id" json:"poll_id"`
	UserID    primitive.ObjectID `bson:"user_id" json:"user_id"`
	OptionID  primitive.ObjectID `bson:"option_id" json:"option_id"`
	CreatedAt primitive.DateTime `bson:"created_at" json:"created_at"`
	UpdatedAt primitive.DateTime `bson:"updated_at" json:"updated_at"`
}

// Comment represents a comment on a poll
type Comment struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	PollID    primitive.ObjectID `bson:"poll_id" json:"poll_id"`
	UserID    primitive.ObjectID `bson:"user_id" json:"user_id"`
	Text      string             `bson:"text" json:"text" binding:"required"`
	CreatedAt primitive.DateTime `bson:"created_at" json:"created_at"`
	UpdatedAt primitive.DateTime `bson:"updated_at" json:"updated_at"`
}
