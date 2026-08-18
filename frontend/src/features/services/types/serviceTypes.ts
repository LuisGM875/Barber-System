export interface Service {
	id: string;
	name: string;
	description: string;
	price: number;
	duration: string;
	image: string;
	isActive: boolean;
    createdAt?: string; 
    updatedAt?: string;
}

export interface ServicePayload {
    name: string;
    description: string;
    price: number;
    duration: string;
    isActive: boolean;
    imageFile: File | null;
}