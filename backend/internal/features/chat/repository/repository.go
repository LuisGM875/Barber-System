package repository

import (
	"github.com/LuisGM875/barbersystem/internal/features/chat/models"
	"github.com/google/uuid"
)

type ConversationItem struct {
	Conversation  models.Conversation
	ClientName    string
	ClientEmail   string
	LastMessage   string
	LastMessageAt string
	UnreadCount   int64
}

type Repository interface {
	GetOrCreateByUserID(uuid.UUID) (*models.Conversation, error)
	FindConversation(uuid.UUID) (*models.Conversation, error)
	ListConversations(uuid.UUID, bool) ([]ConversationItem, error)
	ListMessages(uuid.UUID, int) ([]models.Message, error)
	CreateMessage(*models.Message) error
	MarkRead(uuid.UUID, uuid.UUID) error
}
