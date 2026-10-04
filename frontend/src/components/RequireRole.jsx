import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Works like the requireAdmin middleware on the backend, but for pages.
const RequireRole = ({ role }) => {
  const { user } = useAuth();
  const location = useLocation();

  // After logging in, the login page sends the user back to the page they asked for.
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (user.role !== role) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

export default RequireRole;
