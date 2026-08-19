package domain

type UserRole string

const (
	RoleAdmin  UserRole = "ADMIN"
	RoleClient UserRole = "CLIENT"
)

type User struct {
	ID    string
	Name  string
	Phone string
	Email string
	Role  UserRole
}
