package service

import (
	"errors"
	"time"

	"github.com/LuisGM875/barbersystem/internal/features/appointments/dto"
	"github.com/LuisGM875/barbersystem/internal/features/appointments/models"
	appointmentRepository "github.com/LuisGM875/barbersystem/internal/features/appointments/repository"
	"github.com/google/uuid"
)

func (service *service) Reschedule(userID string, appointmentID uuid.UUID, request dto.RescheduleRequest) (dto.AppointmentResponse, error) {
	appointment, err := service.repository.GetByID(appointmentID)
	if err != nil {
		return dto.AppointmentResponse{}, err
	}
	if appointment.UserID.String() != userID {
		return dto.AppointmentResponse{}, errors.New("no puedes reagendar esta cita")
	}
	if appointment.Status != "PENDING" {
		return dto.AppointmentResponse{}, errors.New("solo se pueden reagendar citas pendientes")
	}
	if !isAvailableTime(request.StartTime) {
		return dto.AppointmentResponse{}, errors.New("horario inválido")
	}

	candidate := models.Appointments{AppointmentDate: request.AppointmentDate, StartTime: request.StartTime}
	start, err := appointmentTime(candidate)
	if err != nil {
		return dto.AppointmentResponse{}, errors.New("fecha u hora inválida")
	}
	if !start.After(time.Now()) {
		return dto.AppointmentResponse{}, errors.New("elige una fecha y hora futuras")
	}

	appointmentDate, err := time.Parse("2006-01-02", request.AppointmentDate)
	if err != nil {
		return dto.AppointmentResponse{}, errors.New("fecha inválida")
	}
	candidateStart, err := timeToMinutes(request.StartTime)
	if err != nil {
		return dto.AppointmentResponse{}, errors.New("hora inválida")
	}
	duration, err := parseDuration(appointment.ServiceDuration)
	if err != nil {
		return dto.AppointmentResponse{}, err
	}

	appointment.AppointmentDate = request.AppointmentDate
	appointment.StartTime = request.StartTime
	err = service.repository.WithDateLock(request.AppointmentDate, func(lockedRepository appointmentRepository.Repository) error {
		if err := ensureAppointmentSlotAvailable(lockedRepository, appointmentDate, candidateStart, bookingDuration(duration), &appointment.ID); err != nil {
			return err
		}
		return lockedRepository.UpdateSchedule(appointment)
	})
	if err != nil {
		return dto.AppointmentResponse{}, err
	}
	return appointmentResponse(*appointment, time.Now()), nil
}
