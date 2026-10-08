import React, { useEffect, useState } from "react";
import "./AdminUsers.css";

const AdminUsers = ({ onAddUser }) => {
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [totalPages, setTotalPages] = useState(1);

  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    new: 0,
  });

  // ================================
  // VIEW USER
  // ================================

  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  // ================================
  // EDIT USER
  // ================================

  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [savingUser, setSavingUser] = useState(false);

  // ============================================================
  // GET TOKEN
  // ============================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken")
    );
  };

  // ============================================================
  // FETCH USERS
  // SEARCH + PAGINATION
  // ============================================================

  useEffect(() => {
  const trimmedSearch = search.trim();

  // Don't call API for 1 or 2 characters
  if (trimmedSearch.length > 0 && trimmedSearch.length < 3) {
    return;
  }

  const timer = setTimeout(() => {
    fetchUsers();
  }, 500);

  return () => clearTimeout(timer);
}, [search, currentPage]);
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      const params = new URLSearchParams();

      params.append("page", currentPage);
      params.append("limit", usersPerPage);

     if (search.trim().length >= 3) {
  params.append("search", search.trim());
}

      const url = `${
        import.meta.env.VITE_API_BASE_URL
      }/api/admin/users?${params.toString()}`;

      console.log("Fetching users:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        },
      });

      const result = await response.json();

      console.log("Users API response:", result);

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to fetch users"
        );
      }

      const apiUsers =
        result?.data?.users ||
        result?.users ||
        [];

      const formattedUsers = apiUsers.map((user) => ({
        id: user.id || user.user_id,

        name:
          user.full_name ||
          user.name ||
          "-",

        email:
          user.email ||
          "-",

        phone:
          user.mobile_number ||
          user.phone_number ||
          user.phone ||
          "-",

        // role:
        //   user.role?.name ||
        //   user.Role?.name ||
        //   user.role_name ||
        //   user.role ||
        //   "-",

        status:
          user.status ||
          "inactive",
      }));

      setUsers(formattedUsers);

      // ============================================
      // STATISTICS
      // ============================================

      setUserStats({
        total:
          result?.data?.statistics?.total ??
          result?.statistics?.total ??
          0,

        active:
          result?.data?.statistics?.active ??
          result?.statistics?.active ??
          0,

        inactive:
          result?.data?.statistics?.inactive ??
          result?.statistics?.inactive ??
          0,

        new:
          result?.data?.statistics?.new ??
          result?.statistics?.new ??
          0,
      });

      // ============================================
      // PAGINATION
      // ============================================

      const pagination =
        result?.data?.pagination ||
        result?.pagination ||
        {};

      const pages =
        pagination.total_pages ??
        pagination.totalPages ??
        1;

      setTotalPages(
        Math.max(1, Number(pages))
      );
    } catch (err) {
      console.error(
        "Fetch users error:",
        err
      );

      setError(
        err.message ||
          "Failed to load users"
      );

      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // SEARCH CHANGE
  // ============================================================

  const handleSearchChange = (e) => {
  const value = e.target.value;

  setSearch(value);
  setCurrentPage(1);
};

  // ============================================================
  // VIEW USER
  // ============================================================

  const handleView = async (id) => {
  try {
    setViewLoading(true);
    setSelectedUser(null);
    setShowViewModal(true);

    const token = getToken();

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/admin/users/${id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        },
      }
    );

    const result = await response.json();

    console.log("View user response:", result);

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to load user"
      );
    }

    // Backend response:
    // {
    //   success: true,
    //   message: "User fetched successfully",
    //   data: {
    //     user: {
    //       full_name: "...",
    //       email: "...",
    //       mobile_number: "...",
    //       status: "active"
    //     }
    //   }
    // }

    const userData =
      result?.data?.user ||
      result?.data ||
      result?.user ||
      result;

    console.log("Selected user data:", userData);

    setSelectedUser(userData);
  } catch (err) {
    console.error("View user error:", err);

    setShowViewModal(false);

    alert(
      err.message ||
        "Failed to load user details"
    );
  } finally {
    setViewLoading(false);
  }
};
  // ============================================================
  // EDIT USER
  // ============================================================

  const handleEdit = async (userOrId) => {
  try {
    setViewLoading(true);

    let userData = null;

    // If an ID is passed, fetch the complete user details
    if (typeof userOrId === "string") {
      const token = getToken();

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/users/${userOrId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
        }
      );

      const result = await response.json();

      console.log("Edit user response:", result);

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to load user"
        );
      }

      userData =
        result?.data?.user ||
        result?.data ||
        result?.user ||
        result;
    } else {
      // If the complete user object is already available
      userData = userOrId;
    }

    console.log("Edit user data:", userData);

    setEditUser({
      ...userData,
    });

    setShowEditModal(true);
  } catch (err) {
    console.error("Edit user error:", err);

    alert(
      err.message ||
        "Failed to load user details"
    );
  } finally {
    setViewLoading(false);
  }
};
  // ============================================================
  // EDIT INPUT CHANGE
  // ============================================================
