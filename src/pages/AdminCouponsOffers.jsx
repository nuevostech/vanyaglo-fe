
import { useCallback, useEffect, useMemo, useState } from "react";
import "./AdminCouponsOffers.css";
import { adminCouponsOffersApi } from "../api/adminCouponsOffersApi";
import { FaTrashAlt } from "react-icons/fa";
const emptyCoupon = {
  code: "",
  name: "",
  description: "",
  discountType: "Percentage",
  discountValue: "",
  minOrder: "0",
  maxDiscount: "",
  usageLimit: "",
  startDate: "",
  endDate: "",
  active: true,
};

const emptyOffer = {
  name: "",
  type: "Percentage Discount",
  discountValue: "",
  appliesTo: "All Products",
  description: "",
  startDate: "",
  endDate: "",
  active: true,
};

const offerTypeToApi = {
  "Percentage Discount": "percentage",
  "Fixed Amount": "fixed",
  "Buy X Get Y": "buy_x_get_y",
};

const offerTypeFromApi = {
  percentage: "Percentage Discount",
  fixed: "Fixed Amount",
  buy_x_get_y: "Buy X Get Y",
};

const appliesToToApi = {
  "All Products": "all_products",
  "Selected Products": "selected_products",
  "Skincare Category": "skincare_category",
  "Makeup Category": "makeup_category",
  "Haircare Category": "haircare_category",
};

const appliesToFromApi = Object.fromEntries(
  Object.entries(appliesToToApi).map(([label, value]) => [value, label])
);

function formatDate(date) {
  if (!date) return "—";

  const value = String(date).slice(0, 10);
  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function getCouponStatus(coupon) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = coupon.startDate
    ? new Date(`${coupon.startDate.slice(0, 10)}T00:00:00`)
    : null;

  const endDate = coupon.endDate
    ? new Date(`${coupon.endDate.slice(0, 10)}T00:00:00`)
    : null;

  if (endDate && today > endDate) return "Expired";
  if (!coupon.active) return "Inactive";
  if (startDate && today < startDate) return "Upcoming";

  if (
    coupon.usageLimit !== "" &&
    coupon.usageLimit != null &&
    Number(coupon.usage) >= Number(coupon.usageLimit)
  ) {
    return "Limit Reached";
  }

  return "Active";
}

function StatusBadge({ status }) {
  const className = status.toLowerCase().replace(/\s+/g, "-");

  return (
    <span className={`status-badge ${className}`}>
      {status}
    </span>
  );
}

function Pagination({ page, setPage, totalPages }) {
  return (
    <div className="pagination-row">
      <div className="pagination-buttons">
        <button
          disabled={page <= 1}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          aria-label="Previous page"
        >
          ‹
        </button>

        {Array.from({ length: totalPages }, (_, index) => index + 1).map(
          (number) => (
            <button
              key={number}
              className={page === number ? "current-page" : ""}
              onClick={() => setPage(number)}
            >
              {number}
            </button>
          )
        )}

        <button
          disabled={page >= totalPages}
          onClick={() =>
            setPage((current) => Math.min(totalPages, current + 1))
          }
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </div>
  );
}

function couponFromApi(row) {
  const type = row.discountType ?? row.discount_type;

  return {
    id: row.id,
    code: row.code ?? "",
    name: row.name ?? "",
    description: row.description ?? "",
    discountType: type === "percentage" ? "Percentage" : "Fixed Amount",
    discountValue: Number(row.discountValue ?? row.discount_value ?? 0),
    minOrder: Number(row.minOrderAmount ?? row.min_order_amount ?? 0),
    maxDiscount: "",
    usage: Number(row.usage_count ?? row.usageCount ?? 0),
    usageLimit: row.usage_limit ?? row.usageLimit ?? "",
    startDate: String(row.startDate ?? row.start_date ?? "").slice(0, 10),
    endDate: String(row.endDate ?? row.end_date ?? "").slice(0, 10),
    active: (row.status ?? "active") === "active",
  };
}

