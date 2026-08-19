package repository

import (
	"errors"
	"github.com/LuisGM875/barbersystem/internal/features/auth/models"
	"github.com/LuisGM875/barbersystem/internal/storage"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

type postgresRepository struct {
	db *gorm.DB
}

func (repository *postgresRepository) CreateAuthToken(token *models.AuthToken) error {
	return repository.db.Create(token).Error
}
func (repository *postgresRepository) FindValidAuthToken(tokenHash, purpose string) (*models.AuthToken, error) {
	var token models.AuthToken
	err := repository.db.Where("token_hash = ? AND purpose = ? AND used_at IS NULL AND expires_at > ?", tokenHash, purpose, time.Now()).First(&token).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &token, err
}
func (repository *postgresRepository) InvalidateAuthTokens(userID, purpose string) error {
	now := time.Now()
	return repository.db.Model(&models.AuthToken{}).Where("user_id = ? AND purpose = ? AND used_at IS NULL", userID, purpose).Update("used_at", now).Error
}
func (repository *postgresRepository) MarkAuthTokenUsed(token *models.AuthToken) error {
	now := time.Now()
	return repository.db.Model(token).Update("used_at", now).Error
}

func NewRepository(db *gorm.DB) Repository {
	return &postgresRepository{db: db}
}

func (repository *postgresRepository) Create(user *models.User) error {
	return repository.db.Create(user).Error
}

func (repository *postgresRepository) FindByEmail(email string) (*models.User, error) {
	var user models.User
	result := repository.db.
		Where("email = ?", email).
		Limit(1).
		Find(&user)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil
	}
	return &user, nil
}

func (repository *postgresRepository) FindByID(id string) (*models.User, error) {

	var user models.User

	err := repository.db.
		Where("id = ?", id).
		First(&user).
		Error

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (repository *postgresRepository) Update(user *models.User) error {
	return repository.db.Save(user).Error
}

func (repository *postgresRepository) Delete(id string) error {
	userID, err := uuid.Parse(id)
	if err != nil {
		return errors.New("usuario inválido")
	}

	var imagePaths []string
	err = repository.db.Transaction(func(tx *gorm.DB) error {
		// Los casts permiten limpiar también bases creadas con versiones antiguas,
		// donde algunos identificadores del chat quedaron almacenados como text.
		if err := tx.Table("messages").Where("conversation_id::text IN (SELECT id::text FROM conversations WHERE user1_id::text = ?) OR sender_id::text = ?", userID.String(), userID.String()).Where("image <> ''").Pluck("image", &imagePaths).Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM messages WHERE conversation_id::text IN (SELECT id::text FROM conversations WHERE user1_id::text = ?) OR sender_id::text = ?", userID.String(), userID.String()).Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM conversations WHERE user1_id::text = ?", userID.String()).Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM appointments WHERE user_id::text = ?", userID.String()).Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM auth_tokens WHERE user_id::text = ?", userID.String()).Error; err != nil {
			return err
		}
		return tx.Unscoped().Delete(&models.User{}, "id = ?", userID).Error
	})
	if err != nil {
		return err
	}
	for _, imagePath := range imagePaths {
		_ = storage.DeleteChatImage(imagePath)
	}
	return nil
}
