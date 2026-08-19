package dto

type UpdatePostRequest struct {
	Title       string `form:"title" binding:"required"`
	Description string `form:"description" binding:"required"`
}
