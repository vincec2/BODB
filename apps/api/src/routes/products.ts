import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

export const productsRouter = Router();

const createProductSchema = z.object({
  name: z.string().trim().min(1, "Product name is required"),
  sku: z.string().trim().min(1, "SKU is required"),
  category: z.string().trim().optional(),
  sellingPrice: z.coerce
    .number()
    .positive("Selling price must be greater than 0"),
  supplierCost: z.coerce
    .number()
    .nonnegative("Supplier cost cannot be negative")
    .optional(),
  supplierId: z.string().trim().optional()
});

productsRouter.get("/", async (_req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json(products);
  } catch (error) {
    next(error);
  }
});

productsRouter.post("/", async (req, res) => {
  const result = createProductSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      message: "Invalid product data",
      errors: result.error.flatten().fieldErrors
    });
    return;
  }

  const { name, sku, category, sellingPrice, supplierCost, supplierId } =
    result.data;

  try {
    const product = await prisma.product.create({
      data: {
        name,
        sku,
        category: category || null,
        sellingPrice,
        supplierCost: supplierCost ?? null,
        supplierId: supplierId || null
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json(product);
  } catch (error) {
    console.error(error);

    res.status(409).json({
      message:
        "Could not create product. The SKU may already exist or the supplier may not exist."
    });
  }
});