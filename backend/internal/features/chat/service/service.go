package service

import (
	"errors"
	"github.com/LuisGM875/barbersystem/internal/features/chat/dto"
	"github.com/LuisGM875/barbersystem/internal/features/chat/models"
	"github.com/LuisGM875/barbersystem/internal/features/chat/repository"
	"github.com/LuisGM875/barbersystem/internal/storage"
	"github.com/google/uuid"
	"mime/multipart"
	"strings"
	"time"
)

type Service interface {
	GetOrCreateMine(string) (dto.ConversationResponse, error)
	ListConversations(string, string) ([]dto.ConversationResponse, error)
	ListMessages(string, string, string) ([]dto.MessageResponse, error)
	SendMessage(string, string, string, string, *multipart.FileHeader) (dto.MessageResponse, error)
}
type service struct{ repository repository.Repository }

func NewService(repository repository.Repository) Service { return &service{repository: repository} }

func conversationResponse(item repository.ConversationItem) dto.ConversationResponse {
	return dto.ConversationResponse{ID: item.Conversation.ID.String(), ClientID: item.Conversation.User1ID.String(), ClientName: item.ClientName, ClientEmail: item.ClientEmail, LastMessage: item.LastMessage, LastMessageAt: item.LastMessageAt, UnreadCount: item.UnreadCount}
}
func messageResponse(item models.Message) dto.MessageResponse {
	return dto.MessageResponse{ID: item.ID.String(), ConversationID: item.ConversationID.String(), SenderID: item.SenderID.String(), Content: item.Content, Image: item.Image, IsRead: item.IsRead, Timestamp: item.Timestamp.Format(time.RFC3339)}
}

func (s *service) GetOrCreateMine(userID string) (dto.ConversationResponse, error) {
	id, err := uuid.Parse(userID)
	if err != nil {
		return dto.ConversationResponse{}, errors.New("usuario inválido")
	}
	conversation, err := s.repository.GetOrCreateByUserID(id)
	if err != nil {
		return dto.ConversationResponse{}, err
	}
	return dto.ConversationResponse{ID: conversation.ID.String(), ClientID: userID}, nil
}
func (s *service) ListConversations(userID, role string) ([]dto.ConversationResponse, error) {
	id, err := uuid.Parse(userID)
	if err != nil {
		return nil, errors.New("usuario inválido")
	}
	items, err := s.repository.ListConversations(id, role == "ADMIN")
	if err != nil {
		return nil, err
	}
	result := make([]dto.ConversationResponse, 0, len(items))
	for _, item := range items {
		result = append(result, conversationResponse(item))
	}
	return result, nil
}

func (s *service) authorize(conversationID, userID uuid.UUID, role string) (*models.Conversation, error) {
	conversation, err := s.repository.FindConversation(conversationID)
	if err != nil {
		return nil, errors.New("conversación no encontrada")
	}
	if role != "ADMIN" && conversation.User1ID != userID {
		return nil, errors.New("sin permiso para esta conversación")
	}
	return conversation, nil
}

func (s *service) ListMessages(conversationIDValue, userIDValue, role string) ([]dto.MessageResponse, error) {
	conversationID, err := uuid.Parse(conversationIDValue)
	if err != nil {
		return nil, errors.New("conversación inválida")
	}
	userID, err := uuid.Parse(userIDValue)
	if err != nil {
		return nil, errors.New("usuario inválido")
	}
	if _, err := s.authorize(conversationID, userID, role); err != nil {
		return nil, err
	}
	if err := s.repository.MarkRead(conversationID, userID); err != nil {
		return nil, err
	}
	messages, err := s.repository.ListMessages(conversationID, 100)
	if err != nil {
		return nil, err
	}
	result := make([]dto.MessageResponse, 0, len(messages))
	for _, message := range messages {
		result = append(result, messageResponse(message))
	}
	return result, nil
}

func (s *service) SendMessage(conversationIDValue, userIDValue, role, content string, file *multipart.FileHeader) (dto.MessageResponse, error) {
	conversationID, err := uuid.Parse(conversationIDValue)
	if err != nil {
		return dto.MessageResponse{}, errors.New("conversación inválida")
	}
	userID, err := uuid.Parse(userIDValue)
	if err != nil {
		return dto.MessageResponse{}, errors.New("usuario inválido")
	}
	if _, err := s.authorize(conversationID, userID, role); err != nil {
		return dto.MessageResponse{}, err
	}
	content = strings.TrimSpace(content)
	if content == "" && file == nil {
		return dto.MessageResponse{}, errors.New("escribe un mensaje o selecciona una imagen")
	}
	if len([]rune(content)) > 2000 {
		return dto.MessageResponse{}, errors.New("el mensaje no puede superar 2000 caracteres")
	}
	imagePath := ""
	if file != nil {
		imagePath, err = storage.SaveChatImage(file)
		if err != nil {
			return dto.MessageResponse{}, err
		}
	}
	message := models.Message{ConversationID: conversationID, SenderID: userID, Content: content, Image: imagePath, Timestamp: time.Now()}
	if err := s.repository.CreateMessage(&message); err != nil {
		if imagePath != "" {
			_ = storage.DeleteChatImage(imagePath)
		}
		return dto.MessageResponse{}, err
	}
	return messageResponse(message), nil
}
