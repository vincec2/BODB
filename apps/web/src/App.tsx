import { useEffect, useMemo, useState } from "react";
import { BusinessInsights } from "./components/BusinessInsights";
import { OverviewCharts } from "./components/OverviewCharts";
import { CustomerIssueForm } from "./components/CustomerIssueForm";
import { CustomerIssuesTable } from "./components/CustomerIssuesTable";
import { DashboardSummary } from "./components/DashboardSummary";
import { ExpenseCsvImport } from "./components/ExpenseCsvImport";
import { ExpenseForm } from "./components/ExpenseForm";
import { ExpensesTable } from "./components/ExpensesTable";
import { NeedsAttention } from "./components/NeedsAttention";
import { OrderForm } from "./components/OrderForm";
import { OrdersTable } from "./components/OrdersTable";
import {
  getOverviewRangeLabel,
  OverviewTimeFilter,
  type OverviewTimeRange
} from "./components/OverviewTimeFilter";
import { ProductCsvImport } from "./components/ProductCsvImport";
import { ProductForm } from "./components/ProductForm";
import { ProductsTable } from "./components/ProductsTable";
import { SectionNav, type AppSection } from "./components/SectionNav";
import { SupplierForm } from "./components/SupplierForm";
import { SuppliersTable } from "./components/SuppliersTable";
import {
  getCustomerIssues,
  getExpenses,
  getHealth,
  getOrders,
  getProducts,
  getSuppliers,
  updateCustomerIssueStatus,
  updateOrderStatus,
  deleteCustomerIssue,
  deleteExpense,
  deleteOrder,
  deleteProduct,
  deleteSupplier,
  type CustomerIssue,
  type CustomerIssueStatus,
  type Expense,
  type HealthResponse,
  type OrderStatus,
  type Product,
  type SalesOrder,
  type Supplier
} from "./lib/api";
import "./App.css";

function isWithinRange(dateValue: string, range: OverviewTimeRange) {
  if (range === "all") {
    return true;
  }

  const itemDate = new Date(dateValue);
  const today = new Date();

  if (Number.isNaN(itemDate.getTime())) {
    return false;
  }

  if (range === "last7") {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    return itemDate >= sevenDaysAgo;
  }

  if (range === "last30") {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    return itemDate >= thirtyDaysAgo;
  }

  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  return itemDate >= firstDayOfMonth;
}

