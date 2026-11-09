
import { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  getAllOrders,
  refundOrder as refundOrderRequest,
  updateOrderStatus,
} from "../api/adminOrdersApi";
import "./AdminOrders.css";

const STATUS_OPTIONS = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const PAGE_SIZE = 5;

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizeStatus = (value) =>
  String(value || "").trim().toLowerCase();

const titleCase = (value = "") =>
  String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getCustomerName = (order) =>
  order.customer_name ||
  order.user_name ||
  order.customerName ||
  order.user?.name ||
  order.customer?.name ||
  "Guest";

const getProductName = (item) =>
  item.product_name ||
  item.product?.name ||
  item.name ||
  "Product";

const getRefundDestination = (order) => {
  const request =
    order.refund_request ||
    order.refundRequest ||
    order.cancellation_request ||
    order.cancellationRequest ||
    {};

  const destination = normalizeStatus(
    order.refund_method ||
      order.refund_destination ||
      order.customer_selected_destination ||
      order.refund_preference ||
      order.refund_option ||
      order.refundMethod ||
      order.refundOption ||
      request.refund_method ||
      request.refund_destination ||
      request.refund_preference ||
      request.refund_option ||
      request.refundMethod ||
      request.refundOption ||
      request.destination
  ).replace(/[\s-]+/g, "_");

  if (
    ["wallet", "vanyaglo_wallet", "e_wallet", "ewallet"].includes(
      destination
    )
  ) {
    return {
      value: "wallet",
      label: "VanyaGlo Wallet",
    };
  }

  if (
    [
      "original",
      "original_payment",
      "original_payment_method",
      "payment_method",
    ].includes(destination)
  ) {
    return {
      value: "original",
      label: "Original Payment Method",
    };
  }

  return null;
};

const getCancellationReason = (order) =>
  order.cancellation_request?.reason ||
  order.cancellation_request?.cancellation_reason ||
  order.cancellationRequest?.reason ||
  order.refund_request?.cancellation_reason ||
  order.cancellation_reason ||
  order.cancel_reason ||
  order.cancellationReason ||
  "";

const getRefundAmount = (order) =>
  order.refund_amount ??
  order.refundAmount ??
  order.refund_request?.refund_amount ??
  order.refundRequest?.refundAmount ??
  order.cancellation_request?.refund_amount ??
  order.total_amount;

const getRefundReason = (order) =>
  order.refund_reason ||
  order.refundReason ||
  order.refund_request?.reason ||
  order.refund_request?.refund_reason ||
  "";

const getRefundStatus = (order) =>
  order.refund_status ||
  order.refundStatus ||
  order.refund_request?.status ||
  order.cancellation_request?.refund_status ||
  order.cancellation_request?.status ||
  order.refundRequest?.status ||
  "";

const getRefundRequestedAt = (order) =>
  order.refund_requested_at ||
  order.refundRequestedAt ||
  order.refund_request?.requested_at ||
  order.refund_request?.created_at ||
  order.cancellation_request?.requested_at ||
  order.cancellation_request?.created_at ||
  "";

