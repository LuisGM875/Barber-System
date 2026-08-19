package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

type Conversation struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
	User1ID   uuid.UUID `gorm:"type:uuid;not null;uniqueIndex"`
	CreatedAt time.Time
	UpdatedAt time.Time `gorm:"index"`
}

func (conversation *Conversation) BeforeCreate(tx *gorm.DB) error {
	conversation.ID = uuid.New()
	return nil
}
