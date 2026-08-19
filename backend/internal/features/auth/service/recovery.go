package service

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"github.com/LuisGM875/barbersystem/internal/core/security"
	"github.com/LuisGM875/barbersystem/internal/email"
	"github.com/LuisGM875/barbersystem/internal/features/auth/models"
	"net/url"
	"strings"
	"time"
)

func newAuthToken() (string, string, error) {
	buffer := make([]byte, 32)
	if _, err := rand.Read(buffer); err != nil {
		return "", "", err
	}
	raw := hex.EncodeToString(buffer)
	sum := sha256.Sum256([]byte(raw))
	return raw, hex.EncodeToString(sum[:]), nil
}
func authTokenHash(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

func (service *service) VerifyEmail(rawToken string) error {
	token, err := service.repository.FindValidAuthToken(authTokenHash(rawToken), "VERIFY_EMAIL")
	if err != nil {
		return err
	}
	if token == nil {
		return errors.New("el enlace de verificación es inválido o expiró")
	}
	user, err := service.repository.FindByID(token.UserID.String())
	if err != nil {
		return err
	}
	verified := true
	user.EmailVerified = &verified
	if err := service.repository.Update(user); err != nil {
		return err
	}
	return service.repository.MarkAuthTokenUsed(token)
}

func (service *service) RequestPasswordReset(emailAddress string) error {
	user, err := service.repository.FindByEmail(strings.ToLower(strings.TrimSpace(emailAddress)))
	if err != nil || user == nil {
		return err
	}
	_ = service.repository.InvalidateAuthTokens(user.ID.String(), "RESET_PASSWORD")
	raw, hash, err := newAuthToken()
	if err != nil {
		return err
	}
	token := models.AuthToken{UserID: user.ID, TokenHash: hash, Purpose: "RESET_PASSWORD", ExpiresAt: time.Now().Add(30 * time.Minute)}
	if err := service.repository.CreateAuthToken(&token); err != nil {
		return err
	}
	link := service.frontendURL + "/reset-password?token=" + url.QueryEscape(raw)
	emailHTML := email.PasswordResetTemplate(user.Name, link)
	return service.emailSender.Send(user.Email, "Recuperación de contraseña de BarberFlow", emailHTML)
}

func (service *service) ResetPassword(rawToken, password string) error {
	if err := security.ValidatePassword(password); err != nil {
		return err
	}
	token, err := service.repository.FindValidAuthToken(authTokenHash(rawToken), "RESET_PASSWORD")
	if err != nil {
		return err
	}
	if token == nil {
		return errors.New("el enlace de recuperación es inválido o expiró")
	}
	user, err := service.repository.FindByID(token.UserID.String())
	if err != nil {
		return err
	}
	passwordHash, err := security.HashPassword(password)
	if err != nil {
		return err
	}
	user.Password = passwordHash
	if err := service.repository.Update(user); err != nil {
		return err
	}
	return service.repository.MarkAuthTokenUsed(token)
}
