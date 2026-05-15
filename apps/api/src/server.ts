import express from "express";
import cors from "cors";
import { productsRouter } from "./routes/products.js";
import { suppliersRouter } from "./routes/suppliers.js";
import { ordersRouter } from "./routes/orders.js";
import { expensesRouter } from "./routes/expenses.js";
import { customerIssuesRouter } from "./routes/customerIssues.js";
import { analyticsRouter } from "./routes/analytics.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "bodb-api"
  });
});

app.use("/api/products", productsRouter);
app.use("/api/suppliers", suppliersRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/customer-issues", customerIssuesRouter);
app.use("/api/analytics", analyticsRouter);

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(error);

    res.status(500).json({
      message: "Unexpected server error"
    });
  }
);

app.listen(PORT, () => {
  console.log(`bodb API running on http://localhost:${PORT}`);
});