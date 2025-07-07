package route

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"microservice-go-gin/internal/delivery/http/handler"
	"microservice-go-gin/internal/delivery/websocket"
	"microservice-go-gin/internal/infrastructure/database"
	"microservice-go-gin/internal/usecase/poll"
	"microservice-go-gin/internal/usecase/vote"
)

func SetupRoutes(router *gin.Engine, db *gorm.DB, baseURL string) {
	// Initialize repositories
	pollRepo := database.NewPollRepository(db)
	voteRepo := database.NewVoteRepository(db)

	// Initialize use cases
	createPollUC := poll.NewCreatePollUseCase(pollRepo, baseURL)
	getPollUC := poll.NewGetPollUseCase(pollRepo, voteRepo)
	createVoteUC := vote.NewCreateVoteUseCase(pollRepo, voteRepo)

	// Initialize handlers
	pollHandler := handler.NewPollHandler(createPollUC, getPollUC)
	voteHandler := handler.NewVoteHandler(createVoteUC)
	qrHandler := handler.NewQRHandler(baseURL)
	wsHub := websocket.NewHub()

	// Start WebSocket hub
	go wsHub.Run()

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Poll routes
		polls := v1.Group("/polls")
		{
			polls.POST("", pollHandler.CreatePoll)
			polls.GET("/:id", pollHandler.GetPoll)
			polls.POST("/:id/vote", voteHandler.CreateVote)
			polls.GET("/:id/qr", qrHandler.GenerateQRCode)
		}
	}

	// WebSocket route
	router.GET("/ws/polls/:id", func(c *gin.Context) {
		websocket.HandleWebSocket(c, wsHub)
	})

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "healthy",
			"service": "QuickPoll API",
		})
	})
}