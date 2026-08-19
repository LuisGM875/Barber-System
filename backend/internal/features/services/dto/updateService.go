package dto

type UpdateServiceRequest struct {
    Name        string  `json:"name" form:"name" binding:"required"`
    Description string  `json:"description" form:"description" binding:"required"`
    Price       float64 `json:"price" form:"price" binding:"required"`
    Duration    string  `json:"duration" form:"duration" binding:"required"`
    IsActive    bool    `json:"isActive" form:"isActive"`
}