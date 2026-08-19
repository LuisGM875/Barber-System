package service

import (
	"errors"

	"github.com/LuisGM875/barbersystem/internal/core/security"
	"github.com/LuisGM875/barbersystem/internal/features/auth/dto"
)

func (service *service) Login(
	request dto.LoginRequest,
) (dto.LoginResponse, error) {

	user, err := service.repository.FindByEmail(request.Email)

	if err != nil {
		return dto.LoginResponse{}, errors.New("invalid credentials")
	}

	if user == nil {
		return dto.LoginResponse{}, errors.New("invalid credentials")
	}

	if user.EmailVerified == nil || !*user.EmailVerified {
		return dto.LoginResponse{}, errors.New("verifica tu correo antes de iniciar sesión")
	}

	if !security.CheckPassword(
		request.Password,
		user.Password,
	) {
		return dto.LoginResponse{}, errors.New("invalid credentials")
	}

	token, err := security.GenerateToken(
		user.ID.String(),
		user.Email,
		user.Role,
	)

	if err != nil {
		return dto.LoginResponse{}, err
	}

	return dto.LoginResponse{
		Token: token,
		User: dto.UserResponse{
			ID:    user.ID.String(),
			Name:  user.Name,
			Phone: user.Phone,
			Email: user.Email,
			Role:  user.Role,
		},
	}, nil
}
