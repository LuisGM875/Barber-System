package repository

import "github.com/LuisGM875/barbersystem/internal/features/posts/models"

type Repository interface {
	Create(post *models.Post) error
	FindAll() ([]models.Post, error)
	FindByID(id string) (*models.Post, error)
	Update(post *models.Post) error
	Delete(id string) error
}
