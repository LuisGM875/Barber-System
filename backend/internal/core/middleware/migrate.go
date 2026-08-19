package middleware

import (
	appointmentsModel "github.com/LuisGM875/barbersystem/internal/features/appointments/models"
	authModel "github.com/LuisGM875/barbersystem/internal/features/auth/models"
	conversationsModel "github.com/LuisGM875/barbersystem/internal/features/chat/models"
	messagesModel "github.com/LuisGM875/barbersystem/internal/features/chat/models"
	postsModel "github.com/LuisGM875/barbersystem/internal/features/posts/models"
	servicesModel "github.com/LuisGM875/barbersystem/internal/features/services/models"
	"gorm.io/gorm"
)

func AutoMigrate(db *gorm.DB) error {

	err := db.AutoMigrate(
		&authModel.User{},
		&authModel.AuthToken{},
		&servicesModel.Services{},
		&appointmentsModel.Appointments{},
		&postsModel.Post{},
		&conversationsModel.Conversation{},
		&messagesModel.Message{},
	)

	return err
}
