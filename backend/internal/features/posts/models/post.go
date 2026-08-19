package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Post struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey"`
	Title       string    `gorm:"size:160;not null"`
	Description string    `gorm:"type:text;not null"`
	Image       string    `gorm:"not null"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func (post *Post) BeforeCreate(tx *gorm.DB) error {
	post.ID = uuid.New()
	return nil
}
