package repository

import (
	"github.com/LuisGM875/barbersystem/internal/features/services/models"
	"github.com/google/uuid"
)

type Repository interface {
	Create(service *models.Services) error
	FindAll() ([]models.Services, error)
	FindByID(id string) (*models.Services, error)
	FindByIDs(ids []uuid.UUID) ([]models.Services, error)
	Update(service *models.Services) error
	Delete(id string) error
	IsImageReferencedByAppointment(imagePath string) (bool, error)
}
