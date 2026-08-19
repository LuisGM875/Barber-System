package repository

import (
	"errors"

	"github.com/LuisGM875/barbersystem/internal/features/posts/models"
	"gorm.io/gorm"
)

type postgresRepository struct{ db *gorm.DB }

func NewRepository(db *gorm.DB) Repository { return &postgresRepository{db: db} }

func (repository *postgresRepository) Create(post *models.Post) error {
	return repository.db.Create(post).Error
}

func (repository *postgresRepository) FindAll() ([]models.Post, error) {
	var posts []models.Post
	err := repository.db.Order("created_at DESC").Find(&posts).Error
	return posts, err
}

func (repository *postgresRepository) FindByID(id string) (*models.Post, error) {
	var post models.Post
	err := repository.db.Where("id = ?", id).First(&post).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &post, err
}

func (repository *postgresRepository) Update(post *models.Post) error {
	return repository.db.Save(post).Error
}

func (repository *postgresRepository) Delete(id string) error {
	return repository.db.Delete(&models.Post{}, "id = ?", id).Error
}
