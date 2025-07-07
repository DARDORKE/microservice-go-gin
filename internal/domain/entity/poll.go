package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Poll represents a poll entity
type Poll struct {
	ID          uuid.UUID      `json:"id" gorm:"type:char(36);primary_key" example:"550e8400-e29b-41d4-a716-446655440000"`
	Title       string         `json:"title" gorm:"type:varchar(255);not null" validate:"required,min=3,max=255" example:"What's your favorite programming language?"`
	Description string         `json:"description" gorm:"type:text" validate:"max=500" example:"Choose your preferred programming language"`
	CreatedBy   string         `json:"created_by" gorm:"type:varchar(100)" validate:"max=100" example:"user123"`
	MultiChoice bool           `json:"multi_choice" gorm:"default:false" example:"false"`
	RequireAuth bool           `json:"require_auth" gorm:"default:false" example:"false"`
	ExpiresAt   *time.Time     `json:"expires_at" example:"2024-01-16T10:00:00Z"`
	CreatedAt   time.Time      `json:"created_at" example:"2024-01-15T10:00:00Z"`
	UpdatedAt   time.Time      `json:"updated_at" example:"2024-01-15T10:00:00Z"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
	Options     []Option       `json:"options" gorm:"foreignKey:PollID;constraint:OnDelete:CASCADE" validate:"required,min=2,max=10,dive"`
	Votes       []Vote         `json:"-" gorm:"foreignKey:PollID;constraint:OnDelete:CASCADE"`
}

func (p *Poll) BeforeCreate(tx *gorm.DB) error {
	p.ID = uuid.New()
	return nil
}

func (p *Poll) IsExpired() bool {
	if p.ExpiresAt == nil {
		return false
	}
	return time.Now().After(*p.ExpiresAt)
}

func (p *Poll) IsActive() bool {
	return !p.IsExpired() && p.DeletedAt.Time.IsZero()
}