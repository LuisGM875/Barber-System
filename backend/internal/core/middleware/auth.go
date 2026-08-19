package middleware


import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/LuisGM875/barbersystem/internal/core/security"
)

func RequireAuth() gin.HandlerFunc {
	return func(context *gin.Context) {
		authorizationHeader := context.GetHeader("Authorization")
		if authorizationHeader == "" {
			context.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "missing authorization token"})
			return
		}

		const bearerPrefix = "Bearer "
		if !strings.HasPrefix(authorizationHeader, bearerPrefix) {
			context.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid authorization token"})
			return
		}

		tokenString := strings.TrimPrefix(authorizationHeader, bearerPrefix)
		claims, err := security.ValidateToken(tokenString)
		if err != nil {
			context.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid or expired token"})
			return
		}

		context.Set("userID", claims.UserID)
		context.Set("email", claims.Email)
		context.Set("role", claims.Role)
		context.Next()
	}
}