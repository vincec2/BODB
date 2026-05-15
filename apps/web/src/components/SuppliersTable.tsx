import { useMemo, useState } from "react";
import type { Supplier } from "../lib/api";

type SuppliersTableProps = {
  suppliers: Supplier[];
  hasError: boolean;
  onSupplierDelete: (supplierId: string) => Promise<void>;
};

export function SuppliersTable({ suppliers, hasError, onSupplierDelete }: SuppliersTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingSupplierId, setDeletingSupplierId] = useState<string | null>(null);

  const filteredSuppliers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return suppliers.filter((supplier) => {
      return (
        normalizedSearch.length === 0 ||
        supplier.name.toLowerCase().includes(normalizedSearch) ||
        (supplier.contactName ?? "").toLowerCase().includes(normalizedSearch) ||
        (supplier.email ?? "").toLowerCase().includes(normalizedSearch) ||
        (supplier.phone ?? "").toLowerCase().includes(normalizedSearch) ||
        (supplier.notes ?? "").toLowerCase().includes(normalizedSearch)
      );
    });
  }, [suppliers, searchTerm]);

  async function handleDeleteSupplier(supplier: Supplier) {
    const confirmed = window.confirm(
      `Delete supplier "${supplier.name}"? Products linked to this supplier will remain, but their supplier will become empty.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingSupplierId(supplier.id);

    try {
      await onSupplierDelete(supplier.id);
    } finally {
      setDeletingSupplierId(null);
    }
  }

  return (
    <>
      <div className="table-toolbar">
        <div className="table-toolbar-header">
          <h3>Supplier filters</h3>
          <span>
            Showing {filteredSuppliers.length} of {suppliers.length}
          </span>
        </div>

        <div className="filter-grid">
          <label>
            Search
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search supplier, contact, email, phone, or notes"
            />
          </label>
        </div>
      </div>

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
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredSuppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td>{supplier.name}</td>
                <td>{supplier.contactName ?? "—"}</td>
                <td>{supplier.email ?? "—"}</td>
                <td>{supplier.phone ?? "—"}</td>
                <td>{supplier._count.products}</td>
                <td>{supplier.notes ?? "—"}</td>
                <td>
                  <button
                    className="danger-button small-button"
                    type="button"
                    disabled={deletingSupplierId === supplier.id}
                    onClick={() => handleDeleteSupplier(supplier)}
                  >
                    {deletingSupplierId === supplier.id ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredSuppliers.length === 0 && !hasError && (
          <p className="empty-state">No suppliers match this search.</p>
        )}
      </div>
    </>
  );
}