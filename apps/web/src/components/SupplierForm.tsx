import { useState } from "react";
import { createSupplier, type CreateSupplierInput } from "../lib/api";

type SupplierFormState = {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  notes: string;
};

type SupplierFormProps = {
  onSupplierCreated: () => Promise<void>;
};

const initialSupplierForm: SupplierFormState = {
  name: "",
  contactName: "",
  email: "",
  phone: "",
  notes: ""
};

export function SupplierForm({ onSupplierCreated }: SupplierFormProps) {
  const [form, setForm] = useState<SupplierFormState>(initialSupplierForm);
  const [formError, setFormError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateFormField(field: keyof SupplierFormState, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  async function handleCreateSupplier(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFormError("");
    setIsSubmitting(true);

    const input: CreateSupplierInput = {
      name: form.name,
      contactName: form.contactName || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      notes: form.notes || undefined
    };

    try {
      await createSupplier(input);
      setForm(initialSupplierForm);
      await onSupplierCreated();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Failed to create supplier");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="product-form" onSubmit={handleCreateSupplier}>
      <div className="form-grid">
        <label>
          Supplier name
          <input
            value={form.name}
            onChange={(event) => updateFormField("name", event.target.value)}
            placeholder="Example: Vision Supply Co."
            required
          />
        </label>

        <label>
          Contact name
          <input
            value={form.contactName}
            onChange={(event) =>
              updateFormField("contactName", event.target.value)
            }
            placeholder="Example: Alex Chen"
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => updateFormField("email", event.target.value)}
            placeholder="orders@example.com"
          />
        </label>

        <label>
          Phone
          <input
            value={form.phone}
            onChange={(event) => updateFormField("phone", event.target.value)}
            placeholder="Optional"
          />
        </label>

        <label className="full-width">
          Notes
          <input
            value={form.notes}
            onChange={(event) => updateFormField("notes", event.target.value)}
            placeholder="Optional supplier notes"
          />
        </label>
      </div>

      {formError && <p className="error">{formError}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Adding supplier..." : "Add supplier"}
      </button>
    </form>
  );
}