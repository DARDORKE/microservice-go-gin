package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Option struct {
	ID        uuid.UUID      `json:"id" gorm:"type:char(36);primary_key"`
	PollID    uuid.UUID      `json:"poll_id" gorm:"type:char(36);not null;index"`
	Text      string         `json:"text" gorm:"type:varchar(255);not null"`
	Order     int            `json:"order" gorm:"default:0"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
	Votes     []Vote         `json:"-" gorm:"foreignKey:OptionID;constraint:OnDelete:CASCADE"`
	VoteCount int            `json:"vote_count" gorm:"-"`
}

func (o *Option) BeforeCreate(tx *gorm.DB) error {
	o.ID = uuid.New()
	return nil
}