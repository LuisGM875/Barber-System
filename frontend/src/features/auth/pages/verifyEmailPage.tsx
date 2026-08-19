import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthLayout from "../../shared/layouts/authLayout";
import { verifyEmail } from "../services/authService";

export default function VerifyEmailPage() {
  const [params] = useSearchParams(); const [message, setMessage] = useState("Verificando tu correo..."); const [ok, setOk] = useState(false);
  useEffect(() => { const token = params.get("token"); if (!token) { setMessage("El enlace no contiene un token válido."); return; } verifyEmail(token).then((response) => { setOk(true); setMessage(response.message); }).catch((err) => setMessage(err instanceof Error ? err.message : "No se pudo verificar el correo")); }, [params]);
  return <AuthLayout title="Verificación de correo" subtitle="Estamos validando tu cuenta" footerQuestion="¿Ya verificaste tu correo?" footerActionLabel="Inicia sesión" footerActionTo="/login"><div className={`rounded-xl border p-4 text-sm ${ok ? "border-green-500/20 bg-green-500/10 text-green-200" : "border-white/10 bg-white/5 text-zinc-300"}`}>{message}</div>{ok && <Link to="/login" className="mt-4 block rounded-xl bg-[#C9A96E] py-3 text-center text-sm font-semibold text-black">Iniciar sesión</Link>}</AuthLayout>;
}
