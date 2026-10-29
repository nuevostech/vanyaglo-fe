
// src/api/adminOrdersApi.js

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

const API_PREFIX = "/api";

const getAuthHeaders = () => {
  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  if (!token) {
    throw new Error(
      "Admin access token not found. Please log in again."
    );
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

const request = async (url, options = {}) => {
  const response = await fetch(
    `${API_BASE_URL}${API_PREFIX}${url}`,
    {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    }
  );

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message || "Request failed"
    );
  }

  return result;
};

export const getAllOrders = async ({
  search = "",
  status = "all",
} = {}) => {
  const params = new URLSearchParams();
  const query = search.trim();

  if (query.length >= 3) {
    params.set("search", query);
  }

  if (status && status !== "all") {
    params.set("status", status);
  }

  const queryString = params.toString();

  const endpoint = queryString
    ? `/orders/admin/all?${queryString}`
    : "/orders/admin/all";

  const result = await request(endpoint);

  return result.data?.orders ?? [];
};

export const updateOrderStatus = async (
  orderId,
  payload
) => {
  return request(
    `/orders/admin/${encodeURIComponent(orderId)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
};
