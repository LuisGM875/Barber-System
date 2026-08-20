export const API_URL = (
	import.meta.env.VITE_API_URL ?? "http://localhost:8080"
).replace(/\/+$/, "");

export function getImageUrl(image?: string | null): string {
	if (!image) return "";

	const value = image.trim();
	if (/^(https?:|blob:|data:)/i.test(value)) {
		return value;
	}

	return `${API_URL}${value.startsWith("/") ? value : `/${value}`}`;
}

export async function apiRequest<T>(
	url: string,
	options: RequestInit = {}
): Promise<T> {

	const token = localStorage.getItem("token");

	const headers = new Headers(options.headers);

	if (!(options.body instanceof FormData)) {
		headers.set("Content-Type", "application/json");
	}

	if (token) {
		headers.set("Authorization", `Bearer ${token}`);
	}

	let response: Response;
	try {
		response = await fetch(`${API_URL}${url}`, {
			...options,
			headers,
		});
	} catch {
		throw new Error("No se pudo conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.");
	}

	if (response.status === 401 && token && !url.startsWith("/api/auth/login") && !url.startsWith("/api/auth/register")) {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		window.dispatchEvent(new Event("auth:session-expired"));
		if (!window.location.pathname.startsWith("/login")) {
			window.location.assign("/login?reason=session-expired");
		}
	}

	if (response.status === 204) {
		return undefined as T;
	}

	const responseText = await response.text();
	const contentType = response.headers.get("content-type") ?? "";
	let data: any = null;

	if (responseText) {
		if (contentType.includes("application/json")) {
			try {
				data = JSON.parse(responseText);
			} catch {
				data = { message: responseText };
			}
		} else {
			data = { message: responseText };
		}
	}

	if (!response.ok) {
		if (response.status >= 500) {
			throw new Error("Ocurrió un problema en el servidor. Inténtalo nuevamente en unos momentos.");
		}
		throw new Error(data.message || "Error en la petición");
	}

	return data;
}
