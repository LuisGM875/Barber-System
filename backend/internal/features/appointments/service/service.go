package service

import (
	"github.com/LuisGM875/barbersystem/internal/email"
	"github.com/LuisGM875/barbersystem/internal/features/appointments/dto"
	appointmentRepository "github.com/LuisGM875/barbersystem/internal/features/appointments/repository"
	authRepository "github.com/LuisGM875/barbersystem/internal/features/auth/repository"
	serviceRepository "github.com/LuisGM875/barbersystem/internal/features/services/repository"
	"github.com/google/uuid"
)

type Service interface {
	Create(
		userID string,
		request dto.CreateAppointmentRequest,
	) (dto.AppointmentResponse, error)

	ListByUserID(
		userID string,
	) ([]dto.AppointmentResponse, error)

	ListAll() ([]dto.AppointmentResponse, error)
	ConfirmAttendance(userID string, appointmentID uuid.UUID) (dto.AppointmentResponse, error)
	Complete(appointmentID uuid.UUID) (dto.AppointmentResponse, error)
	SetStatus(appointmentID uuid.UUID, status string) (dto.AppointmentResponse, error)

	GetAvailability(
		date string,
		serviceID uuid.UUID,
		excludeAppointmentID *uuid.UUID,
	) (dto.AvailabilityResponse, error)
	Reschedule(userID string, appointmentID uuid.UUID, request dto.RescheduleRequest) (dto.AppointmentResponse, error)
}

type service struct {
	repository        appointmentRepository.Repository
	serviceRepository serviceRepository.Repository
	userRepository    authRepository.Repository
	emailSender       email.Sender
	frontendURL       string
}

func NewService(
	repository appointmentRepository.Repository,
	serviceRepository serviceRepository.Repository,
	userRepository authRepository.Repository,
	emailSender email.Sender,
	frontendURL string,
) Service {
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}

	return &service{
		repository:        repository,
		serviceRepository: serviceRepository,
		userRepository:    userRepository,
		emailSender:       emailSender,
		frontendURL:       frontendURL,
	}
}
