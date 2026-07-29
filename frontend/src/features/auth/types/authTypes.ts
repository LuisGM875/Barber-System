export type UserRole = "client" | "admin";

export interface LoginPayload {
	email: string;
	password: string;
	role: UserRole;
}

export interface RegisterPayload {
	name: string;
	email: string;
	password: string;
	role: UserRole;
}
