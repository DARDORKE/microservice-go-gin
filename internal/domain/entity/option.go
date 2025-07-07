package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Option represents a poll option
type Option struct {
	ID        uuid.UUID      `json:"id" gorm:"type:char(36);primary_key" example:"550e8400-e29b-41d4-a716-446655440001"`
	PollID    uuid.UUID      `json:"poll_id" gorm:"type:char(36);not null;index" example:"550e8400-e29b-41d4-a716-446655440000"`
	Text      string         `json:"text" gorm:"type:varchar(255);not null" example:"Go"`
	Order     int            `json:"order" gorm:"default:0" example:"0"`
	CreatedAt time.Time      `json:"created_at" example:"2024-01-15T10:00:00Z"`
	UpdatedAt time.Time      `json:"updated_at" example:"2024-01-15T10:00:00Z"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
	Votes     []Vote         `json:"-" gorm:"foreignKey:OptionID;constraint:OnDelete:CASCADE"`
	VoteCount int            `json:"vote_count" gorm:"-" example:"5"`
}

func (o *Option) BeforeCreate(tx *gorm.DB) error {
	o.ID = uuid.New()
	return nil
}