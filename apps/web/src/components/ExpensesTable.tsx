import { useMemo, useState } from "react";
import type { Expense, ExpenseCategory } from "../lib/api";

type ExpensesTableProps = {
  expenses: Expense[];
  hasError: boolean;
  onExpenseDelete: (expenseId: string) => Promise<void>;
};

const expenseCategories: { value: ExpenseCategory; label: string }[] = [
  { value: "SHIPPING", label: "Shipping" },
  { value: "ADS", label: "Ads" },
  { value: "PLATFORM_FEES", label: "Platform fees" },
  { value: "PACKAGING", label: "Packaging" },
  { value: "REFUNDS", label: "Refunds" },
  { value: "SOFTWARE", label: "Software" },
  { value: "SUPPLIES", label: "Supplies" },
  { value: "OTHER", label: "Other" }
];

function formatCurrency(value: string) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD"
  }).format(Number(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function formatCategory(value: string) {
  return value
    .replace("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function ExpensesTable({ expenses, hasError, onExpenseDelete }: ExpensesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    "ALL" | ExpenseCategory
  >("ALL");
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  const filteredExpenses = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return expenses.filter((expense) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        expense.description.toLowerCase().includes(normalizedSearch) ||
        (expense.vendor ?? "").toLowerCase().includes(normalizedSearch) ||
        (expense.notes ?? "").toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        categoryFilter === "ALL" || expense.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchTerm, categoryFilter]);

  const filteredTotal = filteredExpenses.reduce((total, expense) => {
    return total + Number(expense.amount);
  }, 0);

  async function handleDeleteExpense(expense: Expense) {
    const confirmed = window.confirm(
      `Delete expense "${expense.description}"?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingExpenseId(expense.id);

    try {
      await onExpenseDelete(expense.id);
    } finally {
      setDeletingExpenseId(null);
    }
  }

  return (
    <>
      <div className="table-toolbar">
        <div className="table-toolbar-header">
          <h3>Expense filters</h3>
          <span>
            Showing {filteredExpenses.length} of {expenses.length} ·{" "}
            {new Intl.NumberFormat("en-CA", {
              style: "currency",
              currency: "CAD"
            }).format(filteredTotal)}
          </span>
        </div>

        <div className="filter-grid">
          <label>
            Search
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search description, vendor, or notes"
            />
          </label>

          <label>
            Category
            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value as "ALL" | ExpenseCategory
                )
              }
            >
              <option value="ALL">All categories</option>
              {expenseCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
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
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Vendor</th>
              <th>Date</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredExpenses.map((expense) => (
              <tr key={expense.id}>
                <td>{expense.description}</td>
                <td>{formatCategory(expense.category)}</td>
                <td>{formatCurrency(expense.amount)}</td>
                <td>{expense.vendor ?? "—"}</td>
                <td>{formatDate(expense.expenseDate)}</td>
                <td>{expense.notes ?? "—"}</td>
                <td>
                  <button
                    className="danger-button small-button"
                    type="button"
                    disabled={deletingExpenseId === expense.id}
                    onClick={() => handleDeleteExpense(expense)}
                  >
                    {deletingExpenseId === expense.id ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredExpenses.length === 0 && !hasError && (
          <p className="empty-state">No expenses match these filters.</p>
        )}
      </div>
    </>
  );
}