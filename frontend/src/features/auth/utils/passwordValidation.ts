export const passwordRequirements = [
	{ label: "10 caracteres como mínimo", test: (value: string) => value.length >= 10 },
	{ label: "Una letra minúscula", test: (value: string) => /[a-záéíóúñ]/.test(value) },
	{ label: "Una letra mayúscula", test: (value: string) => /[A-ZÁÉÍÓÚÑ]/.test(value) },
	{ label: "Un número", test: (value: string) => /\d/.test(value) },
	{ label: "Un símbolo, por ejemplo ! @ # $", test: (value: string) => /[^\p{L}\p{N}\s]/u.test(value) },
] as const;

export function isStrongPassword(password: string) {
	return password.length <= 72 && passwordRequirements.every((requirement) => requirement.test(password));
}
