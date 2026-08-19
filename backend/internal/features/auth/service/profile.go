package service

import (
	"errors"
	"strings"

	"github.com/LuisGM875/barbersystem/internal/features/auth/dto"
)

func (service *service) UpdateProfile(userID string, request dto.UpdateProfileRequest) (dto.UserResponse, error) {
	user, err := service.repository.FindByID(userID)
	if err != nil || user == nil {
		return dto.UserResponse{}, errors.New("usuario no encontrado")
	}

	email := strings.ToLower(strings.TrimSpace(request.Email))
	if email != user.Email {
		existing, err := service.repository.FindByEmail(email)
		if err != nil {
			return dto.UserResponse{}, err
		}
		if existing != nil {
			return dto.UserResponse{}, errors.New("el correo ya está registrado")
		}
	}

	user.Name = strings.TrimSpace(request.Name)
	user.Email = email
	user.Phone = strings.TrimSpace(request.Phone)
	if err := service.repository.Update(user); err != nil {
		return dto.UserResponse{}, err
	}

	return dto.UserResponse{ID: user.ID.String(), Name: user.Name, Phone: user.Phone, Email: user.Email, Role: user.Role, IsActive: true}, nil
}

func (service *service) DeleteProfile(userID string) error {
	user, err := service.repository.FindByID(userID)
	if err != nil || user == nil {
		return errors.New("usuario no encontrado")
	}
	return service.repository.Delete(userID)
}
