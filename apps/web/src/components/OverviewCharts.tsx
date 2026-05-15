import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { Expense, SalesOrder } from "../lib/api";

type OverviewChartsProps = {
  orders: SalesOrder[];
  expenses: Expense[];
};

const chartColors = [
  "#172033",
  "#2563eb",
  "#16a34a",
  "#b45309",
  "#b91c1c",
  "#7c3aed",
  "#0891b2",
  "#64748b"
];

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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatEnum(value: string) {
  return value
    .replace("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getFinancialSummaryData(orders: SalesOrder[], expenses: Expense[]) {
  const revenue = orders.reduce((total, order) => {
    return total + calculateOrderRevenue(order);
  }, 0);

  const supplierCosts = orders.reduce((total, order) => {
    return total + calculateOrderCost(order);
  }, 0);

  const totalExpenses = expenses.reduce((total, expense) => {
    return total + Number(expense.amount);
  }, 0);

  const estimatedNetProfit = revenue - supplierCosts - totalExpenses;

  return [
    {
      name: "Revenue",
      amount: revenue
    },
    {
      name: "Supplier Cost",
      amount: supplierCosts
    },
    {
      name: "Expenses",
      amount: totalExpenses
    },
    {
      name: "Net Profit",
      amount: estimatedNetProfit
    }
  ];
}

function getOrderStatusData(orders: SalesOrder[]) {
  const counts = orders.reduce<Record<string, number>>((totals, order) => {
    totals[order.status] = (totals[order.status] ?? 0) + 1;
    return totals;
  }, {});

  return Object.entries(counts).map(([status, count]) => ({
    name: formatEnum(status),
    value: count
  }));
}

function getExpenseCategoryData(expenses: Expense[]) {
  const totals = expenses.reduce<Record<string, number>>((result, expense) => {
    result[expense.category] =
      (result[expense.category] ?? 0) + Number(expense.amount);

    return result;
  }, {});

  return Object.entries(totals)
    .map(([category, amount]) => ({
      name: formatEnum(category),
      amount
    }))
    .sort((a, b) => b.amount - a.amount);
}

function getTopProductRevenueData(orders: SalesOrder[]) {
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

  return Array.from(productRevenueMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

function EmptyChartMessage({ message }: { message: string }) {
  return <div className="empty-chart-message">{message}</div>;
}

export function OverviewCharts({ orders, expenses }: OverviewChartsProps) {
  const financialSummaryData = getFinancialSummaryData(orders, expenses);
  const orderStatusData = getOrderStatusData(orders);
  const expenseCategoryData = getExpenseCategoryData(expenses);
  const topProductRevenueData = getTopProductRevenueData(orders);

  const hasFinancialData = orders.length > 0 || expenses.length > 0;

  return (
    <section className="overview-charts-section">
      <div className="section-header">
        <div>
          <p className="eyebrow">Visual reporting</p>
          <h2>Charts</h2>
        </div>
        <span>Overview</span>
      </div>

      <div className="charts-grid">
        <article className="chart-card">
          <h3>Revenue, Costs, and Profit</h3>

          {hasFinancialData ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={financialSummaryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {financialSummaryData.map((entry, index) => (
                    <Cell
                      fill={chartColors[index % chartColors.length]}
                      key={entry.name}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartMessage message="Add orders or expenses to see financial charts." />
          )}
        </article>

        <article className="chart-card">
          <h3>Orders by Status</h3>

          {orderStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={95}
                  label
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell
                      fill={chartColors[index % chartColors.length]}
                      key={entry.name}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartMessage message="Add orders to see status distribution." />
          )}
        </article>

        <article className="chart-card">
          <h3>Expenses by Category</h3>

          {expenseCategoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={expenseCategoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {expenseCategoryData.map((entry, index) => (
                    <Cell
                      fill={chartColors[index % chartColors.length]}
                      key={entry.name}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartMessage message="Add expenses to see category breakdown." />
          )}
        </article>

        <article className="chart-card">
          <h3>Top Products by Revenue</h3>

          {topProductRevenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topProductRevenueData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={formatCurrency} />
                <YAxis dataKey="name" type="category" width={140} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="revenue" radius={[0, 8, 8, 0]}>
                  {topProductRevenueData.map((entry, index) => (
                    <Cell
                      fill={chartColors[index % chartColors.length]}
                      key={entry.name}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartMessage message="Add orders to see top product revenue." />
          )}
        </article>
      </div>
    </section>
  );
}