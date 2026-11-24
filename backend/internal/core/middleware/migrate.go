package middleware

import (
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	appointmentsModel "github.com/LuisGM875/barbersystem/internal/features/appointments/models"
	authModel "github.com/LuisGM875/barbersystem/internal/features/auth/models"
	conversationsModel "github.com/LuisGM875/barbersystem/internal/features/chat/models"
	messagesModel "github.com/LuisGM875/barbersystem/internal/features/chat/models"
	postsModel "github.com/LuisGM875/barbersystem/internal/features/posts/models"
	servicesModel "github.com/LuisGM875/barbersystem/internal/features/services/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func AutoMigrate(db *gorm.DB) error {
	if err := db.AutoMigrate(
		&authModel.User{},
		&authModel.AuthToken{},
		&servicesModel.Services{},
		&appointmentsModel.Appointments{},
		&postsModel.Post{},
		&conversationsModel.Conversation{},
		&messagesModel.Message{},
	); err != nil {
		return err
	}

	return migrateAppointmentRows(db)
}

type legacyAppointmentRow struct {
	ID              uuid.UUID      `gorm:"column:id"`
	UserID          uuid.UUID      `gorm:"column:user_id"`
	ServiceID       uuid.UUID      `gorm:"column:service_id"`
	CustomerName    string         `gorm:"column:customer_name"`
	ServiceName     string         `gorm:"column:service_name"`
	ServicePrice    float64        `gorm:"column:service_price"`
	ServiceDuration string         `gorm:"column:service_duration"`
	ServiceImage    string         `gorm:"column:service_image"`
	AppointmentDate string         `gorm:"column:appointment_date"`
	StartTime       string         `gorm:"column:start_time"`
	EndTime         string         `gorm:"column:end_time"`
	Status          string         `gorm:"column:status"`
	Notes           string         `gorm:"column:notes"`
	CreatedAt       time.Time      `gorm:"column:created_at"`
	UpdatedAt       time.Time      `gorm:"column:updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"column:deleted_at"`
	UserRole        string         `gorm:"column:user_role"`
	LegacyServiceData json.RawMessage `gorm:"column:items"`
}

type legacyAppointmentService struct {
	ServiceID string  `json:"serviceId"`
	Name      string  `json:"name"`
	Price     float64 `json:"price"`
	Duration  string  `json:"duration"`
	Image     string  `json:"image"`
	Quantity  int     `json:"quantity"`
}

type migratedService struct {
	serviceID uuid.UUID
	name      string
	price     float64
	duration  string
	image     string
	quantity  int
}

func migrateAppointmentRows(db *gorm.DB) error {
	return db.Transaction(func(tx *gorm.DB) error {
		var hasLegacyItems bool
		if err := tx.Raw(`
			SELECT EXISTS (
				SELECT 1
				FROM information_schema.columns
				WHERE table_schema = current_schema()
					AND table_name = 'appointments'
					AND column_name = 'items'
			)
		`).Scan(&hasLegacyItems).Error; err != nil {
			return err
		}

		itemsColumn := "NULL::jsonb AS items"
		if hasLegacyItems {
			itemsColumn = "appointments.items"
		}
		var legacyRows []legacyAppointmentRow
		query := fmt.Sprintf(`
			SELECT appointments.id, appointments.user_id, appointments.service_id,
				appointments.customer_name, appointments.service_name, appointments.service_price,
				appointments.service_duration, appointments.service_image, appointments.appointment_date,
				appointments.start_time, appointments.end_time, appointments.status, appointments.notes,
				appointments.created_at, appointments.updated_at, appointments.deleted_at,
				users.role AS user_role, %s
			FROM appointments
			LEFT JOIN users ON users.id = appointments.user_id
			WHERE appointments.booking_group_id IS NULL
			ORDER BY appointments.created_at ASC, appointments.id ASC
		`, itemsColumn)
		if err := tx.Raw(query).Scan(&legacyRows).Error; err != nil {
			return err
		}

		catalog := make(map[uuid.UUID]servicesModel.Services)
		for _, legacy := range legacyRows {
			if err := migrateLegacyAppointment(tx, legacy, catalog); err != nil {
				return err
			}
		}

		if err := tx.Exec(`
			ALTER TABLE appointments
			ALTER COLUMN booking_group_id SET NOT NULL,
			ALTER COLUMN quantity SET NOT NULL,
			ALTER COLUMN end_time SET NOT NULL
		`).Error; err != nil {
			return err
		}
		if hasLegacyItems {
			return tx.Exec("ALTER TABLE appointments DROP COLUMN items").Error
		}
		return nil
	})
}

