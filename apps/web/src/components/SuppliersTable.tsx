import type { Supplier } from "../lib/api";

type SuppliersTableProps = {
  suppliers: Supplier[];
  hasError: boolean;
};

export function SuppliersTable({ suppliers, hasError }: SuppliersTableProps) {
  return (
    <div className="table-card">
      <table>
        <thead>
          <tr>
            <th>Supplier</th>
            <th>Contact</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Products</th>
            <th>Notes</th>
          </tr>
        </thead>

        <tbody>
          {suppliers.map((supplier) => (
            <tr key={supplier.id}>
              <td>{supplier.name}</td>
              <td>{supplier.contactName ?? "—"}</td>
              <td>{supplier.email ?? "—"}</td>
              <td>{supplier.phone ?? "—"}</td>
              <td>{supplier._count.products}</td>
              <td>{supplier.notes ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {suppliers.length === 0 && !hasError && (
        <p className="empty-state">No suppliers found.</p>
      )}
    </div>
  );
}