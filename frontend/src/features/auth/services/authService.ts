import { apiRequest } from "../../../app/router/api";
import type { AuthMessage, AuthSession, AuthUser, LoginPayload, RegisterPayload, UpdateProfilePayload } from "../types/authTypes";

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

function tokenExpiration(token: string): number | null {
	try {
		const payload = token.split(".")[1];
		if (!payload) return null;
		const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
		const decoded = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="))) as { exp?: number };
		return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
	} catch {
		return null;
	}
}

export function millisecondsUntilExpiration(token: string): number {
	const expiration = tokenExpiration(token);
	return expiration === null ? 0 : expiration - Date.now();
}

export function getStoredSession(): AuthSession | null {
	const token = localStorage.getItem(TOKEN_KEY);
	const userData = localStorage.getItem(USER_KEY);

	if (!token || !userData) {
		return null;
	}

	if (millisecondsUntilExpiration(token) <= 0) {
		clearSession();
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

export async function register(payload: RegisterPayload): Promise<AuthMessage> {
	return apiRequest<AuthMessage>("/api/auth/register", {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export const verifyEmail = (token: string) => apiRequest<AuthMessage>("/api/auth/verify-email", { method: "POST", body: JSON.stringify({ token }) });
export const forgotPassword = (email: string) => apiRequest<AuthMessage>("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
export const resetPassword = (token: string, password: string) => apiRequest<AuthMessage>("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) });

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