const isRefundInProgressOrComplete = (order) =>
  ["processing", "processed", "completed", "refunded", "success"].includes(
    normalizeStatus(getRefundStatus(order)).replace(/[\s-]+/g, "_")
  );

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refundOrder, setRefundOrder] = useState(null);
  const [refundReason, setRefundReason] = useState("");
  const [notice, setNotice] = useState("");

  const [tracking, setTracking] = useState({
    courier_name: "",
    tracking_number: "",
    tracking_url: "",
    estimated_delivery: "",
  });

  // Call the search API after the user enters at least 3 characters.
  // Wait 400 ms after typing to avoid unnecessary requests.
  useEffect(() => {
    const query = search.trim();

    if (query.length < 3) {
      setDebouncedSearch("");
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedSearch(query);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch orders from the existing backend API.
  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {};

      if (debouncedSearch.length >= 3) {
        params.search = debouncedSearch;
      }

      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      const data = await getAllOrders(params);

      setOrders(Array.isArray(data) ? data : []);
      setCurrentPage(1);
    } catch (err) {
      setError(err.message || "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Calculate status cards from the orders returned by the API.
  const stats = useMemo(() => {
    const normalizedOrders = orders;

    return {
      total: normalizedOrders.length,

      pending: normalizedOrders.filter(
        (order) => normalizeStatus(order.status) === "pending"
      ).length,

      cancelled: normalizedOrders.filter(
        (order) => normalizeStatus(order.status) === "cancelled"
      ).length,

      processing: normalizedOrders.filter((order) =>
        ["confirmed", "processing"].includes(
          normalizeStatus(order.status)
        )
      ).length,

      delivered: normalizedOrders.filter(
        (order) => normalizeStatus(order.status) === "delivered"
      ).length,
    };
  }, [orders]);

  // Apply search and status filters to the loaded orders.
  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const orderStatus = normalizeStatus(order.status);

      const matchesStatus =
        statusFilter === "all" || orderStatus === statusFilter;

      const productNames = (order.items || [])
        .map((item) => String(getProductName(item)).toLowerCase())
        .join(" ");

      const matchesSearch =
        !query ||
        String(order.order_id || "").toLowerCase().includes(query) ||
        String(order.user_id || "").toLowerCase().includes(query) ||
        String(getCustomerName(order)).toLowerCase().includes(query) ||
        productNames.includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / PAGE_SIZE)
  );

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;

    return filteredOrders.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredOrders, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setNotice("");
    setError("");
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
  };

  const openRefundDetails = (order) => {
    setRefundOrder(order);
    setRefundReason(getCancellationReason(order));
    setError("");
  };

  const closeRefundDetails = () => {
    setRefundOrder(null);
    setRefundReason("");
  };

  const processRefund = async (event) => {
    event.preventDefault();

    if (
      !refundOrder ||
      !refundReason.trim() ||
      isRefundInProgressOrComplete(refundOrder)
    ) return;

    const refundDestination = getRefundDestination(refundOrder);

    if (!refundDestination) {
      setError(
        "This order has no customer-selected refund destination. Refresh the order details before processing."
      );
      return;
    }

    if (refundDestination.value === "wallet") {
      setError(
        "Wallet refunds are not supported by the configured refund endpoint."
      );
      return;
    }

    const confirmed = window.confirm(
      `Process a refund of ${formatCurrency(getRefundAmount(refundOrder))} to ${refundDestination.label} for order ${refundOrder.order_id}?`
    );

    if (!confirmed) return;

    const orderId = refundOrder.order_id;
    setSavingId(orderId);
    setError("");
    setNotice("");

    try {
      const result = await refundOrderRequest({
        order_id: orderId,
        amount: Number(getRefundAmount(refundOrder)),
        reason: refundReason.trim(),
      });
      closeRefundDetails();
      setNotice(result.message || "Refund request submitted successfully.");
      await loadOrders();
    } catch (err) {
      setError(err.message || "Failed to process refund.");
    } finally {
      setSavingId(null);
    }
  };

  const openTracking = (order) => {
    setSelectedOrder(order);

    setTracking({
      courier_name: order.courier_name || "",
      tracking_number: order.tracking_number || "",
      tracking_url: order.tracking_url || "",
      estimated_delivery: order.estimated_delivery
        ? String(order.estimated_delivery).slice(0, 10)
        : "",
    });

    setNotice("");
    setError("");
  };

  // Update the order using the existing backend API.
  const changeStatus = async (order, status, extra = {}) => {
    const confirmed = window.confirm(
      `Change order status to "${titleCase(status)}"?`
    );

    if (!confirmed) return;

    setSavingId(order.order_id);
    setError("");
    setNotice("");

    try {
      await updateOrderStatus(order.order_id, {
        status,
        ...extra,
      });

      setNotice(
        `Order updated to ${titleCase(status)} successfully.`
      );

      setSelectedOrder(null);

      await loadOrders();
    } catch (err) {
      setError(err.message || "Failed to update order.");
    } finally {
      setSavingId(null);
    }
  };

  const saveTracking = async (event) => {
    event.preventDefault();

    if (!selectedOrder) return;

    if (
      !tracking.courier_name.trim() ||
      !tracking.tracking_number.trim()
    ) {
      setError("Enter the courier name and tracking number.");
      return;
    }

    if (tracking.tracking_url.trim()) {
      try {
        const url = new URL(tracking.tracking_url.trim());

        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error("Invalid protocol");
        }
      } catch {
        setError(
          "Enter a valid tracking URL beginning with http:// or https://."
        );
        return;
      }
    }

    await changeStatus(selectedOrder, "shipped", {
      ...tracking,
      courier_name: tracking.courier_name.trim(),
      tracking_number: tracking.tracking_number.trim(),
      tracking_url: tracking.tracking_url.trim() || null,
      estimated_delivery: tracking.estimated_delivery || null,
    });
  };
  
  // Export filtered orders to Excel
  const handleExportExcel = () => {
    if (filteredOrders.length === 0) {
      window.alert("No orders available to export.");
      return;
    }

    const exportData = filteredOrders.map((order) => ({
      "Order ID": order.order_id || "",
      "Customer Name": getCustomerName(order),
      "Customer ID": order.user_id || "Guest",
      "Order Date": formatDate(order.created_at),
      "Items": (order.items || []).length,
      "Total Amount": Number(order.total_amount || 0),
      "Payment Status": titleCase(order.payment_status || "unknown"),
      "Order Status": titleCase(order.status || "unknown"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

    XLSX.writeFile(
      workbook,
      "VanyaGlo_Orders.xlsx"
    );
  };


  return (
    <main className="orders-page">
      <header className="orders-heading">
        <div>
          <h1>Orders Management</h1>
          <p>Review, confirm and track customer orders.</p>
        </div>
      </header>

      {/* Order summary cards */}
      <section className="orders-stats">
        <StatCard
          label="Total Orders"
          value={stats.total}
        />

        <StatCard
          label="Pending Confirmation"
          value={stats.pending}
        />

        <StatCard
          label="Cancelled"
          value={stats.cancelled}
        />

        <StatCard
          label="Processing"
          value={stats.processing}
        />

        <StatCard
          label="Delivered"
          value={stats.delivered}
        />
      </section>

      {notice && (
        <div className="orders-notice" role="status">
          {notice}
        </div>
      )}

      {error && (
        <div className="orders-error" role="alert">
          {error}
          <button
            type="button"
            onClick={() => setError("")}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search and status filter */}
      <section className="orders-toolbar">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search order ID, customer name or ID..."
          aria-label="Search orders"
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter orders by status"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status === "all" ? "All Statuses" : titleCase(status)}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="order-btn primary export-excel-btn"
          onClick={handleExportExcel}
          disabled={loading || filteredOrders.length === 0}
        >
          Export to Excel
        </button>
      </section>

      {/* Orders table */}
      <section className="orders-table-wrap">
        {loading ? (
          <div className="orders-empty">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="orders-empty">
            No orders found for this search or status.
          </div>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Order Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {paginatedOrders.map((order) => {
                const status = normalizeStatus(order.status);
                const orderId = order.order_id;

                return (
                  <tr key={orderId}>
                    <td>
                      <span className="order-id">
                        #{String(orderId || "").slice(0, 8)}
                      </span>
                    </td>

                    <td>
                      <div className="customer-info">
                        <strong>{getCustomerName(order)}</strong>
                        <span>ID: {order.user_id || "Guest"}</span>
                      </div>
                    </td>

                    <td>{formatDate(order.created_at)}</td>

                    <td>
                      <span className="items-count">
                        {order.items?.length || 0} item(s)
                      </span>
                    </td>

                    <td className="order-total">
                      {formatCurrency(order.total_amount)}
                    </td>

                    <td>
                      <StatusBadge status={order.payment_status} />
                    </td>

                    <td>
                      <StatusBadge status={status} />
                    </td>

                    <td>
                      <div className="order-actions">
                        <button
                          type="button"
                          className="order-btn outline"
                          onClick={() => openOrderDetails(order)}
                        >
                          View Details
                        </button>

                        {status === "cancelled" &&
                          normalizeStatus(order.payment_status) === "paid" &&
                          !isRefundInProgressOrComplete(order) && (
                            <button
                              type="button"
                              className="order-btn outline"
                              onClick={() => openRefundDetails(order)}
                            >
                              Refund
                            </button>
                          )}

                        {status === "pending" && (
                          <button
                            type="button"
                            className="order-btn primary"
                            disabled={savingId === orderId}
                            onClick={() => changeStatus(order, "confirmed")}
                          >
                            {savingId === orderId ? "Saving..." : "Confirm"}
                          </button>
                        )}

                        {status === "confirmed" && (
                          <button
                            type="button"
                            className="order-btn primary"
                            disabled={savingId === orderId}
                            onClick={() => changeStatus(order, "processing")}
                          >
                            {savingId === orderId
                              ? "Saving..."
                              : "Start Processing"}
                          </button>
                        )}

                        {status === "processing" && (
                          <button
                            type="button"
                            className="order-btn outline"
                            onClick={() => openTracking(order)}
                          >
                            Add Tracking
                          </button>
                        )}

                        {status === "shipped" && (
                          <button
                            type="button"
                            className="order-btn outline"
                            disabled={savingId === orderId}
                            onClick={() => changeStatus(order, "delivered")}
                          >
                            {savingId === orderId
                              ? "Saving..."
                              : "Mark Delivered"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* Pagination */}
      {!loading && filteredOrders.length > 0 && (
        <div className="products-pagination">
          <button
            type="button"
            className="pagination-arrow"
            disabled={currentPage <= 1}
            onClick={() =>
              setCurrentPage((page) => Math.max(1, page - 1))
            }
            aria-label="Previous page"
          >
            ‹
          </button>

          <button
            type="button"
            className="pagination-page"
            aria-current="page"
          >
            {currentPage}
          </button>

          <button
            type="button"
            className="pagination-arrow"
            disabled={currentPage >= totalPages}
            onClick={() =>
              setCurrentPage((page) =>
                Math.min(totalPages, page + 1)
              )
            }
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      )}

      {/* Order details modal */}
      {selectedOrder && (
        <div
          className="orders-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeOrderDetails();
            }
          }}
        >
          <section
            className="orders-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-modal-title"
          >
            <header className="orders-modal-header">
              <div>
                <h2 id="order-modal-title">Order Details</h2>
                <p>{selectedOrder.order_id}</p>
              </div>

              <button
                type="button"
                className="orders-modal-close"
                onClick={closeOrderDetails}
                aria-label="Close order details"
              >
                ×
              </button>
            </header>

            <div className="order-detail-summary">
              <span>Status</span>
              <StatusBadge status={selectedOrder.status} />

              <span>Total</span>
              <strong>
                {formatCurrency(selectedOrder.total_amount)}
              </strong>
            </div>

            <div className="order-customer-details">
              <h3>Customer Details</h3>

              <p>
                <strong>Name:</strong> {getCustomerName(selectedOrder)}
              </p>

              <p>
                <strong>Customer ID:</strong>{" "}
                {selectedOrder.user_id || "Guest"}
              </p>

              <p>
                <strong>Order Date:</strong>{" "}
                {formatDate(selectedOrder.created_at)}
              </p>

              <p>
                <strong>Payment Status:</strong>{" "}
                {titleCase(selectedOrder.payment_status || "unknown")}
              </p>
            </div>

            <h3>Ordered Products</h3>

            <div className="order-items-list">
              {selectedOrder.items?.length ? (
                selectedOrder.items.map((item, index) => (
                  <div
                    className="order-item-row"
                    key={`${item.product_id || getProductName(item)}-${index}`}
                  >
                    <div>
                      <strong>{getProductName(item)}</strong>
                      <p>Quantity: {item.quantity || 0}</p>
                    </div>

                    <strong>
                      {formatCurrency(item.subtotal)}
                    </strong>
                  </div>
                ))
              ) : (
                <p>No product details available.</p>
              )}
            </div>

            {/* Shipping and tracking */}
            {["processing", "shipped"].includes(
              normalizeStatus(selectedOrder.status)
            ) && (
              <form
                className="tracking-form"
                onSubmit={saveTracking}
              >
                <h3>Shipping & Tracking</h3>

                <label>
                  Courier Name *
                  <input
                    value={tracking.courier_name}
                    onChange={(event) =>
                      setTracking({
                        ...tracking,
                        courier_name: event.target.value,
                      })
                    }
                    required
                    placeholder="Enter courier name"
                  />
                </label>

                <label>
                  Tracking Number *
                  <input
                    value={tracking.tracking_number}
                    onChange={(event) =>
                      setTracking({
                        ...tracking,
                        tracking_number: event.target.value,
                      })
                    }
                    required
                    placeholder="Enter tracking number"
                  />
                </label>

                <label>
                  Tracking URL
                  <input
                    type="url"
                    value={tracking.tracking_url}
                    onChange={(event) =>
                      setTracking({
                        ...tracking,
                        tracking_url: event.target.value,
                      })
                    }
                    placeholder="https://courier.example/track/..."
                  />
                </label>

                <label>
                  Estimated Delivery
                  <input
                    type="date"
                    value={tracking.estimated_delivery}
                    onChange={(event) =>
                      setTracking({
                        ...tracking,
                        estimated_delivery: event.target.value,
                      })
                    }
                  />
                </label>

                <button
                  className="order-btn primary full-width"
                  type="submit"
                  disabled={savingId === selectedOrder.order_id}
                >
                  {savingId === selectedOrder.order_id
                    ? "Saving..."
                    : "Save & Mark Shipped"}
                </button>
              </form>
            )}

            {normalizeStatus(selectedOrder.status) === "shipped" && (
              <p className="tracking-note">
                Saving shipping details again updates tracking
                information. Use Mark Delivered in the order list
                when delivery is complete.
              </p>
            )}

            {normalizeStatus(selectedOrder.status) === "pending" && (
              <div className="order-detail-actions">
                <button
                  type="button"
                  className="order-btn outline"
                  onClick={closeOrderDetails}
                >
                  Close
                </button>

                <button
                  type="button"
                  className="order-btn primary"
                  disabled={savingId === selectedOrder.order_id}
                  onClick={() =>
                    changeStatus(selectedOrder, "confirmed")
                  }
                >
                  {savingId === selectedOrder.order_id
                    ? "Saving..."
                    : "Confirm Order"}
                </button>
              </div>
            )}

            {normalizeStatus(selectedOrder.status) !== "pending" && (
              <button
                type="button"
                className="order-btn outline full-width"
                onClick={closeOrderDetails}
              >
                Close
              </button>
            )}
          </section>
        </div>
      )}

      {refundOrder && (
        <div
          className="orders-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeRefundDetails();
            }
          }}
        >
          <section
            className="orders-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="refund-modal-title"
          >
            <header className="orders-modal-header">
              <div>
                <h2 id="refund-modal-title">Refund Details</h2>
                <p>{refundOrder.order_id}</p>
              </div>

              <button
                type="button"
                className="orders-modal-close"
                onClick={closeRefundDetails}
                aria-label="Close refund details"
              >
                ×
              </button>
            </header>

            <div className="order-customer-details refund-details">
              <p>
                <strong>Customer:</strong> {getCustomerName(refundOrder)}
              </p>
              <p>
                <strong>Order status:</strong>{" "}
                {titleCase(refundOrder.status)}
              </p>
              <p>
                <strong>Payment status:</strong>{" "}
                {titleCase(refundOrder.payment_status)}
              </p>
              <p>
                <strong>Refund amount:</strong>{" "}
                {formatCurrency(getRefundAmount(refundOrder))}
              </p>
              <p>
                <strong>Customer-selected destination:</strong>{" "}
                {getRefundDestination(refundOrder)?.label ||
                  "Not provided by the order"}
              </p>
              <p>
                <strong>Cancellation reason:</strong>{" "}
                {getCancellationReason(refundOrder) || "Not provided"}
              </p>
              {getRefundStatus(refundOrder) && (
                <p>
                  <strong>Refund status:</strong>{" "}
                  {titleCase(getRefundStatus(refundOrder))}
                </p>
              )}
              {getRefundReason(refundOrder) && (
                <p>
                  <strong>Refund reason:</strong>{" "}
                  {getRefundReason(refundOrder)}
                </p>
              )}
              {getRefundRequestedAt(refundOrder) && (
                <p>
                  <strong>Request date:</strong>{" "}
                  {formatDate(getRefundRequestedAt(refundOrder))}
                </p>
              )}
              {refundOrder.payment_method && (
                <p>
                  <strong>Payment method:</strong>{" "}
                  {titleCase(refundOrder.payment_method)}
                </p>
              )}
              {refundOrder.payment_id && (
                <p>
                  <strong>Payment reference:</strong> {refundOrder.payment_id}
                </p>
              )}
            </div>

            {!getRefundDestination(refundOrder) && (
              <p className="refund-warning" role="alert">
                The customer refund option was not included in the order
                response. The backend must return the saved refund method
                before this refund can be processed.
              </p>
            )}

            {getRefundDestination(refundOrder)?.value === "wallet" && (
              <p className="refund-warning" role="alert">
                The customer selected VanyaGlo Wallet. The current refund API
                only supports the original payment method, so wallet processing
                must be implemented by the backend.
              </p>
            )}

            <form onSubmit={processRefund}>
              <label className="refund-reason">
                Admin processing reason *
                <textarea
                  value={refundReason}
                  onChange={(event) => setRefundReason(event.target.value)}
                  required
                  rows={3}
                  placeholder="Enter the reason for processing this refund"
                />
              </label>

              <button
                type="submit"
                className="order-btn primary full-width"
                disabled={
                  savingId === refundOrder.order_id ||
                  !getRefundDestination(refundOrder) ||
                  isRefundInProgressOrComplete(refundOrder) ||
                  !refundReason.trim() ||
                  getRefundDestination(refundOrder)?.value === "wallet"
                }
              >
                {savingId === refundOrder.order_id
                  ? "Processing Refund..."
                  : "Process Refund"}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <article className="orders-stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status) || "unknown";

  return (
    <span className={`order-status status-${normalized}`}>
      {titleCase(normalized)}
    </span>
  );
}