func migrateLegacyAppointment(tx *gorm.DB, legacy legacyAppointmentRow, catalog map[uuid.UUID]servicesModel.Services) error {
	var legacyServices []legacyAppointmentService
	if len(legacy.LegacyServiceData) > 0 {
		if err := json.Unmarshal(legacy.LegacyServiceData, &legacyServices); err != nil {
			return fmt.Errorf("no se pudieron migrar los servicios de la cita %s: %w", legacy.ID, err)
		}
	}
	if len(legacyServices) == 0 {
		legacyServices = []legacyAppointmentService{{
			ServiceID: legacy.ServiceID.String(),
			Price:     legacy.ServicePrice,
			Duration:  legacy.ServiceDuration,
			Image:     legacy.ServiceImage,
			Quantity:  1,
		}}
	}

	services := make([]migratedService, 0, len(legacyServices))
	serviceIndexes := make(map[uuid.UUID]int, len(legacyServices))
	primaryID := legacy.ServiceID
	for _, legacyService := range legacyServices {
		serviceID := legacy.ServiceID
		if strings.TrimSpace(legacyService.ServiceID) != "" {
			parsedID, err := uuid.Parse(legacyService.ServiceID)
			if err != nil {
				return fmt.Errorf("servicio inválido en la cita %s: %w", legacy.ID, err)
			}
			serviceID = parsedID
		}
		if serviceID == uuid.Nil {
			return fmt.Errorf("la cita %s no tiene un servicio válido", legacy.ID)
		}

		quantity := legacyService.Quantity
		if quantity < 1 {
			quantity = 1
		}
		name, price := legacyService.Name, legacyService.Price
		duration, image := legacyService.Duration, legacyService.Image
		if name == "" || duration == "" || image == "" {
			service, err := migratedServiceFromCatalog(tx, serviceID, catalog)
			if err != nil {
				if serviceID != legacy.ServiceID {
					return fmt.Errorf("no se encontró el servicio %s usado por la cita %s: %w", serviceID, legacy.ID, err)
				}
				if name == "" {
					name = legacy.ServiceName
				}
				if duration == "" {
					duration = legacy.ServiceDuration
				}
				if image == "" {
					image = legacy.ServiceImage
				}
				if price == 0 {
					price = legacy.ServicePrice
				}
			} else {
				if name == "" {
					name = service.Name
				}
				if duration == "" {
					duration = service.Duration
				}
				if image == "" {
					image = service.Image
				}
				if price == 0 {
					price = service.Price
				}
			}
		}
		if name == "" || duration == "" || image == "" {
			return fmt.Errorf("faltan datos del servicio %s en la cita %s", serviceID, legacy.ID)
		}

		if index, exists := serviceIndexes[serviceID]; exists {
			services[index].quantity += quantity
			continue
		}
		serviceIndexes[serviceID] = len(services)
		services = append(services, migratedService{
			serviceID: serviceID,
			name:      name,
			price:     price,
			duration:  duration,
			image:     image,
			quantity:  quantity,
		})
	}
	if len(services) == 0 {
		return fmt.Errorf("la cita %s no contiene servicios", legacy.ID)
	}
	if _, exists := serviceIndexes[primaryID]; !exists {
		primaryID = services[0].serviceID
	}

	totalDuration, err := migrationDuration(legacy.ServiceDuration)
	if err != nil || totalDuration < 1 {
		totalDuration = 0
		for _, appointmentService := range services {
			duration, parseErr := migrationDuration(appointmentService.duration)
			if parseErr != nil {
				return fmt.Errorf("duración inválida para el servicio %s en la cita %s: %w", appointmentService.serviceID, legacy.ID, parseErr)
			}
			totalDuration += duration * appointmentService.quantity
		}
	}
	start, err := time.Parse("15:04", legacy.StartTime)
	if err != nil {
		return fmt.Errorf("hora inválida en la cita %s: %w", legacy.ID, err)
	}
	endTime := legacy.EndTime
	if endTime == "" {
		endTime = start.Add(time.Duration(totalDuration) * time.Minute).Format("15:04")
	}

	customerName := legacy.CustomerName
	primaryService := services[serviceIndexes[primaryID]]
	if customerName == "" &&
		strings.EqualFold(strings.TrimSpace(legacy.UserRole), "ADMIN") &&
		legacy.ServiceName != primaryService.name {
		customerName = legacy.ServiceName
	}

	groupID := legacy.ID
	for _, appointmentService := range services {
		unitDuration, err := migrationDuration(appointmentService.duration)
		if err != nil {
			return fmt.Errorf("duración inválida para el servicio %s en la cita %s: %w", appointmentService.serviceID, legacy.ID, err)
		}
		row := appointmentsModel.Appointments{
			BookingGroupID:  groupID,
			UserID:          legacy.UserID,
			ServiceID:       appointmentService.serviceID,
			CustomerName:    customerName,
			ServiceName:     appointmentService.name,
			ServicePrice:    appointmentService.price,
			ServiceDuration: migrationDurationString(unitDuration * appointmentService.quantity),
			ServiceImage:    appointmentService.image,
			Quantity:        appointmentService.quantity,
			IsPrimary:       appointmentService.serviceID == primaryID,
			AppointmentDate: legacy.AppointmentDate,
			StartTime:       legacy.StartTime,
			EndTime:         endTime,
			Status:          legacy.Status,
			Notes:           legacy.Notes,
			CreatedAt:       legacy.CreatedAt,
			UpdatedAt:       legacy.UpdatedAt,
			DeletedAt:       legacy.DeletedAt,
		}
		if appointmentService.serviceID == primaryID {
			row.ID = legacy.ID
			if err := tx.Model(&appointmentsModel.Appointments{}).Where("id = ?", legacy.ID).Updates(map[string]any{
				"booking_group_id":  row.ID,
				"customer_name":     row.CustomerName,
				"service_id":        row.ServiceID,
				"service_name":      row.ServiceName,
				"service_price":     row.ServicePrice,
				"service_duration":  row.ServiceDuration,
				"service_image":     row.ServiceImage,
				"quantity":          row.Quantity,
				"is_primary":        true,
				"end_time":          row.EndTime,
			}).Error; err != nil {
				return err
			}
			continue
		}
		if err := tx.Create(&row).Error; err != nil {
			return fmt.Errorf("no se pudo crear el registro del servicio %s para la cita %s: %w", appointmentService.serviceID, legacy.ID, err)
		}
	}
	return nil
}

