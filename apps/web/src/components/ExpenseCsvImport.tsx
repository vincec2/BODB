import Papa from "papaparse";
import { useState } from "react";
import {
  importExpenses,
  type ExpenseCategory,
  type ExpenseImportRow
} from "../lib/api";

type ExpenseCsvImportProps = {
  onExpensesImported: () => Promise<void>;
};

type CsvPreviewRow = {
  rowNumber: number;
  description: string;
  category: string;
  amount: string;
  vendor: string;
  expenseDate: string;
  notes: string;
  errors: string[];
};

const requiredColumns = ["description", "category", "amount"];

const allowedCategories: ExpenseCategory[] = [
  "SHIPPING",
  "ADS",
  "PLATFORM_FEES",
  "PACKAGING",
  "REFUNDS",
  "SOFTWARE",
  "SUPPLIES",
  "OTHER"
];

function normalizeHeader(value: string) {
  return value.trim();
}

function normalizeExpenseCategory(value: string): ExpenseCategory | null {
  const normalized = value.trim().toUpperCase().replaceAll(" ", "_").replaceAll("-", "_");

  if (allowedCategories.includes(normalized as ExpenseCategory)) {
    return normalized as ExpenseCategory;
  }

  return null;
}

function validatePreviewRow(row: CsvPreviewRow) {
  const errors: string[] = [];

  if (!row.description.trim()) {
    errors.push("Missing description");
  }

  if (!row.category.trim()) {
    errors.push("Missing category");
  } else if (!normalizeExpenseCategory(row.category)) {
    errors.push(
      `Invalid category. Use one of: ${allowedCategories.join(", ")}`
    );
  }

  if (!row.amount.trim()) {
    errors.push("Missing amount");
  }

  if (row.amount && Number.isNaN(Number(row.amount))) {
    errors.push("amount must be a number");
  }

  if (Number(row.amount) <= 0) {
    errors.push("amount must be greater than 0");
  }

  if (
    row.expenseDate.trim() &&
    Number.isNaN(new Date(row.expenseDate).getTime())
  ) {
    errors.push("expenseDate must be a valid date");
  }

  return errors;
}

function convertPreviewRowsToImportRows(
  rows: CsvPreviewRow[]
): ExpenseImportRow[] {
  return rows.map((row) => {
    const category = normalizeExpenseCategory(row.category);

    if (!category) {
      throw new Error(`Row ${row.rowNumber}: invalid category`);
    }

    const expense: ExpenseImportRow = {
      description: row.description.trim(),
      category,
      amount: Number(row.amount)
    };

    if (row.vendor.trim()) {
      expense.vendor = row.vendor.trim();
    }

    if (row.expenseDate.trim()) {
      expense.expenseDate = row.expenseDate.trim();
    }

    if (row.notes.trim()) {
      expense.notes = row.notes.trim();
    }

    return expense;
  });
}

export function ExpenseCsvImport({
  onExpensesImported
}: ExpenseCsvImportProps) {
  const [previewRows, setPreviewRows] = useState<CsvPreviewRow[]>([]);
  const [importError, setImportError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);

  const hasRows = previewRows.length > 0;
  const hasErrors = previewRows.some((row) => row.errors.length > 0);

  function handleCsvFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setImportError("");
    setSuccessMessage("");
    setPreviewRows([]);

    if (!file) {
      return;
    }

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normalizeHeader,
      complete: (result) => {
        const fields = result.meta.fields ?? [];

        const missingColumns = requiredColumns.filter(
          (column) => !fields.includes(column)
        );

        if (missingColumns.length > 0) {
          setImportError(
            `Missing required column${
              missingColumns.length === 1 ? "" : "s"
            }: ${missingColumns.join(", ")}`
          );
          return;
        }

        const rows: CsvPreviewRow[] = result.data.map((row, index) => {
          const previewRow: CsvPreviewRow = {
            rowNumber: index + 1,
            description: row.description ?? "",
            category: row.category ?? "",
            amount: row.amount ?? "",
            vendor: row.vendor ?? "",
            expenseDate: row.expenseDate ?? "",
            notes: row.notes ?? "",
            errors: []
          };

          previewRow.errors = validatePreviewRow(previewRow);

          return previewRow;
        });

        setPreviewRows(rows);
      },
      error: (error) => {
        setImportError(error.message);
      }
    });

    event.target.value = "";
  }

  async function handleImportExpenses() {
    setImportError("");
    setSuccessMessage("");
    setIsImporting(true);

    try {
      const expenses = convertPreviewRowsToImportRows(previewRows);
      const result = await importExpenses(expenses);

      setPreviewRows([]);
      setSuccessMessage(
        `Successfully imported ${result.importedCount} expense${
          result.importedCount === 1 ? "" : "s"
        }.`
      );

      await onExpensesImported();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setImportError(err.message);
      } else {
        setImportError("Failed to import expenses");
      }
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="csv-import-card">
      <div className="csv-import-header">
        <div>
          <h3>Import expenses from CSV</h3>
          <p>
            Required columns: <strong>description</strong>,{" "}
            <strong>category</strong>, <strong>amount</strong>. Optional
            columns: <strong>vendor</strong>, <strong>expenseDate</strong>,{" "}
            <strong>notes</strong>.
          </p>
        </div>

        <label className="file-upload-button">
          Choose CSV
          <input
            accept=".csv,text/csv"
            type="file"
            onChange={handleCsvFileChange}
          />
        </label>
      </div>

      <div className="csv-template-box">
        <p>Example CSV format:</p>
        <code>description,category,amount,vendor,expenseDate,notes</code>
      </div>

      <div className="csv-template-box">
        <p>Allowed categories:</p>
        <code>{allowedCategories.join(", ")}</code>
      </div>

      {importError && <pre className="import-error-message">{importError}</pre>}

      {successMessage && <p className="success">{successMessage}</p>}

      {hasRows && (
        <>
          <div className="csv-preview-summary">
            <span>{previewRows.length} rows ready for preview</span>
            {hasErrors ? (
              <strong className="error">
                Fix validation errors before importing.
              </strong>
            ) : (
              <strong className="success">No preview errors detected.</strong>
            )}
          </div>

          <div className="table-card csv-preview-table">
            <table>
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Vendor</th>
                  <th>Date</th>
                  <th>Notes</th>
                  <th>Validation</th>
                </tr>
              </thead>

              <tbody>
                {previewRows.map((row) => (
                  <tr key={row.rowNumber}>
                    <td>{row.rowNumber}</td>
                    <td>{row.description}</td>
                    <td>{row.category}</td>
                    <td>{row.amount}</td>
                    <td>{row.vendor || "—"}</td>
                    <td>{row.expenseDate || "—"}</td>
                    <td>{row.notes || "—"}</td>
                    <td>
                      {row.errors.length === 0 ? (
                        <span className="success">Valid</span>
                      ) : (
                        <span className="error">{row.errors.join(", ")}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="csv-import-actions">
            <button
              type="button"
              disabled={hasErrors || isImporting}
              onClick={handleImportExpenses}
            >
              {isImporting ? "Importing..." : "Import expenses"}
            </button>

            <button
              className="secondary-button"
              type="button"
              disabled={isImporting}
              onClick={() => setPreviewRows([])}
            >
              Clear preview
            </button>
          </div>
        </>
      )}
    </section>
  );
}