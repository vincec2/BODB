import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { openai, openaiModel } from "../lib/openai.js";

export const analyticsRouter = Router();

const overviewRanges = ["all", "last7", "last30", "monthToDate"] as const;

type OverviewRange = (typeof overviewRanges)[number];

const analyticsSummaryRequestSchema = z.object({
  analytics: z.object({
    range: z.enum(["all", "last7", "last30", "monthToDate"]),
    summary: z.object({
      revenue: z.number(),
      supplierCost: z.number(),
      grossProfit: z.number(),
      expenses: z.number(),
      estimatedNetProfit: z.number(),
      orderCount: z.number(),
      expenseCount: z.number(),
      productCount: z.number(),
      customerIssueCount: z.number(),
      openIssueCount: z.number(),
      highPriorityOpenIssueCount: z.number(),
      lowMarginProductCount: z.number()
    }),
    insights: z.object({
      topExpenseCategory: z
        .object({
          name: z.string(),
          amount: z.number()
        })
        .nullable(),
      topProduct: z
        .object({
          name: z.string(),
          revenue: z.number()
        })
        .nullable(),
      lowMarginProductCount: z.number(),
      openIssueCount: z.number(),
      highPriorityOpenIssueCount: z.number()
    })
  })
});

const aiBusinessSummarySchema = z.object({
  generatedAt: z.string(),
  title: z.string(),
  riskLevel: z.enum(["low", "medium", "high"]),
  summaryText: z.string(),
  highlights: z.array(z.string()).min(1).max(8),
  recommendations: z.array(z.string()).min(1).max(8)
});

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD"
  }).format(value);
}

function getRangeLabel(range: OverviewRange) {
  if (range === "last7") {
    return "the last 7 days";
  }

  if (range === "last30") {
    return "the last 30 days";
  }

  if (range === "monthToDate") {
    return "month to date";
  }

  return "all time";
}

function getRiskLevel(input: {
  estimatedNetProfit: number;
  highPriorityOpenIssueCount: number;
  openIssueCount: number;
  lowMarginProductCount: number;
}) {
  if (
    input.estimatedNetProfit < 0 ||
    input.highPriorityOpenIssueCount > 0 ||
    input.openIssueCount >= 5
  ) {
    return "high";
  }

  if (input.lowMarginProductCount > 0 || input.openIssueCount > 0) {
    return "medium";
  }

  return "low";
}

