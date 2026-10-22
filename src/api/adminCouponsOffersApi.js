
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
)
  .replace(/\/+$/, "")
  .replace(/\/api$/, "") + "/api";

// ============================================================
// AUTH TOKEN
// ============================================================

function getAuthToken() {
  return (
    localStorage.getItem("accessToken") ||
    localStorage.getItem("adminToken") ||
    localStorage.getItem("token") ||
    ""
  );
}

// ============================================================
// COMMON API REQUEST
// ============================================================

async function request(endpoint, options = {}) {
  const token = getAuthToken();

  const { headers: customHeaders = {}, ...fetchOptions } = options;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...customHeaders,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message || `Request failed (${response.status})`
    );
  }

  return result;
}

// ============================================================
// RESPONSE HELPERS
// ============================================================

function getList(result, key) {
  const data = result.data ?? result;

  if (Array.isArray(data)) {
    return data;
  }

  return (
    data[key] ||
    data.rows ||
    data.items ||
    data.results ||
    []
  );
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      value !== "all"
    ) {
      query.set(key, String(value));
    }
  });

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

// ============================================================
// COUPONS & OFFERS API
// ============================================================

export const adminCouponsOffersApi = {
  // ----------------------------------------------------------
  // COUPONS
  // ----------------------------------------------------------

  getCoupons: (params = {}, options = {}) =>
    request(
      `/admin/coupons${buildQuery(params)}`,
      { signal: options.signal }
    ).then((result) => getList(result, "coupons")),

  getCouponStats: () =>
    request("/admin/coupons/stats").then(
      (result) => result.data ?? result
    ),

  getCouponById: (id) =>
    request(`/admin/coupons/${id}`).then(
      (result) => result.data ?? result
    ),

  createCoupon: (data) =>
    request("/admin/coupons", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateCoupon: (id, data) =>
    request(`/admin/coupons/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  updateCouponStatus: (id, status) =>
    request(`/admin/coupons/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status:
          typeof status === "boolean"
            ? status
              ? "active"
              : "inactive"
            : status,
      }),
    }),

  deleteCoupon: (id) =>
    request(`/admin/coupons/${id}`, {
      method: "DELETE",
    }),

  // ----------------------------------------------------------
  // OFFERS
  // ----------------------------------------------------------

  getOffers: (params = {}, options = {}) =>
    request(
      `/admin/offers${buildQuery(params)}`,
      { signal: options.signal }
    ).then((result) => getList(result, "offers")),

  getOfferStats: () =>
    request("/admin/offers/stats").then(
      (result) => result.data ?? result
    ),

  getOfferById: (id) =>
    request(`/admin/offers/${id}`).then(
      (result) => result.data ?? result
    ),

  createOffer: (data) =>
    request("/admin/offers", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateOffer: (id, data) =>
    request(`/admin/offers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  updateOfferStatus: (id, status) =>
    request(`/admin/offers/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status:
          typeof status === "boolean"
            ? status
              ? "active"
              : "inactive"
            : status,
      }),
    }),

  deleteOffer: (id) =>
    request(`/admin/offers/${id}`, {
      method: "DELETE",
    }),
};
