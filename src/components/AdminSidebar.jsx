
import React from "react";
import { useNavigate } from "react-router-dom";
import "./AdminSidebar.css";

const AdminSidebar = ({ activeMenu, setActiveMenu }) => {
  const navigate = useNavigate();

  const menuItems = [
    { name: "Dashboard", icon: "▦" },
    { name: "Users", icon: "♙" },
    { name: "Products", icon: "▣" },
    { name: "Orders", icon: "📦" },
    { name: "Coupons", icon: "🎁" },
    { name: "Ratings & Reviews", icon: "☆" },
  ];

  const handleMenuClick = (item) => {
  setActiveMenu(item.name);
  navigate("/admin");
};

    // Keep the existing dashboard section-switching behavior
    // for Dashboard, Users, Products, Orders and Reviews.
    
  const handleLogout = () => {
    const confirmLogout = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmLogout) return;

    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("access_token");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("user_name");
    localStorage.removeItem("username");

    window.location.href = "http://localhost:5000";
  };

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-logo">
        <div className="logo-name">
          VanyaGlo
          <span className="logo-star">✦</span>
        </div>

        <div className="logo-subtitle">
          BEAUTY AND PERSONAL CARE
        </div>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <button
            key={item.name}
            type="button"
            className={`sidebar-menu-item ${
              activeMenu === item.name ? "active" : ""
            }`}
            onClick={() => handleMenuClick(item)}
          >
            <span className="menu-icon">{item.icon}</span>
            <span>{item.name}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-logout">
        <button
          type="button"
          className="sidebar-logout-btn"
          onClick={handleLogout}
        >
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
