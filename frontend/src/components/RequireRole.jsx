import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser } from "../store/authSlice";
import { homeFor } from "../utils/roles";

// Works like the role middleware on the backend, but for pages.
const RequireRole = ({ role }) => {
  const user = useSelector(selectUser);
  const location = useLocation();

  // After logging in, the login page sends the user back to the page they asked for.
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  // The wrong kind of account goes to its own start page.
  if (user.role !== role) {
    return <Navigate to={homeFor(user.role)} replace />;
  }
  return <Outlet />;
};

export default RequireRole;
