package models

import (
	"time"

	authModels "github.com/LuisGM875/barbersystem/internal/features/auth/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Appointments struct {
	ID              uuid.UUID      `gorm:"type:uuid;primaryKey"`
	BookingGroupID  uuid.UUID      `gorm:"type:uuid;index"`
	UserID          uuid.UUID      `gorm:"type:uuid;not null;index"`
	ServiceID       uuid.UUID      `gorm:"type:uuid;not null;index"`
	CustomerName    string         `gorm:"size:160"`
	ServiceName     string         `gorm:"size:120;not null"`
	ServicePrice    float64        `gorm:"not null"`
	ServiceDuration string         `gorm:"size:20;not null"`
	ServiceImage    string         `gorm:"not null"`
	Quantity        int            `gorm:"not null;default:1"`
	IsPrimary       bool           `gorm:"not null;default:false"`
	AppointmentDate string         `gorm:"size:10;not null;index"`
	StartTime       string         `gorm:"size:5;not null;index"`
	EndTime         string         `gorm:"size:5"`
	Status          string         `gorm:"size:20;not null;default:'PENDING'"`
	Notes           string         `gorm:"type:text"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
	DeletedAt       gorm.DeletedAt  `gorm:"index"`
	User            authModels.User `gorm:"foreignKey:UserID"`
}

func (appointment *Appointments) BeforeCreate(tx *gorm.DB) error {
	appointment.ID = uuid.New()
	return nil
}
