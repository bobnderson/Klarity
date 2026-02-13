import { Navigate, Outlet } from "react-router-dom";

export const ProtectedRoute = () => {
  const userData = sessionStorage.getItem("user_data");

  if (!userData) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
