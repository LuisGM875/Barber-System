package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Services struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey"`
	Name        string    `gorm:"size:120;not null"`
	Description string    `gorm:"type:text;not null"`
	Price       float64   `gorm:"not null"`
	Duration    string    `gorm:"size:20;not null"`
	Image       string    `gorm:"not null"`
	IsActive    bool      `gorm:"default:true"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	DeletedAt   gorm.DeletedAt `gorm:"index"`
}

func (service *Services) BeforeCreate(tx *gorm.DB) error {
	service.ID = uuid.New()
	return nil
}
