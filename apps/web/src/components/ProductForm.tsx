import { useState } from "react";
import {
  createProduct,
  type CreateProductInput,
  type Supplier
} from "../lib/api";

type ProductFormState = {
  name: string;
  sku: string;
  category: string;
  sellingPrice: string;
  supplierCost: string;
  supplierId: string;
};

type ProductFormProps = {
  suppliers: Supplier[];
  onProductCreated: () => Promise<void>;
};

const initialProductForm: ProductFormState = {
  name: "",
  sku: "",
  category: "",
  sellingPrice: "",
  supplierCost: "",
  supplierId: ""
};

export function ProductForm({
  suppliers,
  onProductCreated
}: ProductFormProps) {
  const [form, setForm] = useState<ProductFormState>(initialProductForm);
  const [formError, setFormError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateFormField(field: keyof ProductFormState, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  async function handleCreateProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFormError("");
    setIsSubmitting(true);

    const input: CreateProductInput = {
      name: form.name,
      sku: form.sku,
      category: form.category || undefined,
      sellingPrice: Number(form.sellingPrice),
      supplierCost: form.supplierCost ? Number(form.supplierCost) : undefined,
      supplierId: form.supplierId || undefined
    };

    try {
      await createProduct(input);
      setForm(initialProductForm);
      await onProductCreated();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Failed to create product");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="product-form" onSubmit={handleCreateProduct}>
      <div className="form-grid">
        <label>
          Product name
          <input
            value={form.name}
            onChange={(event) => updateFormField("name", event.target.value)}
            placeholder="Example: ACUVUE OASYS"
            required
          />
        </label>

        <label>
          SKU
          <input
            value={form.sku}
            onChange={(event) => updateFormField("sku", event.target.value)}
            placeholder="Example: CL-001"
            required
          />
        </label>

        <label>
          Supplier
          <select
            value={form.supplierId}
            onChange={(event) =>
              updateFormField("supplierId", event.target.value)
            }
          >
            <option value="">No supplier selected</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Category
          <input
            value={form.category}
            onChange={(event) => updateFormField("category", event.target.value)}
            placeholder="Example: Contact Lenses"
          />
        </label>

        <label>
          Selling price
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.sellingPrice}
            onChange={(event) =>
              updateFormField("sellingPrice", event.target.value)
            }
            placeholder="72.99"
            required
          />
        </label>

        <label>
          Supplier cost
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.supplierCost}
            onChange={(event) =>
              updateFormField("supplierCost", event.target.value)
            }
            placeholder="48.25"
          />
        </label>
      </div>

      {formError && <p className="error">{formError}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Adding product..." : "Add product"}
      </button>
    </form>
  );
}