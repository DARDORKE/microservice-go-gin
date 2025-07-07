package entity_test

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"microservice-go-gin/internal/domain/entity"
)

func TestPoll_IsExpired(t *testing.T) {
	tests := []struct {
		name      string
		expiresAt *time.Time
		expected  bool
	}{
		{
			name:      "no expiration date",
			expiresAt: nil,
			expected:  false,
		},
		{
			name:      "future expiration date",
			expiresAt: timePtr(time.Now().Add(1 * time.Hour)),
			expected:  false,
		},
		{
			name:      "past expiration date",
			expiresAt: timePtr(time.Now().Add(-1 * time.Hour)),
			expected:  true,
		},
		{
			name:      "current time expiration",
			expiresAt: timePtr(time.Now()),
			expected:  true, // Should be expired as time.Now().After(time.Now()) could be true due to precision
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			poll := &entity.Poll{
				Title:     "Test Poll",
				ExpiresAt: tt.expiresAt,
			}

			result := poll.IsExpired()
			if tt.name == "current time expiration" {
				// For current time, we accept either true or false due to timing precision
				return
			}
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestPoll_IsActive(t *testing.T) {
	tests := []struct {
		name      string
		expiresAt *time.Time
		deletedAt time.Time
		expected  bool
	}{
		{
			name:      "active poll",
			expiresAt: timePtr(time.Now().Add(1 * time.Hour)),
			deletedAt: time.Time{}, // zero value means not deleted
			expected:  true,
		},
		{
			name:      "expired poll",
			expiresAt: timePtr(time.Now().Add(-1 * time.Hour)),
			deletedAt: time.Time{},
			expected:  false,
		},
		{
			name:      "deleted poll",
			expiresAt: timePtr(time.Now().Add(1 * time.Hour)),
			deletedAt: time.Now(),
			expected:  false,
		},
		{
			name:      "no expiration but deleted",
			expiresAt: nil,
			deletedAt: time.Now(),
			expected:  false,
		},
		{
			name:      "no expiration and not deleted",
			expiresAt: nil,
			deletedAt: time.Time{},
			expected:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			poll := &entity.Poll{
				Title:     "Test Poll",
				ExpiresAt: tt.expiresAt,
			}
			poll.DeletedAt.Time = tt.deletedAt

			result := poll.IsActive()
			assert.Equal(t, tt.expected, result)
		})
	}
}

func timePtr(t time.Time) *time.Time {
	return &t
}