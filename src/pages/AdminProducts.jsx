import React, { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
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
} from "../utils/productMatching";
import "./AdminProducts.css";

const ProductImageLinks = ({ images, onChange }) => {
  const [urlFields, setUrlFields] = useState(
    () => normalizeProductImages(images)
  );
  const [failedImages, setFailedImages] = useState({});

  useEffect(() => {
    const normalizedImages = normalizeProductImages(images);
    setUrlFields((currentFields) =>
      currentFields.some((field) => !field)
        ? currentFields
        : normalizedImages
    );
  }, [images]);

  const updateUrlField = (index, value) => {
    const nextFields = [...urlFields];
    nextFields[index] = value;
    setUrlFields(nextFields);
    onChange(normalizeProductImages(nextFields));
  };

  const addUrlField = () => {
    const nextFields = [...urlFields, ""];
    setUrlFields(nextFields);
    onChange(normalizeProductImages(nextFields));
  };

  const removeUrlField = (index) => {
    const nextFields = urlFields.filter((_, fieldIndex) => fieldIndex !== index);
    setUrlFields(nextFields);
    onChange(normalizeProductImages(nextFields));
  };

  const validImages = normalizeProductImages(urlFields);

  return (
    <div className="edit-product-field">
      <label>Product Images</label>
      <div className="product-image-url-fields">
        {urlFields.map((url, index) => (
          <div className="product-image-url-row" key={`image-url-${index}`}>
            <input
              type="url"
              value={url}
              onChange={(event) => updateUrlField(index, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addUrlField();
                }
              }}
              placeholder="Paste image URL"
            />
            <button
              type="button"
              className="product-image-remove-btn"
              onClick={() => removeUrlField(index)}
              aria-label={`Remove image URL ${index + 1}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="product-image-add-btn"
        onClick={addUrlField}
        aria-label="Add another image URL"
      >
        + Add image URL
      </button>

      {validImages.length > 0 && (
        <div className="product-image-preview-list">
          {validImages.map((image, index) => (
            <div className="product-image-preview" key={`${image}-${index}`}>
              <img
                src={image}
                alt={`Product image ${index + 1}`}
                onError={(event) => {
                  setFailedImages((current) => ({
                    ...current,
                    [image]: true,
                  }));
                  event.currentTarget.style.display = "none";
                }}
              />
              {failedImages[image] && (
                <span className="product-image-error">
                  Image unavailable
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ExcelImagePreview = ({ images }) => {
  const imageUrls = normalizeProductImages(images);
  const [failedImages, setFailedImages] = useState({});

  if (imageUrls.length === 0) {
    return "-";
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: "5px",
        minWidth: "220px",
        maxHeight: "180px",
        overflowY: "auto",
      }}
    >
      {imageUrls.map((image, index) => (
        <div
          key={`${image}-${index}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              flex: "0 0 42px",
              border: "1px solid #e5e5e5",
              borderRadius: "4px",
              overflow: "hidden",
              display: "grid",
              placeItems: "center",
              background: "#f7f7f7",
              fontSize: "9px",
              color: "#777",
            }}
          >
            {failedImages[image] ? (
              <span>Unavailable</span>
            ) : (
              <img
                src={image}
                alt={`Product preview ${index + 1}`}
                onError={() =>
                  setFailedImages((current) => ({
                    ...current,
                    [image]: true,
                  }))
                }
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            )}
          </div>
          <a
            href={image}
            target="_blank"
            rel="noreferrer"
            title={image}
            style={{
              minWidth: 0,
              overflow: "hidden",
              color: "#555",
              fontSize: "11px",
              textDecoration: "underline",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {image}
          </a>
        </div>
      ))}
    </div>
  );
};

