import React, { useEffect, useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import AdminUsers from "./AdminUsers";
import AdminProducts from "./AdminProducts";
import "./AdminDashboard.css";
import { Eye, EyeOff } from "lucide-react";
import ProductReviews from "./ProductReviews";
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
const [creatingProduct, setCreatingProduct] = useState(false);

const [addProductForm, setAddProductForm] = useState({
  product_name: "",
  actual_price: "",
  offer_price: "",
  discount_percentage: "",
  stock: "",
  product_description: "",
  is_active: true,
});
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
  totalReviews: "00",
});

const [recentUsers, setRecentUsers] = useState([]);
const [recentUsersPage, setRecentUsersPage] = useState(1);

const recentUsersPerPage = 5;

const recentUsersTotalPages = Math.ceil(
  recentUsers.length / recentUsersPerPage
);

const paginatedRecentUsers = recentUsers.slice(
  (recentUsersPage - 1) * recentUsersPerPage,
  recentUsersPage * recentUsersPerPage
);
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
  {
    value: dashboardStats.totalReviews,
    label: "Ratings & Reviews",
    onClick: () => setActiveMenu("Ratings & Reviews"),
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
     `${import.meta.env.VITE_API_BASE_URL}/api/admin/users?page=1&limit=100`,
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
        created_at: user.created_at,
    }));

    const today = new Date();

const todayUsers = formattedUsers.filter((user) => {
  if (!user.created_at) return false;

  const createdDate = new Date(user.created_at);

  return (
    createdDate.getFullYear() === today.getFullYear() &&
    createdDate.getMonth() === today.getMonth() &&
    createdDate.getDate() === today.getDate()
  );
});

