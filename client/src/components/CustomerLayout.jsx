import { NavLink, Outlet, useLocation } from "react-router";
import { getLastOrderId } from "../lib/lastOrder.js";

const linkClass = ({ isActive }) =>
  `px-3 py-2 text-sm font-medium ${isActive ? "text-amber-700" : "text-stone-600"}`;

export default function CustomerLayout() {
  // useLocation re-renders the layout on every navigation, so the link
  // appears right after an order is placed.
  useLocation();
  const lastOrderId = getLastOrderId();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <nav className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
          <span className="mr-auto text-lg font-semibold">The Hostess</span>
          <NavLink to="/" end className={linkClass}>
            Menu
          </NavLink>
          <NavLink to="/reserve" className={linkClass}>
            Reserve
          </NavLink>
          {lastOrderId && (
            <NavLink to={`/order/${lastOrderId}`} className={linkClass}>
              Your order
            </NavLink>
          )}
          <NavLink to="/cart" className={linkClass}>
            Cart
          </NavLink>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