function App() {
  const [activeSection, setActiveSection] = useState<AppSection>("overview");
  const [overviewRange, setOverviewRange] =
    useState<OverviewTimeRange>("all");

  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [customerIssues, setCustomerIssues] = useState<CustomerIssue[]>([]);
  const [error, setError] = useState<string>("");

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      return isWithinRange(order.orderDate, overviewRange);
    });
  }, [orders, overviewRange]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      return isWithinRange(expense.expenseDate, overviewRange);
    });
  }, [expenses, overviewRange]);

  const filteredCustomerIssues = useMemo(() => {
    return customerIssues.filter((issue) => {
      return isWithinRange(issue.createdAt, overviewRange);
    });
  }, [customerIssues, overviewRange]);

  async function loadProducts() {
    const productData = await getProducts();
    setProducts(productData);
  }

  async function loadSuppliers() {
    const supplierData = await getSuppliers();
    setSuppliers(supplierData);
  }

  async function loadOrders() {
    const orderData = await getOrders();
    setOrders(orderData);
  }

  async function loadExpenses() {
    const expenseData = await getExpenses();
    setExpenses(expenseData);
  }

  async function loadCustomerIssues() {
    const customerIssueData = await getCustomerIssues();
    setCustomerIssues(customerIssueData);
  }

  async function loadBusinessData() {
    await Promise.all([
      loadProducts(),
      loadSuppliers(),
      loadOrders(),
      loadExpenses(),
      loadCustomerIssues()
    ]);
  }

  async function handleOrderStatusChange(
    orderId: string,
    status: OrderStatus
  ) {
    await updateOrderStatus(orderId, status);
    await loadBusinessData();
  }

  async function handleCustomerIssueStatusChange(
    issueId: string,
    status: CustomerIssueStatus
  ) {
    await updateCustomerIssueStatus(issueId, status);
    await loadBusinessData();
  }

  async function handleDeleteProduct(productId: string) {
    await deleteProduct(productId);
    await loadBusinessData();
  }

  async function handleDeleteSupplier(supplierId: string) {
    await deleteSupplier(supplierId);
    await loadBusinessData();
  }

  async function handleDeleteOrder(orderId: string) {
    await deleteOrder(orderId);
    await loadBusinessData();
  }

  async function handleDeleteExpense(expenseId: string) {
    await deleteExpense(expenseId);
    await loadBusinessData();
  }

  async function handleDeleteCustomerIssue(issueId: string) {
    await deleteCustomerIssue(issueId);
    await loadBusinessData();
  }

  useEffect(() => {
    async function loadData() {
      try {
        const healthData = await getHealth();
        await loadBusinessData();
        setHealth(healthData);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Something went wrong");
        }
      }
    }

    loadData();
  }, []);

  function renderActiveSection() {
    if (activeSection === "overview") {
      const rangeLabel = getOverviewRangeLabel(overviewRange);

      return (
        <>
          <DashboardSummary
            orders={filteredOrders}
            products={products}
            expenses={filteredExpenses}
          />

          <OverviewCharts orders={filteredOrders} expenses={filteredExpenses} />

          <NeedsAttention
            orders={filteredOrders}
            products={products}
            expenses={filteredExpenses}
            customerIssues={filteredCustomerIssues}
          />

          <BusinessInsights
            orders={filteredOrders}
            expenses={filteredExpenses}
            customerIssues={filteredCustomerIssues}
            products={products}
            rangeLabel={rangeLabel}
          />
        </>
      );
    }

    if (activeSection === "suppliers") {
      return (
        <section className="products-section">
          <div className="section-header">
            <div>
              <p className="eyebrow">Supplier workflow</p>
              <h2>Suppliers</h2>
            </div>
            <span>{suppliers.length} suppliers</span>
          </div>

          <SupplierForm onSupplierCreated={loadBusinessData} />

          <SuppliersTable
            suppliers={suppliers}
            hasError={Boolean(error)}
            onSupplierDelete={handleDeleteSupplier}
          />
        </section>
      );
    }

    if (activeSection === "orders") {
      return (
        <section className="products-section">
          <div className="section-header">
            <div>
              <p className="eyebrow">Revenue and margin tracking</p>
              <h2>Orders</h2>
            </div>
            <span>{orders.length} orders</span>
          </div>

          <OrderForm products={products} onOrderCreated={loadBusinessData} />

          <OrdersTable
            orders={orders}
            hasError={Boolean(error)}
            onOrderStatusChange={handleOrderStatusChange}
            onOrderDelete={handleDeleteOrder}
          />
        </section>
      );
    }

    if (activeSection === "customerIssues") {
      return (
        <section className="products-section">
          <div className="section-header">
            <div>
              <p className="eyebrow">Support and follow-up</p>
              <h2>Customer Issues</h2>
            </div>
            <span>{customerIssues.length} issues</span>
          </div>

          <CustomerIssueForm
            orders={orders}
            onCustomerIssueCreated={loadBusinessData}
          />

          <CustomerIssuesTable
            customerIssues={customerIssues}
            hasError={Boolean(error)}
            onCustomerIssueStatusChange={handleCustomerIssueStatusChange}
            onCustomerIssueDelete={handleDeleteCustomerIssue}
          />
        </section>
      );
    }

    if (activeSection === "expenses") {
      return (
        <section className="products-section">
          <div className="section-header">
            <div>
              <p className="eyebrow">Operating costs</p>
              <h2>Expenses</h2>
            </div>
            <span>{expenses.length} expenses</span>
          </div>

          <ExpenseCsvImport onExpensesImported={loadBusinessData} />

          <ExpenseForm onExpenseCreated={loadBusinessData} />

          <ExpensesTable
            expenses={expenses}
            hasError={Boolean(error)}
            onExpenseDelete={handleDeleteExpense}
          />
        </section>
      );
    }

    return (
      <section className="products-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Database-backed data</p>
            <h2>Products</h2>
          </div>
          <span>{products.length} products</span>
        </div>

        <ProductCsvImport onProductsImported={loadBusinessData} />

        <ProductForm
          suppliers={suppliers}
          onProductCreated={loadBusinessData}
        />

        <ProductsTable
          products={products}
          hasError={Boolean(error)}
          onProductDelete={handleDeleteProduct}
        />
      </section>
    );
  }

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div className="app-header">
          <div>
            <p className="eyebrow">Business Operations Dashboard</p>
            <h1>bodb</h1>
            <p className="subtitle">
              A full-stack operations dashboard for tracking orders, suppliers,
              expenses, margins, customer issues, and business insights.
            </p>
          </div>

          <div className="status-card compact-status-card">
            <h2>API connection</h2>

            {health && (
              <p className="success">
                Connected to <strong>{health.service}</strong>
              </p>
            )}

            {error && <p className="error">{error}</p>}

            {!health && !error && <p>Checking backend...</p>}
          </div>
        </div>

        <SectionNav
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          counts={{
            suppliers: suppliers.length,
            orders: orders.length,
            customerIssues: customerIssues.length,
            expenses: expenses.length,
            products: products.length
          }}
        />

        {renderActiveSection()}
      </section>
    </main>
  );
}

export default App;