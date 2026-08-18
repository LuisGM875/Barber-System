import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/loginForm";
import AuthLayout from "../../shared/layouts/authLayout";
import type { LoginPayload } from "../types/authTypes";
import { useAuth } from "../../../app/providers/authProvider";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (payload: LoginPayload) => {
    try {
      setError(null);
      setLoading(true);
      await login(payload);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Bienvenido de vuelta"
      subtitle="Ingresa a tu cuenta para gestionar tus citas"
      footerQuestion="No tienes cuenta?"
      footerActionLabel="Registrate"
      footerActionTo="/register"
    >
      {error ? (
        <p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      <LoginForm onSubmit={handleLogin} isLoading={loading} />
    </AuthLayout>
  );
}