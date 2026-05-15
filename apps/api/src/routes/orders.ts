import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

export const ordersRouter = Router();

const createOrderSchema = z.object({
  orderNumber: z.string().trim().min(1, "Order number is required"),
  customerName: z.string().trim().optional(),
  customerEmail: z
    .string()
    .trim()
    .email("Email must be valid")
    .optional()
    .or(z.literal("")),
  source: z.string().trim().optional(),
  status: z
    .enum([
      "PENDING",
      "PAID",
      "FULFILLING",
      "SHIPPED",
      "COMPLETED",
      "CANCELLED",
      "REFUNDED"
    ])
    .default("PAID"),
  orderDate: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  productId: z.string().trim().min(1, "Product is required"),
  quantity: z.coerce.number().int().positive("Quantity must be at least 1"),
  unitPrice: z.coerce.number().positive("Unit price must be greater than 0").optional()
});

const updateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "PAID",
    "FULFILLING",
    "SHIPPED",
    "COMPLETED",
    "CANCELLED",
    "REFUNDED"
  ])
});

const orderInclude = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          supplier: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  }
};

ordersRouter.get("/", async (_req, res, next) => {
  try {
    const orders = await prisma.salesOrder.findMany({
      orderBy: {
        orderDate: "desc"
      },
      include: orderInclude
    });

    res.json(orders);
  } catch (error) {
    next(error);
  }
});

ordersRouter.post("/", async (req, res) => {
  const result = createOrderSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      message: "Invalid order data",
      errors: result.error.flatten().fieldErrors
    });
    return;
  }

  const {
    orderNumber,
    customerName,
    customerEmail,
    source,
    status,
    orderDate,
    notes,
    productId,
    quantity,
    unitPrice
  } = result.data;

  try {
    const product = await prisma.product.findUnique({
      where: {
        id: productId
      }
    });

    if (!product) {
      res.status(404).json({
        message: "Product not found"
      });
      return;
    }

    const finalUnitPrice = unitPrice ?? Number(product.sellingPrice);
    const supplierCostSnapshot =
      product.supplierCost === null ? null : Number(product.supplierCost);

    const order = await prisma.salesOrder.create({
      data: {
        orderNumber,
        customerName: customerName || null,
        customerEmail: customerEmail || null,
        source: source || null,
        status,
        notes: notes || null,

        ...(orderDate
            ? { orderDate: new Date(orderDate) }
            : {}),

        items: {
            create: {
            productId,
            quantity,
            unitPrice: finalUnitPrice,
            supplierCostSnapshot
            }
        }
      },
      include: orderInclude
    });

    res.status(201).json(order);
  } catch (error) {
    console.error(error);

    res.status(409).json({
      message: "Could not create order. The order number may already exist."
    });
  }
});

ordersRouter.patch("/:id/status", async (req, res) => {
  const result = updateOrderStatusSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      message: "Invalid order status",
      errors: result.error.flatten().fieldErrors
    });
    return;
  }

  const { id } = req.params;
  const { status } = result.data;

  try {
    const existingOrder = await prisma.salesOrder.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      res.status(404).json({
        message: "Order not found"
      });
      return;
    }

    const updatedOrder = await prisma.salesOrder.update({
      where: { id },
      data: { status },
      include: orderInclude
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not update order status."
    });
  }
});

ordersRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ message: "Order ID is required" });
    return;
  }

  try {
    const existingOrder = await prisma.salesOrder.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    await prisma.salesOrder.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not delete order."
    });
  }
});