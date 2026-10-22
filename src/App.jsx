
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
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Existing admin dashboard */}
        <Route
          path="/admin"
          element={<AdminDashboard />}
        />

        {/* New orders management page */}
        <Route
          path="/admin/orders"
          element={<AdminOrders />}
        />
        <Route
  path="/admin/coupons-offers"
  element={<AdminCouponsOffers />}
/>

        {/* Redirect unknown routes */}
        <Route
          path="*"
          element={<Navigate to="/admin" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
