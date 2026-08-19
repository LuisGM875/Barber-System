package router

import (
	"github.com/LuisGM875/barbersystem/internal/core/middleware"
	appointmentHandler "github.com/LuisGM875/barbersystem/internal/features/appointments/handler"
	appointmentRoutes "github.com/LuisGM875/barbersystem/internal/features/appointments/routes"
	authHandler "github.com/LuisGM875/barbersystem/internal/features/auth/handler"
	chatHandler "github.com/LuisGM875/barbersystem/internal/features/chat/handler"
	chatRoutes "github.com/LuisGM875/barbersystem/internal/features/chat/routes"
	postHandler "github.com/LuisGM875/barbersystem/internal/features/posts/handler"
	postRoutes "github.com/LuisGM875/barbersystem/internal/features/posts/routes"
	serviceHandler "github.com/LuisGM875/barbersystem/internal/features/services/handler"
	serviceRoutes "github.com/LuisGM875/barbersystem/internal/features/services/routes"
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.Engine, authHandler *authHandler.Handler, appointmentsHandler *appointmentHandler.Handler, servicesHandler *serviceHandler.Handler, postsHandler *postHandler.Handler, chatsHandler *chatHandler.Handler) {

	auth := router.Group("/api/auth")

	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/verify-email", authHandler.VerifyEmail)
		auth.POST("/forgot-password", authHandler.ForgotPassword)
		auth.POST("/reset-password", authHandler.ResetPassword)
		auth.PUT("/me", middleware.RequireAuth(), authHandler.UpdateProfile)
		auth.DELETE("/me", middleware.RequireAuth(), authHandler.DeleteProfile)
	}

	appointments := router.Group("/api/appointments")
	appointments.Use(middleware.RequireAuth())
	appointmentRoutes.RegisterRoutes(appointments, appointmentsHandler)

	services := router.Group("/api/services")
	serviceRoutes.RegisterRoutes(services, servicesHandler)

	posts := router.Group("/api/posts")
	postRoutes.RegisterRoutes(posts, postsHandler)

	chat := router.Group("/api/chat")
	chat.Use(middleware.RequireAuth())
	chatRoutes.RegisterRoutes(chat, chatsHandler)

}
