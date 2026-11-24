package service

import (
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/LuisGM875/barbersystem/internal/features/appointments/dto"
	"github.com/LuisGM875/barbersystem/internal/features/appointments/models"
	"github.com/google/uuid"
)

func appointmentTime(appointment models.Appointments) (time.Time, error) {
	return time.ParseInLocation("2006-01-02 15:04", appointment.AppointmentDate+" "+appointment.StartTime, businessLocation)
}

func appointmentResponse(appointments []models.Appointments, now time.Time) (dto.AppointmentResponse, error) {
	if len(appointments) == 0 {
		return dto.AppointmentResponse{}, errors.New("la cita no contiene servicios")
	}

	sort.SliceStable(appointments, func(i, j int) bool {
		return appointments[i].IsPrimary && !appointments[j].IsPrimary
	})
	primary := appointments[0]
	start, err := appointmentTime(primary)
	if err != nil {
		return dto.AppointmentResponse{}, errors.New("fecha de cita inválida")
	}

	totalDuration := 0
	totalPrice := 0.0
	services := make([]dto.AppointmentService, 0, len(appointments))
	for _, appointment := range appointments {
		quantity := appointment.Quantity
		if quantity < 1 {
			quantity = 1
		}
		duration, err := parseDuration(appointment.ServiceDuration)
		if err != nil {
			return dto.AppointmentResponse{}, fmt.Errorf("duración inválida para el servicio %s: %w", appointment.ServiceID, err)
		}
		totalDuration += duration
		totalPrice += appointment.ServicePrice * float64(quantity)
		services = append(services, dto.AppointmentService{
			ServiceID: appointment.ServiceID.String(),
			Name:      appointment.ServiceName,
			Price:     appointment.ServicePrice,
			Duration:  minutesToDuration(duration / quantity),
			Image:     appointment.ServiceImage,
			Quantity:  quantity,
		})
	}

	endTime := primary.EndTime
	if endTime == "" {
		startMinutes, _ := timeToMinutes(primary.StartTime)
		endTime = minutesToTime((startMinutes + totalDuration) % (24 * 60))
	}

	status := primary.Status
	isPast := !start.IsZero() && !start.After(now)
	withinCompletionWindow := isPast && now.Before(start.Add(24*time.Hour))
	needsReview := withinCompletionWindow && (status == "PENDING" || status == "CONFIRMED")
	canConfirm := status == "PENDING" && !start.IsZero() && !now.Before(start.Add(-24*time.Hour)) && now.Before(start)
	groupID := appointmentBookingGroupID(primary)

	return dto.AppointmentResponse{
		ID:              groupID.String(),
		UserID:          primary.UserID.String(),
		UserName:        primary.User.Name,
		UserEmail:       primary.User.Email,
		UserPhone:       primary.User.Phone,
		CustomerName:    primary.CustomerName,
		ServiceID:       primary.ServiceID.String(),
		ServiceName:     primary.ServiceName,
		ServicePrice:    totalPrice,
		ServiceDuration: minutesToDuration(totalDuration),
		ServiceImage:    primary.ServiceImage,
		AppointmentDate: primary.AppointmentDate,
		StartTime:       primary.StartTime,
		EndTime:         endTime,
		Status:          status,
		Notes:           primary.Notes,
		CreatedAt:       primary.CreatedAt.Format(time.RFC3339),
		CanConfirm:      canConfirm,
		CanComplete:     withinCompletionWindow,
		IsPast:          isPast,
		NeedsReview:     needsReview,
		Services:        services,
	}, nil
}

func (service *service) listResponses(appointments []models.Appointments) ([]dto.AppointmentResponse, error) {
	now := time.Now()
	sort.SliceStable(appointments, func(i, j int) bool {
		a, _ := appointmentTime(appointments[i])
		b, _ := appointmentTime(appointments[j])
		aPast, bPast := a.Before(now), b.Before(now)
		if aPast != bPast {
			return !aPast
		}
		if aPast {
			return a.After(b)
		}
		return a.Before(b)
	})

	groups := make(map[uuid.UUID][]models.Appointments, len(appointments))
	groupOrder := make([]uuid.UUID, 0, len(appointments))
	for _, appointment := range appointments {
		groupID := appointmentBookingGroupID(appointment)
		if _, exists := groups[groupID]; !exists {
			groupOrder = append(groupOrder, groupID)
		}
		groups[groupID] = append(groups[groupID], appointment)
	}

	result := make([]dto.AppointmentResponse, 0, len(groups))
	for _, groupID := range groupOrder {
		response, err := appointmentResponse(groups[groupID], now)
		if err != nil {
			return nil, err
		}
		result = append(result, response)
	}
	return result, nil
}

