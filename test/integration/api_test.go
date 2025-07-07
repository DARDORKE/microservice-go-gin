package integration

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/suite"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"microservice-go-gin/internal/delivery/http/route"
	"microservice-go-gin/internal/domain/entity"
	"microservice-go-gin/internal/infrastructure/database"
	"microservice-go-gin/internal/usecase/poll"
)

type APITestSuite struct {
	suite.Suite
	db     *gorm.DB
	router *gin.Engine
}

func (suite *APITestSuite) SetupSuite() {
	// Setup in-memory SQLite database for testing
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	suite.Require().NoError(err)

	// Run migrations
	err = database.Migrate(db)
	suite.Require().NoError(err)

	suite.db = db

	// Setup Gin router
	gin.SetMode(gin.TestMode)
	suite.router = gin.New()
	route.SetupRoutes(suite.router, db, "http://localhost:8080")
}

func (suite *APITestSuite) TearDownTest() {
	// Clean up database after each test
	suite.db.Exec("DELETE FROM votes")
	suite.db.Exec("DELETE FROM options")
	suite.db.Exec("DELETE FROM polls")
}

func (suite *APITestSuite) TestCreatePoll() {
	// Test data
	pollData := map[string]interface{}{
		"title":       "What's your favorite programming language?",
		"description": "Choose your preferred programming language",
		"options":     []string{"Go", "Python", "JavaScript", "Java"},
		"multi_choice": false,
		"require_auth": false,
	}

	// Convert to JSON
	jsonData, err := json.Marshal(pollData)
	suite.Require().NoError(err)

	// Create request
	req, err := http.NewRequest("POST", "/api/v1/polls", bytes.NewBuffer(jsonData))
	suite.Require().NoError(err)
	req.Header.Set("Content-Type", "application/json")

	// Perform request
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	// Assert response
	suite.Equal(http.StatusCreated, w.Code)

	var response poll.CreatePollOutput
	err = json.Unmarshal(w.Body.Bytes(), &response)
	suite.Require().NoError(err)

	suite.NotEmpty(response.ID)
	suite.Contains(response.ShareURL, "http://localhost:8080/poll/")
	suite.Contains(response.QRCodeURL, "/api/v1/polls/")
	suite.Contains(response.QRCodeURL, "/qr")

	// Verify poll was created in database
	var dbPoll entity.Poll
	err = suite.db.Preload("Options").First(&dbPoll, "id = ?", response.ID).Error
	suite.Require().NoError(err)

	suite.Equal(pollData["title"], dbPoll.Title)
	suite.Equal(pollData["description"], dbPoll.Description)
	suite.Equal(len(pollData["options"].([]string)), len(dbPoll.Options))
	suite.Equal(pollData["multi_choice"], dbPoll.MultiChoice)
	suite.Equal(pollData["require_auth"], dbPoll.RequireAuth)
}

func (suite *APITestSuite) TestGetPoll() {
	// Create a poll first
	poll := &entity.Poll{
		Title:       "Test Poll",
		Description: "Test Description",
		MultiChoice: false,
		RequireAuth: false,
		CreatedBy:   "test-user",
		Options: []entity.Option{
			{Text: "Option 1", Order: 0},
			{Text: "Option 2", Order: 1},
			{Text: "Option 3", Order: 2},
		},
	}

	err := suite.db.Create(poll).Error
	suite.Require().NoError(err)

	// Create some votes for testing
	votes := []entity.Vote{
		{PollID: poll.ID, OptionID: poll.Options[0].ID, VoterID: "voter1", IPAddress: "192.168.1.1"},
		{PollID: poll.ID, OptionID: poll.Options[0].ID, VoterID: "voter2", IPAddress: "192.168.1.2"},
		{PollID: poll.ID, OptionID: poll.Options[1].ID, VoterID: "voter3", IPAddress: "192.168.1.3"},
	}

	for _, vote := range votes {
		err := suite.db.Create(&vote).Error
		suite.Require().NoError(err)
	}

	// Test getting the poll
	req, err := http.NewRequest("GET", fmt.Sprintf("/api/v1/polls/%s", poll.ID.String()), nil)
	suite.Require().NoError(err)

	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	suite.Equal(http.StatusOK, w.Code)

	var response entity.Poll
	err = json.Unmarshal(w.Body.Bytes(), &response)
	suite.Require().NoError(err)

	suite.Equal(poll.ID, response.ID)
	suite.Equal(poll.Title, response.Title)
	suite.Equal(poll.Description, response.Description)
	suite.Equal(len(poll.Options), len(response.Options))

	// Check vote counts
	option1VoteCount := 0
	option2VoteCount := 0
	for _, option := range response.Options {
		if option.Text == "Option 1" {
			option1VoteCount = option.VoteCount
		} else if option.Text == "Option 2" {
			option2VoteCount = option.VoteCount
		}
	}

	suite.Equal(2, option1VoteCount)
	suite.Equal(1, option2VoteCount)
}

