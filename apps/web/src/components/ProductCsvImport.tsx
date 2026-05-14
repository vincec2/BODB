import Papa from "papaparse";
import { useState } from "react";
import { importProducts, type ProductImportRow } from "../lib/api";

type ProductCsvImportProps = {
  onProductsImported: () => Promise<void>;
};

type CsvPreviewRow = {
  rowNumber: number;
  name: string;
  sku: string;
  category: string;
  sellingPrice: string;
  supplierCost: string;
  errors: string[];
};

const requiredColumns = ["name", "sku", "sellingPrice"];

function normalizeHeader(value: string) {
  return value.trim();
}

function validatePreviewRow(row: CsvPreviewRow) {
  const errors: string[] = [];

  if (!row.name.trim()) {
    errors.push("Missing name");
  }

  if (!row.sku.trim()) {
    errors.push("Missing SKU");
  }

  if (!row.sellingPrice.trim()) {
    errors.push("Missing sellingPrice");
  }

  if (row.sellingPrice && Number.isNaN(Number(row.sellingPrice))) {
    errors.push("sellingPrice must be a number");
  }

  if (Number(row.sellingPrice) <= 0) {
    errors.push("sellingPrice must be greater than 0");
  }

  if (row.supplierCost && Number.isNaN(Number(row.supplierCost))) {
    errors.push("supplierCost must be a number");
  }

  if (row.supplierCost && Number(row.supplierCost) < 0) {
    errors.push("supplierCost cannot be negative");
  }

  return errors;
}

function convertPreviewRowsToImportRows(
  rows: CsvPreviewRow[]
): ProductImportRow[] {
  return rows.map((row) => {
    const product: ProductImportRow = {
      name: row.name.trim(),
      sku: row.sku.trim(),
      sellingPrice: Number(row.sellingPrice)
    };

    if (row.category.trim()) {
      product.category = row.category.trim();
    }

    if (row.supplierCost.trim()) {
      product.supplierCost = Number(row.supplierCost);
    }

    return product;
  });
}

export function ProductCsvImport({
  onProductsImported
}: ProductCsvImportProps) {
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
            `Missing required column${missingColumns.length === 1 ? "" : "s"}: ${missingColumns.join(", ")}`
          );
          return;
        }

        const rows: CsvPreviewRow[] = result.data.map((row, index) => {
          const previewRow: CsvPreviewRow = {
            rowNumber: index + 1,
            name: row.name ?? "",
            sku: row.sku ?? "",
            category: row.category ?? "",
            sellingPrice: row.sellingPrice ?? "",
            supplierCost: row.supplierCost ?? "",
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

  async function handleImportProducts() {
    setImportError("");
    setSuccessMessage("");
    setIsImporting(true);

    try {
      const products = convertPreviewRowsToImportRows(previewRows);
      const result = await importProducts(products);

      setPreviewRows([]);
      setSuccessMessage(
        `Successfully imported ${result.importedCount} product${
          result.importedCount === 1 ? "" : "s"
        }.`
      );

      await onProductsImported();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setImportError(err.message);
      } else {
        setImportError("Failed to import products");
      }
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="csv-import-card">
      <div className="csv-import-header">
        <div>
          <h3>Import products from CSV</h3>
          <p>
            Required columns: <strong>name</strong>, <strong>sku</strong>,{" "}
            <strong>sellingPrice</strong>. Optional columns:{" "}
            <strong>category</strong>, <strong>supplierCost</strong>.
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
        <code>name,sku,category,sellingPrice,supplierCost</code>
      </div>

      {importError && (
        <pre className="import-error-message">{importError}</pre>
      )}

      {successMessage && <p className="success">{successMessage}</p>}

      {hasRows && (
        <>
          <div className="csv-preview-summary">
            <span>{previewRows.length} rows ready for preview</span>
            {hasErrors ? (
              <strong className="error">Fix validation errors before importing.</strong>
            ) : (
              <strong className="success">No preview errors detected.</strong>
            )}
          </div>

          <div className="table-card csv-preview-table">
            <table>
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Selling Price</th>
                  <th>Supplier Cost</th>
                  <th>Validation</th>
                </tr>
              </thead>

              <tbody>
                {previewRows.map((row) => (
                  <tr key={`${row.rowNumber}-${row.sku}`}>
                    <td>{row.rowNumber}</td>
                    <td>{row.name}</td>
                    <td>{row.sku}</td>
                    <td>{row.category || "—"}</td>
                    <td>{row.sellingPrice}</td>
                    <td>{row.supplierCost || "—"}</td>
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
              onClick={handleImportProducts}
            >
              {isImporting ? "Importing..." : "Import products"}
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