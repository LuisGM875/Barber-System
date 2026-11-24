package service

import (
	"testing"
	"time"

	"github.com/LuisGM875/barbersystem/internal/features/appointments/models"
)

func TestBookingDuration(t *testing.T) {
	tests := []struct {
		name     string
		duration int
		want     int
	}{
		{name: "servicio corto bloquea toda su duración", duration: 30, want: 30},
		{name: "una hora bloquea toda su duración", duration: 60, want: 60},
		{name: "más de una hora bloquea hasta el término real", duration: 90, want: 90},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := bookingDuration(test.duration); got != test.want {
				t.Fatalf("bookingDuration(%d) = %d; want %d", test.duration, got, test.want)
			}
		})
	}
}

func TestLongAppointmentBlocksNextAppointmentUntilEnd(t *testing.T) {
	const (
		firstStart     = 15 * 60
		firstDuration  = 90
		secondStart    = 16 * 60
		secondDuration = 30
	)

	if !timesOverlap(
		firstStart,
		bookingDuration(firstDuration),
		secondStart,
		bookingDuration(secondDuration),
	) {
		t.Fatal("la cita de las 16:00 debe permanecer bloqueada hasta terminar la cita larga")
	}
}

func TestFindBookedTimesByDate(t *testing.T) {
	fromDate := time.Date(2026, time.June, 1, 0, 0, 0, 0, time.UTC)
	toDate := fromDate.AddDate(0, 0, 1)
	appointments := make([]models.Appointments, 0, len(availableTimes)+1)
	for _, startTime := range availableTimes {
		appointments = append(appointments, models.Appointments{
			AppointmentDate: fromDate.Format("2006-01-02"),
			StartTime:       startTime,
			ServiceDuration: "30min",
		})
	}
	appointments = append(appointments, models.Appointments{
		AppointmentDate: toDate.Format("2006-01-02"),
		StartTime:       availableTimes[0],
		ServiceDuration: "30min",
	})

	got := findBookedTimesByDate(fromDate, toDate, appointments, 30)
	if len(got[fromDate.Format("2006-01-02")]) != len(availableTimes) {
		t.Fatal("expected every time on the first date to be booked")
	}
	if len(got[toDate.Format("2006-01-02")]) != 1 {
		t.Fatal("expected only one booked time on the second date")
	}
}

func TestAvailabilityWithoutSelectedServiceBlocksExistingAppointmentDuration(t *testing.T) {
	appointments := []models.Appointments{{
		StartTime:       "15:00",
		ServiceDuration: "60min",
	}}

	bookedTimes := findBookedTimes(appointments, 30, nil)
	if len(bookedTimes) != 2 || bookedTimes[0] != "15:00" || bookedTimes[1] != "15:30" {
		t.Fatalf("booked times = %v; want [15:00 15:30]", bookedTimes)
	}
}
