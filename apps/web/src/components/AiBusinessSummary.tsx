import { useState } from "react";
import {
  generateBusinessSummary,
  type BusinessSummary,
  type OverviewAnalytics
} from "../lib/api";

type AiBusinessSummaryProps = {
  analytics: OverviewAnalytics | null;
  isAnalyticsLoading: boolean;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function getRiskLabel(riskLevel: BusinessSummary["riskLevel"]) {
  if (riskLevel === "high") {
    return "High attention";
  }

  if (riskLevel === "medium") {
    return "Moderate attention";
  }

  return "Stable";
}

export function AiBusinessSummary({
  analytics,
  isAnalyticsLoading
}: AiBusinessSummaryProps) {
  const [summary, setSummary] = useState<BusinessSummary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  async function handleGenerateSummary() {
    if (!analytics) {
      setSummaryError("Analytics must load before generating a summary.");
      return;
    }

    setIsGenerating(true);
    setSummaryError("");

    try {
      const generatedSummary = await generateBusinessSummary(analytics);
      setSummary(generatedSummary);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSummaryError(err.message);
      } else {
        setSummaryError("Failed to generate business summary");
      }
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <section className="ai-summary-panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">AI-ready reporting</p>
          <h2>Business Summary Generator</h2>
        </div>

        <button
          type="button"
          disabled={!analytics || isAnalyticsLoading || isGenerating}
          onClick={handleGenerateSummary}
        >
          {isGenerating ? "Generating..." : "Generate summary"}
        </button>
      </div>

      <p className="ai-summary-note">
        This MVP uses a backend rule-based generator. Later, the same endpoint
        can be upgraded to call a real AI model using the analytics data.
      </p>

      {summaryError && <p className="error">{summaryError}</p>}

      {!summary && !summaryError && (
        <div className="ai-summary-empty">
          Generate a plain-English business report from the current analytics
          period.
        </div>
      )}

      {summary && (
        <div className="ai-summary-result">
          <div className="ai-summary-result-header">
            <div>
              <h3>{summary.title}</h3>
              <p>Generated {formatDateTime(summary.generatedAt)}</p>
            </div>

            <span className={`risk-badge risk-badge-${summary.riskLevel}`}>
              {getRiskLabel(summary.riskLevel)}
            </span>
          </div>

          <p className="ai-summary-text">{summary.summaryText}</p>

          <div className="ai-summary-columns">
            <article>
              <h4>Key highlights</h4>
              <ul>
                {summary.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </article>

            <article>
              <h4>Recommended next actions</h4>
              <ul>
                {summary.recommendations.map((recommendation) => (
                  <li key={recommendation}>{recommendation}</li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      )}
    </section>
  );
}