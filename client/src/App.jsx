import { Route, Routes } from "react-router";
import CustomerLayout from "./components/CustomerLayout.jsx";
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
      <Route path="/staff/kitchen" element={<KitchenPage />} />
      <Route path="/staff/dashboard" element={<DashboardPage />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
