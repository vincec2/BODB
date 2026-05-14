import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

export const suppliersRouter = Router();

const createSupplierSchema = z.object({
  name: z.string().trim().min(1, "Supplier name is required"),
  contactName: z.string().trim().optional(),
  email: z.string().trim().email("Email must be valid").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  notes: z.string().trim().optional()
});

suppliersRouter.get("/", async (_req, res, next) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    res.json(suppliers);
  } catch (error) {
    next(error);
  }
});

suppliersRouter.post("/", async (req, res) => {
  const result = createSupplierSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      message: "Invalid supplier data",
      errors: result.error.flatten().fieldErrors
    });
    return;
  }

  const { name, contactName, email, phone, notes } = result.data;

  try {
    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactName: contactName || null,
        email: email || null,
        phone: phone || null,
        notes: notes || null
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    res.status(201).json(supplier);
  } catch (error) {
    console.error(error);

    res.status(409).json({
      message: "Could not create supplier. The supplier name may already exist."
    });
  }
});