export interface Post {
    id: string;
    title: string;
    description: string;
    image: string;
    createdAt: string;
    updatedAt: string;
}

export interface PostPayload {
    title: string;
    description: string;
}
