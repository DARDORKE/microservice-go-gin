package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"microservice-go-gin/internal/usecase/poll"
)

type PollHandler struct {
	createPollUC *poll.CreatePollUseCase
	getPollUC    *poll.GetPollUseCase
}

func NewPollHandler(createPollUC *poll.CreatePollUseCase, getPollUC *poll.GetPollUseCase) *PollHandler {
	return &PollHandler{
		createPollUC: createPollUC,
		getPollUC:    getPollUC,
	}
}

// CreatePoll godoc
// @Summary Create a new poll
// @Description Create a new poll with options
// @Tags polls
// @Accept json
// @Produce json
// @Param poll body poll.CreatePollInput true "Poll data"
// @Success 201 {object} poll.CreatePollOutput
// @Failure 400 {object} map[string]string
// @Router /api/v1/polls [post]
func (h *PollHandler) CreatePoll(c *gin.Context) {
	var input poll.CreatePollInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input.CreatedBy = c.ClientIP()

	output, err := h.createPollUC.Execute(c.Request.Context(), input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, output)
}

// GetPoll godoc
// @Summary Get poll details
// @Description Get poll details with current results and vote counts
// @Tags polls
// @Accept json
// @Produce json
// @Param id path string true "Poll ID" format(uuid)
// @Success 200 {object} entity.Poll "Poll details with results"
// @Failure 400 {object} map[string]string "Invalid poll ID"
// @Failure 404 {object} map[string]string "Poll not found"
// @Router /api/v1/polls/{id} [get]
func (h *PollHandler) GetPoll(c *gin.Context) {
	idStr := c.Param("id")
	pollID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid poll ID"})
		return
	}

	poll, err := h.getPollUC.Execute(c.Request.Context(), pollID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "poll not found"})
		return
	}

	c.JSON(http.StatusOK, poll)
}