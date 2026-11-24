package service

import (
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/LuisGM875/barbersystem/internal/email"
	"github.com/LuisGM875/barbersystem/internal/features/appointments/dto"
	"github.com/LuisGM875/barbersystem/internal/features/appointments/models"
	appointmentRepository "github.com/LuisGM875/barbersystem/internal/features/appointments/repository"
	serviceModels "github.com/LuisGM875/barbersystem/internal/features/services/models"
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

	requestServices := request.Services
	if len(requestServices) == 0 {
		requestServices = request.LegacyItems
	}
	if len(requestServices) == 0 {
		requestServices = []dto.AppointmentServiceRequest{{ServiceID: request.ServiceID, Quantity: 1}}
	}

	type serviceSelection struct {
		service  *serviceModels.Services
		quantity int
		duration int
	}
	selections := make(map[uuid.UUID]*serviceSelection, len(requestServices))
	serviceOrder := make([]uuid.UUID, 0, len(requestServices))
	totalDuration := 0
	totalPrice := 0.0
	for _, requestedService := range requestServices {
		if requestedService.Quantity < 1 {
			return dto.AppointmentResponse{}, errors.New("la cantidad de servicios debe ser mayor a cero")
		}
		itemServiceUUID, parseErr := uuid.Parse(requestedService.ServiceID)
		if parseErr != nil {
			return dto.AppointmentResponse{}, errors.New("servicio inválido")
		}
		selection, exists := selections[itemServiceUUID]
		if !exists {
			serviceModel, findErr := s.serviceRepository.FindByID(itemServiceUUID.String())
			if findErr != nil || serviceModel == nil {
				return dto.AppointmentResponse{}, errors.New("servicio no encontrado")
			}
			if !serviceModel.IsActive {
				return dto.AppointmentResponse{}, errors.New("el servicio no está disponible")
			}
			duration, durationErr := parseDuration(serviceModel.Duration)
			if durationErr != nil {
				return dto.AppointmentResponse{}, durationErr
			}
			selection = &serviceSelection{service: serviceModel, duration: duration}
			selections[itemServiceUUID] = selection
			serviceOrder = append(serviceOrder, itemServiceUUID)
		}
		selection.quantity += requestedService.Quantity
		totalDuration += selection.duration * requestedService.Quantity
		totalPrice += selection.service.Price * float64(requestedService.Quantity)
	}
	primarySelection, exists := selections[serviceUUID]
	if !exists {
		return dto.AppointmentResponse{}, errors.New("el servicio principal debe estar incluido en la cita")
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

	newBookingDuration := bookingDuration(totalDuration)

	candidateStart, err := timeToMinutes(
		request.StartTime,
	)

	if err != nil {
		return dto.AppointmentResponse{}, errors.New(
			"hora inválida",
		)
	}

	endTime := minutesToTime((candidateStart + totalDuration) % (24 * 60))
	customerName := strings.TrimSpace(request.CustomerName)
	if customerName == "" {
		customerName = strings.TrimSpace(request.ClientName)
	}

	bookingGroupID := uuid.New()
	appointments := make([]models.Appointments, 0, len(serviceOrder))
	for _, selectedID := range serviceOrder {
		selection := selections[selectedID]
		appointments = append(appointments, models.Appointments{
			ID:              uuid.New(),
			BookingGroupID:  bookingGroupID,
			UserID:          userUUID,
			ServiceID:       selectedID,
			CustomerName:    customerName,
			ServiceName:     selection.service.Name,
			ServicePrice:    selection.service.Price,
			ServiceDuration: minutesToDuration(selection.duration * selection.quantity),
			ServiceImage:    selection.service.Image,
			Quantity:        selection.quantity,
			IsPrimary:       selectedID == serviceUUID,
			AppointmentDate: request.AppointmentDate,
			StartTime:       request.StartTime,
			EndTime:         endTime,
			Status:          "PENDING",
			Notes:           request.Notes,
		})
	}

	// La revisión y la inserción ocurren bajo el mismo bloqueo transaccional.
	// Dos solicitudes del mismo día no pueden observar el horario libre a la vez.
	err = s.repository.WithDateLock(request.AppointmentDate, func(lockedRepository appointmentRepository.Repository) error {
		if err := ensureAppointmentSlotAvailable(lockedRepository, appointmentDate, candidateStart, newBookingDuration, nil); err != nil {
			return err
		}
		for index := range appointments {
			if err := lockedRepository.Create(&appointments[index]); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return dto.AppointmentResponse{}, err
	}

	// La reserva ya está confirmada en la base de datos. Un fallo del proveedor
	// de correo no debe hacer que el cliente intente crear la misma cita otra vez.
	if user, findErr := s.userRepository.FindByID(userID); findErr != nil {
		log.Printf("no se pudo obtener el usuario para enviar la cita %s: %v", bookingGroupID, findErr)
	} else {
		displayDate := appointmentDate.Format("02/01/2006")
		emailHTML := email.AppointmentTemplate(email.AppointmentDetails{
			Name:         user.Name,
			Service:      primarySelection.service.Name,
			Date:         displayDate,
			Time:         request.StartTime,
			Duration:     minutesToDuration(totalDuration),
			Price:        fmt.Sprintf("$%.2f MXN", totalPrice),
			Notes:        request.Notes,
			DashboardURL: s.frontendURL + "/dashboard?section=appointments",
		})
		if sendErr := s.emailSender.Send(user.Email, "Confirmación de tu cita en BarberFlow", emailHTML); sendErr != nil {
			log.Printf("no se pudo enviar el correo de la cita %s: %v", bookingGroupID, sendErr)
		}
	}

	return appointmentResponse(appointments, time.Now())
}

func minutesToDuration(minutes int) string {
	if minutes >= 60 {
		return fmt.Sprintf("%dh%02dmin", minutes/60, minutes%60)
	}
	return fmt.Sprintf("%dmin", minutes)
}

func ensureAppointmentSlotAvailable(repository appointmentRepository.Repository, date time.Time, candidateStart, candidateDuration int, excludeID *uuid.UUID) error {
	appointments, err := repository.FindByDate(date)
	if err != nil {
		return err
	}
	for _, existing := range appointmentIntervals(appointments) {
		if excludeID != nil && existing.groupID == *excludeID {
			continue
		}
		if timesOverlap(candidateStart, candidateDuration, existing.start, bookingDuration(existing.duration)) {
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
