package service

import (
	"errors"

	"github.com/LuisGM875/barbersystem/internal/features/services/dto"
	"github.com/LuisGM875/barbersystem/internal/storage"
	"github.com/google/uuid"
	"mime/multipart"
)

func (service *service) Update(id string, request dto.UpdateServiceRequest, file *multipart.FileHeader) (dto.ServiceResponse, error) {
	serviceID, err := uuid.Parse(id)
	if err != nil {
		return dto.ServiceResponse{}, errors.New("invalid service id")
	}

	existing, err := service.repository.FindByID(serviceID.String())
	if err != nil {
		return dto.ServiceResponse{}, err
	}

	if existing == nil {
		return dto.ServiceResponse{}, errors.New("service not found")
	}

	oldImage := existing.Image

	existing.Name = request.Name
	existing.Description = request.Description
	existing.Price = request.Price
	existing.Duration = request.Duration
	existing.IsActive = request.IsActive

	var newImage string

	if file != nil {
		newImage, err = storage.SaveServiceImage(file)

		if err != nil {
			return dto.ServiceResponse{}, err
		}

		existing.Image = newImage
	}

	if err := service.repository.Update(existing); err != nil {
		// Si guardamos una imagen nueva pero falló la BD,
		// eliminamos la nueva.
		if newImage != "" {
			_ = storage.DeleteServiceImage(newImage)
		}
		return dto.ServiceResponse{}, err
	}

	// La BD se actualizó correctamente.
	// Ahora podemos eliminar la imagen anterior.
	if newImage != "" && oldImage != "" {
		referenced, referenceErr := service.repository.IsImageReferencedByAppointment(oldImage)
		if referenceErr != nil {
			return dto.ServiceResponse{}, referenceErr
		}
		if !referenced {
			_ = storage.DeleteServiceImage(oldImage)
		}
	}

	return dto.ServiceResponse{
		ID:          existing.ID.String(),
		Name:        existing.Name,
		Description: existing.Description,
		Price:       existing.Price,
		Duration:    existing.Duration,
		Image:       existing.Image,
		IsActive:    existing.IsActive,
	}, nil
}
