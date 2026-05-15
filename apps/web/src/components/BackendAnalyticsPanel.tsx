import type { OverviewAnalytics } from "../lib/api";

type BackendAnalyticsPanelProps = {
  analytics: OverviewAnalytics | null;
  isLoading: boolean;
  error: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD"
  }).format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function BackendAnalyticsPanel({
  analytics,
  isLoading,
  error
}: BackendAnalyticsPanelProps) {
  return (
    <section className="backend-analytics-panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Backend-powered reporting</p>
          <h2>Analytics API Snapshot</h2>
        </div>

        {analytics && <span>Generated {formatDateTime(analytics.generatedAt)}</span>}
      </div>

      {isLoading && <p>Loading backend analytics...</p>}

      {error && <p className="error">{error}</p>}

      {analytics && (
        <>
          <div className="analytics-api-grid">
            <article>
              <span>Revenue</span>
              <strong>{formatCurrency(analytics.summary.revenue)}</strong>
            </article>

            <article>
              <span>Supplier cost</span>
              <strong>{formatCurrency(analytics.summary.supplierCost)}</strong>
            </article>

            <article>
              <span>Expenses</span>
              <strong>{formatCurrency(analytics.summary.expenses)}</strong>
            </article>

            <article>
              <span>Net profit</span>
              <strong>
                {formatCurrency(analytics.summary.estimatedNetProfit)}
              </strong>
            </article>
          </div>

          <div className="analytics-api-insights">
            <article>
              <h3>Top product</h3>
              {analytics.insights.topProduct ? (
                <p>
                  <strong>{analytics.insights.topProduct.name}</strong>{" "}
                  generated{" "}
                  <strong>
                    {formatCurrency(analytics.insights.topProduct.revenue)}
                  </strong>{" "}
                  in tracked revenue.
                </p>
              ) : (
                <p>No product revenue in this period yet.</p>
              )}
            </article>

            <article>
              <h3>Top expense category</h3>
              {analytics.insights.topExpenseCategory ? (
                <p>
                  <strong>{analytics.insights.topExpenseCategory.name}</strong>{" "}
                  is the largest expense category at{" "}
                  <strong>
                    {formatCurrency(
                      analytics.insights.topExpenseCategory.amount
                    )}
                  </strong>
                  .
                </p>
              ) : (
                <p>No expenses in this period yet.</p>
              )}
            </article>

            <article>
              <h3>Operations watch</h3>
              <p>
                {analytics.summary.openIssueCount} open issue
                {analytics.summary.openIssueCount === 1 ? "" : "s"},{" "}
                {analytics.summary.highPriorityOpenIssueCount} high-priority
                issue
                {analytics.summary.highPriorityOpenIssueCount === 1 ? "" : "s"},{" "}
                and {analytics.summary.lowMarginProductCount} low-margin product
                {analytics.summary.lowMarginProductCount === 1 ? "" : "s"}.
              </p>
            </article>
          </div>
        </>
      )}
    </section>
  );
}