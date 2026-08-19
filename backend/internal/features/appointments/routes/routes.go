package routes

import (
	"github.com/LuisGM875/barbersystem/internal/core/middleware"
	appointmentHandler "github.com/LuisGM875/barbersystem/internal/features/appointments/handler"
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup, handler *appointmentHandler.Handler) {
	router.GET("", handler.ListMine)
	router.GET("/all", middleware.RequireRole("ADMIN"), handler.ListAll)
	router.POST("", handler.Create)
	router.GET("/availability", handler.GetAvailability)
	router.PATCH("/:id/confirm", handler.ConfirmAttendance)
	router.PATCH("/:id/complete", middleware.RequireRole("ADMIN"), handler.Complete)
	router.PATCH("/:id/status", middleware.RequireRole("ADMIN"), handler.SetStatus)
	router.PATCH("/:id/reschedule", handler.Reschedule)
}
