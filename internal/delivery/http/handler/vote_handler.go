package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"microservice-go-gin/internal/delivery/websocket"
	"microservice-go-gin/internal/domain/repository"
	"microservice-go-gin/internal/usecase/poll"
	"microservice-go-gin/internal/usecase/vote"
)

// VoteRequest represents the request body for voting
type VoteRequest struct {
	OptionIDs []string `json:"option_ids" binding:"required,min=1" example:"550e8400-e29b-41d4-a716-446655440001"`
}

// VoteResponse represents the response after voting
type VoteResponse struct {
	Message string `json:"message" example:"vote submitted successfully"`
}

type VoteHandler struct {
	createVoteUC *vote.CreateVoteUseCase
	getPollUC    *poll.GetPollUseCase
	wsHub        *websocket.Hub
	voteRepo     repository.VoteRepository
}

func NewVoteHandler(createVoteUC *vote.CreateVoteUseCase, getPollUC *poll.GetPollUseCase, wsHub *websocket.Hub, voteRepo repository.VoteRepository) *VoteHandler {
	return &VoteHandler{
		createVoteUC: createVoteUC,
		getPollUC:    getPollUC,
		wsHub:        wsHub,
		voteRepo:     voteRepo,
	}
}

// CreateVote godoc
// @Summary Submit a vote
// @Description Submit a vote for one or more options in a poll
// @Tags votes
// @Accept json
// @Produce json
// @Param id path string true "Poll ID" format(uuid)
// @Param vote body VoteRequest true "Vote data with option IDs"
// @Success 200 {object} VoteResponse "Vote submitted successfully"
// @Failure 400 {object} map[string]string "Invalid request or voting error"
// @Router /api/v1/polls/{id}/vote [post]
func (h *VoteHandler) CreateVote(c *gin.Context) {
	pollIDStr := c.Param("id")
	pollID, err := uuid.Parse(pollIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid poll ID"})
		return
	}

	var requestBody VoteRequest

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var optionIDs []uuid.UUID
	for _, idStr := range requestBody.OptionIDs {
		optionID, err := uuid.Parse(idStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid option ID"})
			return
		}
		optionIDs = append(optionIDs, optionID)
	}

	input := vote.CreateVoteInput{
		PollID:    pollID,
		OptionIDs: optionIDs,
		VoterID:   c.ClientIP(),
		IPAddress: c.ClientIP(),
		UserAgent: c.Request.UserAgent(),
	}

	if err := h.createVoteUC.Execute(c.Request.Context(), input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get updated poll data and broadcast via WebSocket
	updatedPoll, err := h.getPollUC.Execute(c.Request.Context(), pollID)
	if err == nil {
		// Create a map of option votes for quick lookup
		optionVotes := make(map[string]int)
		totalVotes := 0
		for _, option := range updatedPoll.Options {
			optionVotes[option.ID.String()] = option.VoteCount
			totalVotes += option.VoteCount
		}

		// Broadcast updates for each voted option
		for _, optionID := range optionIDs {
			voteData := map[string]interface{}{
				"option_id":   optionID.String(),
				"poll_id":     pollID.String(),
				"votes":       optionVotes[optionID.String()],
				"total_votes": totalVotes,
			}
			h.wsHub.BroadcastVoteUpdate(pollID, voteData)
		}
	}

	c.JSON(http.StatusOK, VoteResponse{Message: "vote submitted successfully"})
}

// HasVotedResponse represents the response for checking if user has voted
type HasVotedResponse struct {
	HasVoted bool `json:"has_voted" example:"true"`
}

// HasVoted godoc
// @Summary Check if user has voted
// @Description Check if the current user (by IP) has already voted in this poll
// @Tags votes
// @Produce json
// @Param id path string true "Poll ID" format(uuid)
// @Success 200 {object} HasVotedResponse "Voting status"
// @Failure 400 {object} map[string]string "Invalid poll ID"
// @Router /api/v1/polls/{id}/has-voted [get]
func (h *VoteHandler) HasVoted(c *gin.Context) {
	pollIDStr := c.Param("id")
	pollID, err := uuid.Parse(pollIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid poll ID"})
		return
	}

	voterID := c.ClientIP()
	hasVoted, err := h.voteRepo.HasVoted(c.Request.Context(), pollID, voterID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check voting status"})
		return
	}

	c.JSON(http.StatusOK, HasVotedResponse{HasVoted: hasVoted})
}