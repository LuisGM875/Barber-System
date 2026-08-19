import { useState } from "react";
import type { FormEvent } from "react";
import type { LoginPayload } from "../types/authTypes";
import { Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";

interface LoginFormProps {
	onSubmit: (payload: LoginPayload) => void;
	isLoading?: boolean;
}

export default function LoginForm({ onSubmit, isLoading = false }: LoginFormProps) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		onSubmit({ email, password });
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">

			<div>
				<label className="block text-xs font-medium mb-1.5 text-[#A1A1AA]">
					Correo electronico
				</label>
				<input
					type="email"
					value={email}
					onChange={(event) => setEmail(event.target.value)}
					placeholder="tu@correo.com"
					required
					className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all bg-[#1C1C1C] text-[#F8F5F0] border border-[rgba(248,245,240,0.08)] focus:border-[#C9A96E]"
				/>
			</div>

			<div>
				<div className="flex justify-between mb-1.5">
					<label className="text-xs font-medium text-[#A1A1AA]">Contrasena</label>
					<Link to="/forgot-password" className="text-xs text-[#C9A96E]">
						Olvidaste tu contrasena?
					</Link>
				</div>
				<div className="relative">
				<input
					type={showPassword ? "text" : "password"}
					value={password}
					onChange={(event) => setPassword(event.target.value)}
					placeholder="********"
					required
					className="w-full py-3 pl-4 pr-12 rounded-xl text-sm outline-none transition-all bg-[#1C1C1C] text-[#F8F5F0] border border-[rgba(248,245,240,0.08)] focus:border-[#C9A96E]"
				/>
				<button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#C9A96E]">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
				</div>
			</div>

			<button
				type="submit"
				disabled={isLoading}
				className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:scale-[1.01] mt-2 bg-[#C9A96E] text-[#111111]"
			>
				{isLoading ? "Iniciando..." : "Iniciar sesion"}
			</button>
		</form>
	);
}
