import test from "node:test";
import assert from "node:assert/strict";

import {
  findMatchingProduct,
  getExcelProductDetails,
  consolidateExcelProductRows,
  normalizeProductImportHeader,
  getUpdatedStock,
  getProductStatus,
  isLowStock,
  removeProductById,
  normalizeProductImages,
} from "./productMatching.js";

test("matches the same brand and product name without case or whitespace differences", () => {
  const products = [
    { id: 12, name: "Lotion", brand: "Brand A", stock: 5 },
  ];

  assert.equal(
    findMatchingProduct(products, "  lotion  ", " brand a ")?.id,
    12
  );
});

test("does not match when either the brand or product name differs", () => {
  const products = [
    { id: 12, name: "Lotion", brand: "Brand A", stock: 5 },
  ];

  assert.equal(
    findMatchingProduct(products, "Lotion", "Brand B"),
    undefined
  );
  assert.equal(
    findMatchingProduct(products, "Serum", "Brand A"),
    undefined
  );
});

test("adds the incoming stock to an existing product stock", () => {
  assert.equal(getUpdatedStock(5, 3), 8);
});

test("reads product name, brand, and stock from Excel headers", () => {
  assert.deepEqual(
    getExcelProductDetails({ "Product Name": "Lotion", Brand: "Brand A", Stock: "4" }),
    { productName: "Lotion", brand: "Brand A", stock: 4 }
  );

  assert.equal(
    getExcelProductDetails({ Product: "Serum" }).productName,
    "Serum"
  );
});

test("normalizes all supported import headers to API field names", () => {
  assert.deepEqual(
    [
      "Product Name",
      "Brand",
      "Actual Price",
      "Offer Price",
      "Stock",
      "Discount %",
      "Product Images",
      "Product Description",
    ].map(normalizeProductImportHeader),
    [
      "Product",
      "Brand",
      "MRP",
      "Selling Price",
      "Stock",
      "Discount",
      "Product Images",
      "Product Description",
    ]
  );
});

test("consolidates repeated Excel rows by product name and brand", () => {
  const rows = consolidateExcelProductRows([
    { "Product Name": "Lotion", Brand: "Brand A", Stock: 4 },
    { "Product Name": " lotion ", Brand: "brand a", Stock: 3 },
    { "Product Name": "Lotion", Brand: "Brand B", Stock: 2 },
  ]);

  assert.equal(rows.length, 2);
  assert.equal(rows[0].Stock, 7);
  assert.equal(rows[1].Stock, 2);
});

test("consolidates duplicate rows using a Quantity column", () => {
  const rows = consolidateExcelProductRows([
    { "Product Name": "Lotion", Brand: "Brand A", Quantity: 4 },
    { "Product Name": "Lotion", Brand: "Brand A", Quantity: 3 },
  ]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].Quantity, 7);
});

test("marks products with zero stock as inactive", () => {
  assert.equal(getProductStatus(0, true), "Inactive");
});

test("reactivates a product when stock is increased above zero", () => {
  assert.equal(getProductStatus(5, false), "Active");
});

test("marks products with stock below 10 as low stock", () => {
  assert.equal(isLowStock(9), true);
  assert.equal(isLowStock(10), false);
});

test("removes a product from the UI product list by id", () => {
  const products = [
    { id: 12, name: "Lotion" },
    { id: 13, name: "Serum" },
  ];

  assert.deepEqual(removeProductById(products, 12), [
    { id: 13, name: "Serum" },
  ]);
});

test("normalizes product image links into a clean array", () => {
  assert.deepEqual(
    normalizeProductImages([
      "https://example.com/one.jpg",
      "  ",
      "https://example.com/two.jpg",
    ]),
    [
      "https://example.com/one.jpg",
      "https://example.com/two.jpg",
    ]
  );

  assert.deepEqual(
    normalizeProductImages(
      "https://example.com/one.jpg, https://example.com/two.jpg"
    ),
    [
      "https://example.com/one.jpg",
      "https://example.com/two.jpg",
    ]
  );

  assert.deepEqual(
    normalizeProductImages(
      '["https://example.com/one.jpg", "https://example.com/two.jpg"]'
    ),
    [
      "https://example.com/one.jpg",
      "https://example.com/two.jpg",
    ]
  );

  assert.deepEqual(
    normalizeProductImages([
      { url: "https://example.com/one.jpg" },
      { image_url: "https://example.com/two.jpg" },
    ]),
    [
      "https://example.com/one.jpg",
      "https://example.com/two.jpg",
    ]
  );
});
