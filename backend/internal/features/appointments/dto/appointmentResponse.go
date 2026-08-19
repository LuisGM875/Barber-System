package dto

type AppointmentResponse struct {
	ID              string  `json:"id"`
	UserID          string  `json:"userId"`
	UserName        string  `json:"userName,omitempty"`
	ServiceID       string  `json:"serviceId"`
	ServiceName     string  `json:"serviceName"`
	ServicePrice    float64 `json:"servicePrice"`
	ServiceDuration string  `json:"serviceDuration"`
	ServiceImage    string  `json:"serviceImage"`
	AppointmentDate string  `json:"appointmentDate"`
	StartTime       string  `json:"startTime"`
	Status          string  `json:"status"`
	Notes           string  `json:"notes"`
	CreatedAt       string  `json:"createdAt"`
	CanConfirm      bool    `json:"canConfirm"`
	CanComplete     bool    `json:"canComplete"`
	IsPast          bool    `json:"isPast"`
	NeedsReview     bool    `json:"needsReview"`
}
