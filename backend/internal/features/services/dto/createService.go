package dto

type CreateServiceRequest struct {
    Name        string  `form:"name" binding:"required"`
    Description string  `form:"description" binding:"required"`
    Price       float64 `form:"price" binding:"required"`
    Duration    string  `form:"duration" binding:"required"`
    IsActive    bool    `form:"isActive"`
}