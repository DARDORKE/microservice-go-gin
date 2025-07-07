package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Poll struct {
	ID          uuid.UUID      `json:"id" gorm:"type:char(36);primary_key"`
	Title       string         `json:"title" gorm:"type:varchar(255);not null"`
	Description string         `json:"description" gorm:"type:text"`
	CreatedBy   string         `json:"created_by" gorm:"type:varchar(100)"`
	MultiChoice bool           `json:"multi_choice" gorm:"default:false"`
	RequireAuth bool           `json:"require_auth" gorm:"default:false"`
	ExpiresAt   *time.Time     `json:"expires_at"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
	Options     []Option       `json:"options" gorm:"foreignKey:PollID;constraint:OnDelete:CASCADE"`
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