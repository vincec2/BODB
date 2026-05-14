export type AppSection =
  | "overview"
  | "suppliers"
  | "orders"
  | "customerIssues"
  | "expenses"
  | "products";

type SectionNavProps = {
  activeSection: AppSection;
  onSectionChange: (section: AppSection) => void;
  counts: {
    suppliers: number;
    orders: number;
    customerIssues: number;
    expenses: number;
    products: number;
  };
};

const sections: {
  id: AppSection;
  label: string;
  countKey?: keyof SectionNavProps["counts"];
}[] = [
  {
    id: "overview",
    label: "Overview"
  },
  {
    id: "suppliers",
    label: "Suppliers",
    countKey: "suppliers"
  },
  {
    id: "orders",
    label: "Orders",
    countKey: "orders"
  },
  {
    id: "customerIssues",
    label: "Customer Issues",
    countKey: "customerIssues"
  },
  {
    id: "expenses",
    label: "Expenses",
    countKey: "expenses"
  },
  {
    id: "products",
    label: "Products",
    countKey: "products"
  }
];

export function SectionNav({
  activeSection,
  onSectionChange,
  counts
}: SectionNavProps) {
  return (
    <nav className="section-nav" aria-label="Dashboard sections">
      {sections.map((section) => {
        const isActive = section.id === activeSection;
        const count =
          section.countKey === undefined ? null : counts[section.countKey];

        return (
          <button
            className={`section-nav-button ${isActive ? "active" : ""}`}
            key={section.id}
            type="button"
            onClick={() => onSectionChange(section.id)}
          >
            <span>{section.label}</span>
            {count !== null && <strong>{count}</strong>}
          </button>
        );
      })}
    </nav>
  );
}