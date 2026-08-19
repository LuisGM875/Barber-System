package handler

import (
	"net/http"

	"github.com/LuisGM875/barbersystem/internal/features/appointments/dto"
	"github.com/LuisGM875/barbersystem/internal/features/appointments/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type Handler struct {
	service service.Service
}

func NewHandler(service service.Service) *Handler {
	return &Handler{service: service}
}

func (handler *Handler) Create(context *gin.Context) {
	var request dto.CreateAppointmentRequest
	if err := context.ShouldBindJSON(&request); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": "Selecciona un servicio, una fecha y un horario válidos."})
		return
	}

	userID := context.GetString("userID")
	if userID == "" {
		context.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	response, err := handler.service.Create(userID, request)
	if err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	context.JSON(http.StatusCreated, response)
}

func (handler *Handler) ListMine(context *gin.Context) {
	userID := context.GetString("userID")
	if userID == "" {
		context.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	responses, err := handler.service.ListByUserID(userID)
	if err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	context.JSON(http.StatusOK, responses)
}

func (handler *Handler) ListAll(context *gin.Context) {
	responses, err := handler.service.ListAll()
	if err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	context.JSON(http.StatusOK, responses)
}

func (handler *Handler) ConfirmAttendance(context *gin.Context) {
	id, err := uuid.Parse(context.Param("id"))
	if err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": "cita inválida"})
		return
	}
	response, err := handler.service.ConfirmAttendance(context.GetString("userID"), id)
	if err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	context.JSON(http.StatusOK, response)
}

func (handler *Handler) Complete(context *gin.Context) {
	id, err := uuid.Parse(context.Param("id"))
	if err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": "cita inválida"})
		return
	}
	response, err := handler.service.Complete(id)
	if err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	context.JSON(http.StatusOK, response)
}

func (handler *Handler) SetStatus(context *gin.Context) {
	id, err := uuid.Parse(context.Param("id"))
	if err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": "cita inválida"})
		return
	}
	var request dto.UpdateStatusRequest
	if err := context.ShouldBindJSON(&request); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": "estado requerido"})
		return
	}
	response, err := handler.service.SetStatus(id, request.Status)
	if err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	context.JSON(http.StatusOK, response)
}

func (handler *Handler) Reschedule(context *gin.Context) {
	id, err := uuid.Parse(context.Param("id"))
	if err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": "cita inválida"})
		return
	}
	var request dto.RescheduleRequest
	if err := context.ShouldBindJSON(&request); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": "fecha y hora requeridas"})
		return
	}
	response, err := handler.service.Reschedule(context.GetString("userID"), id, request)
	if err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	context.JSON(http.StatusOK, response)
}

func (handler *Handler) GetAvailability(c *gin.Context) {

	var query dto.AvailabilityQuery

	if err := c.ShouldBindQuery(&query); err != nil {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"message": "Fecha y servicio son requeridos",
			},
		)

		return
	}

	serviceID, err := uuid.Parse(
		query.ServiceID,
	)

	if err != nil {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"message": "serviceId inválido",
			},
		)

		return
	}

	var excludeAppointmentID *uuid.UUID
	if query.ExcludeAppointmentID != "" {
		excludeID, parseErr := uuid.Parse(query.ExcludeAppointmentID)
		if parseErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "excludeAppointmentId inválido"})
			return
		}
		excludeAppointmentID = &excludeID
	}

	response, err := handler.service.GetAvailability(
		query.Date,
		serviceID,
		excludeAppointmentID,
	)

	if err != nil {

		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"message": err.Error(),
			},
		)

		return
	}

	c.JSON(
		http.StatusOK,
		response,
	)
}
