import { Route, Routes } from "react-router";
import CustomerLayout from "./components/CustomerLayout.jsx";
import ProtectedRoute from "./features/staff/ProtectedRoute.jsx";
import CartPage from "./pages/CartPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import KitchenPage from "./pages/KitchenPage.jsx";
import MenuPage from "./pages/MenuPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import OrderStatusPage from "./pages/OrderStatusPage.jsx";
import ReservePage from "./pages/ReservePage.jsx";
import StaffLoginPage from "./pages/StaffLoginPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<MenuPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/order/:id" element={<OrderStatusPage />} />
        <Route path="/reserve" element={<ReservePage />} />
      </Route>

      <Route path="/staff/login" element={<StaffLoginPage />} />
      <Route
        path="/staff/kitchen"
        element={
          <ProtectedRoute roles={["kitchen", "owner"]}>
            <KitchenPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/dashboard"
        element={
          <ProtectedRoute roles={["owner"]}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
