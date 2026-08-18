import { apiRequest } from "../../../app/router/api";
import type { Service, ServicePayload } from "../types/serviceTypes";

export async function getServices(): Promise<Service[]> {
	return apiRequest<Service[]>("/api/services");
}

export async function createService(
    payload: ServicePayload,
    image: File
): Promise<Service> {
    const formData = new FormData();

    formData.append("name", payload.name);
    formData.append("description", payload.description);
    formData.append("price", String(payload.price));
    formData.append("duration", payload.duration);
    formData.append("isActive", String(payload.isActive));
    formData.append("image", image);

    return apiRequest<Service>("/api/services", {
        method: "POST",
        body: formData,
    });
}

export async function updateService(
	id: string,
	payload: ServicePayload,
	image?: File | null
): Promise<Service> {

	const formData = new FormData();

	formData.append("name", payload.name);
	formData.append("description", payload.description);
	formData.append("price", String(payload.price));
	formData.append("duration", payload.duration);
	formData.append("isActive", String(payload.isActive));

	if (image) {
		formData.append("image", image);
	}

	return apiRequest<Service>(`/api/services/${id}`, {
		method: "PUT",
		body: formData,
	});
}

export async function deleteService(id: string): Promise<void> {
	await apiRequest<void>(`/api/services/${id}`, {
		method: "DELETE",
	});
}