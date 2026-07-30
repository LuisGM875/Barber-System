import { useState } from "react";
import type { FormEvent } from "react";
import type { RegisterPayload } from "../types/authTypes";

interface RegisterFormProps {
	onSubmit: (payload: RegisterPayload) => void;
}

export default function RegisterForm({ onSubmit }: RegisterFormProps) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		onSubmit({ name, email, password });
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
					Contrasena
				</label>
				<input
					type="password"
					value={password}
					onChange={(event) => setPassword(event.target.value)}
					placeholder="********"
					required
					className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all bg-[#1C1C1C] text-[#F8F5F0] border border-[rgba(248,245,240,0.08)] focus:border-[#C9A96E]"
				/>
			</div>

			<button
				type="submit"
				className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:scale-[1.01] mt-2 bg-[#C9A96E] text-[#111111]"
			>
				Crear cuenta
			</button>
		</form>
	);
}
