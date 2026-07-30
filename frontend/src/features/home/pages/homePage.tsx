import { useNavigate } from "react-router-dom";
import MainLayout from "../../shared/layouts/mainLayout";

export default function HomePage() {
    const navigate = useNavigate();
    const handleNavigate = (path: string) => {
        navigate(path);
    };

    return (
        <MainLayout>
            <section id="hero" className="relative min-h-screen flex items-center overflow-hidden pt-16">
                {/* Background image */}
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&h=900&fit=crop&auto=format"
                        alt="Barbería de lujo"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(17,17,17,0.95) 50%, rgba(17,17,17,0.5) 100%)" }} />
                </div>

                <div className="relative max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
                    <div className="animate-fadeInUp">
                        
                        {/*<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6" style={{ backgroundColor: "rgba(201,169,110,0.15)", color: "#C9A96E", border: "1px solid rgba(201,169,110,0.3)" }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E] animate-pulse" />
                            Abierto hoy · 9:00 – 20:00
                        </div>*/}
                        <h1 className="font-display text-5xl lg:text-7xl font-bold leading-none mb-6" style={{ color: "#F8F5F0", letterSpacing: "-0.02em" }}>
                            Tu estilo,<br /><em className="not-italic" style={{ color: "#C9A96E" }}>nuestra</em><br />experiencia.
                        </h1>
                        <p className="text-lg mb-8 max-w-md leading-relaxed" style={{ color: "#A1A1AA" }}>
                            Reserva tu próxima cita de forma rápida y sencilla. Barbería premium en el corazón de la ciudad.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <button className="px-8 py-3.5 rounded-lg font-semibold text-sm transition-all hover:scale-105" style={{ backgroundColor: "#C9A96E", color: "#111111" }}>
                                Reservar cita
                            </button>
                            <button onClick={() => handleNavigate("/services")} className="px-8 py-3.5 rounded-lg font-medium text-sm border transition-all" style={{ color: "#F8F5F0", borderColor: "rgba(248,245,240,0.2)" }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(248,245,240,0.06)")}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                                Ver servicios
                            </button>
                        </div>

                        <div className="flex gap-8 mt-12">
                            {[["500+", "Clientes satisfechos"], ["8 años", "De experiencia"], ["4.9★", "Calificación"]].map(([val, label]) => (
                                <div key={label}>
                                    <div className="font-display text-2xl font-bold" style={{ color: "#C9A96E" }}>{val}</div>
                                    <div className="text-xs mt-0.5" style={{ color: "#A1A1AA" }}>{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="hidden lg:grid grid-cols-2 gap-3 animate-fadeIn delay-200">
                        <div className="space-y-3">
                            <img src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=500&fit=crop&auto=format" alt="Corte fade" className="w-full rounded-xl object-cover" style={{ height: "240px" }} />
                            <img src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=300&fit=crop&auto=format" alt="Corte y barba" className="w-full rounded-xl object-cover" style={{ height: "160px" }} />
                        </div>
                        <div className="space-y-3 mt-8">
                            <img src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&h=280&fit=crop&auto=format" alt="Barbería interior" className="w-full rounded-xl object-cover" style={{ height: "160px" }} />
                            <img src="https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=420&fit=crop&auto=format" alt="Barbero trabajando" className="w-full rounded-xl object-cover" style={{ height: "240px" }} />
                        </div>
                    </div>
                </div>
            </section>
        </MainLayout>
    )
}