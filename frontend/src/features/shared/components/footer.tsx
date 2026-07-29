export default function Footer() {
    return (
        <footer className="border-t px-6 py-10" style={{ borderColor: "rgba(248,245,240,0.06)", backgroundColor: "#0D0D0D" }}>
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "#C9A96E" }}>
                        <span style={{ fontSize: "12px", color: "#111" }}>✂</span>
                    </div>
                    <span className="font-display text-base font-semibold" style={{ color: "#F8F5F0" }}>BarberFlow</span>
                </div>
                <p className="text-xs" style={{ color: "#A1A1AA" }}>© 2026 BarberFlow. Todos los derechos reservados.</p>
            </div>
        </footer>
    )
}