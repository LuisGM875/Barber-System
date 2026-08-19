package service

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/LuisGM875/barbersystem/internal/features/appointments/dto"
	"github.com/google/uuid"
)

var availableTimes = []string{
	"09:00",
	"09:30",
	"10:00",
	"10:30",
	"11:00",
	"11:30",
	"12:00",
	"12:30",
	"13:00",
	"14:00",
	"14:30",
	"15:00",
	"15:30",
	"16:00",
	"16:30",
	"17:00",
	"17:30",
	"18:00",
}

func parseDuration(duration string) (int, error) {

	duration = strings.ToLower(
		strings.TrimSpace(duration),
	)

	duration = strings.ReplaceAll(duration, "minutos", "min")
	duration = strings.ReplaceAll(duration, "minuto", "min")
	duration = strings.ReplaceAll(duration, "horas", "h")
	duration = strings.ReplaceAll(duration, "hora", "h")
	duration = strings.ReplaceAll(duration, " ", "")

	// Ejemplo:
	// 1h30min
	if strings.Contains(duration, "h") {

		parts := strings.Split(duration, "h")

		hours, err := strconv.Atoi(parts[0])
		if err != nil {
			return 0, errors.New("duración inválida")
		}

		total := hours * 60

		if len(parts) > 1 && parts[1] != "" {

			minutesText := strings.TrimSuffix(
				parts[1],
				"min",
			)

			minutes, err := strconv.Atoi(minutesText)
			if err != nil {
				return 0, errors.New("duración inválida")
			}

			total += minutes
		}

		return total, nil
	}

	// Ejemplo:
	// 90min
	if strings.HasSuffix(duration, "min") {

		value := strings.TrimSuffix(
			duration,
			"min",
		)

		minutes, err := strconv.Atoi(value)
		if err != nil {
			return 0, errors.New("duración inválida")
		}

		return minutes, nil
	}

	// Ejemplo:
	// 60
	minutes, err := strconv.Atoi(duration)

	if err != nil {
		return 0, errors.New("duración inválida")
	}

	return minutes, nil
}

func timeToMinutes(value string) (int, error) {

	t, err := time.Parse(
		"15:04",
		value,
	)

	if err != nil {
		return 0, err
	}

	return t.Hour()*60 + t.Minute(), nil
}

func timesOverlap(
	startA int,
	durationA int,
	startB int,
	durationB int,
) bool {

	endA := startA + durationA
	endB := startB + durationB

	return startA < endB &&
		startB < endA
}

// bookingDuration devuelve el tiempo durante el cual el servicio necesita
// bloquear la agenda. Los servicios de más de una hora liberan sus últimos
// 30 minutos para que la siguiente cita pueda comenzar mientras finalizan.
func bookingDuration(serviceDuration int) int {
	if serviceDuration > 60 {
		return serviceDuration - 30
	}

	return serviceDuration
}

func (s *service) GetAvailability(
	dateValue string,
	serviceID uuid.UUID,
	excludeAppointmentID *uuid.UUID,
) (dto.AvailabilityResponse, error) {

	date, err := time.Parse(
		"2006-01-02",
		dateValue,
	)

	if err != nil {
		return dto.AvailabilityResponse{}, errors.New(
			"fecha inválida",
		)
	}

	// Buscar el servicio real en la tabla services.
	service, err := s.serviceRepository.FindByID(
		serviceID.String(),
	)

	if err != nil {
		return dto.AvailabilityResponse{}, errors.New(
			"servicio no encontrado",
		)
	}

	if !service.IsActive {
		return dto.AvailabilityResponse{}, errors.New(
			"el servicio no está disponible",
		)
	}

	// Duración del servicio que el usuario quiere reservar.
	newDuration, err := parseDuration(
		service.Duration,
	)

	if err != nil {
		return dto.AvailabilityResponse{}, err
	}

	newBookingDuration := bookingDuration(newDuration)

	// Obtener todas las citas de ese día.
	appointments, err := s.repository.FindByDate(date)

	if err != nil {
		return dto.AvailabilityResponse{}, err
	}

	bookedTimes := make(
		[]string,
		0,
	)

	// Revisamos cada horario disponible.
	for _, availableTime := range availableTimes {

		candidateStart, err := timeToMinutes(
			availableTime,
		)

		if err != nil {
			continue
		}

		isBooked := false

		// Revisamos contra todas las citas existentes.
		for _, appointment := range appointments {
			if excludeAppointmentID != nil && appointment.ID == *excludeAppointmentID {
				continue
			}

			existingStart, err := timeToMinutes(
				appointment.StartTime,
			)

			if err != nil {
				continue
			}

			existingDuration, err := parseDuration(
				appointment.ServiceDuration,
			)

			if err != nil {
				continue
			}

			existingBookingDuration := bookingDuration(existingDuration)

			// Si los intervalos se cruzan,
			// bloqueamos el horario.
			if timesOverlap(
				candidateStart,
				newBookingDuration,
				existingStart,
				existingBookingDuration,
			) {
				isBooked = true
				break
			}
		}

		if isBooked {
			bookedTimes = append(
				bookedTimes,
				availableTime,
			)
		}
	}

	return dto.AvailabilityResponse{
		Date:        dateValue,
		BookedTimes: bookedTimes,
	}, nil
}

func minutesToTime(minutes int) string {

	hour := minutes / 60
	minute := minutes % 60

	return fmt.Sprintf(
		"%02d:%02d",
		hour,
		minute,
	)
}