const AdminProducts = ({ onAddProduct }) => {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [products, setProducts] = useState([]);

  const [loadingProducts, setLoadingProducts] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [fileChecked, setFileChecked] = useState(false);
  const [importing, setImporting] = useState(false);
  const [excelProducts, setExcelProducts] = useState([]);
  const [editingExcelProductId, setEditingExcelProductId] = useState(null);
  const [excelProductDraft, setExcelProductDraft] = useState(null);
const [excelHeaders, setExcelHeaders] = useState([]);
  const [showViewModal, setShowViewModal] = useState(false);
const [showEditModal, setShowEditModal] = useState(false);

const [selectedProduct, setSelectedProduct] = useState(null);
const [viewingProduct, setViewingProduct] = useState(false);
const [savingProduct, setSavingProduct] = useState(false);
const [showAddProductModal, setShowAddProductModal] = useState(false);
const [creatingProduct, setCreatingProduct] = useState(false);

const [addProductForm, setAddProductForm] = useState({
  product_name: "",
  brand: "",
  actual_price: "",
  offer_price: "",
  discount_percentage: "",
  stock: "",
  product_description: "",
  product_images: [],
  is_active: true,
});
const [editProduct, setEditProduct] = useState({
  product_name: "",
  brand: "",
  actual_price: "",
  offer_price: "",
  discount_percentage: "",
  product_description: "",
  product_images: [],
  is_active: true,
});

  const fileInputRef = useRef(null);

  const productsPerPage = 5;

  /* ============================================================
     TOKEN
  ============================================================ */

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken")
    );
  };

  /* ============================================================
     FETCH PRODUCTS
  ============================================================ */

  const fetchProducts = async (searchValue = "") => {
  try {
    setLoadingProducts(true);

    const token = getToken();

    if (!token) {
      console.error("Admin token not found");
      return;
    }

    const trimmedSearch = searchValue.trim();

    let url = `${import.meta.env.VITE_API_BASE_URL}/api/admin/products?page=1&limit=100`;

    if (trimmedSearch.length >= 3) {
      url += `&search=${encodeURIComponent(trimmedSearch)}`;
    }

    console.log("Fetching products:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    console.log("Products API response:", result);

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to fetch products"
      );
    }

    const apiProducts =
      result?.data?.products ||
      result?.data?.items ||
      result?.products ||
      result?.items ||
      [];

    const formattedProducts = apiProducts.map((product) => {
      const actualPrice = Number(
        product.actual_price ??
          product.mrp ??
          product.price ??
          0
      );

      const offerPrice = Number(
        product.offer_price ??
          product.selling_price ??
          product.sellingPrice ??
          actualPrice
      );

      const stock = Number(
        product.stock ??
          product.stock_quantity ??
          product.stockQuantity ??
          product.quantity ??
          product.inventory?.stock ??
          0
      );

      const isActive =
        product.is_active !== undefined
          ? Boolean(product.is_active)
          : String(
              product.status || "Active"
            ).toLowerCase() === "active";

      return {
        id:
          product.id ||
          product.product_id,

        name:
          product.product_name ||
          product.name ||
          "-",

        brand:
          product.brand ||
          product.brandName ||
          product.product_brand ||
          product.brand_name ||
          "-",

        category:
          product.category ||
          product.category_name ||
          "-",

        sellingPrice: offerPrice,

        mrp: actualPrice,

        stock,

        product_images: normalizeProductImages(
          product.product_images ||
            product.image_urls ||
            product.images ||
            []
        ),

        status:
          getProductStatus(stock, isActive),
      };
    });

    setProducts(formattedProducts);
  } catch (error) {
    console.error(
      "Fetch products error:",
      error
    );

    alert(
      error.message ||
        "Failed to fetch products"
    );
  } finally {
    setLoadingProducts(false);
  }
};
  /* ============================================================
     LOAD PRODUCTS
  ============================================================ */

  // useEffect(() => {
  //   fetchProducts();
  // }, []);

  /* ============================================================
     IMPORT EXCEL BUTTON
  ============================================================ */

  const handleImportButton = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  /* ============================================================
     FILE SELECT
  ============================================================ */

  const handleFileSelect = (e) => {
  const file = e.target.files?.[0];

  if (!file) {
    return;
  }

  const fileName = file.name.toLowerCase();

  const isExcel =
    fileName.endsWith(".xlsx") ||
    fileName.endsWith(".xls");

  if (!isExcel) {
    alert("Please select an Excel file (.xlsx or .xls).");
    e.target.value = "";
    return;
  }

  if (file.size === 0) {
    alert("The selected Excel file is empty.");
    e.target.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = (event) => {
    try {
      const data = new Uint8Array(event.target.result);

      const workbook = XLSX.read(data, {
        type: "array",
      });

      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        throw new Error("No worksheet found in the Excel file.");
      }

      const worksheet = workbook.Sheets[firstSheetName];

      const rows = XLSX.utils.sheet_to_json(worksheet, {
        defval: "",
      });

      if (rows.length === 0) {
        alert("The Excel file does not contain any product data.");
        e.target.value = "";
        return;
      }

      const headers = Object.keys(rows[0]);

      setSelectedFile(file);
      setExcelHeaders(headers);
      setExcelProducts(
        rows.map((row, index) => ({
          ...row,
          _previewId: `${Date.now()}-${index}`,
        }))
      );
      setEditingExcelProductId(null);
      setExcelProductDraft(null);

      setFileChecked(false);
      setShowImportModal(true);

      console.log("Excel preview:", rows);
    } catch (error) {
      console.error("Excel preview error:", error);
      alert(
        error.message ||
          "Unable to read the Excel file."
      );

      e.target.value = "";
    }
  };

  reader.onerror = () => {
    alert("Failed to read the Excel file.");
    e.target.value = "";
  };

  reader.readAsArrayBuffer(file);
};
const startEditingExcelProduct = (product) => {
  setEditingExcelProductId(product._previewId);
  setExcelProductDraft({ ...product });
  setFileChecked(false);
};

const cancelEditingExcelProduct = () => {
  setEditingExcelProductId(null);
  setExcelProductDraft(null);
};

const saveEditingExcelProduct = () => {
  if (!excelProductDraft) return;

  setExcelProducts((currentProducts) =>
    currentProducts.map((product) =>
      product._previewId === editingExcelProductId
        ? excelProductDraft
        : product
    )
  );
  setEditingExcelProductId(null);
  setExcelProductDraft(null);
  setFileChecked(false);
};

