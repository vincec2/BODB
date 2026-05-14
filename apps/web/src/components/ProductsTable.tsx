import type { Product } from "../lib/api";

type ProductsTableProps = {
  products: Product[];
  hasError: boolean;
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
    return "—";
  }

  const sellingPrice = Number(product.sellingPrice);
  const supplierCost = Number(product.supplierCost);

  if (sellingPrice <= 0) {
    return "—";
  }

  const margin = ((sellingPrice - supplierCost) / sellingPrice) * 100;

  return `${margin.toFixed(1)}%`;
}

export function ProductsTable({ products, hasError }: ProductsTableProps) {
  return (
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
          </tr>
        </thead>

        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.sku}</td>
              <td>{product.supplier?.name ?? "—"}</td>
              <td>{product.category ?? "—"}</td>
              <td>{formatCurrency(product.sellingPrice)}</td>
              <td>{formatCurrency(product.supplierCost)}</td>
              <td>{calculateMargin(product)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {products.length === 0 && !hasError && (
        <p className="empty-state">No products found.</p>
      )}
    </div>
  );
}