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

const importProductsBodySchema = z.object({
  products: z.array(z.unknown()).min(1, "At least one product is required").max(200)
});

const optionalText = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
}, z.string().trim().optional());

const importProductRowSchema = z.object({
  name: z.string().trim().min(1, "Product name is required"),
  sku: z.string().trim().min(1, "SKU is required"),
  category: optionalText,
  sellingPrice: z.coerce.number().positive("Selling price must be greater than 0"),
  supplierCost: z.coerce
    .number()
    .nonnegative("Supplier cost cannot be negative")
    .optional()
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

productsRouter.post("/import", async (req, res) => {
  const bodyResult = importProductsBodySchema.safeParse(req.body);

  if (!bodyResult.success) {
    res.status(400).json({
      message: "Invalid import data",
      errors: bodyResult.error.flatten().fieldErrors
    });
    return;
  }

  const parsedProducts: z.infer<typeof importProductRowSchema>[] = [];
  const rowErrors: {
    rowNumber: number;
    sku?: string;
    errors: string[];
  }[] = [];

  bodyResult.data.products.forEach((rawProduct, index) => {
    const rowResult = importProductRowSchema.safeParse(rawProduct);

    if (!rowResult.success) {
      const errors = Object.values(rowResult.error.flatten().fieldErrors)
        .flat()
        .filter((error): error is string => Boolean(error));

      rowErrors.push({
        rowNumber: index + 1,
        errors
      });

      return;
    }

    parsedProducts.push(rowResult.data);
  });

  const skuCounts = new Map<string, number>();

  for (const product of parsedProducts) {
    skuCounts.set(product.sku, (skuCounts.get(product.sku) ?? 0) + 1);
  }

  for (const product of parsedProducts) {
    if ((skuCounts.get(product.sku) ?? 0) > 1) {
      rowErrors.push({
        rowNumber: parsedProducts.indexOf(product) + 1,
        sku: product.sku,
        errors: ["Duplicate SKU found inside this CSV import"]
      });
    }
  }

  const existingProducts = await prisma.product.findMany({
    where: {
      sku: {
        in: parsedProducts.map((product) => product.sku)
      }
    },
    select: {
      sku: true
    }
  });

  const existingSkus = new Set(existingProducts.map((product) => product.sku));

  parsedProducts.forEach((product, index) => {
    if (existingSkus.has(product.sku)) {
      rowErrors.push({
        rowNumber: index + 1,
        sku: product.sku,
        errors: ["SKU already exists in the database"]
      });
    }
  });

  if (rowErrors.length > 0) {
    res.status(400).json({
      message: "Some products could not be imported",
      rowErrors
    });
    return;
  }

  try {
    const createdProducts = await prisma.$transaction(
      parsedProducts.map((product) =>
        prisma.product.create({
          data: {
            name: product.name,
            sku: product.sku,
            category: product.category ?? null,
            sellingPrice: product.sellingPrice,
            supplierCost: product.supplierCost ?? null
          },
          include: {
            supplier: {
              select: {
                id: true,
                name: true
              }
            }
          }
        })
      )
    );

    res.status(201).json({
      importedCount: createdProducts.length,
      products: createdProducts
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not import products."
    });
  }
});

productsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ message: "Product ID is required" });
    return;
  }

  try {
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    await prisma.product.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error(error);

    res.status(409).json({
      message:
        "Could not delete product. It may already be used by an order."
    });
  }
});