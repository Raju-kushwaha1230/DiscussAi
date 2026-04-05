import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PublicRoute = () => {
  const { token, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

  return token ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export default PublicRoute;