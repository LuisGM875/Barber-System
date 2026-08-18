export interface LoginPayload {
	email: string;
	password: string;
}

export interface RegisterPayload {
	name: string;
	phone: string;
	email: string;
	password: string;
}

export interface AuthUser {
	id: string;
	name: string;
	phone: string;
	email: string;
	role: string;
	isActive?: boolean;
}

export interface AuthSession {
	token: string;
	user: AuthUser;
}

export interface UpdateProfilePayload {
	name: string;
	email: string;
	phone: string;
}
