import { useMemo, useState } from "react";
import type {
  CustomerIssue,
  CustomerIssuePriority,
  CustomerIssueStatus,
  CustomerIssueType
} from "../lib/api";

type CustomerIssuesTableProps = {
  customerIssues: CustomerIssue[];
  hasError: boolean;
  onCustomerIssueStatusChange: (
    issueId: string,
    status: CustomerIssueStatus
  ) => Promise<void>;
  onCustomerIssueDelete: (issueId: string) => Promise<void>;
};

const customerIssueStatuses: {
  value: CustomerIssueStatus;
  label: string;
}[] = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" }
];

const customerIssuePriorities: {
  value: CustomerIssuePriority;
  label: string;
}[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" }
];

const customerIssueTypes: {
  value: CustomerIssueType;
  label: string;
}[] = [
  { value: "SHIPPING_DELAY", label: "Shipping delay" },
  { value: "WRONG_ITEM", label: "Wrong item" },
  { value: "REFUND_REQUEST", label: "Refund request" },
  { value: "PRODUCT_QUESTION", label: "Product question" },
  { value: "PAYMENT_ISSUE", label: "Payment issue" },
  { value: "SUPPLIER_ISSUE", label: "Supplier issue" },
  { value: "OTHER", label: "Other" }
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function formatEnum(value: string) {
  return value
    .replace("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function CustomerIssuesTable({
  customerIssues,
  hasError,
  onCustomerIssueStatusChange,
  onCustomerIssueDelete
}: CustomerIssuesTableProps) {
  const [updatingIssueId, setUpdatingIssueId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | CustomerIssueStatus
  >("ALL");
  const [priorityFilter, setPriorityFilter] = useState<
    "ALL" | CustomerIssuePriority
  >("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | CustomerIssueType>(
    "ALL"
  );
  const [deletingIssueId, setDeletingIssueId] = useState<string | null>(null);

  const filteredIssues = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return customerIssues.filter((issue) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        issue.title.toLowerCase().includes(normalizedSearch) ||
        issue.description.toLowerCase().includes(normalizedSearch) ||
        (issue.customerName ?? "").toLowerCase().includes(normalizedSearch) ||
        (issue.customerEmail ?? "").toLowerCase().includes(normalizedSearch) ||
        (issue.order?.orderNumber ?? "").toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" || issue.status === statusFilter;

      const matchesPriority =
        priorityFilter === "ALL" || issue.priority === priorityFilter;

      const matchesType = typeFilter === "ALL" || issue.type === typeFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesType;
    });
  }, [
    customerIssues,
    searchTerm,
    statusFilter,
    priorityFilter,
    typeFilter
  ]);

  async function handleStatusChange(
    issueId: string,
    status: CustomerIssueStatus
  ) {
    setUpdatingIssueId(issueId);

    try {
      await onCustomerIssueStatusChange(issueId, status);
    } finally {
      setUpdatingIssueId(null);
    }
  }

  async function handleDeleteIssue(issue: CustomerIssue) {
    const confirmed = window.confirm(
      `Delete customer issue "${issue.title}"?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingIssueId(issue.id);

    try {
      await onCustomerIssueDelete(issue.id);
    } finally {
      setDeletingIssueId(null);
    }
  }

  return (
    <>
      <div className="table-toolbar">
        <div className="table-toolbar-header">
          <h3>Customer issue filters</h3>
          <span>
            Showing {filteredIssues.length} of {customerIssues.length}
          </span>
        </div>

        <div className="filter-grid four-columns">
          <label>
            Search
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search title, customer, order, or description"
            />
          </label>

          <label>
            Status
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as "ALL" | CustomerIssueStatus
                )
              }
            >
              <option value="ALL">All statuses</option>
              {customerIssueStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Priority
            <select
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(
                  event.target.value as "ALL" | CustomerIssuePriority
                )
              }
            >
              <option value="ALL">All priorities</option>
              {customerIssuePriorities.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Type
            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as "ALL" | CustomerIssueType)
              }
            >
              <option value="ALL">All types</option>
              {customerIssueTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Issue</th>
              <th>Type</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Customer</th>
              <th>Order</th>
              <th>Created</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredIssues.map((issue) => {
              const isUpdating = updatingIssueId === issue.id;

              return (
                <tr key={issue.id}>
                  <td>{issue.title}</td>
                  <td>{formatEnum(issue.type)}</td>
                  <td>
                    <select
                      className="table-select"
                      value={issue.status}
                      disabled={isUpdating}
                      onChange={(event) =>
                        handleStatusChange(
                          issue.id,
                          event.target.value as CustomerIssueStatus
                        )
                      }
                    >
                      {customerIssueStatuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{formatEnum(issue.priority)}</td>
                  <td>{issue.customerName ?? "—"}</td>
                  <td>{issue.order?.orderNumber ?? "—"}</td>
                  <td>{formatDate(issue.createdAt)}</td>
                  <td>{issue.description}</td>
                  <td>
                    <button
                      className="danger-button small-button"
                      type="button"
                      disabled={deletingIssueId === issue.id}
                      onClick={() => handleDeleteIssue(issue)}
                    >
                      {deletingIssueId === issue.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredIssues.length === 0 && !hasError && (
          <p className="empty-state">No customer issues match these filters.</p>
        )}
      </div>
    </>
  );
}