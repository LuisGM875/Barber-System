import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import AuthLayout from "../../shared/layouts/authLayout";
import { resetPassword } from "../services/authService";
import { isStrongPassword, passwordRequirements } from "../utils/passwordValidation";

export default function ResetPasswordPage() {
	const [params] = useSearchParams();
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [show, setShow] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [ok, setOk] = useState(false);
	const [loading, setLoading] = useState(false);

	const submit = async (event: FormEvent) => {
		event.preventDefault();
		setMessage(null);
		if (!isStrongPassword(password)) {
			setMessage("La contraseña todavía no cumple todos los requisitos.");
			return;
		}
		if (password !== confirm) {
			setMessage("Las contraseñas no coinciden.");
			return;
		}
		const token = params.get("token");
		if (!token) {
			setMessage("El enlace no es válido. Solicita uno nuevo.");
			return;
		}
		try {
			setLoading(true);
			const response = await resetPassword(token, password);
			setOk(true);
			setMessage(response.message);
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "No se pudo cambiar la contraseña");
		} finally {
			setLoading(false);
		}
	};

	return (
		<AuthLayout title="Nueva contraseña" subtitle="Elige una contraseña segura" footerQuestion="¿Ya la cambiaste?" footerActionLabel="Inicia sesión" footerActionTo="/login">
			{message && <p className={`mb-4 rounded-xl border p-3 text-sm ${ok ? "border-green-500/20 bg-green-500/10 text-green-200" : "border-red-500/20 bg-red-500/10 text-red-200"}`}>{message}</p>}
			{ok ? <Link to="/login" className="block rounded-xl bg-[#C9A96E] py-3 text-center text-sm font-semibold text-black">Iniciar sesión</Link> : (
				<form onSubmit={submit} className="space-y-4">
					<label className="block text-xs text-zinc-400">Nueva contraseña<div className="relative"><input required minLength={10} maxLength={72} type={show ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#1C1C1C] py-3 pl-4 pr-12 outline-none" /><button type="button" onClick={() => setShow((current) => !current)} aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-4 top-1/2 text-zinc-400">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
					<ul className="grid gap-1 text-xs sm:grid-cols-2">{passwordRequirements.map((requirement) => <li key={requirement.label} className={requirement.test(password) ? "text-green-400" : "text-zinc-500"}>{requirement.test(password) ? "✓" : "○"} {requirement.label}</li>)}</ul>
					<label className="block text-xs text-zinc-400">Confirmar contraseña<input required minLength={10} maxLength={72} type={show ? "text" : "password"} value={confirm} onChange={(event) => setConfirm(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#1C1C1C] px-4 py-3 outline-none" /></label>
					<button disabled={loading} className="w-full rounded-xl bg-[#C9A96E] py-3 text-sm font-semibold text-black disabled:opacity-50">{loading ? "Guardando..." : "Cambiar contraseña"}</button>
				</form>
			)}
		</AuthLayout>
	);
}
