export interface ChatConversation {
    id: string;
    clientId: string;
    clientName: string;
    clientEmail: string;
    lastMessage: string;
    lastMessageAt: string;
    unreadCount: number;
}

export interface ChatMessage {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    image: string;
    isRead: boolean;
    timestamp: string;
}
