package security

import (
	"errors"
	"unicode"
	"unicode/utf8"
)

// ValidatePassword centraliza la política para que registro y recuperación
// exijan exactamente las mismas condiciones, incluso si se omite el frontend.
func ValidatePassword(password string) error {
	if utf8.RuneCountInString(password) < 10 {
		return errors.New("la contraseña debe tener al menos 10 caracteres")
	}
	if len([]byte(password)) > 72 {
		return errors.New("la contraseña no puede superar 72 caracteres")
	}

	var lower, upper, number, symbol bool
	for _, character := range password {
		switch {
		case unicode.IsLower(character):
			lower = true
		case unicode.IsUpper(character):
			upper = true
		case unicode.IsDigit(character):
			number = true
		case unicode.IsPunct(character) || unicode.IsSymbol(character):
			symbol = true
		}
	}
	if !lower || !upper || !number || !symbol {
		return errors.New("la contraseña debe incluir una minúscula, una mayúscula, un número y un símbolo")
	}
	return nil
}
