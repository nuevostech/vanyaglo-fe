import React, { useCallback, useEffect, useState } from "react";

import "./ProductReviews.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ProductReviews = () => {

  const [reviews, setReviews] = useState([]);

  const [search, setSearch] = useState("");

  const [rating, setRating] = useState("");

  const [page, setPage] = useState(1);

  const [limit] = useState(10);

  const [pagination, setPagination] = useState({

    page: 1,

    limit: 10,

    total: 0,

    total_pages: 0,

  });

  const [replyText, setReplyText] = useState({});

  const [activeReply, setActiveReply] = useState(null);

  const [loading, setLoading] = useState(false);

  const [savingReply, setSavingReply] = useState(false);

  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const getToken = () =>

    localStorage.getItem("token") ||

    localStorage.getItem("accessToken") ||

    localStorage.getItem("access_token") ||

    localStorage.getItem("auth_token");

  const getHeaders = () => ({

    Authorization: `Bearer ${getToken() || ""}`,

    "Content-Type": "application/json",

  });

  // ----------------------------------------------------------

  // FETCH ALL CUSTOMER REVIEWS

  // GET /api/admin/reviews

  // ----------------------------------------------------------

const fetchReviews = useCallback(async () => {
  const searchValue = search.trim();

  // Do not call the API for 1 or 2 search characters.
  if (searchValue.length > 0 && searchValue.length < 3) {
    return;
  }

  setLoading(true);
  setError("");
  setSuccessMessage("");

  try {
    if (!API_BASE_URL) {
      throw new Error(
        "VITE_API_BASE_URL is missing from your frontend .env file."
      );
    }

    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("auth_token");

    if (!token) {
      throw new Error("Admin authentication token not found. Please log in again.");
    }

    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    // Add search only after 3 characters.
    if (searchValue.length >= 3) {
      params.set("search", searchValue);
    }

    // Add rating filter when selected.
    if (rating) {
      params.set("rating", rating);
    }

    const response = await fetch(
      `${API_BASE_URL}/api/admin/reviews?${params.toString()}`,
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
      throw new Error(
        result.message || "Failed to fetch customer reviews."
      );
    }

    const reviewList = result.data?.reviews || [];

    setReviews(reviewList);

    setPagination(
      result.data?.pagination || {
        page,
        limit,
        total: reviewList.length,
        total_pages: reviewList.length > 0 ? 1 : 0,
      }
    );

    // Preserve replies already typed in the editor.
    setReplyText((previous) => {
      const updated = { ...previous };

      reviewList.forEach((review) => {
        if (updated[review.id] === undefined) {
          updated[review.id] = review.admin_reply || "";
        }
      });

      return updated;
    });
  } catch (err) {
    console.error("Fetch reviews error:", err);

    setError(err.message || "Unable to load reviews.");
    setReviews([]);

    setPagination({
      page: 1,
      limit,
      total: 0,
      total_pages: 0,
    });
  } finally {
    setLoading(false);
  }
}, [page, limit, search, rating]);

