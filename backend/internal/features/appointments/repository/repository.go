package repository

import (
	"time"

	"github.com/LuisGM875/barbersystem/internal/features/appointments/models"
	"github.com/google/uuid"
)

type Repository interface {
	WithDateLock(date string, operation func(Repository) error) error
	Create(appointment *models.Appointments) error
	FindByUserID(userID string) ([]models.Appointments, error)
	FindAll() ([]models.Appointments, error)
	FindByDateRange(from, to string) ([]models.Appointments, error)
	FindByDate(date time.Time) ([]models.Appointments, error)
	GetByID(id uuid.UUID) (*models.Appointments, error)
	Update(appointment *models.Appointments) error
	UpdateSchedule(appointment *models.Appointments) error
}
