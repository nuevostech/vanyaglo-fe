import React, { useEffect, useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import AdminUsers from "./AdminUsers";
import AdminProducts from "./AdminProducts";
import "./AdminDashboard.css";
import { Eye, EyeOff } from "lucide-react";

const AdminDashboard = () => {
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
  full_name: "",
  email: "",
  mobile_number: "",
  password: "",
  status: "active",
});

const [creatingUser, setCreatingUser] = useState(false);
  useEffect(() => {
  const loginAdmin = async () => {
    try {
      
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/dev-login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Admin auto-login failed"
        );
      }

      const accessToken =
        result.data?.access_token ||
        result.data?.accessToken;

      if (!accessToken) {
        throw new Error("Admin access token not received");
      }

      localStorage.setItem("token", accessToken);
      localStorage.setItem("accessToken", accessToken);

      console.log("Admin auto-login successful");
    } catch (error) {
      console.error("Admin auto-login error:", error);
    }
  };

  loginAdmin();
}, []);
  
  const [dashboardStats, setDashboardStats] = useState({
  revenue: "00",
  orders: "00",
  totalUsers: "00",
  products: "00",
});

const [recentUsers, setRecentUsers] = useState([]);

const stats = [
  {
    value: dashboardStats.revenue,
    label: "Revenue",
  },
  {
    value: dashboardStats.orders,
    label: "Orders",
  },
  {
    value: dashboardStats.totalUsers,
    label: "Total Users",
  },
  {
    value: dashboardStats.products,
    label: "Products",
  },
];
const fetchDashboardUsers = async () => {
  try {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken");

    if (!token) {
      console.error("Admin token not found");
      return;
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/admin/users?page=1&limit=5`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    console.log("Dashboard users response:", result);

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to fetch dashboard users"
      );
    }

    const users =
      result?.data?.users ||
      result?.users ||
      [];

    const statistics =
      result?.data?.statistics ||
      result?.statistics ||
      {};

    setDashboardStats((prev) => ({
      ...prev,
      totalUsers: String(statistics.total ?? 0).padStart(2, "0"),
    }));

    const formattedUsers = users.map((user) => ({
      id: user.id || user.user_id,
      initials: (user.full_name || user.name || "-")
        .split(" ")
        .map((word) => word[0])
        .join("")
        .substring(0, 2)
        .toUpperCase(),

      name:
        user.full_name ||
        user.name ||
        "-",

      email:
        user.email ||
        "-",

      status:
        user.status ||
        "inactive",

      role:
        user.role?.name ||
        user.Role?.name ||
        user.role_name ||
        user.role ||
        "-",
    }));

    setRecentUsers(formattedUsers);
  } catch (error) {
    console.error(
      "Dashboard users error:",
      error
    );
  }
};

  const handleAddUser = () => {
    setActiveMenu("Users");
  };

  const handleAddProduct = () => {
    setActiveMenu("Products");
  };
  const handleCreateUser = async (e) => {
  e.preventDefault();

  try {
    setCreatingUser(true);

    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken");

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/admin/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: addUserForm.full_name.trim(),
          email: addUserForm.email.trim() || null,
          mobile_number: addUserForm.mobile_number.trim(),
          password: addUserForm.password,
          status: addUserForm.status,
          is_verified: true,
        }),
      }
    );

    const result = await response.json();

    console.log("Create User API:", result);

    if (!response.ok) {
      throw new Error(result.message || "Failed to create user");
    }

    alert(result.message || "User created successfully");

    setAddUserForm({
      full_name: "",
      email: "",
      mobile_number: "",
      password: "",
      status: "active",
    });

    setShowAddUserModal(false);
  } catch (error) {
    console.error("Create user error:", error);
    alert(error.message || "Failed to create user");
  } finally {
    setCreatingUser(false);
  }
};

  return (
    <div className="admin-layout">

      {/* Sidebar */}
      <AdminSidebar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
      />

      {/* Main Content */}
      <main className="admin-main">

        {/* Header */}
        <header className="dashboard-header">
          <div>
            <h1>Welcome back, Admin</h1>

            <p>
              Here's what's happening with VanyaGlo today
            </p>
          </div>

        </header>

        {/* Dashboard Content */}
        {activeMenu === "Dashboard" && (
          <div className="dashboard-content">

            {/* Statistics */}
            <section className="stats-section">

              {stats.map((stat) => (
                <div
                  className="stat-card"
                  key={stat.label}
                >
                  <div className="stat-value">
                    {stat.value}
                  </div>

                  <div className="stat-label">
                    {stat.label}
                  </div>
                </div>
              ))}

            </section>

            {/* Quick Actions */}
            <section className="quick-actions-section">

              <h2>Quick Actions</h2>

              <div className="quick-actions">

                <button
  className="quick-action-btn"
  onClick={() => setShowAddUserModal(true)}
>
  Add User
</button>

                <button
  className="quick-action-btn"
  onClick={() => setShowAddProductModal(true)}
>
  Add Product
</button>

              </div>

            </section>

            {/* Recent Users */}
            <section className="recent-users-section">

              <h2>Recent Users</h2>

              <div className="recent-users-list">

                {recentUsers.map((user) => (
                  <div
                    className="recent-user-card"
                    key={user.id}
                  >

                    {/* Avatar */}
                    <div className="user-avatar">
                      {user.initials}
                    </div>

                    {/* User Information */}
                    <div className="user-information">

                      <div className="user-name">
                        {user.name}
                      </div>

                      <div className="user-email">
                        {user.email}
                      </div>

                      <div className="user-badges">

                        <span className="status-badge">
                          {user.status}
                        </span>

                        <span
                          className={`role-badge ${
                            user.role === "Reseller"
                              ? "reseller"
                              : "customer"
                          }`}
                        >
                          {user.role}
                        </span>

                      </div>

                    </div>

                  </div>
                ))}

              </div>

            </section>

          </div>
        )}

        {/* Temporary Users Page */}
        {activeMenu === "Users" && (
  <AdminUsers
    onAddUser={() => setShowAddUserModal(true)}
  />
)}

        {/* Temporary Products Page */}
        {activeMenu === "Products" && (
  <AdminProducts
    onAddProduct={() => setShowAddProductModal(true)}
  />
)}

      </main>
      {showAddUserModal && (
  <div
    className="modal-overlay"
    onClick={() => setShowAddUserModal(false)}
  >

    <div
      className="add-user-modal"
      onClick={(e) => e.stopPropagation()}
    >

      {/* Modal Header */}
      <div className="modal-header">

        <div>
          <h2>Add User</h2>

          <p>
            Create a new VanyaGlo user
          </p>
        </div>

        <button
          className="modal-close-btn"
          onClick={() => setShowAddUserModal(false)}
        >
          ×
        </button>

      </div>

      {/* Form */}
      <form
  className="add-user-form"
  onSubmit={handleCreateUser}
>

        {/* Full Name */}
        <div className="form-group">

          <label>
            Full Name
          </label>

          <input
  type="text"
  placeholder="Enter full name"
  value={addUserForm.full_name}
  onChange={(e) =>
    setAddUserForm((prev) => ({
      ...prev,
      full_name: e.target.value,
    }))
  }
  required
/>

        </div>

        {/* Email */}
        <div className="form-group">

          <label>
            Email
          </label>

          <input
  type="email"
  placeholder="Enter email"
  value={addUserForm.email}
  onChange={(e) =>
    setAddUserForm((prev) => ({
      ...prev,
      email: e.target.value,
    }))
  }
  required
/>

        </div>

        {/* Phone */}
        <div className="form-group">

          <label>
            Phone Number
          </label>

          <input
            type="tel"
            placeholder="Enter phone number"
            value={addUserForm.mobile_number}
            onChange={(e) =>
              setAddUserForm((prev) => ({
                ...prev,
                mobile_number: e.target.value,
              }))
            }
            required
          />

        </div>

        {/* Password */}
        <div className="form-group">

  <label>
    Password
  </label>

  <div className="password-input-wrapper">

    <input
  type={showPassword ? "text" : "password"}
  placeholder="Enter password"
  value={addUserForm.password}
  onChange={(e) =>
    setAddUserForm((prev) => ({
      ...prev,
      password: e.target.value,
    }))
  }
  minLength={6}
  required
/>

    <button
      type="button"
      className="password-toggle-btn"
      onClick={() => setShowPassword((prev) => !prev)}
      aria-label={
        showPassword
          ? "Hide password"
          : "Show password"
      }
    >
      {showPassword ? (
        <EyeOff size={19} strokeWidth={1.8} />
      ) : (
        <Eye size={19} strokeWidth={1.8} />
      )}
    </button>

  </div>

</div>
        {/* Role */}
        {/* <div className="form-group">

          <label>
            Role
          </label>

          <select required defaultValue="">
            <option value="" disabled>
              Select role
            </option>

            <option value="customer">
              Customer
            </option>

            <option value="reseller">
              Reseller
            </option>
          </select>

        </div> */}

        {/* Status */}
        <div className="form-group">

          <label>
            Status
          </label>

          <select
  value={addUserForm.status}
  onChange={(e) =>
    setAddUserForm((prev) => ({
      ...prev,
      status: e.target.value,
    }))
  }
>
  <option value="active">Active</option>
  <option value="inactive">Inactive</option>
</select>

        </div>

        {/* Buttons */}
        <div className="modal-actions">

          <button
            type="button"
            className="modal-cancel-btn"
            onClick={() => setShowAddUserModal(false)}
          >
            Cancel
          </button>

          <button type="submit" disabled={creatingUser}>
  {creatingUser ? "Creating..." : "Create User"}
</button>

        </div>

      </form>

    </div>

  </div>
)}
{showAddProductModal && (
  <div
    className="modal-overlay"
    onClick={() => setShowAddProductModal(false)}
  >

    <div
      className="add-product-modal"
      onClick={(e) => e.stopPropagation()}
    >

      {/* Modal Header */}
      <div className="modal-header">

        <div>
          <h2>Add Product</h2>

          <p>
            Add a new VanyaGlo beauty product
          </p>
        </div>

        <button
          className="modal-close-btn"
          onClick={() => setShowAddProductModal(false)}
        >
          ×
        </button>

      </div>

      {/* Product Form */}
      <form
        className="add-product-form"
        onSubmit={(e) => {
          e.preventDefault();

          console.log("Product submitted");

          setShowAddProductModal(false);
        }}
      >

        {/* Product Name */}
        <div className="form-group">

          <label>
            Product Name
          </label>

          <input
            type="text"
            placeholder="Enter product name"
            required
          />

        </div>

        {/* Brand */}
        <div className="form-group">

          <label>
            Brand
          </label>

          <input
            type="text"
            placeholder="Enter brand name"
            required
          />

        </div>

        {/* Category */}
        <div className="form-group">

          <label>
            Category
          </label>

          <select required defaultValue="">

            <option value="" disabled>
              Select category
            </option>

            <option value="skincare">
              Skincare
            </option>

            <option value="makeup">
              Makeup
            </option>

            <option value="haircare">
              Haircare
            </option>

            <option value="fragrance">
              Fragrance
            </option>

            <option value="personal-care">
              Personal Care
            </option>

          </select>

        </div>

        {/* Selling Price + MRP */}
        <div className="form-row">

          <div className="form-group">

            <label>
              Selling Price
            </label>

            <input
              type="number"
              placeholder="₹0"
              min="0"
              required
            />

          </div>

          <div className="form-group">

            <label>
              MRP
            </label>

            <input
              type="number"
              placeholder="₹0"
              min="0"
              required
            />

          </div>

        </div>

        {/* Stock */}
        <div className="form-group">

          <label>
            Stock Quantity
          </label>

          <input
            type="number"
            placeholder="Enter stock quantity"
            min="0"
            required
          />

        </div>

        {/* Status */}
        <div className="form-group">

          <label>
            Status
          </label>

          <select defaultValue="active">

            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>

          </select>

        </div>

        {/* Buttons */}
        <div className="modal-actions">

          <button
            type="button"
            className="modal-cancel-btn"
            onClick={() => setShowAddProductModal(false)}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="modal-create-btn"
          >
            Create Product
          </button>

        </div>

      </form>

    </div>

  </div>
)}
    </div>
  );
};

export default AdminDashboard;