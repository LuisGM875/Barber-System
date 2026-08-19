package service

import (
	"errors"
	"github.com/LuisGM875/barbersystem/internal/core/security"
	"github.com/LuisGM875/barbersystem/internal/email"
	"github.com/LuisGM875/barbersystem/internal/features/auth/domain"
	"github.com/LuisGM875/barbersystem/internal/features/auth/dto"
	"github.com/LuisGM875/barbersystem/internal/features/auth/models"
	"net/url"
	"strings"
	"time"
)

func (service *service) Register(request dto.RegisterRequest) (dto.MessageResponse, error) {
	if err := security.ValidatePassword(request.Password); err != nil {
		return dto.MessageResponse{}, err
	}
	emailAddress := strings.ToLower(strings.TrimSpace(request.Email))
	existing, err := service.repository.FindByEmail(emailAddress)
	if err != nil {
		return dto.MessageResponse{}, err
	}
	if existing != nil {
		if existing.EmailVerified != nil && *existing.EmailVerified {
			return dto.MessageResponse{}, errors.New("el correo ya está registrado")
		}
		// Permite recuperar registros incompletos creados antes de que el envío
		// de correo fuera reversible o después de un fallo temporal del proveedor.
		if err := service.repository.Delete(existing.ID.String()); err != nil {
			return dto.MessageResponse{}, errors.New("no se pudo reiniciar el registro pendiente")
		}
	}
	passwordHash, err := security.HashPassword(request.Password)
	if err != nil {
		return dto.MessageResponse{}, err
	}
	verified := false
	user := models.User{Name: strings.TrimSpace(request.Name), Email: emailAddress, Phone: strings.TrimSpace(request.Phone), Password: passwordHash, Role: string(domain.RoleClient), EmailVerified: &verified}
	if err := service.repository.Create(&user); err != nil {
		return dto.MessageResponse{}, err
	}
	cleanupRegistration := func(original error) (dto.MessageResponse, error) {
		if cleanupErr := service.repository.Delete(user.ID.String()); cleanupErr != nil {
			return dto.MessageResponse{}, errors.New("no se pudo completar ni revertir el registro; contacta al administrador")
		}
		return dto.MessageResponse{}, original
	}
	rawToken, tokenHash, err := newAuthToken()
	if err != nil {
		return cleanupRegistration(err)
	}
	token := models.AuthToken{UserID: user.ID, TokenHash: tokenHash, Purpose: "VERIFY_EMAIL", ExpiresAt: time.Now().Add(24 * time.Hour)}
	if err := service.repository.CreateAuthToken(&token); err != nil {
		return cleanupRegistration(err)
	}
	link := service.frontendURL + "/verify-email?token=" + url.QueryEscape(rawToken)
	emailHTML := email.VerificationTemplate(user.Name, link)
	if err := service.emailSender.Send(user.Email, "Verifica tu correo de BarberFlow", emailHTML); err != nil {
		return cleanupRegistration(err)
	}
	return dto.MessageResponse{Message: "Revisa tu correo para verificar tu cuenta."}, nil
}
