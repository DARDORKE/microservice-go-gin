package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Vote struct {
	ID         uuid.UUID `json:"id" gorm:"type:char(36);primary_key"`
	PollID     uuid.UUID `json:"poll_id" gorm:"type:char(36);not null;index"`
	OptionID   uuid.UUID `json:"option_id" gorm:"type:char(36);not null;index"`
	VoterID    string    `json:"voter_id" gorm:"type:varchar(100);index"`
	IPAddress  string    `json:"ip_address" gorm:"type:varchar(45)"`
	UserAgent  string    `json:"user_agent" gorm:"type:varchar(255)"`
	CreatedAt  time.Time `json:"created_at"`
	Poll       *Poll     `json:"-" gorm:"foreignKey:PollID"`
	Option     *Option   `json:"-" gorm:"foreignKey:OptionID"`
}

func (v *Vote) BeforeCreate(tx *gorm.DB) error {
	v.ID = uuid.New()
	return nil
}