const handleEditChange = (e) => {
  const { name, value } = e.target;

  setEditUser((prev) => ({
    ...prev,
    [name]: value,
  }));
};
const handleUpdate = async () => {
  try {
    if (!editUser) {
      alert("User details not found.");
      return;
    }

    const userId =
      editUser.user_id ||
      editUser.id;

    if (!userId) {
      alert("User ID is missing.");
      console.error("Edit user object:", editUser);
      return;
    }

    const token = getToken();

    if (!token) {
      alert("Authentication token is missing.");
      return;
    }

    const payload = {
      full_name: editUser.full_name?.trim(),
      email: editUser.email?.trim() || null,
      mobile_number: editUser.mobile_number?.trim(),
      status: editUser.status,
    };

    console.log("========== UPDATE USER ==========");
    console.log("User ID:", userId);
    console.log("Payload:", payload);

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/admin/users/${userId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    console.log("Update user response:", result);

    if (!response.ok) {
      throw new Error(
        result.message ||
          "Failed to update user"
      );
    }

    alert(
      result.message ||
        "User updated successfully"
    );

    setShowEditModal(false);
    setEditUser(null);

    // Refresh users table
    await loadUsers();
  } catch (error) {
    console.error(
      "Update user error:",
      error
    );

    alert(
      error.message ||
        "Failed to update user"
    );
  }
};

  // ============================================================
  // UPDATE USER
  // ============================================================

  const handleUpdateUser = async (e) => {
  e.preventDefault();

  if (!editUser) {
    alert("User details not found.");
    return;
  }

  const userId = editUser.user_id || editUser.id;

  if (!userId) {
    alert("User ID not found.");
    return;
  }

  try {
    setSavingUser(true);

    const token = getToken();

    if (!token) {
      alert("Authentication token not found. Please login again.");
      return;
    }

    const payload = {
      full_name: editUser.full_name?.trim(),
      email: editUser.email?.trim() || null,
      mobile_number: editUser.mobile_number?.trim(),
      status: editUser.status,
    };

    console.log("Updating user:", userId);
    console.log("Update payload:", payload);

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/admin/users/${userId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    console.log("Update user response:", result);

    if (!response.ok) {
      throw new Error(result.message || "Failed to update user");
    }

    alert(result.message || "User updated successfully");

    setShowEditModal(false);
    setEditUser(null);

    await fetchUsers();
  } catch (error) {
    console.error("Update user error:", error);
    alert(error.message || "Failed to update user");
  } finally {
    setSavingUser(false);
  }
};
  // ============================================================
  // CLOSE MODALS
  // ============================================================

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedUser(null);
  };

  const closeEditModal = () => {
    if (savingUser) return;

    setShowEditModal(false);
    setEditUser(null);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="users-page">

      {/* ================================
          PAGE HEADER
      ================================= */}

      <div className="users-header">
        <div>
          <h1>Users</h1>

          <p>
            Manage registered users and resellers
          </p>
        </div>

        <button
          className="add-user-btn"
          onClick={onAddUser}
        >
          + Add User
        </button>
      </div>

      {/* ================================
          SEARCH
      ================================= */}

      <div className="users-search-section">
        <div className="users-search">

          <input
            type="text"
            placeholder="Search by name, email, phone"
            value={search}
            onChange={handleSearchChange}
          />

          <span className="search-icon">
            ⌕
          </span>

        </div>
      </div>

      {/* ================================
          STATISTICS
      ================================= */}

      <div className="users-stats">

        <div className="users-stat-card">
          <div className="users-stat-number">
            {String(
              userStats.total
            ).padStart(2, "0")}
          </div>

          <div className="users-stat-label">
            Total
          </div>
        </div>

        <div className="users-stat-card">
          <div className="users-stat-number">
            {String(
              userStats.active
            ).padStart(2, "0")}
          </div>

          <div className="users-stat-label">
            Active
          </div>
        </div>

        <div className="users-stat-card">
          <div className="users-stat-number">
            {String(
              userStats.inactive
            ).padStart(2, "0")}
          </div>

          <div className="users-stat-label">
            Inactive
          </div>
        </div>

        <div className="users-stat-card">
          <div className="users-stat-number">
            {String(
              userStats.new
            ).padStart(2, "0")}
          </div>

          <div className="users-stat-label">
            New (Today)
          </div>
        </div>

      </div>

      {/* ================================
          ERROR
      ================================= */}

      {error && (
        <div className="users-error">
          {error}
        </div>
      )}

      {/* ================================
          USERS TABLE
      ================================= */}

      <div className="users-table-section">

        <div className="users-table-wrapper">

          <table className="users-table">

            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Phone</th>
                {/* <th>Role</th> */}
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan="6"
                    className="no-users"
                  >
                    Loading users...
                  </td>
                </tr>

              ) : users.length > 0 ? (

                users.map((user) => (

                  <tr key={user.id}>

                    {/* USER */}

                    <td>
                      <div className="table-user">

                        <div className="table-avatar">
                          {user.name
                            .split(" ")
                            .map(
                              (word) =>
                                word[0]
                            )
                            .join("")
                            .substring(
                              0,
                              2
                            )
                            .toUpperCase()}
                        </div>

                        <span className="table-user-name">
                          {user.name}
                        </span>

                      </div>
                    </td>

                    {/* EMAIL */}

                    <td>
                      <span className="table-email">
                        {user.email}
                      </span>
                    </td>

                    {/* PHONE */}

                    <td>
                      <span className="table-phone">
                        {user.phone}
                      </span>
                    </td>

                    {/* ROLE */}

                    {/* <td>
                      <span
                        className={`role-badge ${String(
                          user.role
                        ).toLowerCase()}`}
                      >
                        {user.role}
                      </span>
                    </td> */}

                    {/* STATUS */}

                    <td>
                      <span
                        className={`status-badge ${String(
                          user.status
                        ).toLowerCase()}`}
                      >
                        {user.status}
                      </span>
                    </td>

                    {/* ACTIONS */}

                    <td>

                      <div className="table-actions">

                        <button
                          type="button"
                          className="table-action-btn view-btn"
                          onClick={() =>
                            handleView(
                              user.id
                            )
                          }
                        >
                          View
                        </button>

                        <button
                          type="button"
                          className="table-action-btn edit-btn"
                          onClick={() =>
                            handleEdit(
                              user.id
                            )
                          }
                        >
                          Edit
                        </button>

                      </div>

                    </td>

                  </tr>

                ))

              ) : (

                <tr>
                  <td
                    colSpan="6"
                    className="no-users"
                  >
                    No users found
                  </td>
                </tr>

              )}

            </tbody>

          </table>

        </div>

        {/* ================================
            PAGINATION
        ================================= */}

        <div className="users-pagination">

          <button
            type="button"
            className="pagination-arrow"
            onClick={() =>
              setCurrentPage(
                (prev) =>
                  Math.max(
                    1,
                    prev - 1
                  )
              )
            }
            disabled={
              currentPage === 1 ||
              loading
            }
          >
            &lt;
          </button>

          <span className="pagination-page">
            {currentPage}
          </span>

          <button
            type="button"
            className="pagination-arrow"
            onClick={() =>
              setCurrentPage(
                (prev) =>
                  Math.min(
                    totalPages,
                    prev + 1
                  )
              )
            }
            disabled={
              currentPage >=
                totalPages ||
              loading
            }
          >
            &gt;
          </button>

        </div>

      </div>

      {/* =====================================================
          VIEW USER MODAL
      ===================================================== */}

      {showViewModal && (
        <div
          className="user-modal-overlay"
          onClick={closeViewModal}
        >

          <div
            className="user-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="user-modal-header">

              <div>
                <h2>
                  User Details
                </h2>

                <p>
                  View user information
                </p>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={closeViewModal}
              >
                ×
              </button>

            </div>

            {viewLoading ? (

              <div className="modal-loading">
                Loading user...
              </div>

            ) : selectedUser ? (

              <div className="user-details">

                <div className="user-detail-row">
                  <span>
                    Full Name
                  </span>

                  <strong>
                    {selectedUser.full_name ||
                      selectedUser.name ||
                      "-"}
                  </strong>
                </div>

                <div className="user-detail-row">
                  <span>
                    Email
                  </span>

                  <strong>
                    {selectedUser.email ||
                      "-"}
                  </strong>
                </div>

                <div className="user-detail-row">
                  <span>
                    Phone
                  </span>

                  <strong>
                    {selectedUser.mobile_number ||
                      selectedUser.phone_number ||
                      selectedUser.phone ||
                      "-"}
                  </strong>
                </div>

                {/* <div className="user-detail-row">
                  <span>
                    Role
                  </span>

                  <strong>
                    {selectedUser.role?.name ||
                      selectedUser.Role?.name ||
                      selectedUser.role_name ||
                      selectedUser.role ||
                      "-"}
                  </strong>
                </div> */}

                <div className="user-detail-row">
                  <span>
                    Status
                  </span>

                  <strong>
                    {selectedUser.status ||
                      "-"}
                  </strong>
                </div>

                <div className="user-detail-row">
                  <span>
                    Created At
                  </span>

                  <strong>
                    {selectedUser.created_at
                      ? new Date(
                          selectedUser.created_at
                        ).toLocaleDateString()
                      : "-"}
                  </strong>
                </div>

              </div>

            ) : (

              <div className="modal-loading">
                User details not available.
              </div>

            )}

          </div>

        </div>
      )}

      {/* =====================================================
          EDIT USER MODAL
      ===================================================== */}

      {showEditModal && (
        <div
          className="user-modal-overlay"
          onClick={closeEditModal}
        >

          <div
            className="user-modal edit-user-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="user-modal-header">

              <div>
                <h2>
                  Edit User
                </h2>

                <p>
                  Update user information
                </p>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={closeEditModal}
              >
                ×
              </button>

            </div>

            {editLoading ? (

              <div className="modal-loading">
                Loading user...
              </div>

            ) : editUser ? (

              <form
                onSubmit={
                  handleUpdateUser
                }
                className="edit-user-form"
              >

                <div className="form-group">

                  <label>
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="full_name"
                    value={
                      editUser.full_name
                    }
                    onChange={
                      handleEditChange
                    }
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={
                      editUser.email
                    }
                    onChange={
                      handleEditChange
                    }
                  />

                </div>

                <div className="form-group">

                  <label>
                    Phone
                  </label>

                  <input
                    type="text"
                    name="mobile_number"
                    value={
                      editUser.mobile_number
                    }
                    onChange={
                      handleEditChange
                    }
                  />

                </div>

                <div className="form-group">

                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={
                      editUser.status
                    }
                    onChange={
                      handleEditChange
                    }
                  >
                    <option value="active">
                      Active
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>

                    <option value="blocked">
                      Blocked
                    </option>

                  </select>

                </div>

                <div className="edit-user-actions">

                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={
                      closeEditModal
                    }
                    disabled={
                      savingUser
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="save-user-btn"
                    disabled={
                      savingUser
                    }
                  >
                    {savingUser
                      ? "Saving..."
                      : "Save Changes"}
                  </button>

                </div>

              </form>

            ) : (

              <div className="modal-loading">
                User details not available.
              </div>

            )}

          </div>

        </div>
      )}

    </div>
  );
};

export default AdminUsers;