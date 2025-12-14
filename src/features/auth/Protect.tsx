import { type ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import { Navigate } from "react-router-dom";
interface ProtecProps {
  children: ReactNode;
}

const Protect = ({ children }: ProtecProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Carregando....</p>;
  }

  if (!user) {
    // Se não estiver logado, redireciona para /login
    return <Navigate to="/login" replace />;
  }

  return <div>{children}</div>;
};

export default Protect;
