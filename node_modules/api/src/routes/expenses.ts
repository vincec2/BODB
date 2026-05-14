import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

export const expensesRouter = Router();

const createExpenseSchema = z.object({
  description: z.string().trim().min(1, "Description is required"),
  category: z
    .enum([
      "SHIPPING",
      "ADS",
      "PLATFORM_FEES",
      "PACKAGING",
      "REFUNDS",
      "SOFTWARE",
      "SUPPLIES",
      "OTHER"
    ])
    .default("OTHER"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  vendor: z.string().trim().optional(),
  expenseDate: z.string().trim().optional(),
  notes: z.string().trim().optional()
});

expensesRouter.get("/", async (_req, res, next) => {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: {
        expenseDate: "desc"
      }
    });

    res.json(expenses);
  } catch (error) {
    next(error);
  }
});

expensesRouter.post("/", async (req, res) => {
  const result = createExpenseSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      message: "Invalid expense data",
      errors: result.error.flatten().fieldErrors
    });
    return;
  }

  const { description, category, amount, vendor, expenseDate, notes } =
    result.data;

  try {
    const expense = await prisma.expense.create({
      data: {
      description,
      category,
      amount,
      vendor: vendor || null,
      notes: notes || null,

      ...(expenseDate
          ? { expenseDate: new Date(expenseDate) }
          : {})
      }
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not create expense."
    });
  }
});