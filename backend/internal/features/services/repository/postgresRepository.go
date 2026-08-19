package repository

import (
	"errors"

	"github.com/LuisGM875/barbersystem/internal/features/services/models"
	"gorm.io/gorm"
)

type postgresRepository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &postgresRepository{db: db}
}

func (repository *postgresRepository) Create(service *models.Services) error {
	return repository.db.Create(service).Error
}

func (repository *postgresRepository) FindAll() ([]models.Services, error) {
	var services []models.Services
	err := repository.db.Order("created_at DESC").Find(&services).Error
	return services, err
}

func (repository *postgresRepository) FindByID(id string) (*models.Services, error) {
	var service models.Services
	err := repository.db.Where("id = ?", id).First(&service).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}

	if err != nil {
		return nil, err
	}

	return &service, nil
}

func (repository *postgresRepository) Update(service *models.Services) error {
	return repository.db.Save(service).Error
}

func (repository *postgresRepository) Delete(id string) error {
	return repository.db.Delete(&models.Services{}, "id = ?", id).Error
}

func (repository *postgresRepository) IsImageReferencedByAppointment(imagePath string) (bool, error) {
	var count int64
	err := repository.db.Table("appointments").Where("service_image = ?", imagePath).Count(&count).Error
	return count > 0, err
}
