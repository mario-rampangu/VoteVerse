package helpers

import (
	"net/http"
	"net/http/httptest"

	"github.com/gin-gonic/gin"
)

// TestServer provides a test HTTP server for testing handlers
type TestServer struct {
	Engine *gin.Engine
	Server *httptest.Server
}

// NewTestServer creates a new test server with Gin engine
func NewTestServer() *TestServer {
	gin.SetMode(gin.TestMode)
	engine := gin.New()
	engine.Use(gin.Recovery())

	return &TestServer{
		Engine: engine,
	}
}

// Start starts the test server
func (ts *TestServer) Start() {
	ts.Server = httptest.NewServer(ts.Engine)
}

// Close closes the test server
func (ts *TestServer) Close() {
	if ts.Server != nil {
		ts.Server.Close()
	}
}

// URL returns the base URL of the test server
func (ts *TestServer) URL() string {
	if ts.Server == nil {
		return ""
	}
	return ts.Server.URL
}

// ServeHTTP processes an HTTP request and returns a response for testing
func (ts *TestServer) ServeHTTP(req *http.Request) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	ts.Engine.ServeHTTP(w, req)
	return w
}
