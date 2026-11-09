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
	serviceId: string;
	serviceName: string;
	servicePrice: number;
	serviceDuration: string;
	serviceImage: string;
	appointmentDate: string;
	startTime: string;
	status: string;
	notes: string;
	customerName?: string;
	createdAt: string;
	canConfirm: boolean;
	canComplete: boolean;
	isPast: boolean;
	needsReview: boolean;
	items?: AppointmentItem[];
};

export type AppointmentItem = {
	serviceId: string;
	name: string;
	price: number;
	duration: string;
	image: string;
	quantity: number;
};

export type AppointmentPayload = {
	serviceId: string;
	serviceName: string;
	servicePrice: number;
	serviceDuration: string;
	serviceImage: string;
	appointmentDate: string;
	startTime: string;
	notes: string;
	customerName?: string;
	items: { serviceId: string; quantity: number }[];
};

export type AvailabilityResponse = {
	date: string;
	bookedTimes: string[];
};