function buildBusinessSummary(
  analytics: z.infer<typeof analyticsSummaryRequestSchema>["analytics"]
) {
  const { summary, insights, range } = analytics;
  const rangeLabel = getRangeLabel(range);

  const riskLevel = getRiskLevel({
    estimatedNetProfit: summary.estimatedNetProfit,
    highPriorityOpenIssueCount: summary.highPriorityOpenIssueCount,
    openIssueCount: summary.openIssueCount,
    lowMarginProductCount: summary.lowMarginProductCount
  });

  const highlights: string[] = [];
  const recommendations: string[] = [];

  if (summary.orderCount === 0) {
    highlights.push(
      `No orders were recorded for ${rangeLabel}, so revenue and profit are currently limited.`
    );

    recommendations.push(
      "Add or import orders so the dashboard can calculate revenue, product performance, and margins."
    );
  } else {
    highlights.push(
      `Revenue for ${rangeLabel} was ${formatCurrency(
        summary.revenue
      )}, with estimated net profit of ${formatCurrency(
        summary.estimatedNetProfit
      )}.`
    );
  }

  if (summary.estimatedNetProfit < 0) {
    highlights.push(
      `Expenses and supplier costs are currently higher than revenue, resulting in an estimated loss of ${formatCurrency(
        Math.abs(summary.estimatedNetProfit)
      )}.`
    );

    recommendations.push(
      "Review ad spend, shipping costs, platform fees, discounts, and supplier costs to identify where margins are being reduced."
    );
  } else if (summary.orderCount > 0) {
    highlights.push(
      `The business is currently showing positive estimated net profit for this reporting period.`
    );

    recommendations.push(
      "Continue monitoring supplier costs and operating expenses to protect margin as order volume increases."
    );
  }

  if (insights.topProduct) {
    highlights.push(
      `${insights.topProduct.name} was the top product by tracked revenue at ${formatCurrency(
        insights.topProduct.revenue
      )}.`
    );

    recommendations.push(
      `Review inventory, supplier cost, and marketing opportunities for ${insights.topProduct.name}, since it is currently driving the most revenue.`
    );
  }

  if (insights.topExpenseCategory) {
    highlights.push(
      `${insights.topExpenseCategory.name} was the largest expense category at ${formatCurrency(
        insights.topExpenseCategory.amount
      )}.`
    );

    recommendations.push(
      `Check whether ${insights.topExpenseCategory.name.toLowerCase()} spending is producing enough value compared with current revenue and profit.`
    );
  }

  if (summary.openIssueCount > 0) {
    highlights.push(
      `There are ${summary.openIssueCount} open or in-progress customer issue${
        summary.openIssueCount === 1 ? "" : "s"
      }.`
    );

    recommendations.push(
      "Review open customer issues and resolve high-priority cases first to reduce operational risk."
    );
  }

  if (summary.highPriorityOpenIssueCount > 0) {
    recommendations.push(
      `${summary.highPriorityOpenIssueCount} high-priority customer issue${
        summary.highPriorityOpenIssueCount === 1 ? " needs" : "s need"
      } attention before lower-priority work.`
    );
  }

  if (summary.lowMarginProductCount > 0) {
    highlights.push(
      `${summary.lowMarginProductCount} product${
        summary.lowMarginProductCount === 1 ? " is" : "s are"
      } below the 25% gross margin warning threshold.`
    );

    recommendations.push(
      "Review low-margin products and consider adjusting price, supplier cost, shipping assumptions, or discount strategy."
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Keep adding clean order, product, supplier, expense, and customer issue data so the summary becomes more useful over time."
    );
  }

  const summaryText =
    summary.orderCount === 0
      ? `For ${rangeLabel}, there is not enough order activity yet to evaluate business performance. The system can still track expenses, product data, and customer issues, but revenue-based insights will become more useful after orders are added.`
      : `For ${rangeLabel}, the business generated ${formatCurrency(
          summary.revenue
        )} in revenue, with ${formatCurrency(
          summary.supplierCost
        )} in supplier costs and ${formatCurrency(
          summary.expenses
        )} in expenses. Estimated net profit is ${formatCurrency(
          summary.estimatedNetProfit
        )}.`;

  return {
    generatedAt: new Date().toISOString(),
    title: `Business summary for ${rangeLabel}`,
    riskLevel,
    summaryText,
    highlights,
    recommendations
  };
}

async function buildOpenAiBusinessSummary(
  analytics: z.infer<typeof analyticsSummaryRequestSchema>["analytics"]
) {
  if (!openai) {
    return buildBusinessSummary(analytics);
  }

  const rangeLabel = getRangeLabel(analytics.range);

  const prompt = `
You are an operations analyst for a small business dashboard called bodb.

Write a concise business summary based ONLY on the analytics JSON below.

Return ONLY valid JSON. Do not use markdown. Do not wrap the response in code fences.

The JSON response must match this exact shape:
{
  "generatedAt": "ISO date string",
  "title": "string",
  "riskLevel": "low" | "medium" | "high",
  "summaryText": "string",
  "highlights": ["string"],
  "recommendations": ["string"]
}

Rules:
- Use Canadian dollars when discussing money.
- Be practical and business-focused.
- Do not invent data.
- Do not mention numbers that are not in the analytics JSON.
- Keep summaryText to 2-4 sentences.
- Include 3-6 highlights.
- Include 3-6 recommendations.
- Risk level should be:
  - "high" if estimated net profit is negative, there are high-priority open issues, or there are many open issues.
  - "medium" if profit is positive but there are low-margin products or some open issues.
  - "low" only if the business appears stable.
- The reporting period is ${rangeLabel}.

Analytics JSON:
${JSON.stringify(analytics, null, 2)}
`;

  const response = await openai.responses.create({
    model: openaiModel,
    input: prompt,
    max_output_tokens: 900
  });

  const rawText = response.output_text;

  if (!rawText) {
    return buildBusinessSummary(analytics);
  }

  try {
    const parsed = parseAiJsonResponse(rawText);
    return aiBusinessSummarySchema.parse(parsed);
  } catch (error) {
    console.error("Failed to parse OpenAI summary response:", error);
    console.error("Raw OpenAI response:", rawText);

    return buildBusinessSummary(analytics);
  }
}

