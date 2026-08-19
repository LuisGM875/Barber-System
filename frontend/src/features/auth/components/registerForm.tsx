import { useState } from "react";
import type { FormEvent } from "react";
import type { RegisterPayload } from "../types/authTypes";
import { Eye, EyeOff } from "lucide-react";
import { isStrongPassword, passwordRequirements } from "../utils/passwordValidation";

interface RegisterFormProps {
	onSubmit: (payload: RegisterPayload) => void;
	isLoading?: boolean;
}

export default function RegisterForm({ onSubmit, isLoading = false }: RegisterFormProps) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [passwordError, setPasswordError] = useState<string | null>(null);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!isStrongPassword(password)) {
			setPasswordError("La contraseña todavía no cumple todos los requisitos.");
			return;
		}
		setPasswordError(null);
		onSubmit({ name, email, phone, password });
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<label className="block text-xs font-medium mb-1.5 text-[#A1A1AA]">
					Nombre completo
				</label>
				<input
					type="text"
					value={name}
					onChange={(event) => setName(event.target.value)}
					placeholder="Carlos Mendoza"
					required
					className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all bg-[#1C1C1C] text-[#F8F5F0] border border-[rgba(248,245,240,0.08)] focus:border-[#C9A96E]"
				/>
			</div>

			<div>
				<label className="block text-xs font-medium mb-1.5 text-[#A1A1AA]">
					Número de telefono
				</label>
				<input
					type="text"
					value={phone}
					onChange={(event) => setPhone(event.target.value)}
					placeholder="123-456-7890"
					required
					className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all bg-[#1C1C1C] text-[#F8F5F0] border border-[rgba(248,245,240,0.08)] focus:border-[#C9A96E]"
				/>
			</div>

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
				<label className="text-xs font-medium mb-1.5 block text-[#A1A1AA]">
					Contraseña
				</label>
				<div className="relative">
				<input
					type={showPassword ? "text" : "password"}
					value={password}
					onChange={(event) => { setPassword(event.target.value); setPasswordError(null); }}
					placeholder="********"
					required
					minLength={10}
					maxLength={72}
					className="w-full py-3 pl-4 pr-12 rounded-xl text-sm outline-none transition-all bg-[#1C1C1C] text-[#F8F5F0] border border-[rgba(248,245,240,0.08)] focus:border-[#C9A96E]"
				/>
				<button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#C9A96E]">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
				</div>
				<ul className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
					{passwordRequirements.map((requirement) => {
						const valid = requirement.test(password);
						return <li key={requirement.label} className={valid ? "text-green-400" : "text-zinc-500"}>{valid ? "✓" : "○"} {requirement.label}</li>;
					})}
				</ul>
				{passwordError && <p className="mt-2 text-xs text-red-300">{passwordError}</p>}
			</div>

			<button
				type="submit"
				disabled={isLoading}
				className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:scale-[1.01] mt-2 bg-[#C9A96E] text-[#111111]"
			>
				{isLoading ? "Creando..." : "Crear cuenta"}
			</button>
		</form>
	);
}
