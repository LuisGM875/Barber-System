package service

import (
	"testing"
	"time"

	"github.com/LuisGM875/barbersystem/internal/features/appointments/models"
	"github.com/google/uuid"
)

func TestAppointmentResponseAggregatesGroupedServices(t *testing.T) {
	groupID := uuid.New()
	userID := uuid.New()
	date := time.Now().In(businessLocation).AddDate(0, 0, 1).Format("2006-01-02")
	rows := []models.Appointments{
		{
			ID: groupID, BookingGroupID: groupID, UserID: userID, ServiceID: uuid.New(),
			ServiceName: "Base", ServicePrice: 200, ServiceDuration: "2 h", ServiceImage: "base.webp",
			Quantity: 1, IsPrimary: true, AppointmentDate: date, StartTime: "09:00", EndTime: "11:35", Status: "PENDING",
		},
		{
			ID: uuid.New(), BookingGroupID: groupID, UserID: userID, ServiceID: uuid.New(),
			ServiceName: "Corte", ServicePrice: 100, ServiceDuration: "20 min", ServiceImage: "corte.webp",
			Quantity: 1, AppointmentDate: date, StartTime: "09:00", EndTime: "11:35", Status: "PENDING",
		},
		{
			ID: uuid.New(), BookingGroupID: groupID, UserID: userID, ServiceID: uuid.New(),
			ServiceName: "Delineado", ServicePrice: 50, ServiceDuration: "15 min", ServiceImage: "delineado.webp",
			Quantity: 1, AppointmentDate: date, StartTime: "09:00", EndTime: "11:35", Status: "PENDING",
		},
	}

	response, err := appointmentResponse(rows, time.Now())
	if err != nil {
		t.Fatal(err)
	}
	if response.ID != groupID.String() || response.EndTime != "11:35" {
		t.Fatalf("group id/end time = %s/%s", response.ID, response.EndTime)
	}
	if response.ServiceDuration != "2h35min" || response.ServicePrice != 350 {
		t.Fatalf("duration/price = %s/%.2f", response.ServiceDuration, response.ServicePrice)
	}
	if len(response.Services) != 3 {
		t.Fatalf("got %d services; want 3", len(response.Services))
	}
}

func TestGroupedDuplicateServicesOccupyAggregatedDuration(t *testing.T) {
	groupID := uuid.New()
	appointments := []models.Appointments{{
		ID: groupID, BookingGroupID: groupID, StartTime: "09:00", ServiceDuration: "4 h", Quantity: 2,
	}}

	intervals := appointmentIntervals(appointments)
	if len(intervals) != 1 || intervals[0].duration != 240 {
		t.Fatalf("group intervals = %+v; want one 240-minute interval", intervals)
	}
	booked := findBookedTimes(appointments, 30, nil)
	for _, expected := range []string{"09:00", "12:30"} {
		if !containsTime(booked, expected) {
			t.Fatalf("expected %s to be blocked; booked times = %v", expected, booked)
		}
	}
	if containsTime(booked, "13:00") {
		t.Fatalf("expected 13:00 to be available after the 13:00 end time; booked times = %v", booked)
	}
	if bookedAfterExcludingGroup := findBookedTimes(appointments, 30, &groupID); containsTime(bookedAfterExcludingGroup, "09:00") {
		t.Fatalf("excluded group still blocked its own start: %v", bookedAfterExcludingGroup)
	}
}

func TestAppointmentResponsePreservesGroupedServiceQuantity(t *testing.T) {
	groupID := uuid.New()
	row := models.Appointments{
		ID: groupID, BookingGroupID: groupID, UserID: uuid.New(), ServiceID: uuid.New(),
		ServiceName: "Base", ServicePrice: 200, ServiceDuration: "4 h", ServiceImage: "base.webp",
		Quantity: 2, IsPrimary: true, AppointmentDate: time.Now().In(businessLocation).AddDate(0, 0, 1).Format("2006-01-02"),
		StartTime: "09:00", EndTime: "13:00", Status: "PENDING",
	}

	response, err := appointmentResponse([]models.Appointments{row}, time.Now())
	if err != nil {
		t.Fatal(err)
	}
	if response.ServiceDuration != "4h00min" || response.ServicePrice != 400 {
		t.Fatalf("total duration/price = %s/%.2f", response.ServiceDuration, response.ServicePrice)
	}
	if len(response.Services) != 1 || response.Services[0].Quantity != 2 ||
		response.Services[0].Duration != "2h00min" || response.Services[0].Price != 200 {
		t.Fatalf("service details = %+v", response.Services)
	}
}

func containsTime(values []string, expected string) bool {
	for _, value := range values {
		if value == expected {
			return true
		}
	}
	return false
}
