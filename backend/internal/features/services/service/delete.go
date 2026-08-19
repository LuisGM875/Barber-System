package service

import (
	"fmt"
	"github.com/LuisGM875/barbersystem/internal/storage"
)

func (service *service) Delete(id string) error {

	currentService, err := service.repository.FindByID(id)

	if err != nil || currentService == nil {
		return fmt.Errorf("service not found")
	}

	referenced := false
	if currentService.Image != "" {
		referenced, err = service.repository.IsImageReferencedByAppointment(currentService.Image)
		if err != nil {
			return err
		}
	}

	err = service.repository.Delete(id)

	if err != nil {
		return err
	}

	if currentService.Image != "" && !referenced {
		_ = storage.DeleteServiceImage(currentService.Image)
	}

	return nil
}
