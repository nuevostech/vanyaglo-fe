import React, { useState } from "react";
import "./AdminProducts.css";

const AdminProducts = ({ onAddProduct }) => {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
const productsPerPage = 5;

  const products = [
    {
      id: 1,
      name: "The Face Shop Rose Water Toner",
      brand: "The Face Shop",
      category: "Fragrance",
      sellingPrice: 449,
      mrp: 572,
      stock: 80,
      status: "Active",
    },
    {
      id: 2,
      name: "Lakme Face Cream",
      brand: "Lakme",
      category: "Skincare",
      sellingPrice: 399,
      mrp: 499,
      stock: 35,
      status: "Active",
    },
    {
      id: 3,
      name: "Maybelline Lipstick",
      brand: "Maybelline",
      category: "Makeup",
      sellingPrice: 299,
      mrp: 399,
      stock: 0,
      status: "Inactive",
    },
  ];

  const filteredProducts = products.filter((product) => {
    const value = search.toLowerCase();

    return (
      product.name.toLowerCase().includes(value) ||
      product.brand.toLowerCase().includes(value) ||
      product.category.toLowerCase().includes(value)
    );
  });
  const totalPages = Math.ceil(
  filteredProducts.length / productsPerPage
);

const startIndex = (currentPage - 1) * productsPerPage;

const currentProducts = filteredProducts.slice(
  startIndex,
  startIndex + productsPerPage
);

  return (
    <div className="products-page">

      {/* Header */}
      <div className="products-header">
        <div>
          <h1>Products</h1>

          <p>
            Manage VanyaGlo beauty products and inventory
          </p>
        </div>
        <div className="products-header-actions">
          <a
  href="/templates/VanyaGlo_Product_Import_Template.xlsx"
  download
  className="download-template-btn"
>
  Download Template
</a>

  <button
    className="import-product-btn"
    onClick={() =>
      document.getElementById("excel-upload").click()
    }
  >
    Import Excel
  </button>

  <button
  className="add-product-btn"
  onClick={onAddProduct}
>
  + Add Product
</button>

  <input
    id="excel-upload"
    type="file"
    accept=".xlsx,.xls"
    style={{ display: "none" }}
    onChange={(e) => {
      const file = e.target.files[0];

      if (file) {
        console.log("Excel selected:", file.name);
      }
    }}
  />

</div>
      </div>

      {/* Search */}
      <div className="products-search-section">

        <div className="products-search">

          <input
            type="text"
            placeholder="Search by name, brand, category"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <span className="products-search-icon">
            ⌕
          </span>

        </div>

      </div>

      {/* Statistics */}
      <div className="products-stats">

        <div className="products-stat-card">
          <div className="products-stat-number">
            00
          </div>

          <div className="products-stat-label">
            Total Products
          </div>
        </div>

        <div className="products-stat-card">
          <div className="products-stat-number">
            00
          </div>

          <div className="products-stat-label">
            Active
          </div>
        </div>

        <div className="products-stat-card">
          <div className="products-stat-number">
            00
          </div>

          <div className="products-stat-label">
            Out of Stock
          </div>
        </div>

        <div className="products-stat-card">
          <div className="products-stat-number">
            00
          </div>

          <div className="products-stat-label">
            Low Stock
          </div>
        </div>

      </div>

      {/* Products Table */}
      <div className="products-table-section">

        <div className="products-table-wrapper">

          <table className="products-table">

            <thead>

              <tr>
                <th>Product</th>
                <th>Brand</th>
                <th>Category</th>
                <th>Selling Price</th>
                <th>MRP</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>

            </thead>

            <tbody>

              {filteredProducts.length > 0 ? (

                currentProducts.map((product) => (

                  <tr key={product.id}>

                    {/* Product */}
                    <td>

                      <div className="product-table-info">

                        <div className="product-avatar">
                          {product.name
                            .split(" ")
                            .map((word) => word[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>

                        <div className="product-table-name">
                          {product.name}
                        </div>

                      </div>

                    </td>

                    {/* Brand */}
                    <td>
                      {product.brand}
                    </td>

                    {/* Category */}
                    <td>
                      {product.category}
                    </td>

                    {/* Selling Price */}
                    <td>
                      ₹{product.sellingPrice}
                    </td>

                    {/* MRP */}
                    <td>
                      ₹{product.mrp}
                    </td>

                    {/* Stock */}
                    <td>

                      <span
                        className={
                          product.stock === 0
                            ? "stock-out"
                            : product.stock < 20
                            ? "stock-low"
                            : "stock-normal"
                        }
                      >
                        {product.stock} units
                      </span>

                    </td>

                    {/* Status */}
                    <td>

                      <span
                        className={`product-status ${
                          product.status.toLowerCase()
                        }`}
                      >
                        {product.status}
                      </span>

                    </td>

                    {/* Actions */}
                    <td>

                      <div className="product-actions">

                        <button
                          className="product-action-btn"
                          onClick={() =>
                            console.log(
                              "View product",
                              product.id
                            )
                          }
                        >
                          View
                        </button>

                        <button
                          className="product-action-btn"
                          onClick={() =>
                            console.log(
                              "Edit product",
                              product.id
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="product-action-btn delete"
                          onClick={() =>
                            console.log(
                              "Delete product",
                              product.id
                            )
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan="8"
                    className="no-products"
                  >
                    No products found
                  </td>

                </tr>

              )}

            </tbody>

          </table>

                </div>

        {/* Pagination */}
        <div className="products-pagination">

          <button
            className="pagination-arrow"
            onClick={() =>
              setCurrentPage((prev) => prev - 1)
            }
            disabled={currentPage === 1}
          >
            &lt;
          </button>

          <span className="pagination-page">
            {currentPage}
          </span>

          <button
            className="pagination-arrow"
            onClick={() =>
              setCurrentPage((prev) => prev + 1)
            }
            disabled={currentPage === totalPages}
          >
            &gt;
          </button>

        </div>

      </div>

    </div>
  );
};

export default AdminProducts;