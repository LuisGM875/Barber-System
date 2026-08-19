package dto

type EmailRequest struct {
	Email string `json:"email" binding:"required,email"`
}
type TokenRequest struct {
	Token string `json:"token" binding:"required"`
}
type ResetPasswordRequest struct {
	Token    string `json:"token" binding:"required"`
	Password string `json:"password" binding:"required,min=10,max=72"`
}
type MessageResponse struct {
	Message string `json:"message"`
}
