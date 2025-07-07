package route

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"microservice-go-gin/internal/config"
	"microservice-go-gin/internal/delivery/http/handler"
	"microservice-go-gin/internal/delivery/websocket"
	"microservice-go-gin/internal/infrastructure/database"
	"microservice-go-gin/internal/usecase/poll"
	"microservice-go-gin/internal/usecase/vote"
)

func SetupRoutes(router *gin.Engine, db *gorm.DB, baseURL string, cfg *config.Config) {
	// Initialize repositories
	pollRepo := database.NewPollRepository(db)
	voteRepo := database.NewVoteRepository(db)

	// Initialize use cases
	createPollUC := poll.NewCreatePollUseCase(pollRepo, baseURL)
	getPollUC := poll.NewGetPollUseCase(pollRepo, voteRepo)
	createVoteUC := vote.NewCreateVoteUseCase(pollRepo, voteRepo)

	// Initialize WebSocket hub
	wsHub := websocket.NewHub()

	// Initialize handlers
	pollHandler := handler.NewPollHandler(createPollUC, getPollUC)
	voteHandler := handler.NewVoteHandler(createVoteUC, getPollUC, wsHub, voteRepo)
	qrHandler := handler.NewQRHandler(baseURL)

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
			polls.GET("/:id/has-voted", voteHandler.HasVoted)
			polls.GET("/:id/qr", qrHandler.GenerateQRCode)
		}
	}

	// WebSocket route
	router.GET("/ws/polls/:id", func(c *gin.Context) {
		websocket.HandleWebSocket(c, wsHub)
	})

	// Poll redirect route for QR codes
	router.GET("/poll/:id", func(c *gin.Context) {
		pollID := c.Param("id")
		frontendURL := cfg.Server.FrontendURL
		redirectURL := frontendURL + "?poll=" + pollID
		c.Redirect(302, redirectURL)
	})

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "healthy",
			"service": "QuickPoll API",
		})
	})
}