package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"microservice-go-gin/internal/config"
	"microservice-go-gin/internal/delivery/http/handler"
	"microservice-go-gin/internal/delivery/http/middleware"
	"microservice-go-gin/internal/delivery/http/route"
	"microservice-go-gin/internal/infrastructure/cache"
	"microservice-go-gin/internal/infrastructure/database"
	"microservice-go-gin/internal/infrastructure/logger"
	"microservice-go-gin/internal/infrastructure/metrics"
	"microservice-go-gin/internal/usecase"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title           Microservice Go API
// @version         1.0
// @description     Un microservice haute performance développé en Go avec Gin Framework
// @termsOfService  https://example.com/terms/

// @contact.name   Kévy DARDOR
// @contact.url    https://kevy-dardor.com
// @contact.email  kevy.dardor@example.com

// @license.name  MIT
// @license.url   https://opensource.org/licenses/MIT

// @host      localhost:8080
// @BasePath  /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.

func main() {
	// Charger la configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialiser le logger
	logger := logger.NewLogger(cfg)
	logger.Info("Starting microservice-go-gin server...")

	// Initialiser les métriques Prometheus
	metrics.InitMetrics()

	// Initialiser la base de données
	db, err := database.NewDatabase(cfg)
	if err != nil {
		logger.Fatal(fmt.Sprintf("Failed to connect to database: %v", err))
	}

	// Exécuter les migrations
	if err := database.RunMigrations(db); err != nil {
		logger.Fatal(fmt.Sprintf("Failed to run migrations: %v", err))
	}

	// Initialiser Redis
	redisClient, err := cache.NewRedisClient(cfg)
	if err != nil {
		logger.Fatal(fmt.Sprintf("Failed to connect to Redis: %v", err))
	}

	// Initialiser les use cases
	userUseCase := usecase.NewUserUseCase(db, redisClient, logger)
	authUseCase := usecase.NewAuthUseCase(db, redisClient, logger, cfg)

	// Initialiser les handlers
	handlers := handler.NewHandlers(userUseCase, authUseCase, logger)

	// Configurer Gin
	if cfg.Server.Mode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Créer le router
	r := gin.New()

	// Middlewares globaux
	r.Use(middleware.Logger(logger))
	r.Use(middleware.Recovery(logger))
	r.Use(middleware.CORS())
	r.Use(middleware.RequestID())
	r.Use(middleware.Metrics())
	r.Use(middleware.RateLimiter(redisClient))

	// Routes de monitoring
	r.GET("/health", handlers.HealthCheck)
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// Documentation Swagger
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Routes API
	route.SetupRoutes(r, handlers, cfg)

	// Créer le serveur HTTP
	srv := &http.Server{
		Addr:           fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port),
		Handler:        r,
		ReadTimeout:    cfg.Server.Timeout,
		WriteTimeout:   cfg.Server.Timeout,
		MaxHeaderBytes: 1 << 20, // 1MB
	}

	// Démarrer le serveur dans une goroutine
	go func() {
		logger.Info(fmt.Sprintf("Server starting on %s:%d", cfg.Server.Host, cfg.Server.Port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal(fmt.Sprintf("Failed to start server: %v", err))
		}
	}()

	// Attendre les signaux d'arrêt
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Server shutting down...")

	// Graceful shutdown avec timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Arrêter le serveur
	if err := srv.Shutdown(ctx); err != nil {
		logger.Fatal(fmt.Sprintf("Server forced to shutdown: %v", err))
	}

	// Fermer les connexions
	if err := database.Close(db); err != nil {
		logger.Error(fmt.Sprintf("Failed to close database: %v", err))
	}

	if err := redisClient.Close(); err != nil {
		logger.Error(fmt.Sprintf("Failed to close Redis: %v", err))
	}

	logger.Info("Server exited")
}