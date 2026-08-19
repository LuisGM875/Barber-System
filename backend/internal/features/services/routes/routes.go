package routes

import (
	"github.com/LuisGM875/barbersystem/internal/core/middleware"
	serviceHandler "github.com/LuisGM875/barbersystem/internal/features/services/handler"
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup, handler *serviceHandler.Handler) {
	router.GET("", handler.FindAll)
	router.POST("", middleware.RequireAuth(), middleware.RequireRole("ADMIN"), handler.Create)
	router.PUT("/:id", middleware.RequireAuth(), middleware.RequireRole("ADMIN"), handler.Update)
	router.DELETE("/:id", middleware.RequireAuth(), middleware.RequireRole("ADMIN"), handler.Delete)
}
