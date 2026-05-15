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

const importExpensesBodySchema = z.object({
  expenses: z.array(z.unknown()).min(1, "At least one expense is required").max(300)
});

const optionalText = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
}, z.string().trim().optional());

const importExpenseRowSchema = z.object({
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
  vendor: optionalText,
  expenseDate: optionalText,
  notes: optionalText
});

const updateExpenseSchema = z.object({
  description: z.string().trim().min(1, "Description is required").optional(),
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
    .optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0").optional(),
  vendor: z.string().trim().nullable().optional(),
  expenseDate: z.string().trim().optional(),
  notes: z.string().trim().nullable().optional()
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

expensesRouter.post("/import", async (req, res) => {
  const bodyResult = importExpensesBodySchema.safeParse(req.body);

  if (!bodyResult.success) {
    res.status(400).json({
      message: "Invalid import data",
      errors: bodyResult.error.flatten().fieldErrors
    });
    return;
  }

  const parsedExpenses: z.infer<typeof importExpenseRowSchema>[] = [];
  const rowErrors: {
    rowNumber: number;
    errors: string[];
  }[] = [];

  bodyResult.data.expenses.forEach((rawExpense, index) => {
    const rowResult = importExpenseRowSchema.safeParse(rawExpense);

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

    if (rowResult.data.expenseDate) {
      const parsedDate = new Date(rowResult.data.expenseDate);

      if (Number.isNaN(parsedDate.getTime())) {
        rowErrors.push({
          rowNumber: index + 1,
          errors: ["expenseDate must be a valid date"]
        });
        return;
      }
    }

    parsedExpenses.push(rowResult.data);
  });

  if (rowErrors.length > 0) {
    res.status(400).json({
      message: "Some expenses could not be imported",
      rowErrors
    });
    return;
  }

  try {
    const createdExpenses = await prisma.$transaction(
      parsedExpenses.map((expense) =>
        prisma.expense.create({
          data: {
            description: expense.description,
            category: expense.category,
            amount: expense.amount,
            vendor: expense.vendor ?? null,
            notes: expense.notes ?? null,

            ...(expense.expenseDate
              ? { expenseDate: new Date(expense.expenseDate) }
              : {})
          }
        })
      )
    );

    res.status(201).json({
      importedCount: createdExpenses.length,
      expenses: createdExpenses
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not import expenses."
    });
  }
});

expensesRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ message: "Expense ID is required" });
    return;
  }

  try {
    const existingExpense = await prisma.expense.findUnique({
      where: { id }
    });

    if (!existingExpense) {
      res.status(404).json({ message: "Expense not found" });
      return;
    }

    await prisma.expense.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not delete expense."
    });
  }
});

expensesRouter.patch("/:id", async (req, res) => {
  const result = updateExpenseSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      message: "Invalid expense data",
      errors: result.error.flatten().fieldErrors
    });
    return;
  }

  const { id } = req.params;

  if (!id) {
    res.status(400).json({ message: "Expense ID is required" });
    return;
  }

  const { description, category, amount, vendor, expenseDate, notes } =
    result.data;

  if (expenseDate && Number.isNaN(new Date(expenseDate).getTime())) {
    res.status(400).json({
      message: "Expense date must be a valid date"
    });
    return;
  }

  try {
    const existingExpense = await prisma.expense.findUnique({
      where: { id }
    });

    if (!existingExpense) {
      res.status(404).json({ message: "Expense not found" });
      return;
    }

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        ...(description !== undefined ? { description } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(amount !== undefined ? { amount } : {}),
        ...(vendor !== undefined ? { vendor: vendor || null } : {}),
        ...(expenseDate !== undefined
          ? { expenseDate: new Date(expenseDate) }
          : {}),
        ...(notes !== undefined ? { notes: notes || null } : {})
      }
    });

    res.json(updatedExpense);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not update expense."
    });
  }
});