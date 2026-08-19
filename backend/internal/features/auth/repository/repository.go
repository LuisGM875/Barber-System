package repository

import (
	"github.com/LuisGM875/barbersystem/internal/features/auth/models"
)

type Repository interface {
	Create(user *models.User) error

	FindByEmail(email string) (*models.User, error)

	FindByID(id string) (*models.User, error)

	Update(user *models.User) error

	Delete(id string) error
	CreateAuthToken(token *models.AuthToken) error
	FindValidAuthToken(tokenHash, purpose string) (*models.AuthToken, error)
	InvalidateAuthTokens(userID, purpose string) error
	MarkAuthTokenUsed(token *models.AuthToken) error
}
