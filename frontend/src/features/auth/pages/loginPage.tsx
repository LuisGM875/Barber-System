import { useNavigate } from "react-router-dom";
import LoginForm from "../components/loginForm";
import AuthLayout from "../../shared/layouts/authLayout";
import type { LoginPayload } from "../types/authTypes";

export default function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = (payload: LoginPayload) => {
    console.log("Login payload", payload);
    navigate("/");
  };

  return (
    <AuthLayout
      title="Bienvenido de vuelta"
      subtitle="Ingresa a tu cuenta para gestionar tus citas"
      footerQuestion="No tienes cuenta?"
      footerActionLabel="Registrate"
      footerActionTo="/register"
    >
      <LoginForm onSubmit={handleLogin} />
    </AuthLayout>
  );
}