package dto

type ConversationResponse struct {
	ID            string `json:"id"`
	ClientID      string `json:"clientId"`
	ClientName    string `json:"clientName"`
	ClientEmail   string `json:"clientEmail"`
	LastMessage   string `json:"lastMessage"`
	LastMessageAt string `json:"lastMessageAt"`
	UnreadCount   int64  `json:"unreadCount"`
}

type MessageResponse struct {
	ID             string `json:"id"`
	ConversationID string `json:"conversationId"`
	SenderID       string `json:"senderId"`
	Content        string `json:"content"`
	Image          string `json:"image"`
	IsRead         bool   `json:"isRead"`
	Timestamp      string `json:"timestamp"`
}
