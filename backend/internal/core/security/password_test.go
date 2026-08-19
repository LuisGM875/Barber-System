package security

import "testing"

func TestValidatePassword(t *testing.T) {
	tests := []struct {
		name     string
		password string
		valid    bool
	}{
		{name: "segura", password: "BarberFlow#2026", valid: true},
		{name: "solo números", password: "1234567890", valid: false},
		{name: "sin mayúscula", password: "barberflow#2026", valid: false},
		{name: "sin minúscula", password: "BARBERFLOW#2026", valid: false},
		{name: "sin número", password: "BarberFlow#Clave", valid: false},
		{name: "sin símbolo", password: "BarberFlow2026", valid: false},
		{name: "muy corta", password: "Barber#1", valid: false},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := ValidatePassword(test.password)
			if test.valid && err != nil {
				t.Fatalf("se esperaba una contraseña válida: %v", err)
			}
			if !test.valid && err == nil {
				t.Fatal("se esperaba rechazar la contraseña")
			}
		})
	}
}
