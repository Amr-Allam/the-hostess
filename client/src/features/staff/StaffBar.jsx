import { useAuth } from "./useAuth.js";

export default function StaffBar() {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3">
      <span className="text-sm text-stone-600">
        {user.email} ({user.role})
      </span>
      <button
        type="button"
        onClick={logout}
        className="rounded bg-stone-800 px-3 py-1.5 text-sm text-white"
      >
        Log out
      </button>
    </div>
  );
}
