import MainLayout from "../../shared/layouts/mainLayout";
import { useState } from "react"

export default function FeedPage() {
    const galleryPosts = [
        {
            id: 1,
            image: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&h=600&fit=crop&auto=format",
            description: "Corte fade con diseño lateral. Precisión al máximo.",
            date: "Hace 2 días",
            likes: 148,
            comments: 12,
        },
    ]

    const [liked, setLiked] = useState<Set<number>>(new Set())

    const toggle = (id: number) => setLiked(prev => {
        const next = new Set(prev)
        next.has(id) ? next.delete(id) : next.add(id)
        return next
    })

    return (
        <MainLayout>
            <section id="gallery" className="py-24 px-6" style={{ backgroundColor: "#0D0D0D" }}>
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="text-xs font-medium tracking-[0.2em] uppercase mb-3" style={{ color: "#C9A96E" }}>Galería</p>
                        <h2 className="font-display text-4xl lg:text-5xl font-bold" style={{ color: "#F8F5F0" }}>Nuestro trabajo</h2>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {galleryPosts.map((post) => (
                            <div key={post.id} className="group relative rounded-xl overflow-hidden" style={{ aspectRatio: "1", backgroundColor: "#1C1C1C" }}>
                                <img src={post.image} alt={post.description} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "linear-gradient(to top, rgba(17,17,17,0.9) 0%, transparent 50%)" }}>
                                    <p className="text-xs mb-3 line-clamp-2" style={{ color: "#F8F5F0" }}>{post.description}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs" style={{ color: "#A1A1AA" }}>{post.date}</span>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => toggle(post.id)} className="flex items-center gap-1 text-xs transition-colors" style={{ color: liked.has(post.id) ? "#C9A96E" : "#A1A1AA" }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill={liked.has(post.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                                </svg>
                                                {post.likes + (liked.has(post.id) ? 1 : 0)}
                                            </button>
                                            <span className="flex items-center gap-1 text-xs" style={{ color: "#A1A1AA" }}>
                                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                                {post.comments}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </MainLayout>
    )
}