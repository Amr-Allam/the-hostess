import { Navigate } from "react-router";
import { useAuth } from "./useAuth.js";

// Renders children only for a logged-in user whose role is in `roles`.
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="p-6 text-stone-500">Loading…</p>;
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/staff/login" replace />;
  }
  return children;
}