func (service *service) ListByUserID(userID string) ([]dto.AppointmentResponse, error) {
	appointments, err := service.repository.FindByUserID(userID)
	if err != nil {
		return nil, err
	}
	return service.listResponses(appointments)
}

func (service *service) ListAll() ([]dto.AppointmentResponse, error) {
	appointments, err := service.repository.FindAll()
	if err != nil {
		return nil, err
	}
	return service.listResponses(appointments)
}

func (service *service) ListAgenda(from, to string) ([]dto.AppointmentResponse, error) {
	fromDate, err := time.Parse("2006-01-02", from)
	if err != nil {
		return nil, errors.New("fecha inicial inválida")
	}
	toDate, err := time.Parse("2006-01-02", to)
	if err != nil {
		return nil, errors.New("fecha final inválida")
	}
	if toDate.Before(fromDate) {
		return nil, errors.New("el rango de fechas es inválido")
	}
	if toDate.Sub(fromDate) > 366*24*time.Hour {
		return nil, errors.New("el rango de agenda no puede superar un año")
	}

	appointments, err := service.repository.FindByDateRange(from, to)
	if err != nil {
		return nil, err
	}
	return service.listResponses(appointments)
}

func (service *service) responseFor(appointment models.Appointments) (dto.AppointmentResponse, error) {
	appointments, err := service.repository.FindByBookingGroupID(appointmentBookingGroupID(appointment))
	if err != nil {
		return dto.AppointmentResponse{}, err
	}
	return appointmentResponse(appointments, time.Now())
}

func (service *service) ConfirmAttendance(userID string, appointmentID uuid.UUID) (dto.AppointmentResponse, error) {
	appointment, err := service.repository.GetByID(appointmentID)
	if err != nil {
		return dto.AppointmentResponse{}, err
	}
	if appointment.UserID.String() != userID {
		return dto.AppointmentResponse{}, errors.New("no puedes confirmar esta cita")
	}
	if appointment.Status != "PENDING" {
		return dto.AppointmentResponse{}, errors.New("la cita no está pendiente")
	}
	start, err := appointmentTime(*appointment)
	if err != nil {
		return dto.AppointmentResponse{}, errors.New("fecha de cita inválida")
	}
	now := time.Now()
	if now.Before(start.Add(-24 * time.Hour)) {
		return dto.AppointmentResponse{}, errors.New("podrás confirmar tu asistencia 24 horas antes de la cita")
	}
	if !now.Before(start) {
		return dto.AppointmentResponse{}, errors.New("la cita ya pasó")
	}
	appointment.Status = "CONFIRMED"
	if err := service.repository.Update(appointment); err != nil {
		return dto.AppointmentResponse{}, err
	}
	return service.responseFor(*appointment)
}

func (service *service) Complete(appointmentID uuid.UUID) (dto.AppointmentResponse, error) {
	appointment, err := service.repository.GetByID(appointmentID)
	if err != nil {
		return dto.AppointmentResponse{}, err
	}
	if appointment.Status == "CANCELLED" {
		return dto.AppointmentResponse{}, errors.New("no se puede completar una cita cancelada")
	}
	start, err := appointmentTime(*appointment)
	now := time.Now()
	if err != nil || now.Before(start) || !now.Before(start.Add(24*time.Hour)) {
		return dto.AppointmentResponse{}, errors.New("la cita solo puede completarse durante las 24 horas posteriores a su inicio")
	}
	appointment.Status = "COMPLETED"
	if err := service.repository.Update(appointment); err != nil {
		return dto.AppointmentResponse{}, err
	}
	return service.responseFor(*appointment)
}

func (service *service) SetStatus(appointmentID uuid.UUID, status string) (dto.AppointmentResponse, error) {
	status = strings.ToUpper(strings.TrimSpace(status))
	allowed := map[string]bool{"CONFIRMED": true, "COMPLETED": true, "NO_SHOW": true}
	if !allowed[status] {
		return dto.AppointmentResponse{}, errors.New("estado de cita inválido")
	}

	appointment, err := service.repository.GetByID(appointmentID)
	if err != nil {
		return dto.AppointmentResponse{}, err
	}
	if appointment.Status == "CANCELLED" {
		return dto.AppointmentResponse{}, errors.New("no se puede modificar una cita cancelada")
	}
	if status == "COMPLETED" {
		start, err := appointmentTime(*appointment)
		now := time.Now()
		if err != nil || now.Before(start) || !now.Before(start.Add(24*time.Hour)) {
			return dto.AppointmentResponse{}, errors.New("la cita solo puede completarse durante las 24 horas posteriores a su inicio")
		}
	}
	appointment.Status = status
	if err := service.repository.Update(appointment); err != nil {
		return dto.AppointmentResponse{}, err
	}
	return service.responseFor(*appointment)
}
