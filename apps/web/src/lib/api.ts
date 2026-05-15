export type HealthResponse = {
  status: string;
  service: string;
};

export type Supplier = {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    products: number;
  };
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  sellingPrice: string;
  supplierCost: string | null;
  supplierId: string | null;
  supplier: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateProductInput = {
  name: string;
  sku: string;
  category?: string;
  sellingPrice: number;
  supplierCost?: number;
  supplierId?: string;
};

export type UpdateProductInput = {
  name?: string;
  sku?: string;
  category?: string | null;
  sellingPrice?: number;
  supplierCost?: number | null;
  supplierId?: string | null;
};

export type CreateSupplierInput = {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  notes?: string;
};

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "FULFILLING"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

export type SalesOrder = {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerEmail: string | null;
  source: string | null;
  status: OrderStatus;
  orderDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  supplierCostSnapshot: string | null;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    sku: string;
    supplier: {
      id: string;
      name: string;
    } | null;
  };
};

export type CreateOrderInput = {
  orderNumber: string;
  customerName?: string;
  customerEmail?: string;
  source?: string;
  status: OrderStatus;
  orderDate?: string;
  notes?: string;
  productId: string;
  quantity: number;
  unitPrice?: number;
};

export type ExpenseCategory =
  | "SHIPPING"
  | "ADS"
  | "PLATFORM_FEES"
  | "PACKAGING"
  | "REFUNDS"
  | "SOFTWARE"
  | "SUPPLIES"
  | "OTHER";

export type Expense = {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: string;
  vendor: string | null;
  expenseDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateExpenseInput = {
  description: string;
  category: ExpenseCategory;
  amount: number;
  vendor?: string;
  expenseDate?: string;
  notes?: string;
};

export type ExpenseImportRow = {
  description: string;
  category: ExpenseCategory;
  amount: number;
  vendor?: string;
  expenseDate?: string;
  notes?: string;
};

export type ExpenseImportResult = {
  importedCount: number;
  expenses: Expense[];
};

export type UpdateExpenseInput = {
  description?: string;
  category?: ExpenseCategory;
  amount?: number;
  vendor?: string | null;
  expenseDate?: string;
  notes?: string | null;
};

export type CustomerIssueType =
  | "SHIPPING_DELAY"
  | "WRONG_ITEM"
  | "REFUND_REQUEST"
  | "PRODUCT_QUESTION"
  | "PAYMENT_ISSUE"
  | "SUPPLIER_ISSUE"
  | "OTHER";

export type CustomerIssueStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

export type CustomerIssuePriority = "LOW" | "MEDIUM" | "HIGH";

export type CustomerIssue = {
  id: string;
  title: string;
  type: CustomerIssueType;
  status: CustomerIssueStatus;
  priority: CustomerIssuePriority;
  customerName: string | null;
  customerEmail: string | null;
  orderId: string | null;
  order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    orderDate: string;
  } | null;
  description: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCustomerIssueInput = {
  title: string;
  type: CustomerIssueType;
  status: CustomerIssueStatus;
  priority: CustomerIssuePriority;
  customerName?: string;
  customerEmail?: string;
  orderId?: string;
  description: string;
  notes?: string;
};

export type AnalyticsRange = "all" | "last7" | "last30" | "monthToDate";

export type OverviewAnalytics = {
  range: AnalyticsRange;
  generatedAt: string;
  summary: {
    revenue: number;
    supplierCost: number;
    grossProfit: number;
    expenses: number;
    estimatedNetProfit: number;
    orderCount: number;
    expenseCount: number;
    productCount: number;
    customerIssueCount: number;
    openIssueCount: number;
    highPriorityOpenIssueCount: number;
    lowMarginProductCount: number;
  };
  charts: {
    financialSummary: {
      name: string;
      amount: number;
    }[];
    ordersByStatus: {
      status: string;
      name: string;
      value: number;
    }[];
    expensesByCategory: {
      category: string;
      name: string;
      amount: number;
    }[];
    topProductsByRevenue: {
      productId: string;
      name: string;
      revenue: number;
    }[];
  };
  insights: {
    topExpenseCategory: {
      category: string;
      name: string;
      amount: number;
    } | null;
    topProduct: {
      productId: string;
      name: string;
      revenue: number;
    } | null;
    lowMarginProductCount: number;
    openIssueCount: number;
    highPriorityOpenIssueCount: number;
  };
};

export type BusinessSummaryRiskLevel = "low" | "medium" | "high";

export type BusinessSummary = {
  generatedAt: string;
  title: string;
  riskLevel: BusinessSummaryRiskLevel;
  summaryText: string;
  highlights: string[];
  recommendations: string[];
};



export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch("/api/health");

  if (!response.ok) {
    throw new Error("Failed to connect to bodb API");
  }

  return response.json();
}

export async function getProducts(): Promise<Product[]> {
  const response = await fetch("/api/products");

  if (!response.ok) {
    throw new Error("Failed to load products");
  }

  return response.json();
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const response = await fetch("/api/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message ?? "Failed to create product");
  }

  return response.json();
}

