import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RegisterForm from "../components/registerForm";
import AuthLayout from "../../shared/layouts/authLayout";
import type { RegisterPayload } from "../types/authTypes";
import { useAuth } from "../../../app/providers/authProvider";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRegister = async (payload: RegisterPayload) => {
    try {
      setError(null);
      setLoading(true);
      const response = await register(payload);
      setSuccess(response.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle="Registrate para reservar y gestionar tus citas"
      footerQuestion="Ya tienes cuenta?"
      footerActionLabel="Inicia sesion"
      footerActionTo="/login"
    >
      {success ? <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-200"><p>{success}</p><button onClick={() => navigate("/login")} className="mt-3 font-semibold text-[#C9A96E]">Ir a iniciar sesión</button></div> : null}
      {error ? (
        <p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      {!success && <RegisterForm onSubmit={handleRegister} isLoading={loading} />}
    </AuthLayout>
  );
}
