package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	_ "microservice-go-gin/docs"
	"microservice-go-gin/internal/config"
	"microservice-go-gin/internal/delivery/http/route"
	"microservice-go-gin/internal/infrastructure/database"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title           QuickPoll API
// @version         1.0
// @description     API de création de sondages en temps réel avec Go et Gin Framework - Hot Reload
// @termsOfService  https://example.com/terms/

// @contact.name   API Support
// @contact.url    https://quickpoll.example.com
// @contact.email  support@quickpoll.example.com

// @license.name  MIT
// @license.url   https://opensource.org/licenses/MIT

// @host      localhost:8080
// @BasePath  /

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

	log.Println("Starting QuickPoll API server...")

	// Initialiser la base de données
	db, err := database.NewConnection(&cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Exécuter les migrations
	if err := database.Migrate(db); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Configurer Gin
	if cfg.App.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Créer le router
	r := gin.New()

	// Middlewares globaux
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		
		// Toujours définir les headers CORS de base
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		
		// Gérer les origines autorisées
		if cfg.App.Environment == "production" {
			allowedOrigins := []string{cfg.Server.FrontendURL}
			allowed := false
			
			// Vérifier les origines exactes et les domaines Vercel
			for _, allowedOrigin := range allowedOrigins {
				if origin == allowedOrigin || strings.HasSuffix(origin, ".vercel.app") {
					allowed = true
					break
				}
			}
			
			if allowed {
				c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
				log.Printf("CORS: Authorized origin %s", origin)
			} else {
				log.Printf("CORS: Rejected origin %s (expected: %s)", origin, cfg.Server.FrontendURL)
			}
		} else {
			// En développement, autoriser toutes les origines
			c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		}
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Routes de monitoring
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// Documentation Swagger
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Routes API
	baseURL := cfg.Server.BaseURL
	if baseURL == "" {
		baseURL = fmt.Sprintf("http://localhost:%d", cfg.Server.Port)
	}
	route.SetupRoutes(r, db, baseURL, cfg)

	// Créer le serveur HTTP
	srv := &http.Server{
		Addr:           fmt.Sprintf(":%d", cfg.Server.Port),
		Handler:        r,
		ReadTimeout:    cfg.Server.ReadTimeout,
		WriteTimeout:   cfg.Server.WriteTimeout,
		IdleTimeout:    cfg.Server.IdleTimeout,
		MaxHeaderBytes: 1 << 20, // 1MB
	}

	// Démarrer le serveur dans une goroutine
	go func() {
		log.Printf("Server starting on port %d", cfg.Server.Port)
		log.Printf("Swagger documentation: http://localhost:%d/swagger/index.html", cfg.Server.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Attendre les signaux d'arrêt
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Server shutting down...")

	// Graceful shutdown avec timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Arrêter le serveur
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	// Fermer la connexion à la base de données
	sqlDB, err := db.DB()
	if err == nil {
		sqlDB.Close()
	}

	log.Println("Server exited")
}
