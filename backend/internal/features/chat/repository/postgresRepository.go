package repository

import (
	"errors"
	"github.com/LuisGM875/barbersystem/internal/features/chat/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

type postgresRepository struct{ db *gorm.DB }

func NewRepository(db *gorm.DB) Repository { return &postgresRepository{db: db} }

func (r *postgresRepository) GetOrCreateByUserID(userID uuid.UUID) (*models.Conversation, error) {
	var conversation models.Conversation
	err := r.db.Where("user1_id = ?", userID).First(&conversation).Error
	if err == nil {
		return &conversation, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	conversation = models.Conversation{User1ID: userID}
	if err := r.db.Create(&conversation).Error; err != nil {
		return nil, err
	}
	return &conversation, nil
}

func (r *postgresRepository) FindConversation(id uuid.UUID) (*models.Conversation, error) {
	var item models.Conversation
	if err := r.db.First(&item, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *postgresRepository) ListConversations(viewerID uuid.UUID, isAdmin bool) ([]ConversationItem, error) {
	var conversations []models.Conversation
	query := r.db.Order("updated_at DESC")
	if !isAdmin {
		query = query.Where("user1_id = ?", viewerID)
	}
	if err := query.Find(&conversations).Error; err != nil {
		return nil, err
	}
	items := make([]ConversationItem, 0, len(conversations))
	for _, conversation := range conversations {
		var user struct{ Name, Email string }
		r.db.Table("users").Select("name, email").Where("id = ?", conversation.User1ID).Scan(&user)
		var last models.Message
		// Find no considera que una conversación sin mensajes sea un error y evita
		// que GORM escriba un "record not found" engañoso en la consola.
		r.db.Where("conversation_id = ?", conversation.ID).Order("timestamp DESC").Limit(1).Find(&last)
		var unread int64
		r.db.Model(&models.Message{}).Where("conversation_id = ? AND sender_id != ? AND is_read = ?", conversation.ID, viewerID, false).Count(&unread)
		preview := last.Content
		if preview == "" && last.Image != "" {
			preview = "📷 Imagen"
		}
		lastAt := ""
		if !last.Timestamp.IsZero() {
			lastAt = last.Timestamp.Format(time.RFC3339)
		}
		items = append(items, ConversationItem{conversation, user.Name, user.Email, preview, lastAt, unread})
	}
	return items, nil
}

func (r *postgresRepository) ListMessages(id uuid.UUID, limit int) ([]models.Message, error) {
	var reversed []models.Message
	if err := r.db.Where("conversation_id = ?", id).Order("timestamp DESC").Limit(limit).Find(&reversed).Error; err != nil {
		return nil, err
	}
	result := make([]models.Message, len(reversed))
	for i := range reversed {
		result[len(reversed)-1-i] = reversed[i]
	}
	return result, nil
}
func (r *postgresRepository) CreateMessage(message *models.Message) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(message).Error; err != nil {
			return err
		}
		return tx.Model(&models.Conversation{}).Where("id = ?", message.ConversationID).Update("updated_at", message.Timestamp).Error
	})
}
func (r *postgresRepository) MarkRead(conversationID, viewerID uuid.UUID) error {
	return r.db.Model(&models.Message{}).Where("conversation_id = ? AND sender_id != ? AND is_read = ?", conversationID, viewerID, false).Update("is_read", true).Error
}