setRecentUsers(todayUsers);
setRecentUsersPage(1);
  } catch (error) {
    console.error(
      "Dashboard users error:",
      error
    );
  }
};
const fetchDashboardReviews = async () => {
  try {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("auth_token");

    if (!token) return;

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/admin/reviews?page=1&limit=1`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to fetch review count");
    }

    const total = result.data?.pagination?.total ?? 0;

    setDashboardStats((previous) => ({
      ...previous,
      totalReviews: String(total).padStart(2, "0"),
    }));
  } catch (error) {
    console.error("Dashboard reviews error:", error);
  }
};
const fetchDashboardProducts = async () => {
  try {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken");

    if (!token) {
      console.error("Admin token not found");
      return;
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/admin/products?page=1&limit=1`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    console.log("Dashboard products response:", result);

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to fetch dashboard products"
      );
    }

    const totalProducts =
      result?.data?.pagination?.total ??
      result?.pagination?.total ??
      0;

    setDashboardStats((prev) => ({
      ...prev,
      products: String(totalProducts).padStart(2, "0"),
    }));
  } catch (error) {
    console.error("Dashboard products error:", error);
  }
};
useEffect(() => {
  fetchDashboardUsers();
  fetchDashboardProducts();
  fetchDashboardReviews();
}, []);
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
const handleCreateProduct = async (e) => {
  e.preventDefault();

  try {
    setCreatingProduct(true);

    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken");

    if (!token) {
      throw new Error("Admin token not found");
    }

    const actualPrice = Number(addProductForm.actual_price);
    const offerPrice = Number(addProductForm.offer_price);
    const discountPercentage = Number(
      addProductForm.discount_percentage || 0
    );
    const stock = Number(addProductForm.stock);

    if (offerPrice > actualPrice) {
      throw new Error("Offer price cannot be greater than actual price");
    }

    if (stock < 0 || !Number.isInteger(stock)) {
      throw new Error("Stock must be a valid non-negative number");
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/admin/products`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_name: addProductForm.product_name.trim(),
          actual_price: actualPrice,
          offer_price: offerPrice,
          discount_percentage: discountPercentage,
          stock,
          product_images: [],
          product_description:
            addProductForm.product_description.trim(),
          is_active: addProductForm.is_active,
        }),
      }
    );

    const result = await response.json();

    console.log("Create Product API:", result);

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Failed to create product"
      );
    }

    alert(result.message || "Product created successfully");

    setAddProductForm({
      product_name: "",
      actual_price: "",
      offer_price: "",
      discount_percentage: "",
      stock: "",
      product_description: "",
      is_active: true,
    });

    setShowAddProductModal(false);

    // Stay on Dashboard after creating,
    // exactly like Add User.
  } catch (error) {
    console.error("Create product error:", error);
    alert(error.message || "Failed to create product");
  } finally {
    setCreatingProduct(false);
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
        {/* Header - Dashboard only */}
{activeMenu === "Dashboard" && (
  <header className="dashboard-header">
    <div>
      <h1>Welcome back, Admin</h1>

      <p>
        Here's what's happening with VanyaGlo today
      </p>
    </div>
  </header>
)}

        {/* Dashboard Content */}
        {activeMenu === "Dashboard" && (
          <div className="dashboard-content">

            {/* Statistics */}
            
<section className="stats-section">
  {stats.map((stat) => (
    <div
      className={`stat-card ${
        stat.onClick ? "stat-card-clickable" : ""
      }`}
      key={stat.label}
      onClick={stat.onClick}
      role={stat.onClick ? "button" : undefined}
      tabIndex={stat.onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (
          stat.onClick &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault();
          stat.onClick();
        }
      }}
    >
      <div className="stat-value">{stat.value}</div>
      <div className="stat-label">{stat.label}</div>
    </div>
  ))}
</section>


            {/* Quick Actions */}
            {/* <section className="quick-actions-section">

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

            </section> */}

            {/* Recent Users */}
            <section className="recent-users-section">

              <h2>Recent Users</h2>

              <div className="recent-users-list">

                {paginatedRecentUsers.map((user) => (
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

                        {/* <span
                          className={`role-badge ${
                            user.role === "Reseller"
                              ? "reseller"
                              : "customer"
                          }`}
                        >
                          {user.role}
                        </span> */}

                      </div>

                    </div>

                  </div>
                ))}

              </div>
              {recentUsers.length > 0 && (
  <div className="recent-users-pagination">
    <button
      className="recent-users-pagination-arrow"
      onClick={() =>
        setRecentUsersPage((prev) => Math.max(prev - 1, 1))
      }
      disabled={recentUsersPage === 1}
    >
      ‹
    </button>

    <span className="recent-users-pagination-page">
      {recentUsersPage}
    </span>

    <button
      className="recent-users-pagination-arrow"
      onClick={() =>
        setRecentUsersPage((prev) =>
          Math.min(prev + 1, recentUsersTotalPages)
        )
      }
      disabled={recentUsersPage === recentUsersTotalPages}
    >
      ›
    </button>
  </div>
)}

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
{activeMenu === "Ratings & Reviews" && (
  <ProductReviews />
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

          <button
  type="submit"
  className="modal-create-btn"
  disabled={creatingUser}
>
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
  onSubmit={handleCreateProduct}
>
  {/* Product Name */}
  <div className="form-group">
    <label>Product Name</label>

    <input
      type="text"
      placeholder="Enter product name"
      value={addProductForm.product_name}
      onChange={(e) =>
        setAddProductForm((prev) => ({
          ...prev,
          product_name: e.target.value,
        }))
      }
      required
    />
  </div>

  {/* Actual Price + Offer Price */}
  <div className="form-row">
    <div className="form-group">
      <label>Actual Price</label>

      <input
        type="number"
        placeholder="₹0"
        min="0"
        step="0.01"
        value={addProductForm.actual_price}
        onChange={(e) =>
          setAddProductForm((prev) => ({
            ...prev,
            actual_price: e.target.value,
          }))
        }
        required
      />
    </div>

    <div className="form-group">
      <label>Offer Price</label>

      <input
        type="number"
        placeholder="₹0"
        min="0"
        step="0.01"
        value={addProductForm.offer_price}
        onChange={(e) =>
          setAddProductForm((prev) => ({
            ...prev,
            offer_price: e.target.value,
          }))
        }
        required
      />
    </div>
  </div>

  {/* Discount */}
  <div className="form-group">
    <label>Discount Percentage</label>

    <input
      type="number"
      placeholder="Enter discount percentage"
      min="0"
      max="100"
      step="0.01"
      value={addProductForm.discount_percentage}
      onChange={(e) =>
        setAddProductForm((prev) => ({
          ...prev,
          discount_percentage: e.target.value,
        }))
      }
    />
  </div>

  {/* Stock */}
  <div className="form-group">
    <label>Stock Quantity</label>

    <input
      type="number"
      placeholder="Enter stock quantity"
      min="0"
      step="1"
      value={addProductForm.stock}
      onChange={(e) =>
        setAddProductForm((prev) => ({
          ...prev,
          stock: e.target.value,
        }))
      }
      required
    />
  </div>

  {/* Description */}
  <div className="form-group">
    <label>Product Description</label>

    <textarea
      placeholder="Enter product description"
      rows="4"
      value={addProductForm.product_description}
      onChange={(e) =>
        setAddProductForm((prev) => ({
          ...prev,
          product_description: e.target.value,
        }))
      }
    />
  </div>

  {/* Status */}
  <div className="form-group">
    <label>Status</label>

    <select
      value={addProductForm.is_active ? "active" : "inactive"}
      onChange={(e) =>
        setAddProductForm((prev) => ({
          ...prev,
          is_active: e.target.value === "active",
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
      onClick={() => setShowAddProductModal(false)}
      disabled={creatingProduct}
    >
      Cancel
    </button>

    <button
      type="submit"
      className="modal-create-btn"
      disabled={creatingProduct}
    >
      {creatingProduct ? "Creating..." : "Create Product"}
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