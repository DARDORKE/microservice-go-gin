package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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
}

func NewVoteHandler(createVoteUC *vote.CreateVoteUseCase) *VoteHandler {
	return &VoteHandler{
		createVoteUC: createVoteUC,
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

	c.JSON(http.StatusOK, VoteResponse{Message: "vote submitted successfully"})
}