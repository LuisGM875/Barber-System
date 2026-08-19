package handler

import (
	"net/http"

	"github.com/LuisGM875/barbersystem/internal/features/services/dto"
	"github.com/LuisGM875/barbersystem/internal/features/services/service"
	"github.com/gin-gonic/gin"
	"mime/multipart"
)

type Handler struct {
	service service.Service
}

func NewHandler(service service.Service) *Handler {
	return &Handler{service: service}
}

func (handler *Handler) FindAll(context *gin.Context) {
	response, err := handler.service.FindAll()
	if err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	context.JSON(http.StatusOK, response)
}

func (handler *Handler) Create(context *gin.Context) {
	var request dto.CreateServiceRequest

	if err := context.ShouldBind(&request); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": "Completa correctamente el nombre, descripción, precio y duración del servicio."})
		return
	}

	file, err := context.FormFile("image")

	if err != nil {
		context.JSON(http.StatusBadRequest, gin.H{
			"message": "Debes seleccionar una imagen para el servicio.",
		})
		return
	}

	response, err := handler.service.Create(
		request,
		file,
	)

	if err != nil {
		context.JSON(http.StatusBadRequest, gin.H{
			"message": err.Error(),
		})
		return
	}

	context.JSON(http.StatusCreated, response)
}

func (handler *Handler) Update(context *gin.Context) {
	id := context.Param("id")

	var request dto.UpdateServiceRequest

	if err := context.ShouldBind(&request); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": "Completa correctamente el nombre, descripción, precio y duración del servicio."})
		return
	}

	var file *multipart.FileHeader

	file, _ = context.FormFile("image")

	response, err := handler.service.Update(
		id,
		request,
		file,
	)

	if err != nil {

		status := http.StatusBadRequest

		if err.Error() == "service not found" {
			status = http.StatusNotFound
		}

		context.JSON(status, gin.H{
			"message": err.Error(),
		})

		return
	}

	context.JSON(http.StatusOK, response)
}

func (handler *Handler) Delete(context *gin.Context) {
	id := context.Param("id")
	if err := handler.service.Delete(id); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	context.Status(http.StatusNoContent)
}
