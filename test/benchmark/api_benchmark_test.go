package benchmark

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"microservice-go-gin/internal/delivery/http/route"
	"microservice-go-gin/internal/infrastructure/database"
)

func setupBenchmarkRouter() *gin.Engine {
	// Setup in-memory SQLite database
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		panic(err)
	}

	// Run migrations
	err = database.Migrate(db)
	if err != nil {
		panic(err)
	}

	// Setup Gin router
	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	route.SetupRoutes(router, db, "http://localhost:8080")

	return router
}

func BenchmarkCreatePoll(b *testing.B) {
	router := setupBenchmarkRouter()

	pollData := map[string]interface{}{
		"title":       "Benchmark Poll",
		"description": "Testing poll creation performance",
		"options":     []string{"Option 1", "Option 2", "Option 3", "Option 4"},
		"multi_choice": false,
		"require_auth": false,
	}

	jsonData, _ := json.Marshal(pollData)

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			req, _ := http.NewRequest("POST", "/api/v1/polls", bytes.NewBuffer(jsonData))
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			if w.Code != http.StatusCreated {
				b.Errorf("Expected status %d, got %d", http.StatusCreated, w.Code)
			}
		}
	})
}

func BenchmarkHealthCheck(b *testing.B) {
	router := setupBenchmarkRouter()

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			req, _ := http.NewRequest("GET", "/health", nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			if w.Code != http.StatusOK {
				b.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
			}
		}
	})
}

func BenchmarkCreatePollMemory(b *testing.B) {
	router := setupBenchmarkRouter()

	pollData := map[string]interface{}{
		"title":       "Memory Benchmark Poll",
		"description": "Testing memory usage",
		"options":     []string{"Option 1", "Option 2"},
		"multi_choice": false,
	}

	jsonData, _ := json.Marshal(pollData)

	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		req, _ := http.NewRequest("POST", "/api/v1/polls", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
	}
}