function isOverviewRange(value: unknown): value is OverviewRange {
  return typeof value === "string" && overviewRanges.includes(value as OverviewRange);
}

function getRangeStartDate(range: OverviewRange) {
  const now = new Date();

  if (range === "all") {
    return null;
  }

  if (range === "last7") {
    const date = new Date(now);
    date.setDate(date.getDate() - 7);
    return date;
  }

  if (range === "last30") {
    const date = new Date(now);
    date.setDate(date.getDate() - 30);
    return date;
  }

  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function calculateOrderRevenue(order: {
  items: {
    quantity: number;
    unitPrice: unknown;
  }[];
}) {
  return order.items.reduce((total, item) => {
    return total + Number(item.unitPrice) * item.quantity;
  }, 0);
}

function calculateOrderSupplierCost(order: {
  items: {
    quantity: number;
    supplierCostSnapshot: unknown | null;
  }[];
}) {
  return order.items.reduce((total, item) => {
    const supplierCost = item.supplierCostSnapshot
      ? Number(item.supplierCostSnapshot)
      : 0;

    return total + supplierCost * item.quantity;
  }, 0);
}

function calculateProductMargin(product: {
  sellingPrice: unknown;
  supplierCost: unknown | null;
}) {
  if (product.supplierCost === null) {
    return null;
  }

  const sellingPrice = Number(product.sellingPrice);
  const supplierCost = Number(product.supplierCost);

  if (sellingPrice <= 0) {
    return null;
  }

  return ((sellingPrice - supplierCost) / sellingPrice) * 100;
}

function formatEnumLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function parseAiJsonResponse(text: string) {
  const cleanedText = text
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  return JSON.parse(cleanedText);
}

analyticsRouter.get("/overview", async (req, res) => {
  const requestedRange = req.query.range;
  const range: OverviewRange = isOverviewRange(requestedRange)
    ? requestedRange
    : "all";

  const startDate = getRangeStartDate(range);

  const orderWhere = startDate
    ? {
        orderDate: {
          gte: startDate
        }
      }
    : {};

  const expenseWhere = startDate
    ? {
        expenseDate: {
          gte: startDate
        }
      }
    : {};

  const issueWhere = startDate
    ? {
        createdAt: {
          gte: startDate
        }
      }
    : {};

  try {
    const [orders, expenses, customerIssues, products] = await Promise.all([
      prisma.salesOrder.findMany({
        where: orderWhere,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      }),

      prisma.expense.findMany({
        where: expenseWhere
      }),

      prisma.customerIssue.findMany({
        where: issueWhere,
        select: {
          id: true,
          status: true,
          priority: true,
          type: true
        }
      }),

      prisma.product.findMany({
        select: {
          id: true,
          name: true,
          sellingPrice: true,
          supplierCost: true
        }
      })
    ]);

    const totalRevenue = orders.reduce((total, order) => {
      return total + calculateOrderRevenue(order);
    }, 0);

    const totalSupplierCost = orders.reduce((total, order) => {
      return total + calculateOrderSupplierCost(order);
    }, 0);

    const totalExpenses = expenses.reduce((total, expense) => {
      return total + Number(expense.amount);
    }, 0);

    const grossProfit = totalRevenue - totalSupplierCost;
    const estimatedNetProfit = grossProfit - totalExpenses;

    const orderStatusCounts = orders.reduce<Record<string, number>>(
      (counts, order) => {
        counts[order.status] = (counts[order.status] ?? 0) + 1;
        return counts;
      },
      {}
    );

    const expenseCategoryTotals = expenses.reduce<Record<string, number>>(
      (totals, expense) => {
        totals[expense.category] =
          (totals[expense.category] ?? 0) + Number(expense.amount);

        return totals;
      },
      {}
    );

    const productRevenueMap = new Map<
      string,
      {
        productId: string;
        name: string;
        revenue: number;
      }
    >();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const current = productRevenueMap.get(item.productId) ?? {
          productId: item.productId,
          name: item.product.name,
          revenue: 0
        };

        productRevenueMap.set(item.productId, {
          productId: item.productId,
          name: item.product.name,
          revenue: current.revenue + Number(item.unitPrice) * item.quantity
        });
      });
    });

    const topProductsByRevenue = Array.from(productRevenueMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const expensesByCategory = Object.entries(expenseCategoryTotals)
      .map(([category, amount]) => ({
        category,
        name: formatEnumLabel(category),
        amount
      }))
      .sort((a, b) => b.amount - a.amount);

    const ordersByStatus = Object.entries(orderStatusCounts).map(
      ([status, count]) => ({
        status,
        name: formatEnumLabel(status),
        value: count
      })
    );

    const openIssues = customerIssues.filter((issue) => {
      return issue.status === "OPEN" || issue.status === "IN_PROGRESS";
    });

    const highPriorityOpenIssues = openIssues.filter((issue) => {
      return issue.priority === "HIGH";
    });

    const lowMarginProducts = products.filter((product) => {
      const margin = calculateProductMargin(product);
      return margin !== null && margin < 25;
    });

    const topExpenseCategory = expensesByCategory[0] ?? null;
    const topProduct = topProductsByRevenue[0] ?? null;

    res.json({
      range,
      generatedAt: new Date().toISOString(),
      summary: {
        revenue: totalRevenue,
        supplierCost: totalSupplierCost,
        grossProfit,
        expenses: totalExpenses,
        estimatedNetProfit,
        orderCount: orders.length,
        expenseCount: expenses.length,
        productCount: products.length,
        customerIssueCount: customerIssues.length,
        openIssueCount: openIssues.length,
        highPriorityOpenIssueCount: highPriorityOpenIssues.length,
        lowMarginProductCount: lowMarginProducts.length
      },
      charts: {
        financialSummary: [
          {
            name: "Revenue",
            amount: totalRevenue
          },
          {
            name: "Supplier Cost",
            amount: totalSupplierCost
          },
          {
            name: "Expenses",
            amount: totalExpenses
          },
          {
            name: "Net Profit",
            amount: estimatedNetProfit
          }
        ],
        ordersByStatus,
        expensesByCategory,
        topProductsByRevenue
      },
      insights: {
        topExpenseCategory,
        topProduct,
        lowMarginProductCount: lowMarginProducts.length,
        openIssueCount: openIssues.length,
        highPriorityOpenIssueCount: highPriorityOpenIssues.length
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not load analytics overview."
    });
  }
});

analyticsRouter.post("/summary", async (req, res) => {
  const result = analyticsSummaryRequestSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      message: "Invalid analytics summary data",
      errors: result.error.flatten().fieldErrors
    });
    return;
  }

  try {
    const businessSummary = await buildOpenAiBusinessSummary(
      result.data.analytics
    );

    res.json({
      ...businessSummary,
      model: openai ? openaiModel : "rule-based-fallback"
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not generate business summary."
    });
  }
});