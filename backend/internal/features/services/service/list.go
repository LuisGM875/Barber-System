package service

import "github.com/LuisGM875/barbersystem/internal/features/services/dto"

func (service *service) FindAll() ([]dto.ServiceResponse, error) {
	services, err := service.repository.FindAll()
	if err != nil {
		return nil, err
	}

	responses := make([]dto.ServiceResponse, 0, len(services))
	for _, item := range services {
		responses = append(responses, dto.ServiceResponse{
			ID:          item.ID.String(),
			Name:        item.Name,
			Description: item.Description,
			Price:       item.Price,
			Duration:    item.Duration,
			Image:       item.Image,
			IsActive:    item.IsActive,
		})
	}

	return responses, nil
}

func (service *service) FindByID(id string) (*dto.ServiceResponse, error) {
	item, err := service.repository.FindByID(id)
	if err != nil || item == nil {
		return nil, err
	}

	response := dto.ServiceResponse{
		ID:          item.ID.String(),
		Name:        item.Name,
		Description: item.Description,
		Price:       item.Price,
		Duration:    item.Duration,
		Image:       item.Image,
		IsActive:    item.IsActive,
	}

	return &response, nil
}
