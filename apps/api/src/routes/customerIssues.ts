import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

export const customerIssuesRouter = Router();

const createCustomerIssueSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  type: z
    .enum([
      "SHIPPING_DELAY",
      "WRONG_ITEM",
      "REFUND_REQUEST",
      "PRODUCT_QUESTION",
      "PAYMENT_ISSUE",
      "SUPPLIER_ISSUE",
      "OTHER"
    ])
    .default("OTHER"),
  status: z
    .enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"])
    .default("OPEN"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  customerName: z.string().trim().optional(),
  customerEmail: z
    .string()
    .trim()
    .email("Email must be valid")
    .optional()
    .or(z.literal("")),
  orderId: z.string().trim().optional(),
  description: z.string().trim().min(1, "Description is required"),
  notes: z.string().trim().optional()
});

const updateCustomerIssueStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"])
});

const customerIssueInclude = {
  order: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
      orderDate: true
    }
  }
};

customerIssuesRouter.get("/", async (_req, res, next) => {
  try {
    const issues = await prisma.customerIssue.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: customerIssueInclude
    });

    res.json(issues);
  } catch (error) {
    next(error);
  }
});

customerIssuesRouter.post("/", async (req, res) => {
  const result = createCustomerIssueSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      message: "Invalid customer issue data",
      errors: result.error.flatten().fieldErrors
    });
    return;
  }

  const {
    title,
    type,
    status,
    priority,
    customerName,
    customerEmail,
    orderId,
    description,
    notes
  } = result.data;

  try {
    if (orderId) {
      const order = await prisma.salesOrder.findUnique({
        where: {
          id: orderId
        }
      });

      if (!order) {
        res.status(404).json({
          message: "Linked order not found"
        });
        return;
      }
    }

    const issue = await prisma.customerIssue.create({
      data: {
        title,
        type,
        status,
        priority,
        customerName: customerName || null,
        customerEmail: customerEmail || null,
        orderId: orderId || null,
        description,
        notes: notes || null
      },
      include: customerIssueInclude
    });

    res.status(201).json(issue);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not create customer issue."
    });
  }
});

customerIssuesRouter.patch("/:id/status", async (req, res) => {
  const result = updateCustomerIssueStatusSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      message: "Invalid customer issue status",
      errors: result.error.flatten().fieldErrors
    });
    return;
  }

  const { id } = req.params;
  const { status } = result.data;

  try {
    const existingIssue = await prisma.customerIssue.findUnique({
      where: { id }
    });

    if (!existingIssue) {
      res.status(404).json({
        message: "Customer issue not found"
      });
      return;
    }

    const updatedIssue = await prisma.customerIssue.update({
      where: { id },
      data: { status },
      include: customerIssueInclude
    });

    res.json(updatedIssue);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not update customer issue status."
    });
  }
});

customerIssuesRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ message: "Customer issue ID is required" });
    return;
  }

  try {
    const existingIssue = await prisma.customerIssue.findUnique({
      where: { id }
    });

    if (!existingIssue) {
      res.status(404).json({ message: "Customer issue not found" });
      return;
    }

    await prisma.customerIssue.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not delete customer issue."
    });
  }
});