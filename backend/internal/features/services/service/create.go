package service

import (
	"fmt"
	"mime/multipart"

	"github.com/LuisGM875/barbersystem/internal/storage"
	"github.com/LuisGM875/barbersystem/internal/features/services/dto"
	"github.com/LuisGM875/barbersystem/internal/features/services/models"
)

func (service *service) Create(
	request dto.CreateServiceRequest,
	file *multipart.FileHeader,
) (dto.ServiceResponse, error) {

	imagePath, err := storage.SaveServiceImage(file)

	if err != nil {
		return dto.ServiceResponse{}, err
	}

	newService := models.Services{
		Name:        request.Name,
		Description: request.Description,
		Price:       request.Price,
		Duration:    request.Duration,
		Image:       imagePath,
		IsActive:    request.IsActive,
	}

	err = service.repository.Create(&newService)

	if err != nil {
		// Si falla la BD, eliminamos la imagen que acabamos de guardar.
		_ = storage.DeleteServiceImage(imagePath)

		return dto.ServiceResponse{}, fmt.Errorf("could not create service: %w", err)
	}

	return dto.ServiceResponse{
		ID:          newService.ID.String(),
		Name:        newService.Name,
		Description: newService.Description,
		Price:       newService.Price,
		Duration:    newService.Duration,
		Image:       newService.Image,
		IsActive:    newService.IsActive,
	}, nil
}