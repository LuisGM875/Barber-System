package routes

import (
	"github.com/LuisGM875/barbersystem/internal/core/middleware"
	postHandler "github.com/LuisGM875/barbersystem/internal/features/posts/handler"
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup, handler *postHandler.Handler) {
	router.GET("", handler.FindAll)
	router.POST("", middleware.RequireAuth(), middleware.RequireRole("ADMIN"), handler.Create)
	router.PUT("/:id", middleware.RequireAuth(), middleware.RequireRole("ADMIN"), handler.Update)
	router.DELETE("/:id", middleware.RequireAuth(), middleware.RequireRole("ADMIN"), handler.Delete)
}
