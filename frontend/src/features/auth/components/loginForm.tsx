import { useState } from "react";
import type { FormEvent } from "react";
import type { LoginPayload, UserRole } from "../types/authTypes";

interface LoginFormProps {
	onSubmit: (payload: LoginPayload) => void;
}

export default function LoginForm({ onSubmit }: LoginFormProps) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [role, setRole] = useState<UserRole>("client");

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		onSubmit({ email, password, role });
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="flex rounded-lg p-1 mb-6 bg-[#1C1C1C]">
				{(["client", "admin"] as const).map((selectedRole) => (
					<button
						key={selectedRole}
						type="button"
						onClick={() => setRole(selectedRole)}
						className="flex-1 py-2 rounded-md text-sm font-medium transition-all"
						style={{
							backgroundColor: role === selectedRole ? "#27272A" : "transparent",
							color: role === selectedRole ? "#F8F5F0" : "#A1A1AA",
						}}
					>
						{selectedRole === "client" ? "Cliente" : "Administrador"}
					</button>
				))}
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
				<div className="flex justify-between mb-1.5">
					<label className="text-xs font-medium text-[#A1A1AA]">Contrasena</label>
					<button type="button" className="text-xs text-[#C9A96E]">
						Olvidaste tu contrasena?
					</button>
				</div>
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
				Iniciar sesion
			</button>
		</form>
	);
}
