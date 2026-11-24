package service

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/LuisGM875/barbersystem/internal/features/appointments/dto"
	"github.com/LuisGM875/barbersystem/internal/features/appointments/models"
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

// bookingDuration keeps the full appointment duration blocked through its end time.
func bookingDuration(serviceDuration int) int {
	return serviceDuration
}

type appointmentInterval struct {
	groupID uuid.UUID
	start   int
	duration int
}

func appointmentBookingGroupID(appointment models.Appointments) uuid.UUID {
	if appointment.BookingGroupID != uuid.Nil {
		return appointment.BookingGroupID
	}
	return appointment.ID
}

func appointmentIntervals(appointments []models.Appointments) []appointmentInterval {
	intervals := make([]appointmentInterval, 0, len(appointments))
	indexByGroup := make(map[uuid.UUID]int, len(appointments))
	for _, appointment := range appointments {
		groupID := appointmentBookingGroupID(appointment)
		duration, err := parseDuration(appointment.ServiceDuration)
		if err != nil {
			continue
		}
		start, err := timeToMinutes(appointment.StartTime)
		if err != nil {
			continue
		}
		index, exists := indexByGroup[groupID]
		if !exists {
			index = len(intervals)
			indexByGroup[groupID] = index
			intervals = append(intervals, appointmentInterval{groupID: groupID, start: start})
		}
		intervals[index].duration += duration
	}
	return intervals
}

func (s *service) GetAvailability(
	dateValue string,
	serviceID uuid.UUID,
	serviceIDs []uuid.UUID,
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

	if len(serviceIDs) == 0 && serviceID != uuid.Nil {
		serviceIDs = []uuid.UUID{serviceID}
	}

	newBookingDuration := 30
	if len(serviceIDs) > 0 {
		newBookingDuration, err = s.bookingDurationForServices(serviceIDs)
		if err != nil {
			return dto.AvailabilityResponse{}, err
		}
	}

	// Obtener todas las citas de ese día.
	appointments, err := s.repository.FindByDate(date)

	if err != nil {
		return dto.AvailabilityResponse{}, err
	}

	return dto.AvailabilityResponse{
		Date:        dateValue,
		BookedTimes: findBookedTimes(appointments, newBookingDuration, excludeAppointmentID),
	}, nil
}

func (s *service) GetAvailabilityRange(
	from string,
	to string,
	serviceID uuid.UUID,
	serviceIDs []uuid.UUID,
) (dto.AvailabilityRangeResponse, error) {
	fromDate, err := time.Parse("2006-01-02", from)
	if err != nil {
		return dto.AvailabilityRangeResponse{}, errors.New("fecha inicial inválida")
	}
	toDate, err := time.Parse("2006-01-02", to)
	if err != nil {
		return dto.AvailabilityRangeResponse{}, errors.New("fecha final inválida")
	}
	if toDate.Before(fromDate) || toDate.Sub(fromDate) > 30*24*time.Hour {
		return dto.AvailabilityRangeResponse{}, errors.New("el rango de disponibilidad no puede superar un mes")
	}
	if len(serviceIDs) == 0 {
		serviceIDs = []uuid.UUID{serviceID}
	}

	newBookingDuration, err := s.bookingDurationForServices(serviceIDs)
	if err != nil {
		return dto.AvailabilityRangeResponse{}, err
	}
	appointments, err := s.repository.FindByDateRange(from, to)
	if err != nil {
		return dto.AvailabilityRangeResponse{}, err
	}

	return dto.AvailabilityRangeResponse{
		BookedTimesByDate: findBookedTimesByDate(fromDate, toDate, appointments, newBookingDuration),
	}, nil
}

func (s *service) bookingDurationForServices(serviceIDs []uuid.UUID) (int, error) {
	newDuration := 0
	for _, id := range serviceIDs {
		service, err := s.serviceRepository.FindByID(id.String())
		if err != nil || service == nil {
			return 0, errors.New("servicio no encontrado")
		}
		if !service.IsActive {
			return 0, errors.New("el servicio no está disponible")
		}
		duration, err := parseDuration(service.Duration)
		if err != nil {
			return 0, err
		}
		newDuration += duration
	}
	return bookingDuration(newDuration), nil
}

func findBookedTimes(
	appointments []models.Appointments,
	candidateDuration int,
	excludeAppointmentID *uuid.UUID,
) []string {
	bookedTimes := make([]string, 0)
	intervals := appointmentIntervals(appointments)
	for _, availableTime := range availableTimes {
		candidateStart, err := timeToMinutes(availableTime)
		if err != nil {
			continue
		}
		for _, interval := range intervals {
			if excludeAppointmentID != nil && interval.groupID == *excludeAppointmentID {
				continue
			}
			if timesOverlap(candidateStart, candidateDuration, interval.start, bookingDuration(interval.duration)) {
				bookedTimes = append(bookedTimes, availableTime)
				break
			}
		}
	}
	return bookedTimes
}

func findBookedTimesByDate(
	fromDate time.Time,
	toDate time.Time,
	appointments []models.Appointments,
	candidateDuration int,
) map[string][]string {
	appointmentsByDate := make(map[string][]models.Appointments)
	for _, appointment := range appointments {
		appointmentsByDate[appointment.AppointmentDate] = append(
			appointmentsByDate[appointment.AppointmentDate],
			appointment,
		)
	}

	bookedTimesByDate := make(map[string][]string)
	for date := fromDate; !date.After(toDate); date = date.AddDate(0, 0, 1) {
		dateValue := date.Format("2006-01-02")
		bookedTimesByDate[dateValue] = findBookedTimes(
			appointmentsByDate[dateValue],
			candidateDuration,
			nil,
		)
	}
	return bookedTimesByDate
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
