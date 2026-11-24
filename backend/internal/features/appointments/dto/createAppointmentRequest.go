package dto

type CreateAppointmentRequest struct {
	ServiceID       string `json:"serviceId" binding:"required"`
	AppointmentDate string `json:"appointmentDate" binding:"required"`
	StartTime       string `json:"startTime" binding:"required"`

	Notes        string                      `json:"notes"`
	CustomerName string                      `json:"customerName"`
	ClientName   string                      `json:"clientName"`
	Services     []AppointmentServiceRequest `json:"services"`
	LegacyItems  []AppointmentServiceRequest `json:"items,omitempty"`
}

type AppointmentServiceRequest struct {
	ServiceID string `json:"serviceId" binding:"required"`
	Quantity  int    `json:"quantity" binding:"required,min=1"`
}

type AppointmentService struct {
	ServiceID string  `json:"serviceId"`
	Name      string  `json:"name"`
	Price     float64 `json:"price"`
	Duration  string  `json:"duration"`
	Image     string  `json:"image"`
	Quantity  int     `json:"quantity"`
}

type AvailabilityQuery struct {
	Date                 string `form:"date" binding:"required"`
	ServiceID            string `form:"serviceId"`
	ExcludeAppointmentID string `form:"excludeAppointmentId"`
	ServiceIDs           string `form:"serviceIds"`
}

type AvailabilityRangeQuery struct {
	From       string `form:"from" binding:"required"`
	To         string `form:"to" binding:"required"`
	ServiceID  string `form:"serviceId" binding:"required"`
	ServiceIDs string `form:"serviceIds"`
}

type AvailabilityResponse struct {
	Date        string   `json:"date"`
	BookedTimes []string `json:"bookedTimes"`
}

type AvailabilityRangeResponse struct {
	BookedTimesByDate map[string][]string `json:"bookedTimesByDate"`
}

type RescheduleRequest struct {
	AppointmentDate string `json:"appointmentDate" binding:"required"`
	StartTime       string `json:"startTime" binding:"required"`
}
