import { useState } from "react";
import type { OrderStatus, SalesOrder } from "../lib/api";

type OrdersTableProps = {
  orders: SalesOrder[];
  hasError: boolean;
  onOrderStatusChange: (
    orderId: string,
    status: OrderStatus
  ) => Promise<void>;
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
  onOrderStatusChange
}: OrdersTableProps) {
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    setUpdatingOrderId(orderId);

    try {
      await onOrderStatusChange(orderId, status);
    } finally {
      setUpdatingOrderId(null);
    }
  }

  return (
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
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => {
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
              </tr>
            );
          })}
        </tbody>
      </table>

      {orders.length === 0 && !hasError && (
        <p className="empty-state">No orders found.</p>
      )}
    </div>
  );
}