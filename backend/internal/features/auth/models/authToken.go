package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

type AuthToken struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index"`
	TokenHash string    `gorm:"size:64;not null;uniqueIndex"`
	Purpose   string    `gorm:"size:30;not null;index"`
	ExpiresAt time.Time `gorm:"not null;index"`
	UsedAt    *time.Time
	CreatedAt time.Time
}

func (token *AuthToken) BeforeCreate(tx *gorm.DB) error { token.ID = uuid.New(); return nil }
