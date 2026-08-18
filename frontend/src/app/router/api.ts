const API_URL = "http://localhost:8080";

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

	const response = await fetch(`${API_URL}${url}`, {
		...options,
		headers,
	});

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
		throw new Error(data.message || "Error en la petición");
	}

	return data;
}