import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { AuthMessage, AuthSession, AuthUser, LoginPayload, RegisterPayload, UpdateProfilePayload } from "../../features/auth/types/authTypes";
import * as authService from "../../features/auth/services/authService";

interface AuthContextValue {
	user: AuthUser | null;
	token: string | null;
	isAuthenticated: boolean;
	login: (payload: LoginPayload) => Promise<AuthSession>;
	register: (payload: RegisterPayload) => Promise<AuthMessage>;
	logout: () => void;
	updateProfile: (payload: UpdateProfilePayload) => Promise<AuthUser>;
	deleteProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface Props {
	children: ReactNode;
}

export default function AuthProvider({ children }: Props) {
	const [session, setSession] = useState<AuthSession | null>(() => authService.getStoredSession());

	const handleLogin = async (payload: LoginPayload) => {
		const nextSession = await authService.login(payload);
		setSession(nextSession);
		return nextSession;
	};

	const handleRegister = async (payload: RegisterPayload) => {
		return authService.register(payload);
	};

	const handleLogout = () => {
		authService.logout();
		setSession(null);
	};

	const handleUpdateProfile = async (payload: UpdateProfilePayload) => {
		const updatedUser = await authService.updateProfile(payload);
		setSession((current) => current ? { ...current, user: updatedUser } : current);
		return updatedUser;
	};

	const handleDeleteProfile = async () => {
		await authService.deleteProfile();
		handleLogout();
	};

	useEffect(() => {
		const expireSession = () => {
			authService.logout();
			setSession(null);
		};

		window.addEventListener("auth:session-expired", expireSession);
		if (!session?.token) {
			return () => window.removeEventListener("auth:session-expired", expireSession);
		}

		const remaining = authService.millisecondsUntilExpiration(session.token);
		if (remaining <= 0) {
			expireSession();
			return () => window.removeEventListener("auth:session-expired", expireSession);
		}

		const timer = window.setTimeout(() => {
			expireSession();
			window.location.assign("/login?reason=session-expired");
		}, remaining);

		return () => {
			window.clearTimeout(timer);
			window.removeEventListener("auth:session-expired", expireSession);
		};
	}, [session?.token]);

	return (
		<AuthContext.Provider
			value={{
				user: session?.user ?? null,
				token: session?.token ?? null,
				isAuthenticated: Boolean(session?.token),
				login: handleLogin,
				register: handleRegister,
				logout: handleLogout,
				updateProfile: handleUpdateProfile,
				deleteProfile: handleDeleteProfile,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}

	return context;
}
