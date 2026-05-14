import { useState } from "react";
import type { CustomerIssue, CustomerIssueStatus } from "../lib/api";

type CustomerIssuesTableProps = {
  customerIssues: CustomerIssue[];
  hasError: boolean;
  onCustomerIssueStatusChange: (
    issueId: string,
    status: CustomerIssueStatus
  ) => Promise<void>;
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
  onCustomerIssueStatusChange
}: CustomerIssuesTableProps) {
  const [updatingIssueId, setUpdatingIssueId] = useState<string | null>(null);

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

  return (
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
          </tr>
        </thead>

        <tbody>
          {customerIssues.map((issue) => {
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
              </tr>
            );
          })}
        </tbody>
      </table>

      {customerIssues.length === 0 && !hasError && (
        <p className="empty-state">No customer issues found.</p>
      )}
    </div>
  );
}