import { useState } from "react";
import {
  createExpense,
  type CreateExpenseInput,
  type ExpenseCategory
} from "../lib/api";

type ExpenseFormState = {
  description: string;
  category: ExpenseCategory;
  amount: string;
  vendor: string;
  expenseDate: string;
  notes: string;
};

type ExpenseFormProps = {
  onExpenseCreated: () => Promise<void>;
};

const initialExpenseForm: ExpenseFormState = {
  description: "",
  category: "OTHER",
  amount: "",
  vendor: "",
  expenseDate: "",
  notes: ""
};

export function ExpenseForm({ onExpenseCreated }: ExpenseFormProps) {
  const [form, setForm] = useState<ExpenseFormState>(initialExpenseForm);
  const [formError, setFormError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateFormField(field: keyof ExpenseFormState, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  async function handleCreateExpense(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFormError("");
    setIsSubmitting(true);

    const input: CreateExpenseInput = {
      description: form.description,
      category: form.category,
      amount: Number(form.amount),
      vendor: form.vendor || undefined,
      expenseDate: form.expenseDate || undefined,
      notes: form.notes || undefined
    };

    try {
      await createExpense(input);
      setForm(initialExpenseForm);
      await onExpenseCreated();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Failed to create expense");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="product-form" onSubmit={handleCreateExpense}>
      <div className="form-grid">
        <label>
          Description
          <input
            value={form.description}
            onChange={(event) =>
              updateFormField("description", event.target.value)
            }
            placeholder="Example: Canada Post shipping labels"
            required
          />
        </label>

        <label>
          Category
          <select
            value={form.category}
            onChange={(event) =>
              updateFormField("category", event.target.value as ExpenseCategory)
            }
          >
            <option value="SHIPPING">Shipping</option>
            <option value="ADS">Ads</option>
            <option value="PLATFORM_FEES">Platform fees</option>
            <option value="PACKAGING">Packaging</option>
            <option value="REFUNDS">Refunds</option>
            <option value="SOFTWARE">Software</option>
            <option value="SUPPLIES">Supplies</option>
            <option value="OTHER">Other</option>
          </select>
        </label>

        <label>
          Amount
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(event) => updateFormField("amount", event.target.value)}
            placeholder="25.00"
            required
          />
        </label>

        <label>
          Vendor
          <input
            value={form.vendor}
            onChange={(event) => updateFormField("vendor", event.target.value)}
            placeholder="Optional"
          />
        </label>

        <label>
          Expense date
          <input
            type="date"
            value={form.expenseDate}
            onChange={(event) =>
              updateFormField("expenseDate", event.target.value)
            }
          />
        </label>

        <label className="full-width">
          Notes
          <input
            value={form.notes}
            onChange={(event) => updateFormField("notes", event.target.value)}
            placeholder="Optional expense notes"
          />
        </label>
      </div>

      {formError && <p className="error">{formError}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Adding expense..." : "Add expense"}
      </button>
    </form>
  );
}