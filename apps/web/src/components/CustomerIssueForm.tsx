import { useState } from "react";
import {
  createCustomerIssue,
  type CreateCustomerIssueInput,
  type CustomerIssuePriority,
  type CustomerIssueStatus,
  type CustomerIssueType,
  type SalesOrder
} from "../lib/api";

type CustomerIssueFormState = {
  title: string;
  type: CustomerIssueType;
  status: CustomerIssueStatus;
  priority: CustomerIssuePriority;
  customerName: string;
  customerEmail: string;
  orderId: string;
  description: string;
  notes: string;
};

type CustomerIssueFormProps = {
  orders: SalesOrder[];
  onCustomerIssueCreated: () => Promise<void>;
};

const initialCustomerIssueForm: CustomerIssueFormState = {
  title: "",
  type: "OTHER",
  status: "OPEN",
  priority: "MEDIUM",
  customerName: "",
  customerEmail: "",
  orderId: "",
  description: "",
  notes: ""
};

export function CustomerIssueForm({
  orders,
  onCustomerIssueCreated
}: CustomerIssueFormProps) {
  const [form, setForm] = useState<CustomerIssueFormState>(
    initialCustomerIssueForm
  );
  const [formError, setFormError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateFormField(
    field: keyof CustomerIssueFormState,
    value: string
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  async function handleCreateCustomerIssue(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setFormError("");
    setIsSubmitting(true);

    const input: CreateCustomerIssueInput = {
      title: form.title,
      type: form.type,
      status: form.status,
      priority: form.priority,
      customerName: form.customerName || undefined,
      customerEmail: form.customerEmail || undefined,
      orderId: form.orderId || undefined,
      description: form.description,
      notes: form.notes || undefined
    };

    try {
      await createCustomerIssue(input);
      setForm(initialCustomerIssueForm);
      await onCustomerIssueCreated();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Failed to create customer issue");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="product-form" onSubmit={handleCreateCustomerIssue}>
      <div className="form-grid">
        <label>
          Issue title
          <input
            value={form.title}
            onChange={(event) => updateFormField("title", event.target.value)}
            placeholder="Example: Customer says order has not arrived"
            required
          />
        </label>

        <label>
          Issue type
          <select
            value={form.type}
            onChange={(event) =>
              updateFormField("type", event.target.value as CustomerIssueType)
            }
          >
            <option value="SHIPPING_DELAY">Shipping delay</option>
            <option value="WRONG_ITEM">Wrong item</option>
            <option value="REFUND_REQUEST">Refund request</option>
            <option value="PRODUCT_QUESTION">Product question</option>
            <option value="PAYMENT_ISSUE">Payment issue</option>
            <option value="SUPPLIER_ISSUE">Supplier issue</option>
            <option value="OTHER">Other</option>
          </select>
        </label>

        <label>
          Status
          <select
            value={form.status}
            onChange={(event) =>
              updateFormField(
                "status",
                event.target.value as CustomerIssueStatus
              )
            }
          >
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </label>

        <label>
          Priority
          <select
            value={form.priority}
            onChange={(event) =>
              updateFormField(
                "priority",
                event.target.value as CustomerIssuePriority
              )
            }
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </label>

        <label>
          Customer name
          <input
            value={form.customerName}
            onChange={(event) =>
              updateFormField("customerName", event.target.value)
            }
            placeholder="Optional"
          />
        </label>

        <label>
          Customer email
          <input
            type="email"
            value={form.customerEmail}
            onChange={(event) =>
              updateFormField("customerEmail", event.target.value)
            }
            placeholder="Optional"
          />
        </label>

        <label>
          Linked order
          <select
            value={form.orderId}
            onChange={(event) => updateFormField("orderId", event.target.value)}
          >
            <option value="">No linked order</option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.orderNumber}
              </option>
            ))}
          </select>
        </label>

        <label className="full-width">
          Description
          <input
            value={form.description}
            onChange={(event) =>
              updateFormField("description", event.target.value)
            }
            placeholder="Describe what happened"
            required
          />
        </label>

        <label className="full-width">
          Notes
          <input
            value={form.notes}
            onChange={(event) => updateFormField("notes", event.target.value)}
            placeholder="Optional internal notes"
          />
        </label>
      </div>

      {formError && <p className="error">{formError}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Adding issue..." : "Add customer issue"}
      </button>
    </form>
  );
}