import { useMemo, useState } from "react";
import type {
  Product,
  Supplier,
  UpdateProductInput
} from "../lib/api";

type ProductsTableProps = {
  products: Product[];
  suppliers: Supplier[];
  hasError: boolean;
  onProductUpdate: (
    productId: string,
    input: UpdateProductInput
  ) => Promise<void>;
  onProductDelete: (productId: string) => Promise<void>;
};

type ProductEditForm = {
  name: string;
  sku: string;
  supplierId: string;
  category: string;
  sellingPrice: string;
  supplierCost: string;
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

function getInitialEditForm(product: Product): ProductEditForm {
  return {
    name: product.name,
    sku: product.sku,
    supplierId: product.supplierId ?? "",
    category: product.category ?? "",
    sellingPrice: product.sellingPrice,
    supplierCost: product.supplierCost ?? ""
  };
}

export function ProductsTable({
  products,
  suppliers,
  hasError,
  onProductUpdate,
  onProductDelete
}: ProductsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [costFilter, setCostFilter] = useState("all");

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ProductEditForm | null>(null);
  const [savingProductId, setSavingProductId] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(
    null
  );
  const [tableError, setTableError] = useState("");

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

  function startEditingProduct(product: Product) {
    setTableError("");
    setEditingProductId(product.id);
    setEditForm(getInitialEditForm(product));
  }

  function cancelEditingProduct() {
    setEditingProductId(null);
    setEditForm(null);
  }

  function updateEditField(field: keyof ProductEditForm, value: string) {
    setEditForm((currentForm) => {
      if (!currentForm) {
        return currentForm;
      }

      return {
        ...currentForm,
        [field]: value
      };
    });
  }

  async function handleSaveProduct(product: Product) {
    if (!editForm) {
      return;
    }

    setTableError("");
    setSavingProductId(product.id);

    const input: UpdateProductInput = {
      name: editForm.name,
      sku: editForm.sku,
      supplierId: editForm.supplierId || null,
      category: editForm.category || null,
      sellingPrice: Number(editForm.sellingPrice),
      supplierCost: editForm.supplierCost ? Number(editForm.supplierCost) : null
    };

    try {
      await onProductUpdate(product.id, input);
      setEditingProductId(null);
      setEditForm(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setTableError(err.message);
      } else {
        setTableError("Failed to update product");
      }
    } finally {
      setSavingProductId(null);
    }
  }

  async function handleDeleteProduct(product: Product) {
    const confirmed = window.confirm(
      `Delete product "${product.name}"? This may fail if the product is already used in an order.`
    );

    if (!confirmed) {
      return;
    }

    setTableError("");
    setDeletingProductId(product.id);

    try {
      await onProductDelete(product.id);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setTableError(err.message);
      } else {
        setTableError("Failed to delete product");
      }
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

      {tableError && <p className="table-error-message">{tableError}</p>}

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
            {filteredProducts.map((product) => {
              const isEditing = editingProductId === product.id;
              const isSaving = savingProductId === product.id;

              if (isEditing && editForm) {
                return (
                  <tr key={product.id}>
                    <td>
                      <input
                        className="inline-input"
                        value={editForm.name}
                        onChange={(event) =>
                          updateEditField("name", event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="inline-input"
                        value={editForm.sku}
                        onChange={(event) =>
                          updateEditField("sku", event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <select
                        className="inline-select"
                        value={editForm.supplierId}
                        onChange={(event) =>
                          updateEditField("supplierId", event.target.value)
                        }
                      >
                        <option value="">No supplier</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="inline-input"
                        value={editForm.category}
                        onChange={(event) =>
                          updateEditField("category", event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="inline-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.sellingPrice}
                        onChange={(event) =>
                          updateEditField("sellingPrice", event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="inline-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.supplierCost}
                        onChange={(event) =>
                          updateEditField("supplierCost", event.target.value)
                        }
                      />
                    </td>
                    <td>—</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="small-button"
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleSaveProduct(product)}
                        >
                          {isSaving ? "Saving..." : "Save"}
                        </button>

                        <button
                          className="secondary-button small-button"
                          type="button"
                          disabled={isSaving}
                          onClick={cancelEditingProduct}
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.sku}</td>
                  <td>{product.supplier?.name ?? "—"}</td>
                  <td>{product.category ?? "—"}</td>
                  <td>{formatCurrency(product.sellingPrice)}</td>
                  <td>{formatCurrency(product.supplierCost)}</td>
                  <td>{formatMargin(product)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="secondary-button small-button"
                        type="button"
                        onClick={() => startEditingProduct(product)}
                      >
                        Edit
                      </button>

                      <button
                        className="danger-button small-button"
                        type="button"
                        disabled={deletingProductId === product.id}
                        onClick={() => handleDeleteProduct(product)}
                      >
                        {deletingProductId === product.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredProducts.length === 0 && !hasError && (
          <p className="empty-state">No products match these filters.</p>
        )}
      </div>
    </>
  );
}