import { apiRequest } from "../../../app/router/api";
import type { Post, PostPayload } from "../types/postTypes";

export function getPosts(): Promise<Post[]> {
    return apiRequest<Post[]>("/api/posts");
}

export function createPost(payload: PostPayload, image: File): Promise<Post> {
    const formData = new FormData();
    formData.append("title", payload.title);
    formData.append("description", payload.description);
    formData.append("image", image);
    return apiRequest<Post>("/api/posts", { method: "POST", body: formData });
}

export function updatePost(id: string, payload: PostPayload, image?: File | null): Promise<Post> {
    const formData = new FormData();
    formData.append("title", payload.title);
    formData.append("description", payload.description);
    if (image) formData.append("image", image);
    return apiRequest<Post>(`/api/posts/${id}`, { method: "PUT", body: formData });
}

export async function deletePost(id: string): Promise<void> {
    await apiRequest<void>(`/api/posts/${id}`, { method: "DELETE" });
}
