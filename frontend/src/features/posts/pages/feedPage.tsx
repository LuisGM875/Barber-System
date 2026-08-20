import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useAuth } from "../../../app/providers/authProvider";
import { getImageUrl } from "../../../app/router/api";
import MainLayout from "../../shared/layouts/mainLayout";
import { createPost, deletePost, getPosts, updatePost } from "../services/postService";
import type { Post, PostPayload } from "../types/postTypes";

const EMPTY_FORM: PostPayload = { title: "", description: "" };

export default function FeedPage() {
    const { user } = useAuth();
    const isAdmin = user?.role?.trim().toUpperCase() === "ADMIN";
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [form, setForm] = useState<PostPayload>(EMPTY_FORM);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getPosts().then(setPosts)
            .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar la galería"))
            .finally(() => setLoading(false));
    }, []);

    const closeModal = () => {
        setModalOpen(false);
        setEditingPost(null);
        setForm(EMPTY_FORM);
        setImageFile(null);
        setImagePreview(null);
        setError(null);
    };

    const openCreate = () => {
        setEditingPost(null);
        setForm(EMPTY_FORM);
        setImageFile(null);
        setImagePreview(null);
        setError(null);
        setModalOpen(true);
    };

    const openEdit = (post: Post) => {
        setEditingPost(post);
        setForm({ title: post.title, description: post.description });
        setImageFile(null);
        setImagePreview(getImageUrl(post.image));
        setError(null);
        setModalOpen(true);
    };

    const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        if (!file) return;
        if (!file.type.startsWith("image/")) { setError("El archivo seleccionado no es una imagen."); return; }
        if (file.size > 5 * 1024 * 1024) { setError("La imagen no puede superar los 5 MB."); return; }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setError(null);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!editingPost && !imageFile) { setError("Debes seleccionar una imagen."); return; }
        setSaving(true);
        setError(null);
        try {
            const saved = editingPost
                ? await updatePost(editingPost.id, form, imageFile)
                : await createPost(form, imageFile!);
            setPosts((current) => editingPost
                ? current.map((post) => post.id === saved.id ? saved : post)
                : [saved, ...current]);
            closeModal();
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo guardar la publicación");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (post: Post) => {
        if (!window.confirm(`¿Eliminar la publicación “${post.title}”? También se borrará su imagen.`)) return;
        try {
            await deletePost(post.id);
            setPosts((current) => current.filter((item) => item.id !== post.id));
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo eliminar la publicación");
        }
    };

    return (
        <MainLayout>
            <section id="gallery" className="flex-1 px-6 py-24" style={{ backgroundColor: "#0D0D0D" }}>
                <div className="max-w-7xl mx-auto">
                    <div className="relative mb-16 text-center">
                        <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#C9A96E]">Galería</p>
                        <h1 className="font-display text-4xl font-bold lg:text-5xl">Nuestro trabajo</h1>
                        {isAdmin && <button type="button" onClick={openCreate} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#C9A96E] px-5 py-3 text-sm font-semibold text-black lg:absolute lg:right-0 lg:top-1/2 lg:mt-0 lg:-translate-y-1/2"><Plus size={18} /> Agregar publicación</button>}
                    </div>
                    {error && !modalOpen && <p className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
                    {loading && <p className="text-center text-sm text-zinc-400">Cargando galería...</p>}
                    {!loading && posts.length === 0 && <p className="text-center text-sm text-zinc-400">Todavía no hay publicaciones.</p>}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {posts.map((post) => (
                            <article key={post.id} className="group relative aspect-square overflow-hidden rounded-2xl bg-zinc-900">
                                <img src={getImageUrl(post.image)} alt={post.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 flex flex-col justify-end p-5" style={{ background: "linear-gradient(to top, rgba(10,10,10,.94), transparent 65%)" }}><h2 className="font-display text-xl font-semibold">{post.title}</h2><p className="mt-1 text-sm text-zinc-300">{post.description}</p></div>
                                {isAdmin && <div className="absolute right-3 top-3 flex gap-2"><button type="button" onClick={() => openEdit(post)} aria-label={`Editar ${post.title}`} title="Editar" className="flex h-10 w-10 items-center justify-center rounded-full bg-black/80 text-[#C9A96E] backdrop-blur"><Pencil size={17} /></button><button type="button" onClick={() => handleDelete(post)} aria-label={`Eliminar ${post.title}`} title="Eliminar" className="flex h-10 w-10 items-center justify-center rounded-full bg-black/80 text-red-400 backdrop-blur"><Trash2 size={17} /></button></div>}
                            </article>
                        ))}
                    </div>
                </div>

                {modalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-black/75">
                    <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#111111]">
                        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5"><div><p className="text-xs uppercase tracking-[.2em] text-[#C9A96E]">{editingPost ? "Editar publicación" : "Nueva publicación"}</p><h2 className="mt-2 font-display text-2xl font-semibold">Información del post</h2></div><button type="button" onClick={closeModal} className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-300"><X size={18} /></button></div>
                        <form onSubmit={handleSubmit}>
                            <div className="max-h-[65vh] space-y-5 overflow-y-auto px-6 py-5">
                                {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
                                <label className="block text-sm text-zinc-400">Título<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none" placeholder="Corte degradado" /></label>
                                <label className="block text-sm text-zinc-400">Descripción<textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none" placeholder="Describe el trabajo realizado..." /></label>
                                <label className="block text-sm text-zinc-400">Imagen<input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleImageChange} className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white" /></label>
                                <p className="text-xs text-zinc-500">PNG, JPG, JPEG o WEBP. Máximo 5 MB.{editingPost ? " Si eliges otra imagen, la anterior se eliminará." : ""}</p>
                                {imagePreview && <img src={imagePreview} alt="Vista previa" className="h-56 w-full rounded-2xl object-cover" />}
                            </div>
                            <div className="flex gap-3 border-t border-white/10 px-6 py-4"><button type="button" onClick={closeModal} disabled={saving} className="rounded-xl border border-white/10 px-5 py-3 text-sm">Cancelar</button><button disabled={saving} className="flex-1 rounded-xl bg-[#C9A96E] px-5 py-3 text-sm font-semibold text-black disabled:opacity-50">{saving ? "Guardando..." : editingPost ? "Guardar cambios" : "Crear publicación"}</button></div>
                        </form>
                    </div>
                </div>}
            </section>
        </MainLayout>
    );
}
