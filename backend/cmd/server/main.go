package main

import (
	"fmt"
	"log"

	"github.com/LuisGM875/barbersystem/internal/core/config"
	"github.com/LuisGM875/barbersystem/internal/core/database"
	"github.com/LuisGM875/barbersystem/internal/core/middleware"
	"github.com/LuisGM875/barbersystem/internal/core/router"
	middlewareSecurity "github.com/LuisGM875/barbersystem/internal/core/security"
	mail "github.com/LuisGM875/barbersystem/internal/email"
	appointmentHandler "github.com/LuisGM875/barbersystem/internal/features/appointments/handler"
	appointmentRepository "github.com/LuisGM875/barbersystem/internal/features/appointments/repository"
	appointmentService "github.com/LuisGM875/barbersystem/internal/features/appointments/service"
	authHandler "github.com/LuisGM875/barbersystem/internal/features/auth/handler"
	authRepository "github.com/LuisGM875/barbersystem/internal/features/auth/repository"
	authService "github.com/LuisGM875/barbersystem/internal/features/auth/service"
	chatHandler "github.com/LuisGM875/barbersystem/internal/features/chat/handler"
	chatRepository "github.com/LuisGM875/barbersystem/internal/features/chat/repository"
	chatService "github.com/LuisGM875/barbersystem/internal/features/chat/service"
	postHandler "github.com/LuisGM875/barbersystem/internal/features/posts/handler"
	postRepository "github.com/LuisGM875/barbersystem/internal/features/posts/repository"
	postService "github.com/LuisGM875/barbersystem/internal/features/posts/service"
	serviceHandler "github.com/LuisGM875/barbersystem/internal/features/services/handler"
	serviceRepository "github.com/LuisGM875/barbersystem/internal/features/services/repository"
	serviceService "github.com/LuisGM875/barbersystem/internal/features/services/service"
	"github.com/LuisGM875/barbersystem/internal/storage"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {

	cfg := config.Load()
	if err := middlewareSecurity.ConfigureJWT(cfg.JWTSecret); err != nil {
		log.Fatal("Configuración JWT inválida: ", err)
	}
	if err := storage.Configure(cfg.SupabaseURL, cfg.SupabaseServiceKey, cfg.SupabaseStorageBucket); err != nil {
		log.Fatal("Configuración de Supabase Storage inválida: ", err)
	}

	db, err := database.Connect(cfg)

	if err != nil {
		log.Fatal("Error conectando DB:", err)
	}

	err = middleware.AutoMigrate(db)

	if err != nil {
		log.Fatal("Error migrando DB:", err)
	}

	routerConfig := gin.Default()

	authRepository := authRepository.NewRepository(db)
	appointmentRepository := appointmentRepository.NewAppointmentRepository(db)

	serviceRepository := serviceRepository.NewRepository(db)
	postsRepository := postRepository.NewRepository(db)
	chatsRepository := chatRepository.NewRepository(db)

	emailSender := mail.NewResendSender(cfg.ResendAPIKey, cfg.EmailFrom)
	authService := authService.NewService(authRepository, emailSender, cfg.FrontendURL)
	appointmentService := appointmentService.NewService(
		appointmentRepository,
		serviceRepository,
		authRepository,
		emailSender,
		cfg.FrontendURL,
	)
	serviceService := serviceService.NewService(serviceRepository)
	postsService := postService.NewService(postsRepository)
	chatsService := chatService.NewService(chatsRepository)

	authHandler := authHandler.NewHandler(authService)
	appointmentsHandler := appointmentHandler.NewHandler(appointmentService)
	servicesHandler := serviceHandler.NewHandler(serviceService)
	postsHandler := postHandler.NewHandler(postsService)
	chatsHandler := chatHandler.NewHandler(chatsService)

	routerConfig.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	routerConfig.GET("/health", func(context *gin.Context) {
		context.JSON(200, gin.H{"status": "ok"})
	})

	routerConfig.Static("/uploads", "./uploads")

	router.RegisterRoutes(routerConfig, authHandler, appointmentsHandler, servicesHandler, postsHandler, chatsHandler)

	for _, route := range routerConfig.Routes() {
		fmt.Println(route.Method, route.Path)
	}

	log.Printf("Servidor escuchando en el puerto %s", cfg.AppPort)
	if err := routerConfig.Run("0.0.0.0:" + cfg.AppPort); err != nil {
		log.Fatal("Error iniciando servidor: ", err)
	}
}
