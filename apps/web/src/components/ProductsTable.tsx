import { useMemo, useState } from "react";
import type { Product } from "../lib/api";

type ProductsTableProps = {
  products: Product[];
  hasError: boolean;
  onProductDelete: (productId: string) => Promise<void>;
};

function formatCurrency(value: string | null) {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD"
  }).format(Number(value));
}

function calculateMargin(product: Product) {
  if (product.supplierCost === null) {
    return null;
  }

  const sellingPrice = Number(product.sellingPrice);
  const supplierCost = Number(product.supplierCost);

  if (sellingPrice <= 0) {
    return null;
  }

  return ((sellingPrice - supplierCost) / sellingPrice) * 100;
}

function formatMargin(product: Product) {
  const margin = calculateMargin(product);

  if (margin === null) {
    return "—";
  }

  return `${margin.toFixed(1)}%`;
}

export function ProductsTable({ products, hasError, onProductDelete }: ProductsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [costFilter, setCostFilter] = useState("all");
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const supplierOptions = useMemo(() => {
    const names = products
      .map((product) => product.supplier?.name)
      .filter((name): name is string => Boolean(name));

    return Array.from(new Set(names)).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.sku.toLowerCase().includes(normalizedSearch) ||
        (product.category ?? "").toLowerCase().includes(normalizedSearch);

      const matchesSupplier =
        supplierFilter === "all" ||
        (supplierFilter === "none" && product.supplier === null) ||
        product.supplier?.name === supplierFilter;

      const margin = calculateMargin(product);

      const matchesCost =
        costFilter === "all" ||
        (costFilter === "missingCost" && product.supplierCost === null) ||
        (costFilter === "lowMargin" && margin !== null && margin < 25);

      return matchesSearch && matchesSupplier && matchesCost;
    });
  }, [products, searchTerm, supplierFilter, costFilter]);

  async function handleDeleteProduct(product: Product) {
    const confirmed = window.confirm(
      `Delete product "${product.name}"? This may fail if the product is already used in an order.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingProductId(product.id);

    try {
      await onProductDelete(product.id);
    } finally {
      setDeletingProductId(null);
    }
  }

  return (
    <>
      <div className="table-toolbar">
        <div className="table-toolbar-header">
          <h3>Product filters</h3>
          <span>
            Showing {filteredProducts.length} of {products.length}
          </span>
        </div>

        <div className="filter-grid">
          <label>
            Search
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search name, SKU, or category"
            />
          </label>

          <label>
            Supplier
            <select
              value={supplierFilter}
              onChange={(event) => setSupplierFilter(event.target.value)}
            >
              <option value="all">All suppliers</option>
              <option value="none">No supplier</option>
              {supplierOptions.map((supplierName) => (
                <option key={supplierName} value={supplierName}>
                  {supplierName}
                </option>
              ))}
            </select>
          </label>

          <label>
            Cost / margin
            <select
              value={costFilter}
              onChange={(event) => setCostFilter(event.target.value)}
            >
              <option value="all">All products</option>
              <option value="missingCost">Missing supplier cost</option>
              <option value="lowMargin">Below 25% margin</option>
            </select>
          </label>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Supplier</th>
              <th>Category</th>
              <th>Selling Price</th>
              <th>Supplier Cost</th>
              <th>Margin</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.sku}</td>
                <td>{product.supplier?.name ?? "—"}</td>
                <td>{product.category ?? "—"}</td>
                <td>{formatCurrency(product.sellingPrice)}</td>
                <td>{formatCurrency(product.supplierCost)}</td>
                <td>{formatMargin(product)}</td>
                <td>
                  <button
                    className="danger-button small-button"
                    type="button"
                    disabled={deletingProductId === product.id}
                    onClick={() => handleDeleteProduct(product)}
                  >
                    {deletingProductId === product.id ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProducts.length === 0 && !hasError && (
          <p className="empty-state">No products match these filters.</p>
        )}
      </div>
    </>
  );
}