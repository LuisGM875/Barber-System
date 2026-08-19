package service

import "testing"

func TestBookingDuration(t *testing.T) {
	tests := []struct {
		name     string
		duration int
		want     int
	}{
		{name: "servicio corto bloquea toda su duración", duration: 30, want: 30},
		{name: "una hora bloquea toda su duración", duration: 60, want: 60},
		{name: "más de una hora libera treinta minutos", duration: 90, want: 60},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := bookingDuration(test.duration); got != test.want {
				t.Fatalf("bookingDuration(%d) = %d; want %d", test.duration, got, test.want)
			}
		})
	}
}

func TestLongAppointmentAllowsNextAppointmentInLastHalfHour(t *testing.T) {
	const (
		firstStart     = 15 * 60
		firstDuration  = 90
		secondStart    = 16 * 60
		secondDuration = 30
	)

	if timesOverlap(
		firstStart,
		bookingDuration(firstDuration),
		secondStart,
		bookingDuration(secondDuration),
	) {
		t.Fatal("la cita de las 16:00 debería estar disponible cuando la cita larga comenzó a las 15:00")
	}
}
