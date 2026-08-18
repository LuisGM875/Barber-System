import { apiRequest } from "../../../app/router/api";
import type { AuthSession, AuthUser, LoginPayload, RegisterPayload, UpdateProfilePayload } from "../types/authTypes";

const TOKEN_KEY = "token";
const USER_KEY = "user";

function saveSession(session: AuthSession) {
	localStorage.setItem(TOKEN_KEY, session.token);
	localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

function clearSession() {
	localStorage.removeItem(TOKEN_KEY);
	localStorage.removeItem(USER_KEY);
}

export function getStoredSession(): AuthSession | null {
	const token = localStorage.getItem(TOKEN_KEY);
	const userData = localStorage.getItem(USER_KEY);

	if (!token || !userData) {
		return null;
	}

	try {
		return {
			token,
			user: JSON.parse(userData) as AuthSession["user"],
		};
	} catch {
		clearSession();
		return null;
	}
}

export function logout() {
	clearSession();
}

export async function login(payload: LoginPayload): Promise<AuthSession> {
	const session = await apiRequest<AuthSession>("/api/auth/login", {
		method: "POST",
		body: JSON.stringify(payload),
	});

	saveSession(session);
	return session;
}

export async function register(payload: RegisterPayload): Promise<AuthSession> {
	const session = await apiRequest<AuthSession>("/api/auth/register", {
		method: "POST",
		body: JSON.stringify(payload),
	});

	saveSession(session);
	return session;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
	const user = await apiRequest<AuthUser>("/api/auth/me", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
	const current = getStoredSession();
	if (current) saveSession({ ...current, user });
	return user;
}

export async function deleteProfile(): Promise<void> {
	await apiRequest<void>("/api/auth/me", { method: "DELETE" });
}
