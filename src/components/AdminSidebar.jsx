import React from "react";
import "./AdminSidebar.css";

const AdminSidebar = ({ activeMenu, setActiveMenu }) => {
  const menuItems = [
    {
      name: "Dashboard",
      icon: "▦",
    },
    {
      name: "Users",
      icon: "♙",
    },
    {
      name: "Products",
      icon: "▣",
    },
  ];

  return (
    <aside className="admin-sidebar">

      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-name">
          VanyaGlo
          <span className="logo-star">✦</span>
        </div>

        <div className="logo-subtitle">
          BEAUTY AND PERSONAL CARE
        </div>
      </div>

      {/* Menu */}
      <nav className="sidebar-menu">

        {menuItems.map((item) => (
          <button
            key={item.name}
            className={`sidebar-menu-item ${
              activeMenu === item.name ? "active" : ""
            }`}
            onClick={() => setActiveMenu(item.name)}
          >
            <span className="menu-icon">
              {item.icon}
            </span>

            <span>{item.name}</span>
          </button>
        ))}

      </nav>

    </aside>
  );
};

export default AdminSidebar;