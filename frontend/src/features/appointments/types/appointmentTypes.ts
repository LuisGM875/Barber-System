export interface ServiceOption {
	id: number;
	name: string;
	description: string;
	price: number;
	duration: string;
	image: string;
}

export type Appointment = {
	id: string;
	userId: string;
	userName?: string;
	userEmail?: string;
	userPhone?: string;
	customerName?: string;
	serviceId: string;
	serviceName: string;
	servicePrice: number;
	serviceDuration: string;
	serviceImage: string;
	appointmentDate: string;
	startTime: string;
	endTime: string;
	status: string;
	notes: string;
	createdAt: string;
	canConfirm: boolean;
	canComplete: boolean;
	isPast: boolean;
	needsReview: boolean;
	services?: AppointmentService[];
};

export type AppointmentService = {
	serviceId: string;
	name: string;
	price: number;
	duration: string;
	image: string;
	quantity: number;
};

export type AppointmentPayload = {
	serviceId: string;
	appointmentDate: string;
	startTime: string;
	notes: string;
	customerName?: string;
	services: { serviceId: string; quantity: number }[];
};

export type AvailabilityResponse = {
	date: string;
	bookedTimes: string[];
};