const handleDeleteExcelRow = (previewId) => {
  const confirmed = window.confirm(
    "Are you sure you want to remove this product from the import?"
  );

  if (!confirmed) {
    return;
  }

  setExcelProducts((currentProducts) =>
    currentProducts.filter(
      (product) => product._previewId !== previewId
    )
  );

  if (editingExcelProductId === previewId) {
    cancelEditingExcelProduct();
  }

  setFileChecked(false);
};

  /* ============================================================
     SUBMIT EXCEL IMPORT
  ============================================================ */

  const handleSubmitImport = async () => {
    if (!selectedFile) {
      alert("Please select an Excel file.");
      return;
    }

    if (!fileChecked) {
      alert(
        "Please check the Excel file before submitting."
      );
      return;
    }

    try {
      setImporting(true);

      const token = getToken();

      if (!token) {
        alert(
          "Authentication token not found. Please login again."
        );
        return;
      }

      const formData = new FormData();
      const mergedRows = consolidateExcelProductRows(excelProducts);
      const matchedRows = [];
      const newRows = [];

      mergedRows.forEach((row) => {
        const { productName, brand } = getExcelProductDetails(row);
        const matchingProduct = findMatchingProduct(
          products,
          productName,
          brand
        );

        if (matchingProduct) {
          matchedRows.push({ row, matchingProduct });
        } else {
          newRows.push(row);
        }
      });

      console.log(
        "Importing Excel:",
        selectedFile.name
      );

      let importData = {};
      let importResult = {};

      if (newRows.length > 0) {
        const workbook = XLSX.read(
          new Uint8Array(await selectedFile.arrayBuffer()),
          { type: "array" }
        );
        const sheetName = workbook.SheetNames[0];
        const importHeaders = [
          ...new Set(excelHeaders.map(normalizeProductImportHeader)),
        ];
        const normalizedHeaders = importHeaders.map((header) =>
          String(header).toLowerCase().replace(/[^a-z0-9]/g, "")
        );

        if (!normalizedHeaders.includes("product")) {
          importHeaders.unshift("Product");
        }

        if (!normalizedHeaders.some((header) =>
          ["brand", "brandname"].includes(header)
        )) {
          importHeaders.push("Brand");
        }
        if (!normalizedHeaders.some((header) =>
          ["stock", "quantity", "stockquantity"].includes(header)
        )) {
          importHeaders.push("Stock");
        }

        const importRows = newRows.map((row) => {
          const { productName, brand, stock } = getExcelProductDetails(row);
          const normalizedRow = Object.fromEntries(
            excelHeaders.map((header) => [
              normalizeProductImportHeader(header),
              row[header] ?? "",
            ])
          );
          normalizedRow.Product = productName;
          normalizedRow.Brand = brand;
          normalizedRow.Stock = stock;
          return Object.fromEntries(
            importHeaders.map((header) => [header, normalizedRow[header] ?? ""])
          );
        });

        workbook.Sheets[sheetName] = XLSX.utils.json_to_sheet(importRows, {
          header: importHeaders,
        });

        const fileContents = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "array",
        });
        const importFile = new File(
          [fileContents],
          selectedFile.name.replace(/\.xls(x)?$/i, ".xlsx"),
          { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
        );
        formData.append("file", importFile);

        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/admin/products/import`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }
        );

        const result = await response.json();
        console.log("Excel import response:", result);

        if (!response.ok) {
          throw new Error(result.message || "Failed to import products");
        }

        importResult = result;
        importData = result?.data || {};
      }

      for (const { row, matchingProduct } of matchedRows) {
        const { stock } = getExcelProductDetails(row);
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/admin/products/${matchingProduct.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              stock: getUpdatedStock(matchingProduct.stock, stock),
            }),
          }
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to update product stock");
        }
      }

      const completed =
        (importData.inserted ?? 0) + matchedRows.length;

      const failed =
        importData.failed ?? 0;

      const totalRows = Math.max(
        (importData.total_rows ?? newRows.length) + matchedRows.length,
        completed + failed
      );

      const failureDetails =
        importData.failed_rows ??
        importData.failures ??
        importData.errors ??
        importResult.failed_rows ??
        importResult.failures ??
        importResult.errors;
      const failureMessage = Array.isArray(failureDetails)
        ? failureDetails
            .slice(0, 3)
            .map((failure) => {
              if (typeof failure === "string") return failure;
              const rowNumber = failure.row ?? failure.row_number;
              const reason =
                failure.message ?? failure.error ?? failure.reason;
              return `${rowNumber ? `Row ${rowNumber}: ` : ""}${reason || JSON.stringify(failure)}`;
            })
            .join("\n")
        : typeof failureDetails === "string"
          ? failureDetails
          : "";

      if (failed > 0) {
        alert(
          `Import completed.\n\nTotal rows: ${totalRows}\nAdded or updated: ${completed}\nFailed: ${failed}${failureMessage ? `\n\nDetails:\n${failureMessage}` : "\n\nThe server did not provide row-level details. Check the Excel import response in the browser console."}`
        );
      } else {
        alert(
          `Products imported successfully.\n\nTotal rows: ${totalRows}\nAdded or updated: ${completed}`
        );
      }

      /* ---------------------------------------------
         CLOSE IMPORT MODAL
      --------------------------------------------- */

      setShowImportModal(false);
      setSelectedFile(null);
      setFileChecked(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      /* ---------------------------------------------
         REFRESH PRODUCTS FROM DATABASE
      --------------------------------------------- */

      setCurrentPage(1);

      await fetchProducts();
    } catch (error) {
      console.error(
        "Excel import error:",
        error
      );

      alert(
        error.message ||
          "Failed to import products"
      );
    } finally {
      setImporting(false);
    }
  };

  /* ============================================================
     CLOSE IMPORT MODAL
  ============================================================ */

  const closeImportModal = () => {
    if (importing) {
      return;
    }

    setShowImportModal(false);
    setSelectedFile(null);
    setFileChecked(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  /* ============================================================
   VIEW PRODUCT
============================================================ */

const handleViewProduct = async (productId) => {
  try {
    setViewingProduct(true);

    const token = getToken();

    if (!token) {
      alert("Authentication token not found. Please login again.");
      return;
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/admin/products/${productId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    console.log("View product response:", result);

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to fetch product"
      );
    }

    const product = result?.data;

    setSelectedProduct(product);
    setShowViewModal(true);
  } catch (error) {
    console.error("View product error:", error);

    alert(
      error.message || "Failed to fetch product"
    );
  } finally {
    setViewingProduct(false);
  }
};
const handleEditProduct = async (productId) => {
  try {
    setViewingProduct(true);

    const token = getToken();

    if (!token) {
      alert("Authentication token not found. Please login again.");
      return;
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/admin/products/${productId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    console.log("Edit product response:", result);

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to fetch product"
      );
    }

    const product = result?.data;

    if (!product) {
      throw new Error("Product data not found");
    }

    setSelectedProduct(product);

    setEditProduct({
      product_name: product.product_name || "",
      brand: product.brand || product.brand_name || "",
      actual_price: product.actual_price ?? "",
      offer_price: product.offer_price ?? "",
      discount_percentage:
        product.discount_percentage ?? "",
      stock: product.stock ?? "",
      product_images: normalizeProductImages(
        product.product_images ||
          product.image_urls ||
          product.images ||
          []
      ),
      product_description:
        product.product_description || "",
      is_active:
        product.is_active !== undefined
          ? product.is_active
          : true,
    });

    setShowEditModal(true);
  } catch (error) {
    console.error("Edit product error:", error);

    alert(
      error.message || "Failed to load product details"
    );
  } finally {
    setViewingProduct(false);
  }
};
const handleSaveProduct = async () => {
  try {
    setSavingProduct(true);

    const token = getToken();

    if (!token) {
      alert("Authentication token not found. Please login again.");
      return;
    }

    if (!selectedProduct?.id) {
      alert("Product ID not found.");
      return;
    }

    const payload = {
      product_name: editProduct.product_name.trim(),
      brand: editProduct.brand.trim(),
      actual_price: Number(editProduct.actual_price),
      offer_price: Number(editProduct.offer_price),
      discount_percentage: Number(
        editProduct.discount_percentage
      ),
      stock: Number(editProduct.stock),
      product_description:
        editProduct.product_description.trim(),
      product_images: normalizeProductImages(
        editProduct.product_images
      ),
      is_active: Number(editProduct.stock) > 0,
    };

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/admin/products/${selectedProduct.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    console.log("Update product response:", result);

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to update product"
      );
    }

    alert("Product updated successfully");

    setShowEditModal(false);
    setSelectedProduct(null);

    await fetchProducts(search.trim());
  } catch (error) {
    console.error("Update product error:", error);

    alert(
      error.message || "Failed to update product"
    );
  } finally {
    setSavingProduct(false);
  }
};
const handleDeleteProduct = (productId) => {
  const confirmed = window.confirm(
    "Are you sure you want to remove this product."
  );

  if (!confirmed) {
    return;
  }

  setProducts((currentProducts) =>
    removeProductById(currentProducts, productId)
  );

  alert("Product removed.");
};
const handleCreateProduct = async (e) => {
  e.preventDefault();

  try {
    setCreatingProduct(true);

    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token");

    if (!token) {
      alert("Authentication token not found. Please login again.");
      return;
    }

    const productName = addProductForm.product_name.trim();
    const brand = addProductForm.brand.trim();
    const stockToAdd = Number(addProductForm.stock);
    const matchingProduct = findMatchingProduct(
      products,
      productName,
      brand
    );

    const payload = {
      product_name: productName,

      brand,

      actual_price: Number(addProductForm.actual_price),

      offer_price: Number(addProductForm.offer_price),

      discount_percentage: Number(
        addProductForm.discount_percentage || 0
      ),

      stock: stockToAdd,

      product_description:
        addProductForm.product_description.trim(),

      product_images: normalizeProductImages(
        addProductForm.product_images
      ),

      is_active: addProductForm.is_active,
    };

    if (matchingProduct) {
      const updatedStock = getUpdatedStock(
        matchingProduct.stock,
        stockToAdd
      );

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/products/${matchingProduct.id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            stock: updatedStock,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to increase stock"
        );
      }

      alert(
        `Stock increased by ${stockToAdd} for ${productName}.`
      );
    } else {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/products`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to create product"
        );
      }

      alert("Product created successfully");
    }

    setAddProductForm({
      product_name: "",
      brand: "",
      actual_price: "",
      offer_price: "",
      discount_percentage: "",
      stock: "",
      product_description: "",
      product_images: [],
      is_active: true,
    });

    setShowAddProductModal(false);

    setCurrentPage(1);

    await fetchProducts(search.trim());
  } catch (error) {
    console.error("Create product error:", error);

    alert(error.message || "Failed to create product");
  } finally {
    setCreatingProduct(false);
  }
};
  /* ============================================================
     SEARCH
  ============================================================ */

  const filteredProducts = products;
  /* ============================================================
     STATISTICS
  ============================================================ */

  const totalProducts =
    products.length;

  const activeProducts =
    products.filter(
      (product) =>
        product.status.toLowerCase() ===
        "active"
    ).length;

  const outOfStockProducts =
    products.filter(
      (product) =>
        product.stock === 0
    ).length;

  const lowStockProducts =
    products.filter((product) =>
      isLowStock(product.stock)
    ).length;

  /* ============================================================
     PAGINATION
  ============================================================ */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredProducts.length /
        productsPerPage
    )
  );

  const startIndex =
    (currentPage - 1) *
    productsPerPage;

  const currentProducts =
    filteredProducts.slice(
      startIndex,
      startIndex + productsPerPage
    );

  /* ============================================================
     SEARCH PAGE RESET
  ============================================================ */

  useEffect(() => {
  const trimmedSearch = search.trim();

  setCurrentPage(1);

  if (
    trimmedSearch.length > 0 &&
    trimmedSearch.length < 3
  ) {
    return;
  }

  const timer = setTimeout(() => {
    fetchProducts(trimmedSearch);
  }, 500);

  return () => clearTimeout(timer);
}, [search]);
  /* ============================================================
     PAGE SAFETY
  ============================================================ */

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  /* ============================================================
     RETURN
  ============================================================ */

  return (
    <div className="products-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="products-header">

        <div>
          <h1>Products</h1>

          <p>
            Manage VanyaGlo beauty products
            and inventory
          </p>
        </div>

        <div className="products-header-actions">

          {/* Download Template */}

          <a
            href="/templates/VanyaGlo_Product_Import_Template.xlsx"
            download
            className="download-template-btn"
          >
            Download Template
          </a>

          {/* Import Excel */}

          <button
            type="button"
            className="import-product-btn"
            onClick={handleImportButton}
          >
            Import Excel
          </button>

          {/* Add Product */}

          <button
  type="button"
  className="add-product-btn"
  onClick={() => setShowAddProductModal(true)}
>
  + Add Product
</button>

          {/* Hidden File Input */}

          <input
            ref={fileInputRef}
            id="excel-upload"
            type="file"
            accept=".xlsx,.xls"
            style={{
              display: "none",
            }}
            onChange={
              handleFileSelect
            }
          />

        </div>
      </div>

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <div className="products-search-section">

        <div className="products-search">

          <input
            type="text"
            placeholder="Search by name, brand, category"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

          <span className="products-search-icon">
            ⌕
          </span>

        </div>

      </div>

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="products-stats">

        <div className="products-stat-card">

          <div className="products-stat-number">
            {String(
              totalProducts
            ).padStart(2, "0")}
          </div>

          <div className="products-stat-label">
            Total Products
          </div>

        </div>

        <div className="products-stat-card">

          <div className="products-stat-number">
            {String(
              activeProducts
            ).padStart(2, "0")}
          </div>

          <div className="products-stat-label">
            Active
          </div>

        </div>

        <div className="products-stat-card">

          <div className="products-stat-number">
            {String(
              outOfStockProducts
            ).padStart(2, "0")}
          </div>

          <div className="products-stat-label">
            Out of Stock
          </div>

        </div>

        <div className="products-stat-card">

          <div className="products-stat-number">
            {String(
              lowStockProducts
            ).padStart(2, "0")}
          </div>

          <div className="products-stat-label">
            Low Stock
          </div>

        </div>

      </div>

      {/* =====================================================
          PRODUCTS TABLE
      ===================================================== */}

      <div className="products-table-section">

        <div className="products-table-wrapper">

          <table className="products-table">

            <thead>

              <tr>
                <th>Product</th>
                <th>Brand</th>
                {/* <th>Category</th> */}
                <th>Selling Price</th>
                <th>MRP</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>

            </thead>

            <tbody>

              {loadingProducts ? (

                <tr>

                  <td
                    colSpan="8"
                    className="no-products"
                  >
                    Loading products...
                  </td>

                </tr>

              ) : filteredProducts.length > 0 ? (

                currentProducts.map(
                  (product) => (

                    <tr
                      key={product.id}
                    >

                      {/* Product */}

                      <td>

                        <div className="product-table-info">

                          <div className="product-avatar">

                            {product.name
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

                      {/* <td>
                        {product.category}
                      </td> */}

                      {/* Selling Price */}

                      <td>
                        ₹
                        {Number(
                          product.sellingPrice
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      {/* MRP */}

                      <td>
                        ₹
                        {Number(
                          product.mrp
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      {/* Stock */}

                      <td>

                        <span
                          className={
                            product.stock === 0
                              ? "stock-out"
                              : isLowStock(product.stock)
                              ? "stock-low"
                              : "stock-normal"
                          }
                        >
                          {product.stock}{" "}
                          units
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
  type="button"
  className="product-action-btn"
  onClick={() => handleViewProduct(product.id)}
>
  View
</button>

                          <button
  type="button"
  className="product-action-btn"
  onClick={() => handleEditProduct(product.id)}
>
  Edit
</button>

                          <button
  type="button"
  className="product-action-btn delete"
  onClick={() => handleDeleteProduct(product.id)}
>
  Delete
</button>

                        </div>

                      </td>

                    </tr>

                  )
                )

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

        {/* =================================================
            PAGINATION
        ================================================= */}

        <div className="products-pagination">

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
              currentPage === 1
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
              currentPage ===
              totalPages
            }
          >
            &gt;
          </button>

        </div>

      </div>

      {/* =====================================================
          IMPORT EXCEL MODAL
      ===================================================== */}

      {showImportModal && (
  <div
    className="modal-overlay"
    onClick={closeImportModal}
  >
    <div
      className="add-product-modal"
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "95%",
        maxWidth: "1200px",
        maxHeight: "90vh",
        overflowY: "auto",
      }}
    >
      {/* Modal Header */}
      {/* Modal Header */}
<div className="modal-header">
  {/* Left Side - Title */}
  <div className="modal-header-title">
    <h2>Import Products</h2>

    <p>
      Review the Excel products before importing.
    </p>
  </div>

  {/* Selected Excel File - Top Right */}
  <div
    style={{
      border: "1px solid #eeeeee",
      borderRadius: "8px",
      padding: "8px 14px",
      background: "#fafafa",
      minWidth: "210px",
      maxWidth: "280px",
    }}
  >
    <div
      style={{
        fontWeight: "600",
        fontSize: "13px",
        marginBottom: "3px",
      }}
    >
      Selected Excel File
    </div>

    <div
      style={{
        fontSize: "13px",
        color: "#555",
        wordBreak: "break-word",
      }}
    >
      {selectedFile?.name || "-"}
    </div>

    {selectedFile && (
      <div
        style={{
          marginTop: "3px",
          fontSize: "11px",
          color: "#888",
        }}
      >
        Size:{" "}
        {(selectedFile.size / 1024).toFixed(1)} KB
      </div>
    )}
  </div>

  {/* Close Button */}
  <button
    type="button"
    className="modal-close-btn"
    onClick={closeImportModal}
    disabled={importing}
  >
    ×
  </button>
</div>

{/* Modal Body */}
<div
  style={{
    padding: "20px",
  }}
>
        {/* Excel Products Preview */}
        {excelProducts.length > 0 && (
          <div
            style={{
              marginBottom: "20px",
            }}
          >
            {/* Preview Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              
              <div
                style={{
                  padding: "6px 12px",
                  borderRadius: "20px",
                  background: "#fff1f3",
                  color: "#ed4d62",
                  fontSize: "13px",
                  fontWeight: "600",
                  whiteSpace: "nowrap",
                }}
              >
                {excelProducts.length} product
                {excelProducts.length !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Preview Table */}
            <div
              style={{
                width: "100%",
                border: "1px solid #e5e5e5",
                borderRadius: "8px",
                overflow: "auto",
                maxHeight: "360px",
              }}
            >
              <table
                style={{
                  width: "100%",
                  minWidth: "1000px",
                  borderCollapse: "collapse",
                  fontSize: "13px",
                }}
              >
                <thead>
                  <tr>
                    {/* Number */}
                    <th
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        background: "#f7f7f7",
                        padding: "10px 12px",
                        borderBottom: "1px solid #ddd",
                        textAlign: "left",
                        whiteSpace: "nowrap",
                      }}
                    >
                      #
                    </th>

                    {/* Excel Headers */}
                    {excelHeaders.map((header) => (
                      <th
                        key={header}
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                          background: "#f7f7f7",
                          padding: "10px 12px",
                          borderBottom: "1px solid #ddd",
                          textAlign: "left",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {String(header)
                          .replaceAll("_", " ")
                          .replace(
                            /\b\w/g,
                            (char) => char.toUpperCase()
                          )}
                      </th>
                    ))}

                    {/* Action */}
                    <th
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        background: "#f7f7f7",
                        padding: "10px 12px",
                        borderBottom: "1px solid #ddd",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {excelProducts.map(
                    (product, index) => {
                      const isEditing =
                        editingExcelProductId === product._previewId;
                      const rowData = isEditing
                        ? excelProductDraft || product
                        : product;

                      return (
                        <tr
                        key={product._previewId}
                        style={{
                          borderBottom:
                            "1px solid #eeeeee",
                        }}
                      >
                        {/* Number */}
                        <td
                          style={{
                            padding: "10px 12px",
                            color: "#555",
                            verticalAlign: "top",
                          }}
                        >
                          {index + 1}
                        </td>

                        {/* Product Data */}
                        {excelHeaders.map(
                          (header) => (
                            <td
                              key={`${product._previewId}-${header}`}
                              title={String(
                                rowData[header] ?? ""
                              )}
                              style={{
                                padding:
                                  "10px 12px",
                                color: "#444",
                                maxWidth: isEditing ? "260px" : "220px",
                                whiteSpace: isEditing ? "normal" : "nowrap",
                                overflow: isEditing ? "visible" : "hidden",
                                textOverflow: isEditing ? "clip" : "ellipsis",
                                verticalAlign:
                                  "top",
                              }}
                            >
                              {isEditing ? (
                                normalizeProductImportHeader(header) ===
                                "Product Images" ? (
                                  <div>
                                    <textarea
                                      value={String(rowData[header] ?? "")}
                                      onChange={(event) =>
                                        setExcelProductDraft((current) => ({
                                          ...current,
                                          [header]: event.target.value,
                                        }))
                                      }
                                      rows={3}
                                      aria-label={`Edit ${header}`}
                                      style={{
                                        width: "220px",
                                        resize: "vertical",
                                      }}
                                    />
                                    <ExcelImagePreview images={rowData[header]} />
                                  </div>
                                ) : normalizeProductImportHeader(header) ===
                                  "Product Description" ? (
                                  <textarea
                                    value={String(rowData[header] ?? "")}
                                    onChange={(event) =>
                                      setExcelProductDraft((current) => ({
                                        ...current,
                                        [header]: event.target.value,
                                      }))
                                    }
                                    rows={3}
                                    aria-label={`Edit ${header}`}
                                    style={{ width: "200px", resize: "vertical" }}
                                  />
                                ) : (
                                  <input
                                    type={
                                      ["MRP", "Selling Price", "Stock", "Discount"].includes(
                                        normalizeProductImportHeader(header)
                                      )
                                        ? "number"
                                        : "text"
                                    }
                                    value={String(rowData[header] ?? "")}
                                    onChange={(event) =>
                                      setExcelProductDraft((current) => ({
                                        ...current,
                                        [header]: event.target.value,
                                      }))
                                    }
                                    aria-label={`Edit ${header}`}
                                    style={{ width: "150px" }}
                                  />
                                )
                              ) : (
                                normalizeProductImportHeader(header) ===
                                "Product Images" ? (
                                  <ExcelImagePreview images={rowData[header]} />
                                ) : (
                                  String(rowData[header] ?? "-")
                                )
                              )}
                            </td>
                          )
                        )}

                        {/* Row Actions */}
                        {/* Row Actions */}
<td
  style={{
    padding: "10px 12px",
    textAlign: "center",
    verticalAlign: "top",
  }}
>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
    }}
  >
    {isEditing ? (
      <>
        <button
          type="button"
          onClick={saveEditingExcelProduct}
          disabled={importing}
          style={{
            border: "1px solid #ed4d62",
            background: "#ed4d62",
            color: "#fff",
            borderRadius: "5px",
            padding: "6px 12px",
            cursor: importing ? "not-allowed" : "pointer",
            fontWeight: "600",
            fontSize: "12px",
          }}
        >
          Save
        </button>

        <button
          type="button"
          onClick={cancelEditingExcelProduct}
          disabled={importing}
          style={{
            border: "1px solid #ccc",
            background: "#fff",
            color: "#555",
            borderRadius: "5px",
            padding: "6px 12px",
            cursor: importing ? "not-allowed" : "pointer",
            fontWeight: "600",
            fontSize: "12px",
          }}
        >
          Cancel
        </button>
      </>
    ) : (
      <>
        <button
          type="button"
          onClick={() => startEditingExcelProduct(product)}
          disabled={importing}
          style={{
            border: "1px solid #777",
            background: "#fff",
            color: "#555",
            borderRadius: "5px",
            padding: "6px 12px",
            cursor: importing ? "not-allowed" : "pointer",
            fontWeight: "600",
            fontSize: "12px",
          }}
        >
          Edit
        </button>

        <button
          type="button"
          onClick={() =>
            handleDeleteExcelRow(product._previewId)
          }
          disabled={importing}
          style={{
            border: "1px solid #ed4d62",
            background: "#fff",
            color: "#ed4d62",
            borderRadius: "5px",
            padding: "6px 12px",
            cursor: importing ? "not-allowed" : "pointer",
            fontWeight: "600",
            fontSize: "12px",
          }}
        >
          Delete
        </button>
      </>
    )}
  </div>
</td>
                      </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Products */}
        {selectedFile &&
          excelProducts.length === 0 && (
            <div
              style={{
                padding: "20px",
                marginBottom: "18px",
                border: "1px solid #eeeeee",
                borderRadius: "8px",
                textAlign: "center",
                color: "#777",
                background: "#fafafa",
              }}
            >
              No products available for import.
            </div>
          )}

        {/* Confirmation */}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            marginBottom: "18px",
            cursor:
              selectedFile &&
              excelProducts.length > 0 &&
              !importing
                ? "pointer"
                : "not-allowed",
            opacity:
              selectedFile &&
              excelProducts.length > 0 &&
              !importing
                ? 1
                : 0.5,
          }}
        >
          <input
            type="checkbox"
            checked={fileChecked}
            onChange={(event) =>
              setFileChecked(event.target.checked)
            }
            disabled={
              !selectedFile ||
              excelProducts.length === 0 ||
              importing
            }
          />

          <span>
            I have checked the Excel file and
            want to import it.
          </span>
        </label>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmitImport}
          disabled={
            !fileChecked ||
            excelProducts.length === 0 ||
            importing
          }
          style={{
  display: "block",
  width: "160px",
  padding: "10px 16px",
  marginLeft: "auto",
  border: "none",
  borderRadius: "6px",
  background:
    !fileChecked ||
    excelProducts.length === 0 ||
    importing
      ? "#cccccc"
      : "#ed4d62",
  color: "#fff",
  cursor:
    !fileChecked ||
    excelProducts.length === 0 ||
    importing
      ? "not-allowed"
      : "pointer",
  fontWeight: "600",
}}
        >
          {importing
            ? "Importing..."
            : "Submit Import"}
        </button>
      </div>
    </div>
  </div>
)}
      {showViewModal && selectedProduct && (
  <div
    className="modal-overlay"
    onClick={() => setShowViewModal(false)}
  >
    <div
      className="view-product-modal"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Modal Header */}
      <div className="modal-header">
        <div>
          <h2>Product Details</h2>
          <p>View product information</p>
        </div>

        <button
          type="button"
          className="modal-close-btn"
          onClick={() => setShowViewModal(false)}
        >
          ×
        </button>
      </div>

      {/* Product Details */}
      <div className="view-product-content">

  {/* LEFT HALF */}
  <div className="view-product-half">

    {/* Product Name */}
    <div className="view-product-row">
      <div className="view-product-label">
        Product Name
      </div>

      <div className="view-product-value">
        {selectedProduct.product_name || "-"}
      </div>
    </div>

    {/* Brand */}
    <div className="view-product-row">
      <div className="view-product-label">
        Brand
      </div>

      <div className="view-product-value">
        {selectedProduct.brand || "-"}
      </div>
    </div>

    {/* Product Images */}
    <div className="view-product-image-section">
      <div className="view-product-label">
        Product Images
      </div>

      <div className="view-product-images">
        {normalizeProductImages(
          selectedProduct.product_images ||
            selectedProduct.image_urls ||
            selectedProduct.images ||
            []
        ).length > 0 ? (
          normalizeProductImages(
            selectedProduct.product_images ||
              selectedProduct.image_urls ||
              selectedProduct.images ||
              []
          ).map((image, index) => (
            <img
              key={`${image}-${index}`}
              src={image}
              alt={`${selectedProduct.product_name || "Product"} ${
                index + 1
              }`}
              className="view-product-image"
            />
          ))
        ) : (
          <span className="no-product-image">
            No images available
          </span>
        )}
      </div>
    </div>

  </div>


  {/* RIGHT HALF */}
  <div className="view-product-half">

    {/* Actual Price */}
    <div className="view-product-row">
      <div className="view-product-label">
        Actual Price
      </div>

      <div className="view-product-value">
        ₹
        {Number(
          selectedProduct.actual_price || 0
        ).toLocaleString("en-IN")}
      </div>
    </div>

    {/* Offer Price */}
    <div className="view-product-row">
      <div className="view-product-label">
        Offer Price
      </div>

      <div className="view-product-value">
        ₹
        {Number(
          selectedProduct.offer_price || 0
        ).toLocaleString("en-IN")}
      </div>
    </div>

    {/* Discount */}
    <div className="view-product-row">
      <div className="view-product-label">
        Discount
      </div>

      <div className="view-product-value">
        {selectedProduct.discount_percentage ?? 0}%
      </div>
    </div>

    {/* Description */}
    <div className="view-product-row">
      <div className="view-product-label">
        Description
      </div>

      <div className="view-product-value view-product-description">
        {selectedProduct.product_description || "-"}
      </div>
    </div>

    {/* Status */}
    <div className="view-product-row">
      <div className="view-product-label">
        Status
      </div>

      <div className="view-product-value">
        <span
          className={`view-product-status ${
            selectedProduct.is_active
              ? "active"
              : "inactive"
          }`}
        >
          {selectedProduct.is_active
            ? "Active"
            : "Inactive"}
        </span>
      </div>
    </div>

  </div>

</div>
      {/* Close Button */}
      <div className="view-product-footer">
        <button
          type="button"
          className="view-product-close-btn"
          onClick={() => setShowViewModal(false)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
{showEditModal && selectedProduct && (
  <div
    className="modal-overlay"
    onClick={() => setShowEditModal(false)}
  >
    <div
      className="edit-product-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="modal-header">
        <div>
          <h2>Edit Product</h2>
          <p>Update product information</p>
        </div>

        <button
          type="button"
          className="modal-close-btn"
          onClick={() => setShowEditModal(false)}
        >
          ×
        </button>
      </div>

      <div className="edit-product-content">

        <div className="edit-product-field">
          <label>Product Name</label>

          <input
            type="text"
            value={editProduct.product_name}
            onChange={(e) =>
              setEditProduct({
                ...editProduct,
                product_name: e.target.value,
              })
            }
          />
        </div>
        <div className="form-group">
  <label>Brand</label>
  <input
    type="text"
    value={editProduct.brand}
    onChange={(e) =>
      setEditProduct({
        ...editProduct,
        brand: e.target.value,
      })
    }
    placeholder="Enter brand name"
  />
</div>

        <div className="edit-product-field">
          <label>Stock</label>
          <input
            type="number"
            min="0"
            value={editProduct.stock}
            onChange={(e) =>
              setEditProduct({
                ...editProduct,
                stock: e.target.value,
              })
            }
          />
        </div>

        <div className="edit-product-field">
          <label>Actual Price</label>

          <input
            type="number"
            min="0"
            value={editProduct.actual_price}
            onChange={(e) =>
              setEditProduct({
                ...editProduct,
                actual_price: e.target.value,
              })
            }
          />
        </div>

        <div className="edit-product-field">
          <label>Offer Price</label>

          <input
            type="number"
            min="0"
            value={editProduct.offer_price}
            onChange={(e) =>
              setEditProduct({
                ...editProduct,
                offer_price: e.target.value,
              })
            }
          />
        </div>

        <div className="edit-product-field">
          <label>Discount Percentage</label>

          <input
            type="number"
            min="0"
            max="100"
            value={editProduct.discount_percentage}
            onChange={(e) =>
              setEditProduct({
                ...editProduct,
                discount_percentage: e.target.value,
              })
            }
          />
        </div>

        <ProductImageLinks
          images={editProduct.product_images}
          onChange={(images) =>
            setEditProduct({
              ...editProduct,
              product_images: images,
            })
          }
        />

        <div className="edit-product-field">
          <label>Description</label>

          <textarea
            rows="4"
            value={editProduct.product_description}
            onChange={(e) =>
              setEditProduct({
                ...editProduct,
                product_description: e.target.value,
              })
            }
          />
        </div>

        <div className="edit-product-field">
          <label>Status</label>

          <select
            value={editProduct.is_active ? "active" : "inactive"}
            onChange={(e) =>
              setEditProduct({
                ...editProduct,
                is_active: e.target.value === "active",
              })
            }
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

      </div>

      <div className="edit-product-footer">
        <button
          type="button"
          className="edit-product-cancel-btn"
          onClick={() => setShowEditModal(false)}
          disabled={savingProduct}
        >
          Cancel
        </button>

        <button
          type="button"
          className="edit-product-save-btn"
          disabled={savingProduct}
          onClick={handleSaveProduct}
        >
          {savingProduct ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  </div>
)}
{showAddProductModal && (
  <div
    className="modal-overlay"
    onClick={() => setShowAddProductModal(false)}
  >
    <div
      className="edit-product-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="modal-header">
        <div>
          <h2>Add Product</h2>
          <p>Add new product information</p>
        </div>

        <button
          type="button"
          className="modal-close-btn"
          onClick={() => setShowAddProductModal(false)}
          disabled={creatingProduct}
        >
          ×
        </button>
      </div>

      <form onSubmit={handleCreateProduct}>
        <div className="edit-product-content">

          {/* Product Name */}
          <div className="edit-product-field">
            <label>Product Name</label>

            <input
              type="text"
              placeholder="Enter product name"
              value={addProductForm.product_name}
              onChange={(e) =>
                setAddProductForm({
                  ...addProductForm,
                  product_name: e.target.value,
                })
              }
              required
            />
          </div>
          <div className="form-group">
  <label>Brand</label>
  <input
    type="text"
    value={addProductForm.brand}
    onChange={(e) =>
      setAddProductForm({
        ...addProductForm,
        brand: e.target.value,
      })
    }
    placeholder="Enter brand name"
  />
</div>

          {/* Actual Price */}
          <div className="edit-product-field">
            <label>Actual Price</label>

            <input
              type="number"
              min="0"
              placeholder="Enter actual price"
              value={addProductForm.actual_price}
              onChange={(e) =>
                setAddProductForm({
                  ...addProductForm,
                  actual_price: e.target.value,
                })
              }
              required
            />
          </div>

          {/* Offer Price */}
          <div className="edit-product-field">
            <label>Offer Price</label>

            <input
              type="number"
              min="0"
              placeholder="Enter offer price"
              value={addProductForm.offer_price}
              onChange={(e) =>
                setAddProductForm({
                  ...addProductForm,
                  offer_price: e.target.value,
                })
              }
              required
            />
          </div>

          {/* Discount */}
          <div className="edit-product-field">
            <label>Discount Percentage</label>

            <input
              type="number"
              min="0"
              max="100"
              placeholder="Enter discount percentage"
              value={addProductForm.discount_percentage}
              onChange={(e) =>
                setAddProductForm({
                  ...addProductForm,
                  discount_percentage: e.target.value,
                })
              }
            />
          </div>

          <ProductImageLinks
            images={addProductForm.product_images}
            onChange={(images) =>
              setAddProductForm({
                ...addProductForm,
                product_images: images,
              })
            }
          />

          {/* Stock */}
          <div className="edit-product-field">
            <label>Stock</label>

            <input
              type="number"
              min="0"
              placeholder="Enter stock quantity"
              value={addProductForm.stock}
              onChange={(e) =>
                setAddProductForm({
                  ...addProductForm,
                  stock: e.target.value,
                })
              }
              required
            />
          </div>

          {/* Description */}
          <div className="edit-product-field">
            <label>Description</label>

            <textarea
              rows="4"
              placeholder="Enter product description"
              value={addProductForm.product_description}
              onChange={(e) =>
                setAddProductForm({
                  ...addProductForm,
                  product_description: e.target.value,
                })
              }
            />
          </div>

          {/* Status */}
          <div className="edit-product-field">
            <label>Status</label>

            <select
              value={
                addProductForm.is_active
                  ? "active"
                  : "inactive"
              }
              onChange={(e) =>
                setAddProductForm({
                  ...addProductForm,
                  is_active: e.target.value === "active",
                })
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

        </div>

        <div className="edit-product-footer">

          <button
            type="button"
            className="edit-product-cancel-btn"
            onClick={() => setShowAddProductModal(false)}
            disabled={creatingProduct}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="edit-product-save-btn"
            disabled={creatingProduct}
          >
            {creatingProduct
              ? "Creating..."
              : "Create Product"}
          </button>

        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
  
};

export default AdminProducts;