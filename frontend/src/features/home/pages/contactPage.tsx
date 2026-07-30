import MainLayout from "../../shared/layouts/mainLayout";

export default function ContactPage() {

    return (
        <MainLayout>
            <section id="contact" className="py-24 px-6" style={{ backgroundColor: "#111111" }}>
                <div className="max-w-5xl mx-auto">
                    <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: "#1C1C1C", border: "1px solid rgba(248,245,240,0.06)" }}>
                        <p className="text-xs font-medium tracking-[0.2em] uppercase mb-4" style={{ color: "#C9A96E" }}>Contáctanos</p>
                        <h2 className="font-display text-4xl lg:text-5xl font-bold mb-6" style={{ color: "#F8F5F0" }}>¿Listo para lucir al máximo?</h2>
                        <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: "#A1A1AA" }}>
                            Reserva tu cita hoy y experimenta el servicio que mereces.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 mb-12">
                            <button className="px-8 py-3.5 rounded-lg font-semibold text-sm transition-all hover:scale-105" style={{ backgroundColor: "#C9A96E", color: "#111111" }}>
                                Reservar ahora
                            </button>
                            <a className="px-8 py-3.5 rounded-lg font-medium text-sm border transition-all inline-block" style={{ color: "#F8F5F0", borderColor: "rgba(248,245,240,0.2)" }}>
                                Llamar: +52 555 123 4567
                            </a>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { icon: "⏰", title: "Horario", text: "Lun–Vie: 11:00–17:00 · Dom: 11:00–16:00" },
                                { icon: "📞", title: "Teléfono", text: "+52 555 123 4567" },
                            ].map(({ icon, title, text }) => (
                                <div key={title} className="p-4 rounded-xl" style={{ backgroundColor: "rgba(248,245,240,0.03)" }}>
                                    <div className="text-2xl mb-2">{icon}</div>
                                    <div className="text-sm font-semibold mb-1" style={{ color: "#F8F5F0" }}>{title}</div>
                                    <div className="text-sm" style={{ color: "#A1A1AA" }}>{text}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </MainLayout>
    )
}