useEffect(() => {
  const searchValue = search.trim();

  if (searchValue.length > 0 && searchValue.length < 3) {
    return;
  }

  const timeoutId = setTimeout(() => {
    fetchReviews();
  }, searchValue.length >= 3 ? 350 : 0);

  return () => clearTimeout(timeoutId);
}, [fetchReviews, search]);

  // ----------------------------------------------------------

  // SAVE ADMIN REPLY

  // ----------------------------------------------------------

  const handleSaveReply = async (event, review) => {

    event.preventDefault();

    const reply = (replyText[review.id] || "").trim();

    if (!reply) {

      setError("Please enter a reply before saving.");

      return;

    }

    if (!review.product_id) {

      setError("Product ID is missing for this review.");

      return;

    }

    setSavingReply(true);

    setError("");

    setSuccessMessage("");

    try {

      const response = await fetch(

        `${API_BASE_URL}/api/admin/products/${review.product_id}/reviews/${review.id}/reply`,

        {

          method: "PATCH",

          headers: getHeaders(),

          body: JSON.stringify({

            admin_reply: reply,

          }),

        }

      );

      const result = await response.json();

      if (!response.ok || !result.success) {

        throw new Error(result.message || "Failed to save reply.");

      }

      setSuccessMessage("Reply saved successfully.");

      setActiveReply(null);

      await fetchReviews();

    } catch (err) {

      console.error("Save review reply error:", err);

      setError(err.message || "Unable to save reply.");

    } finally {

      setSavingReply(false);

    }

  };

  // ----------------------------------------------------------

  // HELPERS

  // ----------------------------------------------------------

  const formatDate = (dateValue) => {

    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-IN", {

      day: "2-digit",

      month: "short",

      year: "numeric",

    });

  };

  const renderStars = (value) => {

    const numericRating = Math.max(

      0,

      Math.min(5, Number(value) || 0)

    );

    return (

      <span className="reviews-stars" aria-label={`${numericRating} out of 5`}>

        {"★".repeat(numericRating)}

        <span className="reviews-stars-empty">

          {"★".repeat(5 - numericRating)}

        </span>

      </span>

    );

  };

  // ----------------------------------------------------------

  // UI

  // ----------------------------------------------------------

  return (

    <div className="product-reviews-page">

      <header className="reviews-header">

        <div>

          <h1>Ratings &amp; Reviews</h1>

          <p>Manage customer product ratings, reviews and replies.</p>

        </div>
      </header>

      <div className="reviews-summary">

        <div className="reviews-summary-card">

          <span>Total Reviews</span>

          <strong>{pagination.total}</strong>

        </div>
        <div className="reviews-summary-card">
    <span>Replied Reviews</span>
    <strong>
      {reviews.filter(
        (review) => review.admin_reply?.trim()
      ).length}
    </strong>
  </div>

        {/* <div className="reviews-summary-card">

          <span>Showing</span>

          <strong>{reviews.length}</strong>

        </div> */}

      </div>

      <div className="reviews-toolbar">

        
<input
  type="search"
  placeholder="Search customer, product or review..."
  value={search}
  onChange={(event) => {
    setSearch(event.target.value);
    setPage(1);
  }}
/>


        <select

          value={rating}

          onChange={(event) => {

            setRating(event.target.value);

            setPage(1);

          }}

          aria-label="Filter by rating"

        >

          <option value="">All Ratings</option>

          <option value="5">5 Stars</option>

          <option value="4">4 Stars</option>

          <option value="3">3 Stars</option>

          <option value="2">2 Stars</option>

          <option value="1">1 Star</option>

        </select>

      </div>

      {error && (

        <div className="reviews-alert reviews-alert-error" role="alert">

          {error}

        </div>

      )}

      {successMessage && (

        <div className="reviews-alert reviews-alert-success" role="status">

          {successMessage}

        </div>

      )}

      <div className="reviews-table-wrapper">

        <table className="reviews-table">

          <thead>

            <tr>

              <th>Product</th>

              <th>Customer</th>

              <th>Rating</th>

              <th>Review</th>

              <th>Date</th>

              <th>Reply Status</th>

              <th>Action</th>

            </tr>

          </thead>

          <tbody>

            {loading ? (

              <tr>

                <td colSpan="7" className="reviews-empty">

                  Loading customer reviews...

                </td>

              </tr>

            ) : reviews.length === 0 ? (

              <tr>

                <td colSpan="7" className="reviews-empty">

                  {error

                    ? "Reviews could not be loaded."

                    : "No customer reviews found."}

                </td>

              </tr>

            ) : (

              reviews.map((review) => {

                const productName =

                  review.product?.product_name || "Unknown Product";

                const customerName =

                  review.user?.full_name || "Unknown Customer";

                const adminReply = review.admin_reply || "";

                return (

                  <React.Fragment key={review.id}>

                    <tr>

                      <td>

                        <div className="reviews-product-name">

                          {productName}

                        </div>

                      </td>

                      <td>

                        <div className="reviews-customer-name">

                          {customerName}

                        </div>

                        <div className="reviews-customer-email">

                          {review.user?.email || ""}

                        </div>

                      </td>

                      <td>

                        <div className="reviews-rating">

                          {renderStars(review.rating)}

                          <span className="reviews-rating-number">

                            {Number(review.rating) || 0}/5

                          </span>

                        </div>

                      </td>

                      <td>

                        <div className="reviews-review-text">

                          {review.review || "No written review"}

                        </div>

                      </td>

                      <td>{formatDate(review.created_at)}</td>

                      <td>

                        <span

                          className={`reviews-status ${

                            adminReply

                              ? "reviews-status-replied"

                              : "reviews-status-pending"

                          }`}

                        >

                          {adminReply ? "Replied" : "Awaiting Reply"}

                        </span>

                      </td>

                      <td>

                        <button

                          type="button"

                          className="reviews-reply-button"

                          onClick={() => {
                      setError("");
                      setSuccessMessage("");
                      setReplyText((previous) => ({
                        ...previous,
                        [review.id]:
                          previous[review.id] !== undefined
                            ? previous[review.id]
                            : adminReply,
                      }));
                      setActiveReply(review.id);
                    }}

                        >

                          {adminReply ? "Edit Reply" : "Reply"}

                        </button>

                      </td>

                    </tr>

                  </React.Fragment>

                );

              })

            )}

          </tbody>

        </table>

      </div>

      {activeReply && (() => {
        const selectedReview = reviews.find(
          (review) => review.id === activeReply
        );

        if (!selectedReview) return null;

        return (
          <div
            className="reviews-modal-overlay"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget &&
                !savingReply
              ) {
                setActiveReply(null);
              }
            }}
          >
            <div
              className="reviews-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="reviews-modal-title"
            >
              <div className="reviews-modal-header">
                <div>
                  <h2 id="reviews-modal-title">
                    {selectedReview.admin_reply ? "Edit Reply" : "Reply to Review"}
                  </h2>
                  <p>Respond to your customer's product review.</p>
                </div>

                <button
                  type="button"
                  className="reviews-modal-close"
                  onClick={() => setActiveReply(null)}
                  disabled={savingReply}
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>

              <div className="reviews-modal-body">
                <div className="reviews-modal-info">
                  <div>
                    <span>Customer</span>
                    <strong>
                      {selectedReview.user?.full_name || "Unknown Customer"}
                    </strong>
                  </div>

                  <div>
                    <span>Product</span>
                    <strong>
                      {selectedReview.product?.product_name || "Unknown Product"}
                    </strong>
                  </div>

                  <div>
                    <span>Rating</span>
                    <strong>
                      {"★".repeat(
                        Math.max(0, Math.min(5, Number(selectedReview.rating) || 0))
                      )}{" "}
                      {Number(selectedReview.rating) || 0}/5
                    </strong>
                  </div>
                </div>

                <div className="reviews-modal-original">
                  <label>Customer Review</label>
                  <p>{selectedReview.review || "No written review."}</p>
                </div>

                <form
                  className="reviews-modal-form"
                  onSubmit={(event) => handleSaveReply(event, selectedReview)}
                >
                  <label htmlFor="admin-review-reply">Your Reply</label>

                  <textarea
                    id="admin-review-reply"
                    rows={5}
                    maxLength={2000}
                    placeholder="Write your response to the customer..."
                    value={replyText[selectedReview.id] || ""}
                    onChange={(event) =>
                      setReplyText((previous) => ({
                        ...previous,
                        [selectedReview.id]: event.target.value,
                      }))
                    }
                    required
                    autoFocus
                  />

                  <div className="reviews-modal-footer">
                    <button
                      type="button"
                      className="reviews-modal-cancel"
                      onClick={() => setActiveReply(null)}
                      disabled={savingReply}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="reviews-modal-save"
                      disabled={
                        savingReply ||
                        !(replyText[selectedReview.id] || "").trim()
                      }
                    >
                      {savingReply ? "Saving..." : "Save Reply"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        );
      })()}

<div className="reviews-pagination">

  <div className="reviews-pagination-controls">

    <button

      type="button"

      className="reviews-page-arrow"

      onClick={() => setPage((current) => Math.max(1, current - 1))}

      disabled={loading || page <= 1}

      aria-label="Previous page"

    >

      &lt;

    </button>

    {Array.from(

      { length: pagination.total_pages },

      (_, index) => index + 1

    )

      .filter((pageNumber) =>

        Math.abs(pageNumber - page) <= 2

      )

      .map((pageNumber) => (

        <button

          type="button"

          key={pageNumber}

          className={`reviews-page-number ${

            page === pageNumber ? "active" : ""

          }`}

          onClick={() => setPage(pageNumber)}

          disabled={loading}

          aria-current={page === pageNumber ? "page" : undefined}

        >

          {pageNumber}

        </button>

      ))}

    <button

      type="button"

      className="reviews-page-arrow"

      onClick={() =>

        setPage((current) =>

          Math.min(pagination.total_pages, current + 1)

        )

      }

      disabled={

        loading ||

        pagination.total_pages === 0 ||

        page >= pagination.total_pages

      }

      aria-label="Next page"

    >

      &gt;

    </button>

  </div>

</div>

    </div>

  );

};

export default ProductReviews;
