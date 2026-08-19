package handler

import (
	"mime/multipart"
	"net/http"

	"github.com/LuisGM875/barbersystem/internal/features/posts/dto"
	"github.com/LuisGM875/barbersystem/internal/features/posts/service"
	"github.com/gin-gonic/gin"
)

type Handler struct{ service service.Service }

func NewHandler(service service.Service) *Handler { return &Handler{service: service} }

func (handler *Handler) FindAll(context *gin.Context) {
	posts, err := handler.service.FindAll()
	if err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	context.JSON(http.StatusOK, posts)
}

func (handler *Handler) Create(context *gin.Context) {
	var request dto.CreatePostRequest
	if err := context.ShouldBind(&request); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": "Completa el título y la descripción de la publicación."})
		return
	}
	file, err := context.FormFile("image")
	if err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": "Debes seleccionar una imagen para la publicación."})
		return
	}
	post, err := handler.service.Create(request, file)
	if err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	context.JSON(http.StatusCreated, post)
}

func (handler *Handler) Update(context *gin.Context) {
	var request dto.UpdatePostRequest
	if err := context.ShouldBind(&request); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": "Completa el título y la descripción de la publicación."})
		return
	}
	var file *multipart.FileHeader
	file, _ = context.FormFile("image")
	post, err := handler.service.Update(context.Param("id"), request, file)
	if err != nil {
		status := http.StatusBadRequest
		if err.Error() == "post not found" {
			status = http.StatusNotFound
		}
		context.JSON(status, gin.H{"message": err.Error()})
		return
	}
	context.JSON(http.StatusOK, post)
}

func (handler *Handler) Delete(context *gin.Context) {
	if err := handler.service.Delete(context.Param("id")); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	context.Status(http.StatusNoContent)
}
