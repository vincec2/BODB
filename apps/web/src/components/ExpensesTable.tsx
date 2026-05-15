import { useMemo, useState } from "react";
import type {
  Expense,
  ExpenseCategory,
  UpdateExpenseInput
} from "../lib/api";

type ExpensesTableProps = {
  expenses: Expense[];
  hasError: boolean;
  onExpenseUpdate: (
    expenseId: string,
    input: UpdateExpenseInput
  ) => Promise<void>;
  onExpenseDelete: (expenseId: string) => Promise<void>;
};

type ExpenseEditForm = {
  description: string;
  category: ExpenseCategory;
  amount: string;
  vendor: string;
  expenseDate: string;
  notes: string;
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

function formatDateInputValue(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function formatCategory(value: string) {
  return value
    .replace("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getInitialEditForm(expense: Expense): ExpenseEditForm {
  return {
    description: expense.description,
    category: expense.category,
    amount: expense.amount,
    vendor: expense.vendor ?? "",
    expenseDate: formatDateInputValue(expense.expenseDate),
    notes: expense.notes ?? ""
  };
}

export function ExpensesTable({
  expenses,
  hasError,
  onExpenseUpdate,
  onExpenseDelete
}: ExpensesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    "ALL" | ExpenseCategory
  >("ALL");

  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ExpenseEditForm | null>(null);
  const [savingExpenseId, setSavingExpenseId] = useState<string | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(
    null
  );
  const [tableError, setTableError] = useState("");

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

  function startEditingExpense(expense: Expense) {
    setTableError("");
    setEditingExpenseId(expense.id);
    setEditForm(getInitialEditForm(expense));
  }

  function cancelEditingExpense() {
    setEditingExpenseId(null);
    setEditForm(null);
  }

  function updateEditField(field: keyof ExpenseEditForm, value: string) {
    setEditForm((currentForm) => {
      if (!currentForm) {
        return currentForm;
      }

      return {
        ...currentForm,
        [field]: value
      };
    });
  }

  async function handleSaveExpense(expense: Expense) {
    if (!editForm) {
      return;
    }

    setTableError("");
    setSavingExpenseId(expense.id);

    const input: UpdateExpenseInput = {
      description: editForm.description,
      category: editForm.category,
      amount: Number(editForm.amount),
      vendor: editForm.vendor || null,
      expenseDate: editForm.expenseDate,
      notes: editForm.notes || null
    };

    try {
      await onExpenseUpdate(expense.id, input);
      setEditingExpenseId(null);
      setEditForm(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setTableError(err.message);
      } else {
        setTableError("Failed to update expense");
      }
    } finally {
      setSavingExpenseId(null);
    }
  }

  async function handleDeleteExpense(expense: Expense) {
    const confirmed = window.confirm(
      `Delete expense "${expense.description}"?`
    );

    if (!confirmed) {
      return;
    }

    setTableError("");
    setDeletingExpenseId(expense.id);

    try {
      await onExpenseDelete(expense.id);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setTableError(err.message);
      } else {
        setTableError("Failed to delete expense");
      }
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

      {tableError && <p className="table-error-message">{tableError}</p>}

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
            {filteredExpenses.map((expense) => {
              const isEditing = editingExpenseId === expense.id;
              const isSaving = savingExpenseId === expense.id;

              if (isEditing && editForm) {
                return (
                  <tr key={expense.id}>
                    <td>
                      <input
                        className="inline-input"
                        value={editForm.description}
                        onChange={(event) =>
                          updateEditField("description", event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <select
                        className="inline-select"
                        value={editForm.category}
                        onChange={(event) =>
                          updateEditField("category", event.target.value)
                        }
                      >
                        {expenseCategories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="inline-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.amount}
                        onChange={(event) =>
                          updateEditField("amount", event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="inline-input"
                        value={editForm.vendor}
                        onChange={(event) =>
                          updateEditField("vendor", event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="inline-input"
                        type="date"
                        value={editForm.expenseDate}
                        onChange={(event) =>
                          updateEditField("expenseDate", event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="inline-input"
                        value={editForm.notes}
                        onChange={(event) =>
                          updateEditField("notes", event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="small-button"
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleSaveExpense(expense)}
                        >
                          {isSaving ? "Saving..." : "Save"}
                        </button>

                        <button
                          className="secondary-button small-button"
                          type="button"
                          disabled={isSaving}
                          onClick={cancelEditingExpense}
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={expense.id}>
                  <td>{expense.description}</td>
                  <td>{formatCategory(expense.category)}</td>
                  <td>{formatCurrency(expense.amount)}</td>
                  <td>{expense.vendor ?? "—"}</td>
                  <td>{formatDate(expense.expenseDate)}</td>
                  <td className="expanding-text-cell">
                    <span>{expense.notes || "—"}</span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="secondary-button small-button"
                        type="button"
                        onClick={() => startEditingExpense(expense)}
                      >
                        Edit
                      </button>

                      <button
                        className="danger-button small-button"
                        type="button"
                        disabled={deletingExpenseId === expense.id}
                        onClick={() => handleDeleteExpense(expense)}
                      >
                        {deletingExpenseId === expense.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredExpenses.length === 0 && !hasError && (
          <p className="empty-state">No expenses match these filters.</p>
        )}
      </div>
    </>
  );
}