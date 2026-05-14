import type { Expense } from "../lib/api";

type ExpensesTableProps = {
  expenses: Expense[];
  hasError: boolean;
};

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

export function ExpensesTable({ expenses, hasError }: ExpensesTableProps) {
  return (
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
          </tr>
        </thead>

        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id}>
              <td>{expense.description}</td>
              <td>{formatCategory(expense.category)}</td>
              <td>{formatCurrency(expense.amount)}</td>
              <td>{expense.vendor ?? "—"}</td>
              <td>{formatDate(expense.expenseDate)}</td>
              <td>{expense.notes ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {expenses.length === 0 && !hasError && (
        <p className="empty-state">No expenses found.</p>
      )}
    </div>
  );
}