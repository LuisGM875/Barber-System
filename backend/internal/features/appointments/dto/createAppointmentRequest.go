package dto

type CreateAppointmentRequest struct {
	ServiceID       string  `json:"serviceId" binding:"required"`
	ServiceName     string  `json:"serviceName" binding:"required"`
	ServicePrice    float64 `json:"servicePrice" binding:"required"`
	ServiceDuration string  `json:"serviceDuration" binding:"required"`
	ServiceImage    string  `json:"serviceImage"`

	AppointmentDate string `json:"appointmentDate" binding:"required"`
	StartTime       string `json:"startTime" binding:"required"`

	Notes      string                   `json:"notes"`
	ClientName string                   `json:"clientName"`
	Items      []AppointmentItemRequest `json:"items"`
}

type AppointmentItemRequest struct {
	ServiceID string `json:"serviceId" binding:"required"`
	Quantity  int    `json:"quantity" binding:"required,min=1"`
}

type AppointmentItem struct {
	ServiceID string  `json:"serviceId"`
	Name      string  `json:"name"`
	Price     float64 `json:"price"`
	Duration  string  `json:"duration"`
	Image     string  `json:"image"`
	Quantity  int     `json:"quantity"`
}

type AvailabilityQuery struct {
	Date                 string `form:"date" binding:"required"`
	ServiceID            string `form:"serviceId" binding:"required"`
	ExcludeAppointmentID string `form:"excludeAppointmentId"`
	ServiceIDs           string `form:"serviceIds"`
}

type AvailabilityResponse struct {
	Date        string   `json:"date"`
	BookedTimes []string `json:"bookedTimes"`
}

type RescheduleRequest struct {
	AppointmentDate string `json:"appointmentDate" binding:"required"`
	StartTime       string `json:"startTime" binding:"required"`
}
