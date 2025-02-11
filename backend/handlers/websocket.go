package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// In production, check origin against allowed domains
		return true
	},
}

type Client struct {
	conn   *websocket.Conn
	userID primitive.ObjectID
	groups map[string]bool
	send   chan []byte
	hub    *Hub
	mu     sync.Mutex
}

type Hub struct {
	clients    map[*Client]bool
	groups     map[string]map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

type Message struct {
	Type    string      `json:"type"`
	Token   string      `json:"token,omitempty"`
	GroupID string      `json:"group_id,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

func newHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		groups:     make(map[string]map[*Client]bool),
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

var hub = newHub()

func init() {
	go hub.run()
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				// Remove client from all groups
				for groupID := range client.groups {
					if group, exists := h.groups[groupID]; exists {
						delete(group, client)
						if len(group) == 0 {
							delete(h.groups, groupID)
						}
					}
				}
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(512)
	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		var msg Message
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("error unmarshaling message: %v", err)
			continue
		}

		switch msg.Type {
		case "join_group":
			c.mu.Lock()
			c.groups[msg.GroupID] = true
			c.mu.Unlock()

			c.hub.mu.Lock()
			if _, exists := c.hub.groups[msg.GroupID]; !exists {
				c.hub.groups[msg.GroupID] = make(map[*Client]bool)
			}
			c.hub.groups[msg.GroupID][c] = true
			c.hub.mu.Unlock()

		case "leave_group":
			c.mu.Lock()
			delete(c.groups, msg.GroupID)
			c.mu.Unlock()

			c.hub.mu.Lock()
			if group, exists := c.hub.groups[msg.GroupID]; exists {
				delete(group, c)
				if len(group) == 0 {
					delete(c.hub.groups, msg.GroupID)
				}
			}
			c.hub.mu.Unlock()
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// BroadcastToGroup sends a message to all clients in a specific group
func (h *Hub) BroadcastToGroup(groupID string, message []byte) {
	h.mu.RLock()
	if group, exists := h.groups[groupID]; exists {
		for client := range group {
			select {
			case client.send <- message:
			default:
				close(client.send)
				delete(h.clients, client)
			}
		}
	}
	h.mu.RUnlock()
}

// HandleWebSocket upgrades the HTTP connection to a WebSocket connection
func HandleWebSocket(c *gin.Context) {
	// Get token from URL parameters
	token := c.Query("token")
	if token == "" {
		log.Println("No token provided in WebSocket connection")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No token provided"})
		return
	}

	// Validate token
	claims := jwt.MapClaims{}
	parsedToken, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("JWT_SECRET")), nil
	})

	if err != nil || !parsedToken.Valid {
		log.Printf("Invalid WebSocket token: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	userIDStr, ok := claims["user_id"].(string)
	if !ok {
		log.Println("No user_id in token claims")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
		return
	}

	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		log.Printf("Invalid user ID format: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Upgrade connection to WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade connection: %v", err)
		return
	}

	client := &Client{
		conn:   conn,
		userID: userID,
		groups: make(map[string]bool),
		send:   make(chan []byte, 256),
		hub:    hub,
	}

	client.hub.register <- client

	go client.writePump()
	go client.readPump()
}

// NotifyPollUpdate sends a poll update to all clients in the group
func NotifyPollUpdate(groupID string, pollID string, updateType string) {
	message := Message{
		Type: "poll_update",
		Data: map[string]string{
			"group_id": groupID,
			"poll_id":  pollID,
			"type":     updateType,
		},
	}

	data, err := json.Marshal(message)
	if err != nil {
		log.Printf("error marshaling poll update: %v", err)
		return
	}

	hub.BroadcastToGroup(groupID, data)
}

// NotifyVoteUpdate sends a vote update to all clients in the group
func NotifyVoteUpdate(groupID string, pollID string) {
	message := Message{
		Type: "vote_update",
		Data: map[string]string{
			"group_id": groupID,
			"poll_id":  pollID,
		},
	}

	data, err := json.Marshal(message)
	if err != nil {
		log.Printf("error marshaling vote update: %v", err)
		return
	}

	hub.BroadcastToGroup(groupID, data)
}

// NotifyCommentUpdate sends a comment update to all clients in the group
func NotifyCommentUpdate(groupID string, pollID string, updateType string) {
	message := Message{
		Type: "comment_update",
		Data: map[string]string{
			"group_id": groupID,
			"poll_id":  pollID,
			"type":     updateType,
		},
	}

	data, err := json.Marshal(message)
	if err != nil {
		log.Printf("error marshaling comment update: %v", err)
		return
	}

	hub.BroadcastToGroup(groupID, data)
}
