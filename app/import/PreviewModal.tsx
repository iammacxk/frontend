"use client";

import React, { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import type { PreviewResult, PreviewRow } from "../../lib/types/importTypes";

// ─── Types ───────────────────────────────────────────────
type FilterMode = "all" | "errors";

interface PreviewModalProps {
  preview?: PreviewResult | null;
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  confirming?: boolean;
  onValidate?: () => void;
  validating?: boolean;
  fileName?: string;
  title?: string;
}

// ─── Tooltip Component ───────────────────────────────────
function CellTooltip({ message }: { message: string }) {
  return (
    <div className="import-tooltip">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>{message}</span>
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────
function StatusBadge({ hasError }: { hasError: boolean }) {
  if (hasError) return <span className="import-badge import-badge-error">ข้อผิดพลาด</span>;
  return <span className="import-badge import-badge-valid">ถูกต้อง</span>;
}

// ─── Export Error Rows to XLSX ────────────────────────────
function exportErrorRows(rows: PreviewRow[], colKeys: string[], filename: string) {
  const errorRows = rows.filter((r) => r.hasError);
  if (!errorRows.length) return;

  const data = errorRows.map((row) => {
    const obj: Record<string, unknown> = { "แถวที่": row.rowNumber };
    colKeys.forEach((col) => {
      const cell = row.cells[col];
      obj[col] = cell?.value ?? "";
      if (cell?.hasError && cell.errorMessage) {
        obj[`${col}_Error`] = cell.errorMessage;
      }
    });
    return obj;
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Error Data");

  // Auto-size columns
  const colWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.max(key.length + 2, 15),
  }));
  ws["!cols"] = colWidths;

  XLSX.writeFile(wb, filename);
}

// ─── Preview Modal Component ─────────────────────────────
export default function PreviewModal({
  preview,
  open,
  onClose,
  onConfirm,
  confirming = false,
  onValidate,
  validating = false,
  fileName,
  title = "ตัวอย่างข้อมูลจากไฟล์",
}: PreviewModalProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  // Derive values safely (needed before hooks and conditional returns to satisfy Rule of Hooks)
  const previewRows = preview?.previewRows ?? [];
  const totalRows = preview?.totalRows ?? 0;
  const errorCount = preview?.errorCount ?? 0;
  const colKeys = previewRows.length > 0 ? Object.keys(previewRows[0].cells) : [];
  const importableCount = Math.max(totalRows - errorCount, 0);

  const displayRows =
    filterMode === "errors"
      ? previewRows.filter((r: PreviewRow) => r.hasError)
      : previewRows;

  const errorRowCount = previewRows.filter((r: PreviewRow) => r.hasError).length;



  if (!open) return null;

  // ── Pending state: file selected but not yet validated ──
  if (!preview) {
    return (
      <div className="import-modal-backdrop" onClick={onClose}>
        <div className="import-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480, maxHeight: 360 }}>
          <div className="import-modal-header">
            <div className="import-modal-header-left">
              <div className="import-modal-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--sky)" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                {title}
              </div>
              {fileName && (
                <div className="import-modal-subtitle" style={{ marginTop: 4 }}>
                  <span style={{ fontWeight: 600, color: "var(--text-h)" }}>{fileName}</span>
                </div>
              )}
            </div>
            <button className="import-modal-close" onClick={onClose} aria-label="ปิด">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            {validating ? (
              <>
                <div className="import-spinner" style={{ width: 32, height: 32 }} />
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-h)" }}>กำลังตรวจสอบไฟล์...</div>
                <div style={{ fontSize: 11, color: "var(--text-m)" }}>ระบบกำลังอ่านและตรวจสอบเงื่อนไขข้อมูลในไฟล์</div>
              </>
            ) : (
              <>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(99,102,241,.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--sky)" strokeWidth="1.8">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-h)", marginBottom: 4 }}>พร้อมตรวจสอบไฟล์</div>
                  <div style={{ fontSize: 11, color: "var(--text-m)" }}>กดปุ่มด้านล่างเพื่อเริ่มตรวจสอบความถูกต้องของข้อมูล</div>
                </div>
                <div className="import-modal-footer-actions" style={{ width: "100%", justifyContent: "center" }}>
                  <button className="import-btn import-btn-danger" onClick={onClose} style={{ fontSize: 12.5, minWidth: 120 }}>ยกเลิก</button>
                  {onValidate && (
                    <button className="import-btn import-btn-primary" onClick={onValidate} style={{ fontSize: 12.5, minWidth: 120 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      ตรวจสอบไฟล์
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Loaded state: preview result ready ──


  return (
    <div className="import-modal-backdrop" onClick={onClose}>
      <div
        className="import-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="import-modal-header">
          <div className="import-modal-header-left">
            <div className="import-modal-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--sky)" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              {title}
            </div>
            <div className="import-modal-subtitle">
              แสดงตัวอย่าง {displayRows.length} แถวแรก
              {filterMode === "errors" && (
                <span className="import-badge import-badge-error" style={{ marginLeft: 8, fontSize: 10 }}>
                  เฉพาะ Error
                </span>
              )}
            </div>
          </div>
          <button className="import-modal-close" onClick={onClose} aria-label="ปิด">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Stats Row ── */}
        <div className="import-modal-stats">
          <div className="import-modal-stat" style={{ paddingRight: 16, borderRight: "1px solid rgba(148, 155, 168, 0.2)" }}>
            <span className="import-modal-stat-num" style={{ color: "var(--sky)", fontSize: 24 }}>
              {totalRows.toLocaleString()}<span style={{ fontSize: 16, color: "var(--text-m)", fontWeight: 600 }}>/{totalRows.toLocaleString()}</span>
            </span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span className="import-modal-stat-lbl">ตรวจสอบแล้ว</span>
              <span style={{ fontSize: 10, color: "var(--text-f)" }}>(ครบทุกแถวในไฟล์)</span>
            </div>
          </div>
          <div className="import-modal-stat">
            <span className="import-modal-stat-num" style={{ color: "var(--mint)" }}>
              {importableCount.toLocaleString()}
            </span>
            <span className="import-modal-stat-lbl">ข้อมูลถูกต้อง</span>
          </div>
          <div className="import-modal-stat">
            <span className="import-modal-stat-num" style={{ color: "var(--rose)" }}>
              {errorCount.toLocaleString()}
            </span>
            <span className="import-modal-stat-lbl">พบข้อผิดพลาด</span>
          </div>
        </div>

        {/* ── Toolbar: Filter Tabs + Export ── */}
        <div className="import-modal-toolbar">
          <div className="import-filter-tabs">
            <button
              className={`import-filter-tab${filterMode === "all" ? " active" : ""}`}
              onClick={() => setFilterMode("all")}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              ทั้งหมด
              <span className="import-filter-count">{previewRows.length}</span>
            </button>
            <button
              className={`import-filter-tab error${filterMode === "errors" ? " active" : ""}`}
              onClick={() => setFilterMode("errors")}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              เฉพาะรายการที่ Error
              <span className="import-filter-count error">{errorRowCount}</span>
            </button>
          </div>

        </div>

        {/* ── Table ── */}
        <div className="import-modal-table-wrap">
          {displayRows.length === 0 ? (
            <div className="import-empty" style={{ padding: "48px 24px" }}>
              <div className="import-empty-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="import-empty-title">ไม่มีรายการที่ผิดพลาด</div>
              <div className="import-empty-sub">ข้อมูลทั้งหมดถูกต้องพร้อมนำเข้า</div>
            </div>
          ) : (
            <table className="import-table import-table-modal">
              <thead>
                <tr>
                  <th className="import-th-sticky-left">#</th>
                  <th>สถานะ</th>
                  {colKeys.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row: PreviewRow) => (
                  <tr key={row.rowNumber} className={row.hasError ? "import-row-error" : ""}>
                    <td className="import-th-sticky-left" style={{ color: "var(--text-m)", fontSize: 11 }}>
                      {row.rowNumber}
                    </td>
                    <td>
                      <StatusBadge hasError={row.hasError} />
                    </td>
                    {colKeys.map((col) => {
                      const cell = row.cells[col];
                      const isError = cell?.hasError;
                      return (
                        <td
                          key={col}
                          className={isError ? "import-cell-error" : ""}
                        >
                          <div className="import-cell-content">
                            <span className="import-cell-value">
                              {cell?.value !== null && cell?.value !== undefined
                                ? String(cell.value)
                                : "—"}
                            </span>
                            {isError && cell?.errorMessage && (
                              <CellTooltip message={cell.errorMessage} />
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="import-modal-footer">
          <div className="import-modal-footer-info">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            แถวที่มีข้อผิดพลาดจะไม่ถูกนำเข้า · Session หมดอายุใน 30 นาที
          </div>
          <div className="import-modal-footer-actions">
            <button className="import-btn import-btn-danger" onClick={onClose}>
              ปิด
            </button>
            {onConfirm && (
              <button
                className="import-btn import-btn-success"
                onClick={onConfirm}
                disabled={confirming}
              >
                {confirming ? (
                  <>
                    <span className="import-spinner-sm" />
                    กำลังนำเข้า...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    ยืนยันการนำเข้า ({importableCount} รายการ)
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
