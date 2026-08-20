import { apiRequest } from "../../../app/router/api";
import type {
	Appointment,
	AppointmentPayload,
	AvailabilityResponse,
} from "../types/appointmentTypes";

export async function getMyAppointments(): Promise<Appointment[]> {
	return apiRequest<Appointment[]>("/api/appointments");
}

export async function createAppointment(
	payload: AppointmentPayload
): Promise<Appointment> {
	return apiRequest<Appointment>("/api/appointments", {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export async function getAvailability(
	date: string,
	serviceId: string,
	excludeAppointmentId?: string
): Promise<AvailabilityResponse> {
	return apiRequest<AvailabilityResponse>(
		`/api/appointments/availability?date=${encodeURIComponent(
			date
		)}&serviceId=${encodeURIComponent(serviceId)}${excludeAppointmentId ? `&excludeAppointmentId=${encodeURIComponent(excludeAppointmentId)}` : ""}`
	);
}

export async function rescheduleAppointment(id: string, appointmentDate: string, startTime: string): Promise<Appointment> {
	return apiRequest<Appointment>(`/api/appointments/${id}/reschedule`, {
		method: "PATCH",
		body: JSON.stringify({ appointmentDate, startTime }),
	});
}

export async function getAllAppointments(): Promise<Appointment[]> {
	return apiRequest<Appointment[]>("/api/appointments/all");
}

export async function getAdminAgenda(from: string, to: string): Promise<Appointment[]> {
	return apiRequest<Appointment[]>(
		`/api/appointments/admin/agenda?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
	);
}

export async function confirmAppointment(id: string): Promise<Appointment> {
	return apiRequest<Appointment>(`/api/appointments/${id}/confirm`, { method: "PATCH" });
}

export async function completeAppointment(id: string): Promise<Appointment> {
	return apiRequest<Appointment>(`/api/appointments/${id}/complete`, { method: "PATCH" });
}

export async function updateAppointmentStatus(id: string, status: "CONFIRMED" | "COMPLETED" | "NO_SHOW"): Promise<Appointment> {
	return apiRequest<Appointment>(`/api/appointments/${id}/status`, {
		method: "PATCH",
		body: JSON.stringify({ status }),
	});
}
