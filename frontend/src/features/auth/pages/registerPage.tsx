import { useNavigate } from "react-router-dom";
import RegisterForm from "../components/registerForm";
import AuthLayout from "../../shared/layouts/authLayout";
import type { RegisterPayload } from "../types/authTypes";

export default function RegisterPage() {
  const navigate = useNavigate();

  const handleRegister = (payload: RegisterPayload) => {
    console.log("Register payload", payload);
    navigate("/");
  };

  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle="Registrate para reservar y gestionar tus citas"
      footerQuestion="Ya tienes cuenta?"
      footerActionLabel="Inicia sesion"
      footerActionTo="/login"
    >
      <RegisterForm onSubmit={handleRegister} />
    </AuthLayout>
  );
}