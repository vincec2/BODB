import type { CustomerIssue, Expense, Product, SalesOrder } from "../lib/api";

type BusinessInsightsProps = {
  orders: SalesOrder[];
  expenses: Expense[];
  customerIssues: CustomerIssue[];
  products: Product[];
  rangeLabel: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD"
  }).format(value);
}

function formatCategory(value: string) {
  return value
    .replace("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

function calculateProductMargin(product: Product) {
  if (!product.supplierCost) {
    return null;
  }

  const sellingPrice = Number(product.sellingPrice);
  const supplierCost = Number(product.supplierCost);

  if (sellingPrice <= 0) {
    return null;
  }

  return ((sellingPrice - supplierCost) / sellingPrice) * 100;
}

export function BusinessInsights({
  orders,
  expenses,
  customerIssues,
  products,
  rangeLabel
}: BusinessInsightsProps) {
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

  const openIssues = customerIssues.filter((issue) => {
    return issue.status === "OPEN" || issue.status === "IN_PROGRESS";
  });

  const highPriorityOpenIssues = openIssues.filter((issue) => {
    return issue.priority === "HIGH";
  });

  const lowMarginProducts = products.filter((product) => {
    const margin = calculateProductMargin(product);
    return margin !== null && margin < 25;
  });

  const expenseTotalsByCategory = expenses.reduce<Record<string, number>>(
    (totals, expense) => {
      totals[expense.category] =
        (totals[expense.category] ?? 0) + Number(expense.amount);

      return totals;
    },
    {}
  );

  const topExpenseCategory = Object.entries(expenseTotalsByCategory).sort(
    ([, amountA], [, amountB]) => amountB - amountA
  )[0];

  const productRevenueMap = new Map<string, { name: string; revenue: number }>();

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const current = productRevenueMap.get(item.productId) ?? {
        name: item.product.name,
        revenue: 0
      };

      productRevenueMap.set(item.productId, {
        name: item.product.name,
        revenue: current.revenue + Number(item.unitPrice) * item.quantity
      });
    });
  });

  const topProduct = Array.from(productRevenueMap.values()).sort((a, b) => {
    return b.revenue - a.revenue;
  })[0];

  return (
    <section className="business-insights-section">
      <div className="section-header">
        <div>
          <p className="eyebrow">Plain-English summary</p>
          <h2>Business Insights</h2>
        </div>
        <span>{rangeLabel}</span>
      </div>

      <div className="insights-grid">
        <article className="insight-card">
          <h3>Profit signal</h3>
          {orders.length === 0 ? (
            <p>No orders in this period yet, so revenue and profit cannot be calculated.</p>
          ) : (
            <p>
              In this period, estimated net profit is{" "}
              <strong>{formatCurrency(estimatedNetProfit)}</strong> after{" "}
              <strong>{formatCurrency(totalSupplierCost)}</strong> in supplier
              costs and <strong>{formatCurrency(totalExpenses)}</strong> in
              expenses.
            </p>
          )}
        </article>

        <article className="insight-card">
          <h3>Top product</h3>
          {topProduct ? (
            <p>
              <strong>{topProduct.name}</strong> generated the most tracked
              revenue in this period at{" "}
              <strong>{formatCurrency(topProduct.revenue)}</strong>.
            </p>
          ) : (
            <p>No product revenue is available for this period yet.</p>
          )}
        </article>

        <article className="insight-card">
          <h3>Expense concentration</h3>
          {topExpenseCategory ? (
            <p>
              Your largest expense category is{" "}
              <strong>{formatCategory(topExpenseCategory[0])}</strong> at{" "}
              <strong>{formatCurrency(topExpenseCategory[1])}</strong>.
            </p>
          ) : (
            <p>No expenses are recorded for this period.</p>
          )}
        </article>

        <article className="insight-card">
          <h3>Customer follow-up</h3>
          {openIssues.length > 0 ? (
            <p>
              There are <strong>{openIssues.length}</strong> open or in-progress
              customer issue{openIssues.length === 1 ? "" : "s"}.{" "}
              {highPriorityOpenIssues.length > 0 && (
                <>
                  <strong>{highPriorityOpenIssues.length}</strong> of them are
                  high priority.
                </>
              )}
            </p>
          ) : (
            <p>No open customer issues are recorded for this period.</p>
          )}
        </article>

        <article className="insight-card">
          <h3>Margin watch</h3>
          {lowMarginProducts.length > 0 ? (
            <p>
              <strong>{lowMarginProducts.length}</strong> product
              {lowMarginProducts.length === 1 ? "" : "s"} are below 25%
              estimated gross margin. Review pricing, supplier cost, or
              discount strategy.
            </p>
          ) : (
            <p>No low-margin products detected using the current product cost data.</p>
          )}
        </article>

        <article className="insight-card">
          <h3>AI-ready foundation</h3>
          <p>
            This rule-based summary is the foundation for a future AI weekly
            business report. Later, these same numbers can be sent to an AI
            endpoint for a more natural written summary.
          </p>
        </article>
      </div>
    </section>
  );
}