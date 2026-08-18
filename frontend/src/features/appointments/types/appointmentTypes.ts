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
	serviceId: string;
	serviceName: string;
	servicePrice: number;
	serviceDuration: string;
	serviceImage: string;
	appointmentDate: string;
	startTime: string;
	status: string;
	notes: string;
	createdAt: string;
	canConfirm: boolean;
	canComplete: boolean;
	isPast: boolean;
	needsReview: boolean;
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
};

export type AvailabilityResponse = {
	date: string;
	bookedTimes: string[];
};