func (suite *APITestSuite) TestVoteOnPoll() {
	// Create a poll first
	poll := &entity.Poll{
		Title:       "Test Poll",
		Description: "Test Description",
		MultiChoice: false,
		RequireAuth: false,
		CreatedBy:   "test-user",
		Options: []entity.Option{
			{Text: "Option 1", Order: 0},
			{Text: "Option 2", Order: 1},
		},
	}

	err := suite.db.Create(poll).Error
	suite.Require().NoError(err)

	// Test voting
	voteData := map[string]interface{}{
		"option_ids": []string{poll.Options[0].ID.String()},
	}

	jsonData, err := json.Marshal(voteData)
	suite.Require().NoError(err)

	req, err := http.NewRequest("POST", fmt.Sprintf("/api/v1/polls/%s/vote", poll.ID.String()), bytes.NewBuffer(jsonData))
	suite.Require().NoError(err)
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	suite.Equal(http.StatusOK, w.Code)

	var response map[string]string
	err = json.Unmarshal(w.Body.Bytes(), &response)
	suite.Require().NoError(err)

	suite.Equal("vote submitted successfully", response["message"])

	// Verify vote was recorded
	var voteCount int64
	err = suite.db.Model(&entity.Vote{}).Where("poll_id = ? AND option_id = ?", poll.ID, poll.Options[0].ID).Count(&voteCount).Error
	suite.Require().NoError(err)
	suite.Equal(int64(1), voteCount)
}

func (suite *APITestSuite) TestGetPollNotFound() {
	// Test getting non-existent poll
	nonExistentID := uuid.New()
	req, err := http.NewRequest("GET", fmt.Sprintf("/api/v1/polls/%s", nonExistentID.String()), nil)
	suite.Require().NoError(err)

	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	suite.Equal(http.StatusNotFound, w.Code)

	var response map[string]string
	err = json.Unmarshal(w.Body.Bytes(), &response)
	suite.Require().NoError(err)

	suite.Equal("poll not found", response["error"])
}

func (suite *APITestSuite) TestCreatePollValidation() {
	// Test creating poll with invalid data
	invalidPollData := map[string]interface{}{
		"title": "Test Poll",
		// Missing required options field
	}

	jsonData, err := json.Marshal(invalidPollData)
	suite.Require().NoError(err)

	req, err := http.NewRequest("POST", "/api/v1/polls", bytes.NewBuffer(jsonData))
	suite.Require().NoError(err)
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	suite.Equal(http.StatusBadRequest, w.Code)
}

func (suite *APITestSuite) TestHealthCheck() {
	req, err := http.NewRequest("GET", "/health", nil)
	suite.Require().NoError(err)

	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	suite.Equal(http.StatusOK, w.Code)

	var response map[string]string
	err = json.Unmarshal(w.Body.Bytes(), &response)
	suite.Require().NoError(err)

	suite.Equal("healthy", response["status"])
	suite.Equal("QuickPoll API", response["service"])
}

func TestAPITestSuite(t *testing.T) {
	suite.Run(t, new(APITestSuite))
}