import type { Expense, Product, SalesOrder } from "../lib/api";

type DashboardSummaryProps = {
  orders: SalesOrder[];
  products: Product[];
  expenses: Expense[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD"
  }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
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

export function DashboardSummary({
  orders,
  products,
  expenses
}: DashboardSummaryProps) {
  const totalRevenue = orders.reduce((total, order) => {
    return total + calculateOrderRevenue(order);
  }, 0);

  const totalSupplierCost = orders.reduce((total, order) => {
    return total + calculateOrderCost(order);
  }, 0);

  const totalExpenses = expenses.reduce((total, expense) => {
    return total + Number(expense.amount);
  }, 0);

  const grossProfit = totalRevenue - totalSupplierCost;
  const estimatedNetProfit = grossProfit - totalExpenses;

  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const netMargin =
    totalRevenue > 0 ? (estimatedNetProfit / totalRevenue) * 100 : 0;

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <div>
          <p className="eyebrow">Business health</p>
          <h2>Dashboard</h2>
        </div>
        <span>{orders.length} orders tracked</span>
      </div>

      <div className="summary-grid">
        <article className="summary-card">
          <p>Total revenue</p>
          <strong>{formatCurrency(totalRevenue)}</strong>
        </article>

        <article className="summary-card">
          <p>Supplier costs</p>
          <strong>{formatCurrency(totalSupplierCost)}</strong>
        </article>

        <article className="summary-card">
          <p>Expenses</p>
          <strong>{formatCurrency(totalExpenses)}</strong>
        </article>

        <article className="summary-card">
          <p>Gross profit</p>
          <strong>{formatCurrency(grossProfit)}</strong>
        </article>

        <article className="summary-card">
          <p>Est. net profit</p>
          <strong>{formatCurrency(estimatedNetProfit)}</strong>
        </article>

        <article className="summary-card">
          <p>Net margin</p>
          <strong>{formatPercent(netMargin)}</strong>
        </article>
      </div>

      <div className="insights-grid">
        <article className="insight-card">
          <h3>Profit breakdown</h3>
          <p>
            Gross margin is {formatPercent(grossMargin)} before expenses. After
            expenses, estimated net margin is {formatPercent(netMargin)}.
          </p>
          <p>
            This helps show whether the business is only generating sales, or
            actually keeping profit after supplier costs and operating expenses.
          </p>
        </article>

        <article className="insight-card">
          <h3>Data foundation</h3>
          <p>
            bodb is currently combining {products.length} product
            {products.length === 1 ? "" : "s"}, {orders.length} order
            {orders.length === 1 ? "" : "s"}, and {expenses.length} expense
            {expenses.length === 1 ? "" : "s"} into one operational view.
          </p>
        </article>
      </div>
    </section>
  );
}