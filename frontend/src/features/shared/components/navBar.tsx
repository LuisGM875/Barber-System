import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    ["Inicio", "/"],
    ["Servicios", "/services"],
    ["Galeria", "/gallery"],
    ["Contacto", "/contact"],
  ] as const;

  const handleNavigate = (path: string) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b" style={{ backgroundColor: "rgba(17,17,17,0.9)", borderColor: "rgba(248,245,240,0.06)" }}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <button className="flex items-center gap-2" onClick={() => handleNavigate("/") }>
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#C9A96E" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#111111">
              <path d="M9.5 3.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v1h1.5c.83 0 1.5.67 1.5 1.5S14.83 7.5 14 7.5h-.5v9l2.5 3h-8l2.5-3v-9H10c-.83 0-1.5-.67-1.5-1.5S9.17 5 10 5h.5v-.5c0-.83-.67-1.5-1.5-1.5z" />
              <ellipse cx="12" cy="4" rx="1.5" ry="1.5" />
            </svg>
          </div>
          <span className="font-display text-lg font-semibold tracking-wide" style={{ color: "#F8F5F0" }}>BarberFlow</span>
        </button>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map(([label, path]) => (
            <button key={path} onClick={() => handleNavigate(path)} className="text-sm transition-colors" style={{ color: "#A1A1AA" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#F8F5F0")}
              onMouseLeave={e => (e.currentTarget.style.color = "#A1A1AA")}>
              {label}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button onClick={() => handleNavigate("/login")} className="text-sm px-4 py-2 rounded-lg transition-colors" style={{ color: "#A1A1AA" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#F8F5F0")}
            onMouseLeave={e => (e.currentTarget.style.color = "#A1A1AA")}>
            Iniciar sesion
          </button>
          <button onClick={() => handleNavigate("/booking")} className="text-sm px-5 py-2 rounded-lg font-medium transition-all" style={{ backgroundColor: "#C9A96E", color: "#111111" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#D4B87A")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#C9A96E")}>
            Reservar cita
          </button>
        </div>

        <button onClick={() => setMenuOpen((prev) => !prev)} className="md:hidden p-2" style={{ color: "#F8F5F0" }}>
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            {menuOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t px-6 py-4 flex flex-col gap-4" style={{ borderColor: "rgba(248,245,240,0.06)", backgroundColor: "#111111" }}>
          {navItems.map(([label, path]) => (
            <button key={path} onClick={() => handleNavigate(path)} className="text-sm text-left" style={{ color: "#A1A1AA" }}>{label}</button>
          ))}
          <div className="flex gap-3 pt-2">
            <button onClick={() => handleNavigate("/login")} className="text-sm px-4 py-2 rounded-lg border" style={{ color: "#F8F5F0", borderColor: "rgba(248,245,240,0.12)" }}>
              Iniciar sesion
            </button>
            <button onClick={() => handleNavigate("/booking")} className="text-sm px-4 py-2 rounded-lg font-medium" style={{ backgroundColor: "#C9A96E", color: "#111111" }}>
              Reservar
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}