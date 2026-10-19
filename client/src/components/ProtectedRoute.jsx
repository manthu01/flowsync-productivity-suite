import { Navigate, useLocation } from "react-router-dom";
import { getToken } from "../services/authService";

const ProtectedRoute = ({ children }) => {
  const token = getToken();
  const location = useLocation();

  if (!token) {
    // Remember where they were headed so Login can send them back there.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
