const normalizeValue = (value) =>
  String(value ?? "")
    .trim()
    .toLocaleLowerCase();

export const findMatchingProduct = (
  products,
  productName,
  brand
) => {
  const normalizedProductName = normalizeValue(productName);
  const normalizedBrand = normalizeValue(brand);

  if (!normalizedProductName || !normalizedBrand) {
    return undefined;
  }

  return products.find((product) => {
    const productNameToMatch =
      product.product_name || product.name;
    const brandToMatch =
      product.brand || product.brand_name;

    return (
      normalizeValue(productNameToMatch) ===
        normalizedProductName &&
      normalizeValue(brandToMatch) === normalizedBrand
    );
  });
};

const getExcelField = (row, aliases) => {
  const normalizedAliases = aliases.map((alias) =>
    alias.toLowerCase().replace(/[^a-z0-9]/g, "")
  );
  const field = Object.keys(row).find((key) =>
    normalizedAliases.includes(
      key.toLowerCase().replace(/[^a-z0-9]/g, "")
    )
  );

  return field ? row[field] : undefined;
};

export const normalizeProductImportHeader = (header) => {
  const normalizedHeader = String(header)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const canonicalHeaders = {
    product: "Product",
    productname: "Product",
    name: "Product",
    brand: "Brand",
    brandname: "Brand",
    mrp: "MRP",
    actualprice: "MRP",
    sellingprice: "Selling Price",
    offerprice: "Selling Price",
    stock: "Stock",
    quantity: "Stock",
    stockquantity: "Stock",
    discount: "Discount",
    discountpercentage: "Discount",
    discountpercent: "Discount",
    productimages: "Product Images",
    images: "Product Images",
    imageurls: "Product Images",
    productdescription: "Product Description",
    description: "Product Description",
  };

  return canonicalHeaders[normalizedHeader] || String(header).trim();
};

export const getExcelProductDetails = (row) => ({
  productName: String(
    getExcelField(row, ["product", "product_name", "product name", "name"]) ?? ""
  ).trim(),
  brand: String(
    getExcelField(row, ["brand", "brand_name", "brand name"]) ?? ""
  ).trim(),
  stock: Number(
    getExcelField(row, ["stock", "quantity", "stock_quantity"]) || 0
  ),
});

export const consolidateExcelProductRows = (rows) => {
  const consolidatedRows = [];
  const rowIndexes = new Map();

  rows.forEach((row) => {
    const { productName, brand, stock } = getExcelProductDetails(row);

    if (!productName || !brand) {
      consolidatedRows.push(row);
      return;
    }

    const key = `${normalizeValue(productName)}::${normalizeValue(brand)}`;
    const existingIndex = rowIndexes.get(key);

    if (existingIndex === undefined) {
      rowIndexes.set(key, consolidatedRows.length);
      consolidatedRows.push({ ...row });
      return;
    }

    const existingRow = consolidatedRows[existingIndex];
    const stockField = Object.keys(existingRow).find(
      (field) =>
        ["stock", "quantity", "stockquantity"].includes(
          field.toLowerCase().replace(/[^a-z0-9]/g, "")
        )
    ) || "Stock";

    existingRow[stockField] = getUpdatedStock(
      getExcelField(existingRow, ["stock", "quantity", "stock_quantity"]),
      stock
    );
  });

  return consolidatedRows;
};

export const getUpdatedStock = (currentStock, additionalStock) =>
  Number(currentStock || 0) + Number(additionalStock || 0);

export const isLowStock = (stock) => {
  const normalizedStock = Number(stock);

  return Number.isFinite(normalizedStock) &&
    normalizedStock > 0 &&
    normalizedStock < 10;
};

export const getProductStatus = (stock, isActive) => {
  const normalizedStock = Number(stock);

  if (
    Number.isFinite(normalizedStock) &&
    normalizedStock === 0
  ) {
    return "Inactive";
  }

  if (
    Number.isFinite(normalizedStock) &&
    normalizedStock > 0
  ) {
    return "Active";
  }

  return isActive ? "Active" : "Inactive";
};

export const removeProductById = (products, productId) =>
  products.filter((product) => product.id !== productId);

export const normalizeProductImages = (images) => {
  let source = images;

  if (!Array.isArray(source)) {
    const imageText = String(source ?? "").trim();

    if (imageText.startsWith("[")) {
      try {
        const parsedImages = JSON.parse(imageText);
        source = Array.isArray(parsedImages) ? parsedImages : [imageText];
      } catch {
        source = imageText.split(",");
      }
    } else {
      source = imageText.split(",");
    }
  }

  return source
    .map((image) => {
      if (typeof image === "string") {
        return image.trim();
      }

      if (image && typeof image === "object") {
        return (
          image.url ||
          image.image_url ||
          image.imageUrl ||
          image.src ||
          image.link ||
          ""
        );
      }

      return "";
    })
    .filter(Boolean)
    .map((image) => image.replace(/\s+/g, " "));
};
