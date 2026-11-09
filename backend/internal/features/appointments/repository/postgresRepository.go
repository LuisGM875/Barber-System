package repository

import (
	"time"

	"github.com/LuisGM875/barbersystem/internal/features/appointments/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AppointmentRepository struct {
	db *gorm.DB
}

func NewAppointmentRepository(db *gorm.DB) *AppointmentRepository {
	return &AppointmentRepository{
		db: db,
	}
}

// WithDateLock serializa únicamente las modificaciones de una misma fecha.
// El advisory lock se libera automáticamente al terminar la transacción.
func (r *AppointmentRepository) WithDateLock(date string, operation func(Repository) error) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec("SELECT pg_advisory_xact_lock(hashtext(?))", "appointments:"+date).Error; err != nil {
			return err
		}
		return operation(&AppointmentRepository{db: tx})
	})
}

func (r *AppointmentRepository) Create(
	appointment *models.Appointments,
) error {
	return r.db.Create(appointment).Error
}

func (r *AppointmentRepository) FindByUserID(
	userID string,
) ([]models.Appointments, error) {

	var appointments []models.Appointments

	err := r.db.
		Preload("User").
		Where("user_id = ?", userID).
		Where("status != ?", "CANCELLED").
		Order("appointment_date ASC, start_time ASC").
		Find(&appointments).Error

	return appointments, err
}

func (r *AppointmentRepository) FindAll() ([]models.Appointments, error) {
	var appointments []models.Appointments
	err := r.db.Preload("User").Where("status != ?", "CANCELLED").Order("appointment_date ASC, start_time ASC").Find(&appointments).Error
	return appointments, err
}

func (r *AppointmentRepository) FindByDateRange(from, to string) ([]models.Appointments, error) {
	var appointments []models.Appointments
	err := r.db.
		Preload("User").
		Where("appointment_date BETWEEN ? AND ?", from, to).
		Where("status != ?", "CANCELLED").
		Order("appointment_date ASC, start_time ASC").
		Find(&appointments).Error
	return appointments, err
}

func (r *AppointmentRepository) FindByDate(
	date time.Time,
) ([]models.Appointments, error) {

	var appointments []models.Appointments

	dateValue := date.Format("2006-01-02")

	err := r.db.
		Where("appointment_date = ?", dateValue).
		Where("status != ?", "CANCELLED").
		Order("start_time ASC").
		Find(&appointments).Error

	return appointments, err
}

func (r *AppointmentRepository) GetByID(
	id uuid.UUID,
) (*models.Appointments, error) {

	var appointment models.Appointments

	err := r.db.
		Preload("User").
		Where("id = ?", id).
		First(&appointment).Error

	if err != nil {
		return nil, err
	}

	return &appointment, nil
}

func (r *AppointmentRepository) Update(appointment *models.Appointments) error {
	// Los cambios de estado no deben volver a escribir user_id, service_id ni
	// los datos históricos de la cita. Además de ser innecesario, hacerlo
	// vuelve a validar llaves foráneas de registros antiguos.
	return r.db.
		Model(&models.Appointments{}).
		Where("id = ?", appointment.ID).
		Update("status", appointment.Status).
		Error
}

func (r *AppointmentRepository) UpdateSchedule(appointment *models.Appointments) error {
	return r.db.Model(&models.Appointments{}).Where("id = ?", appointment.ID).Updates(map[string]any{
		"appointment_date": appointment.AppointmentDate,
		"start_time":       appointment.StartTime,
	}).Error
}
