export type OverviewTimeRange = "all" | "last30" | "last7" | "monthToDate";

type OverviewTimeFilterProps = {
  activeRange: OverviewTimeRange;
  onRangeChange: (range: OverviewTimeRange) => void;
};

const ranges: { value: OverviewTimeRange; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "last30", label: "Last 30 days" },
  { value: "last7", label: "Last 7 days" },
  { value: "monthToDate", label: "Month to date" }
];

export function getOverviewRangeLabel(range: OverviewTimeRange) {
  return ranges.find((item) => item.value === range)?.label ?? "All time";
}

export function OverviewTimeFilter({
  activeRange,
  onRangeChange
}: OverviewTimeFilterProps) {
  return (
    <div className="overview-filter-card">
      <div>
        <p className="eyebrow">Reporting period</p>
        <h3>{getOverviewRangeLabel(activeRange)}</h3>
      </div>

      <div className="overview-filter-buttons">
        {ranges.map((range) => (
          <button
            className={`overview-filter-button ${
              activeRange === range.value ? "active" : ""
            }`}
            key={range.value}
            type="button"
            onClick={() => onRangeChange(range.value)}
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  );
}