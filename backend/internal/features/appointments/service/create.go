package service

import (
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/LuisGM875/barbersystem/internal/email"
	"github.com/LuisGM875/barbersystem/internal/features/appointments/dto"
	"github.com/LuisGM875/barbersystem/internal/features/appointments/models"
	appointmentRepository "github.com/LuisGM875/barbersystem/internal/features/appointments/repository"
	"github.com/google/uuid"
)

func (s *service) Create(
	userID string,
	request dto.CreateAppointmentRequest,
) (dto.AppointmentResponse, error) {

	userUUID, err := uuid.Parse(userID)

	if err != nil {
		return dto.AppointmentResponse{}, errors.New(
			"usuario inválido",
		)
	}

	serviceUUID, err := uuid.Parse(request.ServiceID)

	if err != nil {
		return dto.AppointmentResponse{}, errors.New(
			"servicio inválido",
		)
	}

	// --------------------------------------------------
	// 1. BUSCAR EL SERVICIO REAL
	// --------------------------------------------------

	serviceModel, err := s.serviceRepository.FindByID(
		request.ServiceID,
	)

	if err != nil || serviceModel == nil {
		return dto.AppointmentResponse{}, errors.New(
			"servicio no encontrado",
		)
	}

	if !serviceModel.IsActive {
		return dto.AppointmentResponse{}, errors.New(
			"el servicio no está disponible",
		)
	}

	// --------------------------------------------------
	// 2. VALIDAR FECHA
	// --------------------------------------------------

	appointmentDate, err := time.Parse(
		"2006-01-02",
		request.AppointmentDate,
	)

	if err != nil {
		return dto.AppointmentResponse{}, errors.New(
			"fecha inválida",
		)
	}

	// --------------------------------------------------
	// 3. VALIDAR HORA
	// --------------------------------------------------

	if !isAvailableTime(request.StartTime) {
		return dto.AppointmentResponse{}, errors.New(
			"horario inválido",
		)
	}

	// --------------------------------------------------
	// 4. OBTENER DURACIÓN REAL DEL SERVICIO
	// --------------------------------------------------

	newDuration, err := parseDuration(
		serviceModel.Duration,
	)

	if err != nil {
		return dto.AppointmentResponse{}, err
	}

	newBookingDuration := bookingDuration(newDuration)

	candidateStart, err := timeToMinutes(
		request.StartTime,
	)

	if err != nil {
		return dto.AppointmentResponse{}, errors.New(
			"hora inválida",
		)
	}

	appointment := models.Appointments{
		ID:              uuid.New(),
		UserID:          userUUID,
		ServiceID:       serviceUUID,
		ServiceName:     serviceModel.Name,
		ServicePrice:    serviceModel.Price,
		ServiceDuration: serviceModel.Duration,
		ServiceImage:    serviceModel.Image,
		AppointmentDate: request.AppointmentDate,
		StartTime:       request.StartTime,
		Status:          "PENDING",
		Notes:           request.Notes,
	}

	// La revisión y la inserción ocurren bajo el mismo bloqueo transaccional.
	// Dos solicitudes del mismo día no pueden observar el horario libre a la vez.
	err = s.repository.WithDateLock(request.AppointmentDate, func(lockedRepository appointmentRepository.Repository) error {
		if err := ensureAppointmentSlotAvailable(lockedRepository, appointmentDate, candidateStart, newBookingDuration, nil); err != nil {
			return err
		}
		return lockedRepository.Create(&appointment)
	})
	if err != nil {
		return dto.AppointmentResponse{}, err
	}

	// La reserva ya está confirmada en la base de datos. Un fallo del proveedor
	// de correo no debe hacer que el cliente intente crear la misma cita otra vez.
	if user, findErr := s.userRepository.FindByID(userID); findErr != nil {
		log.Printf("no se pudo obtener el usuario para enviar la cita %s: %v", appointment.ID, findErr)
	} else {
		displayDate := appointmentDate.Format("02/01/2006")
		emailHTML := email.AppointmentTemplate(email.AppointmentDetails{
			Name:         user.Name,
			Service:      appointment.ServiceName,
			Date:         displayDate,
			Time:         appointment.StartTime,
			Duration:     appointment.ServiceDuration,
			Price:        fmt.Sprintf("$%.2f MXN", appointment.ServicePrice),
			Notes:        appointment.Notes,
			DashboardURL: s.frontendURL + "/dashboard?section=appointments",
		})
		if sendErr := s.emailSender.Send(user.Email, "Confirmación de tu cita en BarberFlow", emailHTML); sendErr != nil {
			log.Printf("no se pudo enviar el correo de la cita %s: %v", appointment.ID, sendErr)
		}
	}

	return dto.AppointmentResponse{
		ID:              appointment.ID.String(),
		UserID:          appointment.UserID.String(),
		ServiceID:       appointment.ServiceID.String(),
		ServiceName:     appointment.ServiceName,
		ServicePrice:    appointment.ServicePrice,
		ServiceDuration: appointment.ServiceDuration,
		ServiceImage:    appointment.ServiceImage,
		AppointmentDate: appointment.AppointmentDate,
		StartTime:       appointment.StartTime,
		Status:          appointment.Status,
		Notes:           appointment.Notes,
		CreatedAt:       appointment.CreatedAt.Format(time.RFC3339),
	}, nil
}

func ensureAppointmentSlotAvailable(repository appointmentRepository.Repository, date time.Time, candidateStart, candidateDuration int, excludeID *uuid.UUID) error {
	appointments, err := repository.FindByDate(date)
	if err != nil {
		return err
	}
	for _, existing := range appointments {
		if excludeID != nil && existing.ID == *excludeID {
			continue
		}
		existingStart, startErr := timeToMinutes(existing.StartTime)
		existingDuration, durationErr := parseDuration(existing.ServiceDuration)
		if startErr != nil || durationErr != nil {
			continue
		}
		if timesOverlap(candidateStart, candidateDuration, existingStart, bookingDuration(existingDuration)) {
			return errors.New("el horario seleccionado ya no está disponible")
		}
	}
	return nil
}

func isAvailableTime(value string) bool {

	for _, availableTime := range availableTimes {

		if availableTime == value {
			return true
		}
	}

	return false
}
