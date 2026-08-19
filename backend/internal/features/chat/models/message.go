package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

type Message struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey"`
	ConversationID uuid.UUID `gorm:"type:uuid;not null;index:idx_chat_messages,priority:1"`
	SenderID       uuid.UUID `gorm:"type:uuid;not null;index"`
	Content        string    `gorm:"type:text"`
	Image          string    `gorm:"type:text"`
	IsRead         bool      `gorm:"not null;default:false"`
	Timestamp      time.Time `gorm:"not null;index:idx_chat_messages,priority:2"`
}

func (message *Message) BeforeCreate(tx *gorm.DB) error {
	message.ID = uuid.New()
	if message.Timestamp.IsZero() {
		message.Timestamp = time.Now()
	}
	return nil
}
