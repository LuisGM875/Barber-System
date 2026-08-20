package service

import (
	"errors"
	"sort"
	"strings"
	"time"

	"github.com/LuisGM875/barbersystem/internal/features/appointments/dto"
	"github.com/LuisGM875/barbersystem/internal/features/appointments/models"
	"github.com/google/uuid"
)

func appointmentTime(appointment models.Appointments) (time.Time, error) {
	return time.ParseInLocation("2006-01-02 15:04", appointment.AppointmentDate+" "+appointment.StartTime, time.Local)
}

func appointmentResponse(appointment models.Appointments, now time.Time) dto.AppointmentResponse {
	start, _ := appointmentTime(appointment)
	status := appointment.Status
	isPast := !start.IsZero() && !start.After(now)
	withinCompletionWindow := isPast && now.Before(start.Add(24*time.Hour))
	needsReview := withinCompletionWindow && (status == "PENDING" || status == "CONFIRMED")
	if isPast && (status == "PENDING" || status == "CONFIRMED") {
		status = "NO_SHOW"
	}
	canConfirm := status == "PENDING" && !start.IsZero() && !now.Before(start.Add(-24*time.Hour)) && now.Before(start)
	return dto.AppointmentResponse{ID: appointment.ID.String(), UserID: appointment.UserID.String(), UserName: appointment.User.Name, UserEmail: appointment.User.Email, UserPhone: appointment.User.Phone, ServiceID: appointment.ServiceID.String(), ServiceName: appointment.ServiceName, ServicePrice: appointment.ServicePrice, ServiceDuration: appointment.ServiceDuration, ServiceImage: appointment.ServiceImage, AppointmentDate: appointment.AppointmentDate, StartTime: appointment.StartTime, Status: status, Notes: appointment.Notes, CreatedAt: appointment.CreatedAt.Format(time.RFC3339), CanConfirm: canConfirm, CanComplete: withinCompletionWindow, IsPast: isPast, NeedsReview: needsReview}
}

func listResponses(appointments []models.Appointments) []dto.AppointmentResponse {
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
	result := make([]dto.AppointmentResponse, 0, len(appointments))
	for _, appointment := range appointments {
		result = append(result, appointmentResponse(appointment, now))
	}
	return result
}

func (service *service) ListByUserID(userID string) ([]dto.AppointmentResponse, error) {
	appointments, err := service.repository.FindByUserID(userID)
	if err != nil {
		return nil, err
	}
	return listResponses(appointments), nil
}

func (service *service) ListAll() ([]dto.AppointmentResponse, error) {
	appointments, err := service.repository.FindAll()
	if err != nil {
		return nil, err
	}
	return listResponses(appointments), nil
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
	return listResponses(appointments), nil
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
	return appointmentResponse(*appointment, now), nil
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
	return appointmentResponse(*appointment, time.Now()), nil
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
	return appointmentResponse(*appointment, time.Now()), nil
}
