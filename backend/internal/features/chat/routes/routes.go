package routes

import (
	chatHandler "github.com/LuisGM875/barbersystem/internal/features/chat/handler"
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup, handler *chatHandler.Handler) {
	router.POST("/mine", handler.Mine)
	router.GET("/conversations", handler.Conversations)
	router.GET("/conversations/:id/messages", handler.Messages)
	router.POST("/conversations/:id/messages", handler.Send)
}
