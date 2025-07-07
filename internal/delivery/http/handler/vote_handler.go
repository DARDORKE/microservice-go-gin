package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"microservice-go-gin/internal/usecase/vote"
)

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
// @Description Submit a vote for one or more options
// @Tags votes
// @Accept json
// @Produce json
// @Param id path string true "Poll ID"
// @Param vote body map[string][]string true "Vote data"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Router /api/v1/polls/{id}/vote [post]
func (h *VoteHandler) CreateVote(c *gin.Context) {
	pollIDStr := c.Param("id")
	pollID, err := uuid.Parse(pollIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid poll ID"})
		return
	}

	var requestBody struct {
		OptionIDs []string `json:"option_ids" binding:"required,min=1"`
	}

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

	c.JSON(http.StatusOK, gin.H{"message": "vote submitted successfully"})
}