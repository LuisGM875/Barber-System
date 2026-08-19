package handler

import (
	"github.com/LuisGM875/barbersystem/internal/features/auth/dto"
	"github.com/LuisGM875/barbersystem/internal/features/auth/service"
	"github.com/gin-gonic/gin"
	"net/http"
)

type Handler struct {
	service service.Service
}

func NewHandler(service service.Service) *Handler {
	return &Handler{
		service: service,
	}
}

func (handler *Handler) Register(context *gin.Context) {

	var request dto.RegisterRequest

	if err := context.ShouldBindJSON(&request); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": "Revisa tu nombre, correo y contraseña. Todos los datos obligatorios deben ser válidos."})
		return
	}

	response, err := handler.service.Register(request)

	if err != nil {

		context.JSON(http.StatusBadRequest, gin.H{
			"message": err.Error(),
		})

		return
	}

	context.JSON(http.StatusCreated, response)

}

func (handler *Handler) Login(context *gin.Context) {

	var request dto.LoginRequest

	if err := context.ShouldBindJSON(&request); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": "Ingresa un correo y una contraseña válidos."})

		return
	}

	response, err := handler.service.Login(request)

	if err != nil {

		context.JSON(http.StatusUnauthorized, gin.H{
			"message": err.Error(),
		})

		return
	}

	context.JSON(http.StatusOK, response)

}

func (handler *Handler) UpdateProfile(context *gin.Context) {
	var request dto.UpdateProfileRequest
	if err := context.ShouldBindJSON(&request); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": "Revisa el nombre, correo y teléfono ingresados."})
		return
	}
	response, err := handler.service.UpdateProfile(context.GetString("userID"), request)
	if err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	context.JSON(http.StatusOK, response)
}

func (handler *Handler) DeleteProfile(context *gin.Context) {
	if err := handler.service.DeleteProfile(context.GetString("userID")); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	context.Status(http.StatusNoContent)
}

func (handler *Handler) VerifyEmail(context *gin.Context) {
	var request dto.TokenRequest
	if err := context.ShouldBindJSON(&request); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": "token requerido"})
		return
	}
	if err := handler.service.VerifyEmail(request.Token); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	context.JSON(http.StatusOK, dto.MessageResponse{Message: "Correo verificado correctamente."})
}
func (handler *Handler) ForgotPassword(context *gin.Context) {
	var request dto.EmailRequest
	if err := context.ShouldBindJSON(&request); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": "correo inválido"})
		return
	}
	_ = handler.service.RequestPasswordReset(request.Email)
	context.JSON(http.StatusOK, dto.MessageResponse{Message: "Si el correo está registrado, recibirás instrucciones para recuperar tu contraseña."})
}
func (handler *Handler) ResetPassword(context *gin.Context) {
	var request dto.ResetPasswordRequest
	if err := context.ShouldBindJSON(&request); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": "El enlace o la contraseña no son válidos. Usa al menos 10 caracteres."})
		return
	}
	if err := handler.service.ResetPassword(request.Token, request.Password); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	context.JSON(http.StatusOK, dto.MessageResponse{Message: "Contraseña actualizada. Inicia sesión nuevamente."})
}
