import { useMemo, useState } from "react";
import type { OrderStatus, SalesOrder } from "../lib/api";

type OrdersTableProps = {
  orders: SalesOrder[];
  hasError: boolean;
  onOrderStatusChange: (
    orderId: string,
    status: OrderStatus
  ) => Promise<void>;
  onOrderDelete: (orderId: string) => Promise<void>;
};

const orderStatuses: { value: OrderStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "FULFILLING", label: "Fulfilling" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REFUNDED", label: "Refunded" }
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD"
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function calculateOrderRevenue(order: SalesOrder) {
  return order.items.reduce((total, item) => {
    return total + Number(item.unitPrice) * item.quantity;
  }, 0);
}

function calculateOrderCost(order: SalesOrder) {
  return order.items.reduce((total, item) => {
    const supplierCost = item.supplierCostSnapshot
      ? Number(item.supplierCostSnapshot)
      : 0;

    return total + supplierCost * item.quantity;
  }, 0);
}

function calculateOrderProfit(order: SalesOrder) {
  return calculateOrderRevenue(order) - calculateOrderCost(order);
}

export function OrdersTable({
  orders,
  hasError,
  onOrderStatusChange,
  onOrderDelete,
}: OrdersTableProps) {
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | OrderStatus>("ALL");
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const productNames = order.items
        .map((item) => item.product.name)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        order.orderNumber.toLowerCase().includes(normalizedSearch) ||
        (order.customerName ?? "").toLowerCase().includes(normalizedSearch) ||
        (order.customerEmail ?? "").toLowerCase().includes(normalizedSearch) ||
        productNames.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    setUpdatingOrderId(orderId);

    try {
      await onOrderStatusChange(orderId, status);
    } finally {
      setUpdatingOrderId(null);
    }
  }

  async function handleDeleteOrder(order: SalesOrder) {
    const confirmed = window.confirm(
      `Delete order "${order.orderNumber}"? This will also remove its order items.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingOrderId(order.id);

    try {
      await onOrderDelete(order.id);
    } finally {
      setDeletingOrderId(null);
    }
  }

  return (
    <>
      <div className="table-toolbar">
        <div className="table-toolbar-header">
          <h3>Order filters</h3>
          <span>
            Showing {filteredOrders.length} of {orders.length}
          </span>
        </div>

        <div className="filter-grid">
          <label>
            Search
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search order, customer, email, or product"
            />
          </label>

          <label>
            Status
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "ALL" | OrderStatus)
              }
            >
              <option value="ALL">All statuses</option>
              {orderStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Items</th>
              <th>Revenue</th>
              <th>Est. Cost</th>
              <th>Est. Profit</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredOrders.map((order) => {
              const revenue = calculateOrderRevenue(order);
              const cost = calculateOrderCost(order);
              const profit = calculateOrderProfit(order);
              const isUpdating = updatingOrderId === order.id;

              return (
                <tr key={order.id}>
                  <td>{order.orderNumber}</td>
                  <td>{formatDate(order.orderDate)}</td>
                  <td>{order.customerName ?? "—"}</td>
                  <td>
                    <select
                      className="table-select"
                      value={order.status}
                      disabled={isUpdating}
                      onChange={(event) =>
                        handleStatusChange(
                          order.id,
                          event.target.value as OrderStatus
                        )
                      }
                    >
                      {orderStatuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {order.items.map((item) => (
                      <div key={item.id}>
                        {item.quantity} × {item.product.name}
                      </div>
                    ))}
                  </td>
                  <td>{formatCurrency(revenue)}</td>
                  <td>{formatCurrency(cost)}</td>
                  <td>{formatCurrency(profit)}</td>
                  <td>
                    <button
                      className="danger-button small-button"
                      type="button"
                      disabled={deletingOrderId === order.id}
                      onClick={() => handleDeleteOrder(order)}
                    >
                      {deletingOrderId === order.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredOrders.length === 0 && !hasError && (
          <p className="empty-state">No orders match these filters.</p>
        )}
      </div>
    </>
  );
}