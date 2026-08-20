package config

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	AppName string
	AppEnv  string
	AppPort string

	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string

	JWTSecret      string
	ResendAPIKey   string
	EmailFrom      string
	FrontendURL    string
	AllowedOrigins []string

	SupabaseURL           string
	SupabaseServiceKey    string
	SupabaseStorageBucket string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println(".env no encontrado, usando variables del sistema")
	}

	appPort := os.Getenv("PORT")
	if appPort == "" {
		appPort = os.Getenv("APP_PORT")
	}
	if appPort == "" {
		appPort = "8080"
	}

	allowedOrigins := splitAndTrim(os.Getenv("CORS_ALLOWED_ORIGINS"))
	if len(allowedOrigins) == 0 {
		allowedOrigins = []string{"http://localhost:5173"}
	}

	return &Config{
		AppName: os.Getenv("APP_NAME"),
		AppEnv:  os.Getenv("APP_ENV"),
		AppPort: appPort,

		DBHost:     os.Getenv("DB_HOST"),
		DBPort:     os.Getenv("DB_PORT"),
		DBUser:     os.Getenv("DB_USER"),
		DBPassword: os.Getenv("DB_PASSWORD"),
		DBName:     os.Getenv("DB_NAME"),
		DBSSLMode:  os.Getenv("DB_SSLMODE"),

		JWTSecret:      os.Getenv("JWT_SECRET"),
		ResendAPIKey:   os.Getenv("RESEND_API_KEY"),
		EmailFrom:      os.Getenv("EMAIL_FROM"),
		FrontendURL:    os.Getenv("FRONTEND_URL"),
		AllowedOrigins: allowedOrigins,

		SupabaseURL:           os.Getenv("SUPABASE_URL"),
		SupabaseServiceKey:    os.Getenv("SUPABASE_SERVICE_ROLE_KEY"),
		SupabaseStorageBucket: os.Getenv("SUPABASE_STORAGE_BUCKET"),
	}
}

func splitAndTrim(value string) []string {
	var values []string
	for _, item := range strings.Split(value, ",") {
		if trimmed := strings.TrimSpace(item); trimmed != "" {
			values = append(values, trimmed)
		}
	}

	return values
}
