package service

import (
	"github.com/LuisGM875/barbersystem/internal/features/services/dto"
	"github.com/LuisGM875/barbersystem/internal/features/services/repository"
	"mime/multipart"
)

type Service interface {
	Create(
		request dto.CreateServiceRequest,
		file *multipart.FileHeader,
	) (dto.ServiceResponse, error)
	FindAll() ([]dto.ServiceResponse, error)
	FindByID(id string) (*dto.ServiceResponse, error)
	Update(
		id string,
		request dto.UpdateServiceRequest,
		file *multipart.FileHeader,
	) (dto.ServiceResponse, error)
	Delete(id string) error
}

type service struct {
	repository repository.Repository
}

func NewService(repository repository.Repository) Service {
	return &service{repository: repository}
}
