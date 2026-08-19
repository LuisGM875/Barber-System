package service

import (
	"github.com/LuisGM875/barbersystem/internal/email"
	"github.com/LuisGM875/barbersystem/internal/features/auth/dto"
	"github.com/LuisGM875/barbersystem/internal/features/auth/repository"
)

type Service interface {
	Register(request dto.RegisterRequest) (dto.MessageResponse, error)

	Login(request dto.LoginRequest) (dto.LoginResponse, error)

	UpdateProfile(userID string, request dto.UpdateProfileRequest) (dto.UserResponse, error)

	DeleteProfile(userID string) error
	VerifyEmail(token string) error
	RequestPasswordReset(email string) error
	ResetPassword(token, password string) error
}

type service struct {
	repository  repository.Repository
	emailSender email.Sender
	frontendURL string
}

func NewService(repository repository.Repository, emailSender email.Sender, frontendURL string) Service {
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}
	return &service{
		repository:  repository,
		emailSender: emailSender,
		frontendURL: frontendURL,
	}
}
