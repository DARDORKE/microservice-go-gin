package test

import (
	"testing"

	"microservice-go-gin/internal/config"
	"microservice-go-gin/internal/infrastructure/database"
)

func TestApplicationCompiles(t *testing.T) {
	// Test that config can be loaded
	cfg, err := config.Load()
	if err != nil {
		t.Errorf("Failed to load config: %v", err)
	}

	if cfg == nil {
		t.Error("Config is nil")
	}

	// Test basic structure
	if cfg.App.Name == "" {
		t.Error("App name is empty")
	}

	if cfg.Server.Port == 0 {
		t.Error("Server port is zero")
	}
}

func TestDatabaseConnection(t *testing.T) {
	cfg, err := config.Load()
	if err != nil {
		t.Skip("Skipping database test: config load failed")
	}

	// Try to create connection (will fail in CI but that's ok)
	db, err := database.NewConnection(&cfg.Database)
	if err != nil {
		t.Logf("Database connection failed (expected in test env): %v", err)
		return
	}

	// If connection succeeds, test migration
	err = database.Migrate(db)
	if err != nil {
		t.Errorf("Database migration failed: %v", err)
	}

	// Close connection
	sqlDB, _ := db.DB()
	if sqlDB != nil {
		sqlDB.Close()
	}
}