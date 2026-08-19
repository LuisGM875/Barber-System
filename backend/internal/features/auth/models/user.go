package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

type User struct {
	ID            uuid.UUID `gorm:"type:uuid;primaryKey"`
	Name          string    `gorm:"size:100;not null"`
	Email         string    `gorm:"size:255;uniqueIndex;not null"`
	Password      string    `gorm:"not null"`
	Role          string    `gorm:"not null;default:'CLIENT'"`
	Phone         string    `gorm:"not null"`
	EmailVerified *bool     `gorm:"not null;default:true"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
	DeletedAt     gorm.DeletedAt `gorm:"index"`
}

func (user *User) BeforeCreate(tx *gorm.DB) error {
	user.ID = uuid.New()
	return nil
}
