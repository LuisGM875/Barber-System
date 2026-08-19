package security

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var secretKey []byte

func ConfigureJWT(secret string) error {
	if len(secret) < 32 {
		return errors.New("JWT_SECRET debe contener al menos 32 caracteres")
	}
	secretKey = []byte(secret)
	return nil
}

func GenerateToken(
	userID string,
	email string,
	role string,
) (string, error) {
	if len(secretKey) == 0 {
		return "", errors.New("JWT no está configurado")
	}

	claims := Claims{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(
				time.Now().Add(24 * time.Hour),
			),
			IssuedAt: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(
		jwt.SigningMethodHS256,
		claims,
	)

	return token.SignedString(secretKey)

}

func ValidateToken(tokenString string) (*Claims, error) {

	token, err := jwt.ParseWithClaims(
		tokenString,
		&Claims{},
		func(token *jwt.Token) (interface{}, error) {
			return secretKey, nil
		},
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
	)

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)

	if !ok || !token.Valid {
		return nil, err
	}

	return claims, nil

}
