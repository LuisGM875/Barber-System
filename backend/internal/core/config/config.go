package config

import (
	"log"
	"os"

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

	JWTSecret    string
	ResendAPIKey string
	EmailFrom    string
	FrontendURL  string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println(".env no encontrado, usando variables del sistema")
	}

	return &Config{
		AppName: os.Getenv("APP_NAME"),
		AppEnv:  os.Getenv("APP_ENV"),
		AppPort: os.Getenv("APP_PORT"),

		DBHost:     os.Getenv("DB_HOST"),
		DBPort:     os.Getenv("DB_PORT"),
		DBUser:     os.Getenv("DB_USER"),
		DBPassword: os.Getenv("DB_PASSWORD"),
		DBName:     os.Getenv("DB_NAME"),
		DBSSLMode:  os.Getenv("DB_SSLMODE"),

		JWTSecret:    os.Getenv("JWT_SECRET"),
		ResendAPIKey: os.Getenv("RESEND_API_KEY"),
		EmailFrom:    os.Getenv("EMAIL_FROM"),
		FrontendURL:  os.Getenv("FRONTEND_URL"),
	}
}
