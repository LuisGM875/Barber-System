package handler

import (
	"errors"
	"net/http"
	"strings"

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
	if !strings.EqualFold(strings.TrimSpace(context.GetString("role")), "ADMIN") {
		request.ClientName = ""
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

func (handler *Handler) ListAgenda(context *gin.Context) {
	responses, err := handler.service.ListAgenda(context.Query("from"), context.Query("to"))
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
	response, err := handler.service.Reschedule(context.GetString("userID"), context.GetString("role"), id, request)
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
				"message": "La fecha es requerida",
			},
		)

		return
	}

	serviceID, serviceIDs, err := parseAvailabilityServiceIDs(query.ServiceID, query.ServiceIDs)
	if err != nil {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"message": err.Error(),
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
		serviceIDs,
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

func (handler *Handler) GetAvailabilityRange(c *gin.Context) {
	var query dto.AvailabilityRangeQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Rango de fechas y servicio son requeridos"})
		return
	}

	serviceID, serviceIDs, err := parseAvailabilityServiceIDs(query.ServiceID, query.ServiceIDs)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	response, err := handler.service.GetAvailabilityRange(query.From, query.To, serviceID, serviceIDs)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, response)
}

func parseAvailabilityServiceIDs(serviceIDValue string, serviceIDsValue string) (uuid.UUID, []uuid.UUID, error) {
	serviceID := uuid.Nil
	serviceIDs := make([]uuid.UUID, 0)
	if serviceIDValue != "" {
		parsedID, err := uuid.Parse(serviceIDValue)
		if err != nil {
			return uuid.Nil, nil, errors.New("serviceId inválido")
		}
		serviceID = parsedID
		serviceIDs = append(serviceIDs, parsedID)
	}

	if serviceIDsValue != "" {
		serviceIDs = make([]uuid.UUID, 0)
		if serviceID == uuid.Nil {
			return uuid.Nil, nil, errors.New("serviceId requerido cuando se envía serviceIds")
		}
		for _, rawID := range strings.Split(serviceIDsValue, ",") {
			id, parseErr := uuid.Parse(strings.TrimSpace(rawID))
			if parseErr != nil {
				return uuid.Nil, nil, errors.New("serviceIds inválido")
			}
			serviceIDs = append(serviceIDs, id)
		}
	}
	return serviceID, serviceIDs, nil
}