func migratedServiceFromCatalog(tx *gorm.DB, id uuid.UUID, catalog map[uuid.UUID]servicesModel.Services) (servicesModel.Services, error) {
	if service, exists := catalog[id]; exists {
		return service, nil
	}
	var service servicesModel.Services
	if err := tx.Unscoped().Where("id = ?", id).First(&service).Error; err != nil {
		return servicesModel.Services{}, err
	}
	catalog[id] = service
	return service, nil
}

func migrationDuration(value string) (int, error) {
	value = strings.ToLower(strings.TrimSpace(value))
	value = strings.ReplaceAll(value, "minutos", "min")
	value = strings.ReplaceAll(value, "minuto", "min")
	value = strings.ReplaceAll(value, "horas", "h")
	value = strings.ReplaceAll(value, "hora", "h")
	value = strings.ReplaceAll(value, " ", "")

	if strings.Contains(value, "h") {
		parts := strings.SplitN(value, "h", 2)
		hours, err := strconv.Atoi(parts[0])
		if err != nil {
			return 0, err
		}
		minutes := 0
		if len(parts) == 2 && parts[1] != "" {
			minuteText := strings.TrimSuffix(parts[1], "min")
			minutes, err = strconv.Atoi(minuteText)
			if err != nil {
				return 0, err
			}
		}
		return hours*60 + minutes, nil
	}
	if strings.HasSuffix(value, "min") {
		value = strings.TrimSuffix(value, "min")
	}
	minutes, err := strconv.Atoi(value)
	if err != nil {
		return 0, errors.New("duración inválida")
	}
	return minutes, nil
}

func migrationDurationString(minutes int) string {
	if minutes >= 60 {
		return fmt.Sprintf("%dh%02dmin", minutes/60, minutes%60)
	}
	return fmt.Sprintf("%dmin", minutes)
}
