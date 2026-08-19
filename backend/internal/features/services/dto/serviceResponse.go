package dto

type ServiceResponse struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	Duration    string  `json:"duration"`
	Image       string  `json:"image"`
	IsActive    bool    `json:"isActive"`
}