function offerFromApi(row) {
  const rawType = row.offerType ?? row.offer_type ?? "percentage";

  const standardTypes = {
    percentage: "Percentage Discount",
    fixed: "Fixed Amount",
    buy_x_get_y: "Buy X Get Y",
  };

  const type =
    standardTypes[rawType] ??
    rawType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const rawAppliesTo = row.appliesTo ?? row.applies_to ?? "all_products";
  const value = row.discountValue ?? row.discount_value ?? "";

  let discount = "";

  if (rawType === "buy_x_get_y" || !standardTypes[rawType]) {
    discount = row.description || type;
  } else if (rawType === "fixed") {
    discount = `${money(value)} Off`;
  } else {
    discount = `${value}%`;
  }

  return {
    id: row.id,
    name: row.name ?? "",
    type,
    discountValue: value == null ? "" : String(value),
    discount,
    appliesTo: appliesToFromApi[rawAppliesTo] ?? rawAppliesTo,
    description: row.description ?? "",
    startDate: String(row.startDate ?? row.start_date ?? "").slice(0, 10),
    endDate: String(row.endDate ?? row.end_date ?? "").slice(0, 10),
    active: (row.status ?? "active") === "active",
  };
}

function couponPayload(form) {
  return {
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    description: form.description.trim(),
    discountType:
      form.discountType === "Percentage" ? "percentage" : "fixed",
    discountValue: Number(form.discountValue),
    minOrderAmount: Number(form.minOrder || 0),
    usageLimit:
      form.usageLimit === "" || form.usageLimit == null
        ? null
        : Number(form.usageLimit),
    startDate: form.startDate,
    endDate: form.endDate,
    status: form.active ? "active" : "inactive",
  };
}

function offerPayload(form) {
  const standardTypes = {
    "Percentage Discount": "percentage",
    "Fixed Amount": "fixed",
  };

  const isStandard = Object.prototype.hasOwnProperty.call(
    standardTypes,
    form.type
  );

  const offerType = isStandard
    ? standardTypes[form.type]
    : form.type
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 100);

  return {
    name: form.name.trim(),
    description: form.description.trim(),
    offerType,
    discountValue: isStandard
      ? Number(form.discountValue)
      : null,
    appliesTo: appliesToToApi[form.appliesTo] || "all_products",
    startDate: form.startDate,
    endDate: form.endDate,
    status: form.active ? "active" : "inactive",
  };
}

