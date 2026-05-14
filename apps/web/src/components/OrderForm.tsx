import { useState } from "react";
import {
  createOrder,
  type CreateOrderInput,
  type OrderStatus,
  type Product
} from "../lib/api";

type OrderFormState = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  source: string;
  status: OrderStatus;
  orderDate: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  notes: string;
};

type OrderFormProps = {
  products: Product[];
  onOrderCreated: () => Promise<void>;
};

const initialOrderForm: OrderFormState = {
  orderNumber: "",
  customerName: "",
  customerEmail: "",
  source: "Manual",
  status: "PAID",
  orderDate: "",
  productId: "",
  quantity: "1",
  unitPrice: "",
  notes: ""
};

export function OrderForm({ products, onOrderCreated }: OrderFormProps) {
  const [form, setForm] = useState<OrderFormState>(initialOrderForm);
  const [formError, setFormError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateFormField(field: keyof OrderFormState, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  function handleProductChange(productId: string) {
    const selectedProduct = products.find((product) => product.id === productId);

    setForm((currentForm) => ({
      ...currentForm,
      productId,
      unitPrice: selectedProduct?.sellingPrice ?? ""
    }));
  }

  async function handleCreateOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFormError("");
    setIsSubmitting(true);

    const input: CreateOrderInput = {
      orderNumber: form.orderNumber,
      customerName: form.customerName || undefined,
      customerEmail: form.customerEmail || undefined,
      source: form.source || undefined,
      status: form.status,
      orderDate: form.orderDate || undefined,
      notes: form.notes || undefined,
      productId: form.productId,
      quantity: Number(form.quantity),
      unitPrice: form.unitPrice ? Number(form.unitPrice) : undefined
    };

    try {
      await createOrder(input);
      setForm(initialOrderForm);
      await onOrderCreated();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Failed to create order");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="product-form" onSubmit={handleCreateOrder}>
      <div className="form-grid">
        <label>
          Order number
          <input
            value={form.orderNumber}
            onChange={(event) =>
              updateFormField("orderNumber", event.target.value)
            }
            placeholder="Example: ORD-1001"
            required
          />
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
          Source
          <input
            value={form.source}
            onChange={(event) => updateFormField("source", event.target.value)}
            placeholder="Manual, WooCommerce, Shopify..."
          />
        </label>

        <label>
          Status
          <select
            value={form.status}
            onChange={(event) =>
              updateFormField("status", event.target.value as OrderStatus)
            }
          >
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="FULFILLING">Fulfilling</option>
            <option value="SHIPPED">Shipped</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </label>

        <label>
          Order date
          <input
            type="date"
            value={form.orderDate}
            onChange={(event) =>
              updateFormField("orderDate", event.target.value)
            }
          />
        </label>

        <label>
          Product
          <select
            value={form.productId}
            onChange={(event) => handleProductChange(event.target.value)}
            required
          >
            <option value="">Select product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.sku})
              </option>
            ))}
          </select>
        </label>

        <label>
          Quantity
          <input
            type="number"
            min="1"
            step="1"
            value={form.quantity}
            onChange={(event) =>
              updateFormField("quantity", event.target.value)
            }
            required
          />
        </label>

        <label>
          Unit price
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.unitPrice}
            onChange={(event) =>
              updateFormField("unitPrice", event.target.value)
            }
            placeholder="Auto-filled from product"
          />
        </label>

        <label className="full-width">
          Notes
          <input
            value={form.notes}
            onChange={(event) => updateFormField("notes", event.target.value)}
            placeholder="Optional order notes"
          />
        </label>
      </div>

      {formError && <p className="error">{formError}</p>}

      <button type="submit" disabled={isSubmitting || products.length === 0}>
        {isSubmitting ? "Adding order..." : "Add order"}
      </button>
    </form>
  );
}