
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import AdminDashboard from "./pages/AdminDashboard";
import AdminOrders from "./pages/AdminOrders";
import AdminCouponsOffers from "./pages/AdminCouponsOffers";
import AdminLogin from "./pages/AdminLogin";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import PrivacyPolicy from "./pages/PrivacyPolicy";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Show React Admin Login first */}
        <Route
          path="/"
          element={<Navigate to="/admin/login" replace />}
        />

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        {/* Dashboard pages require authentication */}
        <Route element={<ProtectedAdminRoute />}>
          <Route
            path="/admin"
            element={<AdminDashboard />}
          />

          <Route
            path="/admin/orders"
            element={<AdminOrders />}
          />

          <Route
            path="/admin/coupons-offers"
            element={<AdminCouponsOffers />}
          />
          <Route
  path="/privacy-policy"
  element={<PrivacyPolicy />}
/>
        </Route>

        {/* Unknown routes return to login */}
        <Route
          path="*"
          element={<Navigate to="/admin/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
