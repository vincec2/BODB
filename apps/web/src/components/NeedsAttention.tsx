import type { CustomerIssue, Expense, Product, SalesOrder } from "../lib/api";

type NeedsAttentionProps = {
  orders: SalesOrder[];
  products: Product[];
  expenses: Expense[];
  customerIssues: CustomerIssue[];
};

type AlertLevel = "high" | "medium" | "low";

type AttentionItem = {
  id: string;
  level: AlertLevel;
  title: string;
  description: string;
  action: string;
};

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

function getDaysSince(dateValue: string) {
  const date = new Date(dateValue);
  const today = new Date();

  const differenceMs = today.getTime() - date.getTime();
  return Math.floor(differenceMs / (1000 * 60 * 60 * 24));
}

function getAttentionItems({
  orders,
  products,
  expenses,
  customerIssues
}: NeedsAttentionProps): AttentionItem[] {
  const items: AttentionItem[] = [];

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

  const delayedOrders = orders.filter((order) => {
    const isOpenOrder =
      order.status === "PAID" ||
      order.status === "PENDING" ||
      order.status === "FULFILLING";

    return isOpenOrder && getDaysSince(order.orderDate) >= 3;
  });

  if (delayedOrders.length > 0) {
    items.push({
      id: "delayed-orders",
      level: "high",
      title: "Open orders may need fulfillment follow-up",
      description: `${delayedOrders.length} paid/pending order${
        delayedOrders.length === 1 ? "" : "s"
      } have not reached shipped/completed status after 3+ days.`,
      action: "Check supplier status, tracking links, and customer communication."
    });
  }

  const productsMissingCost = products.filter((product) => {
    return product.supplierCost === null;
  });

  if (productsMissingCost.length > 0) {
    items.push({
      id: "products-missing-cost",
      level: "high",
      title: "Products missing supplier cost",
      description: `${productsMissingCost.length} product${
        productsMissingCost.length === 1 ? "" : "s"
      } cannot be included accurately in margin calculations.`,
      action: "Add supplier cost data for each product."
    });
  }

  const ordersMissingCostSnapshots = orders.filter((order) => {
    return order.items.some((item) => item.supplierCostSnapshot === null);
  });

  if (ordersMissingCostSnapshots.length > 0) {
    items.push({
      id: "orders-missing-cost",
      level: "medium",
      title: "Orders missing cost snapshots",
      description: `${ordersMissingCostSnapshots.length} order${
        ordersMissingCostSnapshots.length === 1 ? "" : "s"
      } include items without supplier cost snapshots.`,
      action:
        "Review older orders or products that were sold before cost data was added."
    });
  }

  const lowMarginProducts = products.filter((product) => {
    const margin = calculateProductMargin(product);
    return margin !== null && margin < 25;
  });

  if (lowMarginProducts.length > 0) {
    items.push({
      id: "low-margin-products",
      level: "medium",
      title: "Low-margin products detected",
      description: `${lowMarginProducts.length} product${
        lowMarginProducts.length === 1 ? "" : "s"
      } are below 25% estimated gross margin.`,
      action: "Review pricing, supplier costs, discounts, or shipping strategy."
    });
  }

  if (totalRevenue > 0 && totalExpenses > grossProfit) {
    items.push({
      id: "expenses-above-gross-profit",
      level: "high",
      title: "Expenses are higher than gross profit",
      description:
        "Your current expenses exceed gross profit, so estimated net profit is negative.",
      action:
        "Review ad spend, shipping costs, platform fees, refunds, and other operating expenses."
    });
  }

  if (orders.length === 0) {
    items.push({
      id: "no-orders",
      level: "low",
      title: "No orders tracked yet",
      description:
        "The dashboard cannot calculate real business health until orders are added.",
      action: "Create or import orders to start tracking revenue and profit."
    });
  }

  if (products.length === 0) {
    items.push({
      id: "no-products",
      level: "low",
      title: "No products tracked yet",
      description:
        "Products are needed before orders can be linked to selling price and supplier cost data.",
      action: "Add products manually or import them later through CSV."
    });
  }

  const openCustomerIssues = customerIssues.filter((issue) => {
    return issue.status === "OPEN" || issue.status === "IN_PROGRESS";
  });

  if (openCustomerIssues.length > 0) {
    items.push({
      id: "open-customer-issues",
      level: "medium",
      title: "Customer issues need follow-up",
      description: `${openCustomerIssues.length} customer issue${
        openCustomerIssues.length === 1 ? "" : "s"
      } are still open or in progress.`,
      action:
        "Review customer messages, update issue status, and resolve urgent problems first."
    });
  }

  const highPriorityIssues = customerIssues.filter((issue) => {
    return (
      issue.priority === "HIGH" &&
      (issue.status === "OPEN" || issue.status === "IN_PROGRESS")
    );
  });

  if (highPriorityIssues.length > 0) {
    items.push({
      id: "high-priority-customer-issues",
      level: "high",
      title: "High-priority customer issues are open",
      description: `${highPriorityIssues.length} high-priority issue${
        highPriorityIssues.length === 1 ? "" : "s"
      } still need resolution.`,
      action:
        "Handle high-priority customer issues before lower-priority operational tasks."
    });
  }

  return items;
}

function formatLevel(level: AlertLevel) {
  if (level === "high") return "High priority";
  if (level === "medium") return "Medium priority";
  return "Low priority";
}

export function NeedsAttention({
  orders,
  products,
  expenses,
  customerIssues
}: NeedsAttentionProps) {
  const attentionItems = getAttentionItems({ orders, products, expenses, customerIssues });

  return (
    <section className="needs-attention-section">
      <div className="section-header">
        <div>
          <p className="eyebrow">Operational alerts</p>
          <h2>Needs Attention</h2>
        </div>
        <span>{attentionItems.length} alerts</span>
      </div>

      {attentionItems.length === 0 ? (
        <div className="all-clear-card">
          <h3>All clear</h3>
          <p>
            No operational alerts detected. As more orders, costs, and expenses
            are added, bodb will surface issues here.
          </p>
        </div>
      ) : (
        <div className="attention-grid">
          {attentionItems.map((item) => (
            <article
              className={`attention-card attention-card-${item.level}`}
              key={item.id}
            >
              <div className="attention-card-header">
                <h3>{item.title}</h3>
                <span>{formatLevel(item.level)}</span>
              </div>

              <p>{item.description}</p>

              <div className="recommended-action">
                <strong>Recommended action:</strong>
                <p>{item.action}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}