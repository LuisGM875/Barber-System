package handler

import (
	"github.com/LuisGM875/barbersystem/internal/features/chat/service"
	"github.com/gin-gonic/gin"
	"mime/multipart"
	"net/http"
)

type Handler struct{ service service.Service }

func NewHandler(service service.Service) *Handler { return &Handler{service: service} }
func (h *Handler) Mine(c *gin.Context) {
	response, err := h.service.GetOrCreateMine(c.GetString("userID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, response)
}
func (h *Handler) Conversations(c *gin.Context) {
	response, err := h.service.ListConversations(c.GetString("userID"), c.GetString("role"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, response)
}
func (h *Handler) Messages(c *gin.Context) {
	response, err := h.service.ListMessages(c.Param("id"), c.GetString("userID"), c.GetString("role"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, response)
}
func (h *Handler) Send(c *gin.Context) {
	content := c.PostForm("content")
	var file *multipart.FileHeader
	file, _ = c.FormFile("image")
	response, err := h.service.SendMessage(c.Param("id"), c.GetString("userID"), c.GetString("role"), content, file)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, response)
}
