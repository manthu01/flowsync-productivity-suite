import { Navigate } from "react-router-dom";
import { getToken, getStoredUser } from "../services/authService";

// Client-side gate is just UX (hide the link, skip a doomed fetch) — the real
// enforcement is the backend's requireAdmin middleware on every /api/admin route.
const AdminRoute = ({ children }) => {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;

  const user = getStoredUser();
  if (!user?.is_admin) return <Navigate to="/dashboard" replace />;

  return children;
};

export default AdminRoute;