export default function AdminCouponsOffers() {
  const [tab, setTab] = useState("coupons");

  const [coupons, setCoupons] = useState([]);
  const [offers, setOffers] = useState([]);

  const [couponSearch, setCouponSearch] = useState("");
  const [couponStatus, setCouponStatus] = useState("all");
  const [couponType, setCouponType] = useState("all");

  const [offerSearch, setOfferSearch] = useState("");
  const [offerStatus, setOfferStatus] = useState("all");
  const [offerType, setOfferType] = useState("all");

  const [couponPage, setCouponPage] = useState(1);
  const [offerPage, setOfferPage] = useState(1);

  const [modal, setModal] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [couponForm, setCouponForm] = useState({ ...emptyCoupon });
  const [offerForm, setOfferForm] = useState({ ...emptyOffer });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const pageSize = 5;
  
const loadCoupons = useCallback(async (params = {}) => {
  console.log("COUPONS: loadCoupons started");
  console.log("COUPONS: request params:", params);

  setLoading(true);
  setError("");

  try {
    console.log("COUPONS: calling adminCouponsOffersApi.getCoupons()");

    const rows = await adminCouponsOffersApi.getCoupons(params);

    console.log("COUPONS: API response:", rows);

    const normalizedCoupons = rows.map(couponFromApi);

    setCoupons(normalizedCoupons);

    console.log(
      "COUPONS: coupons loaded successfully:",
      normalizedCoupons.length
    );
  } catch (err) {
    console.error("COUPONS: API request failed:", err);

    setError(err.message || "Failed to load coupons.");
    setCoupons([]);
  } finally {
    setLoading(false);
    console.log("COUPONS: loading finished");
  }
}, []);

const loadOffers = useCallback(async (params = {}) => {
  setLoading(true);
  setError("");

  try {
    const rows = await adminCouponsOffersApi.getOffers(params);
    setOffers(rows.map(offerFromApi));
  } catch (err) {
    setError(err.message || "Failed to load offers.");
  } finally {
    setLoading(false);
  }
}, []);

useEffect(() => {
  const timer = setTimeout(() => {
    if (tab === "coupons") {
      const search = couponSearch.trim();

      // Search the server only after 3 characters.
      // An empty search reloads all coupons.
      if (search.length > 0 && search.length < 3) {
        return;
      }

      loadCoupons({
        page: 1,
        limit: 100,
        ...(search.length >= 3 ? { search } : {}),
        ...(couponStatus !== "all" ? { status: couponStatus } : {}),
        ...(couponType !== "all"
          ? {
              discountType:
                couponType === "Percentage" ? "percentage" : "fixed",
            }
          : {}),
      });
    } else {
      const search = offerSearch.trim();

      if (search.length > 0 && search.length < 3) {
        return;
      }

      loadOffers({
        page: 1,
        limit: 100,
        ...(search.length >= 3 ? { search } : {}),
        ...(offerStatus !== "all" ? { status: offerStatus } : {}),
        ...(offerType !== "all"
          ? {
              offerType:
                offerType === "Percentage Discount"
                  ? "percentage"
                  : offerType === "Fixed Amount"
                    ? "fixed"
                    : "buy_x_get_y",
            }
          : {}),
      });
    }
  }, 350);

  return () => clearTimeout(timer);
}, [
  tab,
  couponSearch,
  couponStatus,
  couponType,
  offerSearch,
  offerStatus,
  offerType,
  loadCoupons,
  loadOffers,
]);

  // Load both coupons and offers when the page opens.
// This keeps all four summary cards accurate on either tab.
useEffect(() => {
  loadCoupons();
  loadOffers();
}, [loadCoupons, loadOffers]);

  const filteredCoupons = useMemo(() => {
    const query = couponSearch.trim().toLowerCase();

    return coupons.filter((coupon) => {
      const matchesSearch =
        !query ||
        [coupon.code, coupon.name, coupon.description].some((value) =>
          String(value || "").toLowerCase().includes(query)
        );

      const status = getCouponStatus(coupon);

const matchesStatus =
  couponStatus === "all" ||
  (couponStatus === "active" && status === "Active") ||
  (couponStatus === "inactive" && status === "Inactive");

      const matchesType =
        couponType === "all" || coupon.discountType === couponType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [coupons, couponSearch, couponStatus, couponType]);

  const filteredOffers = useMemo(() => {
    const query = offerSearch.trim().toLowerCase();

    return offers.filter((offer) => {
      const matchesSearch =
        !query ||
        [offer.name, offer.type, offer.appliesTo, offer.description].some(
          (value) => String(value || "").toLowerCase().includes(query)
        );

      const matchesStatus =
        offerStatus === "all" ||
        (offerStatus === "active" && offer.active) ||
        (offerStatus === "inactive" && !offer.active);

      const matchesType = offerType === "all" || offer.type === offerType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [offers, offerSearch, offerStatus, offerType]);

  const couponPages = Math.max(
    1,
    Math.ceil(filteredCoupons.length / pageSize)
  );
  const offerPages = Math.max(1, Math.ceil(filteredOffers.length / pageSize));

  const safeCouponPage = Math.min(couponPage, couponPages);
  const safeOfferPage = Math.min(offerPage, offerPages);

  const visibleCoupons = filteredCoupons.slice(
    (safeCouponPage - 1) * pageSize,
    safeCouponPage * pageSize
  );

  const visibleOffers = filteredOffers.slice(
    (safeOfferPage - 1) * pageSize,
    safeOfferPage * pageSize
  );

  function openCouponForm(coupon = null) {
    setError("");
    setNotice("");
    setEditingId(coupon?.id ?? null);
    setCouponForm(coupon ? { ...coupon } : { ...emptyCoupon });
    setModal("coupon");
  }

  function openOfferForm(offer = null) {
    setError("");
    setNotice("");
    setEditingId(offer?.id ?? null);
    setOfferForm(offer ? { ...offer } : { ...emptyOffer });
    setModal("offer");
  }

  async function saveCoupon(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = couponPayload(couponForm);

      if (editingId) {
  await adminCouponsOffersApi.updateCoupon(editingId, payload);
} else {
  await adminCouponsOffersApi.createCoupon(payload);
}
      setModal(null);
      setEditingId(null);
      setCouponForm({ ...emptyCoupon });
      setCouponPage(1);
      await loadCoupons();
    } catch (err) {
      setError(err.message || "Failed to save coupon.");
    } finally {
      setSaving(false);
    }
  }

  async function saveOffer(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = offerPayload(offerForm);

      if (editingId) {
        await adminCouponsOffersApi.updateOffer(editingId, payload);
      } else {
        await adminCouponsOffersApi.createOffer(payload);
      }

      setModal(null);
      setEditingId(null);
      setOfferForm({ ...emptyOffer });
      setOfferPage(1);
      await loadOffers();
    } catch (err) {
      setError(err.message || "Failed to save offer.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCoupon(id) {
    if (!window.confirm("Are you sure you want to delete this coupon?")) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await adminCouponsOffersApi.deleteCoupon(id);
      setNotice("Coupon deleted successfully.");
      await loadCoupons();
    } catch (err) {
      setError(err.message || "Failed to delete coupon.");
    }
  }

  async function deleteOffer(id) {
    if (!window.confirm("Are you sure you want to delete this offer?")) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await adminCouponsOffersApi.deleteOffer(id);
      setNotice("Offer deleted successfully.");
      await loadOffers();
    } catch (err) {
      setError(err.message || "Failed to delete offer.");
    }
  }

  async function toggleCoupon(coupon) {
    setError("");
    setNotice("");

    try {
      await adminCouponsOffersApi.updateCouponStatus(
        coupon.id,
        !coupon.active
      );
      setNotice("Coupon status updated.");
      await loadCoupons();
    } catch (err) {
      setError(err.message || "Failed to update coupon status.");
    }
  }

  async function toggleOffer(offer) {
    setError("");
    setNotice("");

    try {
      await adminCouponsOffersApi.updateOfferStatus(offer.id, !offer.active);
      setNotice("Offer status updated.");
      await loadOffers();
    } catch (err) {
      setError(err.message || "Failed to update offer status.");
    }
  }

  const activeCoupons = coupons.filter(
  (item) => getCouponStatus(item) === "Active"
).length;
  const activeOffers = offers.filter((item) => item.active).length;

  return (
    <div className="coupons-page">
      <header className="coupons-page-header">
        <div>
          <h1>Coupons &amp; Offers</h1>
          <p>
            Manage discount coupons and promotional offers for your customers.
          </p>
        </div>
        <span className="breadcrumb">Home / Coupons &amp; Offers</span>
      </header>

      {error && (
        <div className="api-message error-message" role="alert">
          {error}
          <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}

      {notice && (
        <div className="api-message success-message" role="status">
          {notice}
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss message">
            ×
          </button>
        </div>
      )}

      <section className="summary-grid">
        <div className="summary-card">
          <div className="summary-icon pink-icon">🎁</div>
          <div>
            <h2>{coupons.length}</h2>
            <p>Total Coupons</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon green-icon">✓</div>
          <div>
            <h2>{activeCoupons}</h2>
            <p>Active Coupons</p>
          </div>
        </div>

        {/* <div className="summary-card">
          <div className="summary-icon pink-icon">%</div>
          <div>
            <h2>{offers.length}</h2>
            <p>Total Offers</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon orange-icon">◷</div>
          <div>
            <h2>{activeOffers}</h2>
            <p>Active Offers</p>
          </div>
        </div> */}
      </section>

      <div className="coupons-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "coupons"}
          className={tab === "coupons" ? "selected" : ""}
          onClick={() => setTab("coupons")}
        >
          <span>🎁</span> Coupons
        </button>

        {/* <button
          type="button"
          role="tab"
          aria-selected={tab === "offers"}
          className={tab === "offers" ? "selected" : ""}
          onClick={() => setTab("offers")}
        >
          <span>%</span> Offers
        </button> */}
      </div>

      {tab === "coupons" ? (
        <section className="management-section">
          <div className="section-heading">
            <div>
              <h2>Coupons Management</h2>
              <p>Create and manage discount codes for your customers.</p>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={() => openCouponForm()}
            >
              + Add New Coupon
            </button>
          </div>

          <div className="filter-row">
            <input
              aria-label="Search coupons"
              placeholder="⌕  Search by coupon code, name or description..."
              value={couponSearch}
              onChange={(event) => {
  setCouponSearch(event.target.value);
  setCouponPage(1);
}}
            />

            <select
              aria-label="Filter coupon status"
              value={couponStatus}
              onChange={(event) => {
                setCouponStatus(event.target.value);
                setCouponPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              aria-label="Filter coupon type"
              value={couponType}
              onChange={(event) => {
                setCouponType(event.target.value);
                setCouponPage(1);
              }}
            >
              <option value="all">All Discount Types</option>
              <option value="Percentage">Percentage</option>
              <option value="Fixed Amount">Fixed Amount</option>
            </select>

            <button
              type="button"
              className="outline-button clear-button"
              onClick={() => {
                setCouponSearch("");
                setCouponStatus("all");
                setCouponType("all");
                setCouponPage(1);
              }}
            >
              Clear
            </button>
          </div>

          <div className="table-container">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Coupon Code</th>
                  <th>Name</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Usage</th>
                  <th>Validity</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {visibleCoupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td className="code-cell">{coupon.code}</td>
                    <td>
                      <strong>{coupon.name}</strong>
                      <small>{coupon.description}</small>
                    </td>
                    <td>
                      <span className="discount-badge">
                        {coupon.discountType === "Percentage"
                          ? `${coupon.discountValue}%`
                          : money(coupon.discountValue)}
                      </span>
                    </td>
                    <td>{money(coupon.minOrder)}</td>
                    <td>
                      <div className="usage-text">
                        {coupon.usage} / {coupon.usageLimit || "Unlimited"}
                      </div>
                      <div className="usage-track">
                        <div
                          className="usage-fill"
                          style={{
                            width: `${
                              coupon.usageLimit
                                ? Math.min(
                                    100,
                                    (coupon.usage / Number(coupon.usageLimit)) * 100
                                  )
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      {formatDate(coupon.startDate)}
                      <small>to {formatDate(coupon.endDate)}</small>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="status-action"
                        onClick={() => toggleCoupon(coupon)}
                        title="Click to toggle status"
                        disabled={loading || getCouponStatus(coupon) !== "Active"}
                      >
                        <StatusBadge status={getCouponStatus(coupon)} />
                      </button>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="icon-button"
                          title="Edit coupon"
                          onClick={() => openCouponForm(coupon)}
                        >
                          ✎
                        </button>
                        
<button
  type="button"
  className="icon-button delete-button"
  title="Delete coupon"
  onClick={() => deleteCoupon(coupon.id)}
>
  <FaTrashAlt />
</button>

                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && visibleCoupons.length === 0 && (
                  <tr>
                    <td colSpan="8" className="empty-row">
                      No coupons found.
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td colSpan="8" className="empty-row">
                      Loading coupons...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={safeCouponPage}
            setPage={setCouponPage}
            totalPages={couponPages}
          />
        </section>
      ) : (
        <section className="management-section">
          <div className="section-heading">
            <div>
              <h2>Offers Management</h2>
              <p>Manage seasonal deals, product discounts and campaigns.</p>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={() => openOfferForm()}
            >
              + Add New Offer
            </button>
          </div>

          <div className="filter-row">
            <input
              aria-label="Search offers"
              placeholder="⌕  Search by offer name or description..."
              value={offerSearch}
              onChange={(event) => {
  setOfferSearch(event.target.value);
  setOfferPage(1);
}}
            />

            <select
              aria-label="Filter offer status"
              value={offerStatus}
              onChange={(event) => {
                setOfferStatus(event.target.value);
                setOfferPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              aria-label="Filter offer type"
              value={offerType}
              onChange={(event) => {
                setOfferType(event.target.value);
                setOfferPage(1);
              }}
            >
              <option value="all">All Offer Types</option>
              <option value="Percentage Discount">Percentage Discount</option>
              <option value="Fixed Amount">Fixed Amount</option>
              <option value="Buy X Get Y">Buy X Get Y</option>
            </select>

            <button
              type="button"
              className="outline-button clear-button"
              onClick={() => {
                setOfferSearch("");
                setOfferStatus("all");
                setOfferType("all");
                setOfferPage(1);
              }}
            >
              Clear
            </button>
          </div>

          <div className="table-container">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Offer Name</th>
                  <th>Offer Type</th>
                  <th>Discount</th>
                  <th>Applies To</th>
                  <th>Validity</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {visibleOffers.map((offer) => (
                  <tr key={offer.id}>
                    <td className="code-cell">{offer.name}</td>
                    <td>{offer.type}</td>
                    <td>
                      <span className="discount-badge">{offer.discount}</span>
                    </td>
                    <td>{offer.appliesTo}</td>
                    <td>
                      {formatDate(offer.startDate)}
                      <small>to {formatDate(offer.endDate)}</small>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="status-action"
                        onClick={() => toggleOffer(offer)}
                        title="Click to toggle status"
                        disabled={loading}
                      >
                        <StatusBadge active={offer.active} />
                      </button>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="icon-button"
                          title="Edit offer"
                          onClick={() => openOfferForm(offer)}
                        >
                          ✎
                        </button>
                        
<button
  type="button"
  className="icon-button delete-button"
  title="Delete offer"
  onClick={() => deleteOffer(offer.id)}
>
  <FaTrashAlt />
</button>

                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && visibleOffers.length === 0 && (
                  <tr>
                    <td colSpan="7" className="empty-row">
                      No offers found.
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td colSpan="7" className="empty-row">
                      Loading offers...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={safeOfferPage}
            setPage={setOfferPage}
            totalPages={offerPages}
          />
        </section>
      )}

      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setModal(null);
            }
          }}
        >
          <div
            className="coupon-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="coupon-modal-title"
          >
            <div className="modal-heading">
              <div>
                <h2 id="coupon-modal-title">
                  {editingId ? "Edit" : "Add New"}{" "}
                  {modal === "coupon" ? "Coupon" : "Offer"}
                </h2>
                <p>Enter the details below.</p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => !saving && setModal(null)}
                aria-label="Close form"
                disabled={saving}
              >
                ×
              </button>
            </div>

            {modal === "coupon" ? (
              <form onSubmit={saveCoupon}>
                <div className="form-grid">
                  <label>
                    Coupon Code *
                    <input
                      required
                      maxLength={50}
                      value={couponForm.code}
                      onChange={(event) =>
                        setCouponForm({
                          ...couponForm,
                          code: event.target.value.toUpperCase(),
                        })
                      }
                      placeholder="e.g. VANYA10"
                    />
                  </label>

                  <label>
                    Coupon Name *
                    <input
                      required
                      maxLength={150}
                      value={couponForm.name}
                      onChange={(event) =>
                        setCouponForm({
                          ...couponForm,
                          name: event.target.value,
                        })
                      }
                      placeholder="e.g. Flat 10% Off"
                    />
                  </label>

                  <label className="full-width">
                    Description
                    <input
                      value={couponForm.description}
                      onChange={(event) =>
                        setCouponForm({
                          ...couponForm,
                          description: event.target.value,
                        })
                      }
                      placeholder="Describe the coupon"
                    />
                  </label>

                  <label>
                    Discount Type *
                    <select
                      value={couponForm.discountType}
                      onChange={(event) =>
                        setCouponForm({
                          ...couponForm,
                          discountType: event.target.value,
                        })
                      }
                    >
                      <option>Percentage</option>
                      <option>Fixed Amount</option>
                    </select>
                  </label>

                  <label>
                    Discount Value *
                    <input
                      required
                      type="number"
                      min="0.01"
                      max={
                        couponForm.discountType === "Percentage"
                          ? "100"
                          : undefined
                      }
                      step="0.01"
                      value={couponForm.discountValue}
                      onChange={(event) =>
                        setCouponForm({
                          ...couponForm,
                          discountValue: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Minimum Order (₹) *
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={couponForm.minOrder}
                      onChange={(event) =>
                        setCouponForm({
                          ...couponForm,
                          minOrder: event.target.value,
                        })
                      }
                    />
                  </label>

                  {/* <label>
                    Maximum Discount (₹)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={couponForm.maxDiscount}
                      onChange={(event) =>
                        setCouponForm({
                          ...couponForm,
                          maxDiscount: event.target.value,
                        })
                      }
                      disabled
                      title="Maximum discount is not stored by the current coupon API."
                    />
                    <small>Not supported by the current backend model.</small>
                  </label> */}

                  <label className="full-width">
                    Usage Limit
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={couponForm.usageLimit}
                      onChange={(event) =>
                        setCouponForm({
                          ...couponForm,
                          usageLimit: event.target.value,
                        })
                      }
                      placeholder="Leave empty for unlimited"
                    />
                  </label>

                  <label>
                    Start Date *
                    <input
                      required
                      type="date"
                      value={couponForm.startDate}
                      onChange={(event) =>
                        setCouponForm({
                          ...couponForm,
                          startDate: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    End Date *
                    <input
                      required
                      type="date"
                      min={couponForm.startDate || undefined}
                      value={couponForm.endDate}
                      onChange={(event) =>
                        setCouponForm({
                          ...couponForm,
                          endDate: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>

                <label className="active-toggle">
                  <input
                    type="checkbox"
                    checked={couponForm.active}
                    onChange={(event) =>
                      setCouponForm({
                        ...couponForm,
                        active: event.target.checked,
                      })
                    }
                  />
                  Active
                </label>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="outline-button"
                    onClick={() => setModal(null)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    className="primary-button"
                    type="submit"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Save Changes"
                        : "Create Coupon"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={saveOffer}>
                <div className="form-grid">
                  <label className="full-width">
                    Offer Name *
                    <input
                      required
                      maxLength={150}
                      value={offerForm.name}
                      onChange={(event) =>
                        setOfferForm({
                          ...offerForm,
                          name: event.target.value,
                        })
                      }
                      placeholder="e.g. Diwali Sale"
                    />
                  </label>

                  
<label>
  Offer Type *
  <select
    value={
      ["Percentage Discount", "Fixed Amount"].includes(offerForm.type)
        ? offerForm.type
        : offerForm.type
          ? "Custom"
          : ""
    }
    onChange={(event) =>
      setOfferForm({
        ...offerForm,
        type: event.target.value === "Custom" ? "" : event.target.value,
        discountValue: "",
      })
    }
  >
    <option value="">Select Offer Type</option>
    <option value="Percentage Discount">Percentage Discount</option>
    <option value="Fixed Amount">Fixed Amount</option>
    <option value="Custom">Custom Offer Type</option>
  </select>
</label>

<label>
  Custom Offer Type
  <input
    type="text"
    value={
      ["Percentage Discount", "Fixed Amount"].includes(offerForm.type)
        ? ""
        : offerForm.type
    }
    onChange={(event) =>
      setOfferForm({
        ...offerForm,
        type: event.target.value,
        discountValue: "",
      })
    }
    placeholder="e.g. Buy 2 Get 1 Free"
  />
</label>

<label>
  {["Percentage Discount", "Fixed Amount"].includes(offerForm.type)
    ? "Discount Value *"
    : "Offer Details *"}
  <input
    required
    value={offerForm.discountValue}
    type={
      ["Percentage Discount", "Fixed Amount"].includes(offerForm.type)
        ? "number"
        : "text"
    }
    min={
      ["Percentage Discount", "Fixed Amount"].includes(offerForm.type)
        ? "0.01"
        : undefined
    }
    max={
      offerForm.type === "Percentage Discount" ? "100" : undefined
    }
    step="0.01"
    onChange={(event) =>
      setOfferForm({
        ...offerForm,
        discountValue: event.target.value,
      })
    }
    placeholder={
      ["Percentage Discount", "Fixed Amount"].includes(offerForm.type)
        ? "Enter discount value"
        : "e.g. Buy 2 Get 1 Free"
    }
  />
</label>


                  <label className="full-width">
                    Applies To *
                    <select
                      value={offerForm.appliesTo}
                      onChange={(event) =>
                        setOfferForm({
                          ...offerForm,
                          appliesTo: event.target.value,
                        })
                      }
                    >
                      <option>All Products</option>
                      <option>Selected Products</option>
                      <option>Skincare Category</option>
                      <option>Makeup Category</option>
                      <option>Haircare Category</option>
                    </select>
                  </label>

                  <label className="full-width">
                    Description
                    <input
                      value={offerForm.description}
                      onChange={(event) =>
                        setOfferForm({
                          ...offerForm,
                          description: event.target.value,
                        })
                      }
                      placeholder="Describe this offer"
                    />
                  </label>

                  <label>
                    Start Date *
                    <input
                      required
                      type="date"
                      value={offerForm.startDate}
                      onChange={(event) =>
                        setOfferForm({
                          ...offerForm,
                          startDate: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    End Date *
                    <input
                      required
                      type="date"
                      min={offerForm.startDate || undefined}
                      value={offerForm.endDate}
                      onChange={(event) =>
                        setOfferForm({
                          ...offerForm,
                          endDate: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>

                <label className="active-toggle">
                  <input
                    type="checkbox"
                    checked={offerForm.active}
                    onChange={(event) =>
                      setOfferForm({
                        ...offerForm,
                        active: event.target.checked,
                      })
                    }
                  />
                  Active
                </label>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="outline-button"
                    onClick={() => setModal(null)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    className="primary-button"
                    type="submit"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Save Changes"
                        : "Create Offer"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
