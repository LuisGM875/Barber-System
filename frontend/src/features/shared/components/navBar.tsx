import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/authProvider";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const navItems = [
    ["Inicio", "/"],
    ["Servicios", "/services"],
    ["Galeria", "/feed"],
    ["Contacto", "/contact"],
  ] as const;

  const handleNavigate = (path: string) => {
    navigate(path);
    setMenuOpen(false);
    setUserMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    handleNavigate("/");
  };

  const handleEditInfo = () => {
    handleNavigate("/dashboard?section=profile");
  };

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!userMenuRef.current) {
        return;
      }

      if (!userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, []);

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
          {isAuthenticated ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors"
                style={{ color: "#F8F5F0", backgroundColor: "rgba(248,245,240,0.06)" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(248,245,240,0.1)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "rgba(248,245,240,0.06)")}
              >
                <span>{user?.name ?? "Usuario"}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {userMenuOpen ? (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border bg-[#111111] shadow-2xl" style={{ borderColor: "rgba(248,245,240,0.08)" }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(248,245,240,0.06)" }}>
                    <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "#A1A1AA" }}>
                      Sesión
                    </p>
                    <p className="mt-1 text-sm font-medium" style={{ color: "#F8F5F0" }}>
                      {user?.email}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleNavigate("/dashboard")}
                    className="w-full px-4 py-3 text-left text-sm transition-colors"
                    style={{ color: "#F8F5F0" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(248,245,240,0.06)")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    Mi cuenta
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNavigate("/dashboard?section=appointments")}
                    className="w-full px-4 py-3 text-left text-sm transition-colors"
                    style={{ color: "#F8F5F0" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(248,245,240,0.06)")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    Mis citas
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNavigate("/dashboard?section=messages")}
                    className="w-full px-4 py-3 text-left text-sm transition-colors"
                    style={{ color: "#F8F5F0" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(248,245,240,0.06)")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    Mensajes
                  </button>

                  <button
                    type="button"
                    onClick={handleEditInfo}
                    className="w-full px-4 py-3 text-left text-sm transition-colors"
                    style={{ color: "#F8F5F0" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(248,245,240,0.06)")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    Mi Perfil
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left text-sm transition-colors"
                    style={{ color: "#F8F5F0" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(248,245,240,0.06)")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    Cerrar sesión
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <button onClick={() => handleNavigate("/login")} className="text-sm px-4 py-2 rounded-lg transition-colors" style={{ color: "#A1A1AA" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#F8F5F0")}
              onMouseLeave={e => (e.currentTarget.style.color = "#A1A1AA")}>
              Iniciar sesion
            </button>
          )}
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
            {isAuthenticated ? (
              <div className="w-full">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="w-full text-sm px-4 py-2 rounded-lg border text-left"
                  style={{ color: "#F8F5F0", borderColor: "rgba(248,245,240,0.12)" }}
                >
                  {user?.name ?? "Usuario"}
                </button>
                {userMenuOpen ? (
                  <div className="mt-2 overflow-hidden rounded-2xl border bg-[#111111]" style={{ borderColor: "rgba(248,245,240,0.08)" }}>
                    <button
                      type="button"
                      onClick={() => handleNavigate("/dashboard")}
                      className="w-full px-4 py-3 text-left text-sm"
                      style={{ color: "#F8F5F0" }}
                    >
                      Mi cuenta
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavigate("/dashboard?section=appointments")}
                      className="w-full px-4 py-3 text-left text-sm"
                      style={{ color: "#F8F5F0" }}
                    >
                      Mis citas
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavigate("/dashboard?section=messages")}
                      className="w-full px-4 py-3 text-left text-sm"
                      style={{ color: "#F8F5F0" }}
                    >
                      Mensajes
                    </button>

                    <button
                      type="button"
                      onClick={handleEditInfo}
                      className="w-full px-4 py-3 text-left text-sm"
                      style={{ color: "#F8F5F0" }}
                    >
                      Mi Perfil
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left text-sm"
                      style={{ color: "#F8F5F0" }}
                    >
                      Cerrar sesión
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <button onClick={() => handleNavigate("/login")} className="text-sm px-4 py-2 rounded-lg border" style={{ color: "#F8F5F0", borderColor: "rgba(248,245,240,0.12)" }}>
                Iniciar sesion
              </button>
            )}
            <button onClick={() => handleNavigate("/booking")} className="text-sm px-4 py-2 rounded-lg font-medium" style={{ backgroundColor: "#C9A96E", color: "#111111" }}>
              Reservar
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