export async function importProducts(
  products: ProductImportRow[]
): Promise<ProductImportResult> {
  const response = await fetch("/api/products/import", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ products })
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    if (errorBody?.rowErrors) {
      const rowErrorText = errorBody.rowErrors
        .map((rowError: { rowNumber: number; sku?: string; errors: string[] }) => {
          const skuText = rowError.sku ? `, SKU ${rowError.sku}` : "";
          return `Row ${rowError.rowNumber}${skuText}: ${rowError.errors.join(", ")}`;
        })
        .join("\n");

      throw new Error(rowErrorText);
    }

    throw new Error(errorBody?.message ?? "Failed to import products");
  }

  return response.json();
}

export type ProductImportRow = {
  name: string;
  sku: string;
  category?: string;
  sellingPrice: number;
  supplierCost?: number;
};

export type ProductImportResult = {
  importedCount: number;
  products: Product[];
};

export async function getSuppliers(): Promise<Supplier[]> {
  const response = await fetch("/api/suppliers");

  if (!response.ok) {
    throw new Error("Failed to load suppliers");
  }

  return response.json();
}

export async function createSupplier(
  input: CreateSupplierInput
): Promise<Supplier> {
  const response = await fetch("/api/suppliers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message ?? "Failed to create supplier");
  }

  return response.json();
}

export async function getOrders(): Promise<SalesOrder[]> {
  const response = await fetch("/api/orders");

  if (!response.ok) {
    throw new Error("Failed to load orders");
  }

  return response.json();
}

export async function createOrder(input: CreateOrderInput): Promise<SalesOrder> {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message ?? "Failed to create order");
  }

  return response.json();
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<SalesOrder> {
  const response = await fetch(`/api/orders/${orderId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status })
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message ?? "Failed to update order status");
  }

  return response.json();
}

export async function getExpenses(): Promise<Expense[]> {
  const response = await fetch("/api/expenses");

  if (!response.ok) {
    throw new Error("Failed to load expenses");
  }

  return response.json();
}

export async function createExpense(
  input: CreateExpenseInput
): Promise<Expense> {
  const response = await fetch("/api/expenses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message ?? "Failed to create expense");
  }

  return response.json();
} 

export async function importExpenses(
  expenses: ExpenseImportRow[]
): Promise<ExpenseImportResult> {
  const response = await fetch("/api/expenses/import", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ expenses })
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    if (errorBody?.rowErrors) {
      const rowErrorText = errorBody.rowErrors
        .map((rowError: { rowNumber: number; errors: string[] }) => {
          return `Row ${rowError.rowNumber}: ${rowError.errors.join(", ")}`;
        })
        .join("\n");

      throw new Error(rowErrorText);
    }

    throw new Error(errorBody?.message ?? "Failed to import expenses");
  }

  return response.json();
}

export async function getCustomerIssues(): Promise<CustomerIssue[]> {
  const response = await fetch("/api/customer-issues");

  if (!response.ok) {
    throw new Error("Failed to load customer issues");
  }

  return response.json();
}

export async function createCustomerIssue(
  input: CreateCustomerIssueInput
): Promise<CustomerIssue> {
  const response = await fetch("/api/customer-issues", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message ?? "Failed to create customer issue");
  }

  return response.json();
}

export async function updateCustomerIssueStatus(
  issueId: string,
  status: CustomerIssueStatus
): Promise<CustomerIssue> {
  const response = await fetch(`/api/customer-issues/${issueId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status })
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(
      errorBody?.message ?? "Failed to update customer issue status"
    );
  }

  return response.json();
}

async function deleteResource(url: string, fallbackMessage: string) {
  const response = await fetch(url, {
    method: "DELETE"
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message ?? fallbackMessage);
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  await deleteResource(`/api/products/${productId}`, "Failed to delete product");
}

export async function deleteSupplier(supplierId: string): Promise<void> {
  await deleteResource(
    `/api/suppliers/${supplierId}`,
    "Failed to delete supplier"
  );
}

export async function deleteOrder(orderId: string): Promise<void> {
  await deleteResource(`/api/orders/${orderId}`, "Failed to delete order");
}

export async function deleteExpense(expenseId: string): Promise<void> {
  await deleteResource(`/api/expenses/${expenseId}`, "Failed to delete expense");
}

export async function deleteCustomerIssue(issueId: string): Promise<void> {
  await deleteResource(
    `/api/customer-issues/${issueId}`,
    "Failed to delete customer issue"
  );
}

export async function updateProduct(
  productId: string,
  input: UpdateProductInput
): Promise<Product> {
  const response = await fetch(`/api/products/${productId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message ?? "Failed to update product");
  }

  return response.json();
}

export async function updateExpense(
  expenseId: string,
  input: UpdateExpenseInput
): Promise<Expense> {
  const response = await fetch(`/api/expenses/${expenseId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message ?? "Failed to update expense");
  }

  return response.json();
}

export async function getOverviewAnalytics(
  range: AnalyticsRange
): Promise<OverviewAnalytics> {
  const response = await fetch(`/api/analytics/overview?range=${range}`);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message ?? "Failed to load overview analytics");
  }

  return response.json();
}

export async function generateBusinessSummary(
  analytics: OverviewAnalytics
): Promise<BusinessSummary> {
  const response = await fetch("/api/analytics/summary", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ analytics })
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message ?? "Failed to generate business summary");
  }

  return response.json();
}