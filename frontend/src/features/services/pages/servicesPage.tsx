interface ServiceCardProps {
    onNavigate: (v: string) => void;
}

export default function ServiceCard({ onNavigate }: ServiceCardProps) {
    const services = [
        {
            id: 1,
            name: "Corte de cabello",
            description: "Corte de cabello clásico o moderno, adaptado a tu estilo.",
            price: 25,
            duration: "30 min",
            image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=500&fit=crop&auto=format"
        },
    ]

    return (
        <section id="services" className="py-24 px-6" style={{ backgroundColor: "#111111" }}>
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <p className="text-xs font-medium tracking-[0.2em] uppercase mb-3" style={{ color: "#C9A96E" }}>Menú de servicios</p>
                    <h2 className="font-display text-4xl lg:text-5xl font-bold" style={{ color: "#F8F5F0" }}>Lo que hacemos mejor</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {services.map((service, i) => (
                        <div key={service.id} className="group rounded-xl overflow-hidden transition-all duration-300 animate-fadeInUp cursor-pointer" style={{ backgroundColor: "#1C1C1C", border: "1px solid rgba(248,245,240,0.06)", animationDelay: `${i * 80}ms` }}
                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,169,110,0.3)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)" }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(248,245,240,0.06)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)" }}>
                            <div className="relative overflow-hidden" style={{ height: "180px" }}>
                                <img src={service.image} alt={service.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(28,28,28,0.8), transparent)" }} />
                            </div>
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-display text-lg font-semibold" style={{ color: "#F8F5F0" }}>{service.name}</h3>
                                    <span className="font-mono-data text-lg font-bold" style={{ color: "#C9A96E" }}>${service.price}</span>
                                </div>
                                <p className="text-sm mb-4" style={{ color: "#A1A1AA" }}>{service.description}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs flex items-center gap-1.5" style={{ color: "#A1A1AA" }}>
                                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                                        {service.duration}
                                    </span>
                                    <button onClick={() => onNavigate("booking")} className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all" style={{ backgroundColor: "rgba(201,169,110,0.12)", color: "#C9A96E" }}
                                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(201,169,110,0.22)")}
                                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "rgba(201,169,110,0.12)")}>
                                        Reservar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}