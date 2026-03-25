"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { importService } from "../../lib/services/importService";
import PreviewModal from "./PreviewModal";
import type {
  PreviewResult,
  PreviewRow,
  ImportConfirmResult,
  ImportHistoryRecord,
} from "../../lib/types/importTypes";

// ─── Types ───────────────────────────────────────────────
type TabId = "student" | "dropout" | "results" | "history";

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

// ─── Backend-expected column names ───────────────────────
const STUDENT_COLS = [
  "PersonID_Onec",
  "PassportNumber_Onec",
  "FirstName_Onec",
  "MiddleName_Onec",
  "LastName_Onec",
  "AcademicYear_Onec",
  "Semester_Onec",
  "PrefixID_Onec",
  "GenderID_Onec",
  "NationalityID_Onec",
  "DisabilityID_Onec",
  "DisadvantageEducationID_Onec",
  "DepartmentID_Onec",
  "StudentStatusID_Onec",
  "GradeLevelID_Onec",
  "SchoolID_Onec",
  "SchoolAdmissionYear_Onec",
  "GPAX_Onec",
  "SubDistrictID_Onec",
];
const DROPOUT_COLS = [
  "ACADYEAR",
  "PersonID_Onec",
  "BirthDate_Onec",
  "GradeLevelID_Onec",
  "SchoolName_Onec",
  "AcademicYearPresent_Onec",
  "StatusCodeCause_Onec",
  "DropoutTransferID_Onec",
  "ProvinceNameThai_Onec",
  "DistrictNameThai_Onec",
  "SubDistrictNameThai_Onec",
];

const STUDENT_COLUMN_EXAMPLES: Record<string, string> = {
  PersonID_Onec: "1234567890123 (เลข 13 หลัก)",
  PassportNumber_Onec: "AA1234567",
  FirstName_Onec: "สมชาย",
  MiddleName_Onec: "- หรือเว้นว่างได้",
  LastName_Onec: "ใจดี",
  AcademicYear_Onec: "2567",
  Semester_Onec: "1 หรือ 2",
  PrefixID_Onec: "1 (อ้างอิงรหัสคำนำหน้าในระบบ)",
  GenderID_Onec: "1 = ชาย, 2 = หญิง",
  NationalityID_Onec: "TH",
  DisabilityID_Onec: "0 หรือรหัสความพิการ",
  DisadvantageEducationID_Onec: "0 หรือรหัสกลุ่มด้อยโอกาส",
  DepartmentID_Onec: "101",
  StudentStatusID_Onec: "1 = กำลังเรียน",
  GradeLevelID_Onec: "P1, M1, หรือรหัสชั้นเรียน",
  SchoolID_Onec: "11010001",
  SchoolAdmissionYear_Onec: "2565",
  GPAX_Onec: "3.25",
  SubDistrictID_Onec: "1010101",
};

const DROPOUT_COLUMN_EXAMPLES: Record<string, string> = {
  ACADYEAR: "2567",
  PersonID_Onec: "1234567890123",
  BirthDate_Onec: "01/01/2555 หรือ 2012-01-01",
  GradeLevelID_Onec: "P6, M3, หรือรหัสชั้น",
  SchoolName_Onec: "โรงเรียนบ้านดอน",
  AcademicYearPresent_Onec: "2567",
  StatusCodeCause_Onec: "01",
  DropoutTransferID_Onec: "0 หรือรหัสการย้าย",
  ProvinceNameThai_Onec: "เชียงใหม่",
  DistrictNameThai_Onec: "เมืองเชียงใหม่",
  SubDistrictNameThai_Onec: "ศรีภูมิ",
};

// ─── Sub-components ──────────────────────────────────────

function StatusBadge({ hasError }: { hasError: boolean }) {
  if (hasError)
    return <span className="import-badge import-badge-error">ข้อผิดพลาด</span>;
  return <span className="import-badge import-badge-valid">ถูกต้อง</span>;
}

function HistoryBadge({ status }: { status: string }) {
  if (status === "completed")
    return <span className="import-badge import-badge-completed">สำเร็จ</span>;
  if (status === "completed-warn")
    return (
      <span className="import-badge import-badge-completed-warn">
        สำเร็จ (มีคำเตือน)
      </span>
    );
  if (status === "failed")
    return <span className="import-badge import-badge-error">ล้มเหลว</span>;
  if (status === "processing")
    return (
      <span className="import-badge import-badge-processing">
        กำลังประมวลผล
      </span>
    );
  return null;
}

function CellTooltip({ message }: { message: string }) {
  return (
    <div className="import-tooltip">
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>{message}</span>
    </div>
  );
}

function LoadingOverlay({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="import-card">
      <div className="import-loading-overlay">
        <div className="import-spinner" />
        <div className="import-loading-title">{title}</div>
        {subtitle && <div className="import-loading-sub">{subtitle}</div>}
      </div>
    </div>
  );
}

function ProgressOverlay({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label: string;
}) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="import-card">
      <div className="import-loading-overlay">
        <div className="import-spinner" />
        <div className="import-loading-title">{label}</div>
        <div className="import-progress-wrap">
          <div className="import-progress-bar">
            <div
              className="import-progress-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="import-progress-text">
            <span className="import-progress-count">
              อัปโหลดแล้ว {current.toLocaleString()} / {total.toLocaleString()}{" "}
              รายการ
            </span>
            <span className="import-progress-pct">{pct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadZone({
  file,
  onFile,
  accept = ".csv,.xlsx",
}: {
  file: File | null;
  onFile: (f: File) => void;
  accept?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  return (
    <div
      className={`import-dropzone${drag ? " drag-over" : ""}`}
      onClick={() => ref.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
    >
      <input
        ref={ref}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      <div className="import-dropzone-icon">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <div className="import-dropzone-title">
        ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
      </div>
      <div className="import-dropzone-sub">
        รองรับไฟล์ CSV และ XLSX ขนาดสูงสุด 50 MB
      </div>
      <div className="import-dropzone-tags">
        <span className="import-file-tag">CSV</span>
        <span className="import-file-tag">XLSX</span>
      </div>
      {file && (
        <div
          className="import-file-selected"
          onClick={(e) => e.stopPropagation()}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ color: "var(--text-h)", fontWeight: 700 }}>
            {file.name}
          </span>
          <span style={{ color: "var(--text-m)", fontSize: 11 }}>
            ({(file.size / 1024).toFixed(1)} KB)
          </span>
        </div>
      )}
    </div>
  );
}

function StatCards({
  total,
  valid,
  warning,
  error,
}: {
  total: number;
  valid: number;
  warning: number;
  error: number;
}) {
  return (
    <div className="import-stat-grid">
      <div className="import-stat-card">
        <div
          className="import-stat-num"
          style={{ color: "var(--sky)", fontSize: 24 }}
        >
          {total.toLocaleString()}
          <span
            style={{ fontSize: 16, color: "var(--text-m)", fontWeight: 600 }}
          >
            /{total.toLocaleString()}
          </span>
        </div>
        <div className="import-stat-lbl">ตรวจสอบแล้ว (รวมทุกแถว)</div>
      </div>
      <div className="import-stat-card">
        <div className="import-stat-num" style={{ color: "var(--mint)" }}>
          {valid.toLocaleString()}
        </div>
        <div className="import-stat-lbl">ข้อมูลถูกต้อง</div>
      </div>
      <div className="import-stat-card">
        <div className="import-stat-num" style={{ color: "var(--amber)" }}>
          {warning.toLocaleString()}
        </div>
        <div className="import-stat-lbl">มีคำเตือน / ข้าม</div>
      </div>
      <div className="import-stat-card">
        <div className="import-stat-num" style={{ color: "var(--rose)" }}>
          {error.toLocaleString()}
        </div>
        <div className="import-stat-lbl">ข้อผิดพลาด</div>
      </div>
    </div>
  );
}

// ─── Export Error Rows ────────────────────────────────────
function exportErrorRows(rows: PreviewRow[], colKeys: string[]) {
  const errorRows = rows.filter((r) => r.hasError);
  if (!errorRows.length) return;
  const data = errorRows.map((row) => {
    const obj: Record<string, unknown> = { แถวที่: row.rowNumber };
    colKeys.forEach((col) => {
      const cell = row.cells[col];
      obj[col] = cell?.value ?? "";
      if (cell?.hasError && cell.errorMessage)
        obj[`${col}_Error`] = cell.errorMessage;
    });
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Error Data");
  ws["!cols"] = Object.keys(data[0] || {}).map((k) => ({
    wch: Math.max(k.length + 2, 15),
  }));
  XLSX.writeFile(wb, "import_error_data.xlsx");
}

function exportTemplate(cols: string[], fileName: string) {
  const ws = XLSX.utils.aoa_to_sheet([cols]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  ws["!cols"] = cols.map((col) => ({
    wch: Math.max(col.length + 2, 15),
  }));
  XLSX.writeFile(wb, fileName);
}

function getColumnExample(col: string, examples: Record<string, string>) {
  return examples[col] || "กรุณากรอกข้อมูลตามรูปแบบที่ระบบรองรับ";
}

function ColumnExampleItem({
  col,
  example,
  active,
  hasFile,
  onHover,
  onLeave,
  onToggle,
}: {
  col: string;
  example: string;
  active: boolean;
  hasFile: boolean;
  onHover: (col: string | null) => void;
  onLeave: () => void;
  onToggle: (col: string) => void;
}) {
  return (
    <div
      className="import-check-item"
      style={{ cursor: "help", position: "relative" }}
      onMouseEnter={() => onHover(col)}
      onMouseLeave={onLeave}
      onFocus={() => onHover(col)}
      onBlur={onLeave}
      onClick={() => onToggle(col)}
      tabIndex={0}
      role="button"
      aria-expanded={active}
      aria-label={`${col} ตัวอย่างข้อมูล`}
    >
      <div className={`import-check-dot ${hasFile ? "ok" : "pending"}`} />
      {col}
      {active && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "calc(100% + 8px)",
            zIndex: 20,
            minWidth: 240,
            maxWidth: 360,
            padding: "10px 12px",
            borderRadius: 12,
            background: "rgba(15, 23, 42, 0.98)",
            color: "#fff",
            boxShadow: "0 16px 40px rgba(15, 23, 42, 0.24)",
            border: "1px solid rgba(255,255,255,0.08)",
            fontSize: 12,
            lineHeight: 1.45,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{col}</div>
          <div style={{ opacity: 0.92 }}>ตัวอย่าง: {example}</div>
        </div>
      )}
    </div>
  );
}

// ─── Preview Table (Real Data) ───────────────────────────
function PreviewTable({
  preview,
  onOpenModal,
}: {
  preview: PreviewResult;
  onOpenModal?: () => void;
}) {
  const { previewRows } = preview;
  const [filterMode, setFilterMode] = useState<"all" | "errors">("all");
  if (!previewRows.length) return null;

  const colKeys = Object.keys(previewRows[0].cells);
  const errorRowCount = previewRows.filter((r) => r.hasError).length;
  const displayRows =
    filterMode === "errors"
      ? previewRows.filter((r) => r.hasError)
      : previewRows;

  return (
    <div className="import-card" style={{ padding: 0, overflow: "hidden" }}>
      <div
        style={{
          padding: "16px 20px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div className="import-card-title" style={{ margin: 0 }}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--sky)"
            strokeWidth="2"
          >
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          ตัวอย่าง {preview.previewRows.length} แถวแรก
          (จากข้อมูลที่ตรวจสอบแล้วทั้งหมด {preview.totalRows} แถว)
          <span
            className="import-badge import-badge-processing"
            style={{ fontSize: 10, marginLeft: 8 }}
          >
            ยังไม่นำเข้า
          </span>
        </div>
        {onOpenModal && (
          <button
            className="import-btn import-btn-outline"
            style={{ fontSize: 11.5, padding: "6px 14px" }}
            onClick={onOpenModal}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 3h6v6" />
              <path d="M9 21H3v-6" />
              <path d="M21 3l-7 7" />
              <path d="M3 21l7-7" />
            </svg>
            ดูข้อมูลทั้งหมด
          </button>
        )}
      </div>

      {/* Filter Tabs + Export */}
      <div
        style={{
          padding: "0 20px 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div className="import-filter-tabs">
          <button
            className={`import-filter-tab${filterMode === "all" ? " active" : ""}`}
            onClick={() => setFilterMode("all")}
          >
            ทั้งหมด{" "}
            <span className="import-filter-count">{previewRows.length}</span>
          </button>
          <button
            className={`import-filter-tab error${filterMode === "errors" ? " active" : ""}`}
            onClick={() => setFilterMode("errors")}
          >
            เฉพาะ Error{" "}
            <span className="import-filter-count error">{errorRowCount}</span>
          </button>
        </div>
        {errorRowCount > 0 && (
          <button
            className="import-btn import-btn-export"
            style={{ fontSize: 11, padding: "6px 14px" }}
            onClick={() => exportErrorRows(previewRows, colKeys)}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Error Data
          </button>
        )}
      </div>

      <div
        className="import-table-wrap"
        style={{ borderRadius: 0, boxShadow: "none" }}
      >
        <table className="import-table">
          <thead>
            <tr>
              <th>#</th>
              <th>สถานะ</th>
              {colKeys.map((col) => (
                <th key={col} style={{ fontSize: 11 }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row) => (
              <tr
                key={row.rowNumber}
                className={row.hasError ? "import-row-error" : ""}
              >
                <td style={{ color: "var(--text-m)", fontSize: 11 }}>
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
            {displayRows.length === 0 && (
              <tr>
                <td colSpan={colKeys.length + 2}>
                  <div className="import-empty" style={{ padding: "32px 0" }}>
                    <div className="import-empty-title">
                      ไม่มีรายการที่ผิดพลาด
                    </div>
                    <div className="import-empty-sub">
                      ข้อมูลทั้งหมดถูกต้องพร้อมนำเข้า
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: Student Data Import ────────────────────────────
function TabStudentImport() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadKey, setUploadKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [confirmResult, setConfirmResult] =
    useState<ImportConfirmResult | null>(null);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });
  const [hoveredExampleCol, setHoveredExampleCol] = useState<string | null>(null);
  const [pinnedExampleCol, setPinnedExampleCol] = useState<string | null>(null);

  const handlePreview = useCallback(
    async (fileArg?: File) => {
      const targetFile = fileArg ?? file;
      if (!targetFile) return;
      setLoading(true);
      setError("");
      setPreview(null);
      setConfirmResult(null);
      try {
        const result = await importService.previewStudents(targetFile);
        setPreview(result);
      } catch (err: unknown) {
        const errorMsg =
          (err as ApiError).response?.data?.message ||
          "เกิดข้อผิดพลาดในการตรวจสอบไฟล์";
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [file],
  );

  const handleConfirm = async () => {
    if (!preview?.sessionId) return;
    setConfirming(true);
    setError("");
    const total = preview.totalRows - preview.errorCount;
    setUploadProgress({ current: 0, total });
    // Simulate progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        const next = Math.min(prev.current + Math.ceil(total / 20), total);
        if (next >= total) clearInterval(interval);
        return { ...prev, current: next };
      });
    }, 200);
    try {
      const result = await importService.confirmStudents(preview.sessionId);
      clearInterval(interval);
      setUploadProgress({ current: total, total });
      setConfirmResult(result);
      setPreview(null);
      setModalOpen(false);
      setFile(null);
      setUploadKey((prev) => prev + 1);
    } catch (err: unknown) {
      clearInterval(interval);
      const errorMsg =
        (err as ApiError).response?.data?.message ||
        "เกิดข้อผิดพลาดในการนำเข้าข้อมูล";
      setError(errorMsg);
    } finally {
      setConfirming(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setConfirmResult(null);
    setError("");
    setModalOpen(false);
    setUploadProgress({ current: 0, total: 0 });
  };

  const validCount = preview
    ? preview.previewRows.filter((r) => !r.hasError).length
    : 0;

  return (
    <div>
      <div className="import-two-col">
        {/* LEFT MAIN COLUMN */}
        <div className="import-main-col">
          {/* Upload + form */}
          <div className="import-card">
            <div className="import-card-title">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--sky)"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              นำเข้าข้อมูลนักเรียน
            </div>
            <div className="import-card-desc">
              อัปโหลดไฟล์ข้อมูลนักเรียนรายภาคเรียน
              ระบบจะตรวจสอบและเปรียบเทียบกับฐานข้อมูลก่อนนำเข้าจริง รองรับรูปแบบ
              CSV และ XLSX ตามเทมเพลตมาตรฐาน ONEC
            </div>
            <UploadZone
              key={uploadKey}
              file={file}
              onFile={(f) => {
                setFile(f);
                setPreview(null);
                setConfirmResult(null);
                setError("");
                setModalOpen(true);
              }}
            />
          </div>

          {/* Validation checklist */}
          <div className="import-card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 12,
                flexWrap: "wrap",
              }}
            >
              <div className="import-card-title" style={{ marginBottom: 0 }}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--mint)"
                  strokeWidth="2"
                >
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                คอลัมน์ที่ต้องมีในไฟล์ (ตาม ONEC)
              </div>
              <button
                className="import-btn import-btn-outline"
                type="button"
                style={{ fontSize: 11.5, padding: "6px 14px" }}
                onClick={() =>
                  exportTemplate(STUDENT_COLS, "student_import_template.xlsx")
                }
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export Template
              </button>
            </div>
            <div className="import-checklist">
              {STUDENT_COLS.map((col) => (
                <ColumnExampleItem
                  key={col}
                  col={col}
                  example={getColumnExample(col, STUDENT_COLUMN_EXAMPLES)}
                  active={hoveredExampleCol === col || pinnedExampleCol === col}
                  hasFile={Boolean(file)}
                  onHover={setHoveredExampleCol}
                  onLeave={() => setHoveredExampleCol(null)}
                  onToggle={(selected) =>
                    setPinnedExampleCol((current) =>
                      current === selected ? null : selected,
                    )
                  }
                />
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div
              className="import-card"
              style={{
                background: "rgba(239,68,68,.08)",
                border: "1px solid rgba(239,68,68,.25)",
              }}
            >
              <div
                style={{ color: "var(--rose)", fontWeight: 600, fontSize: 13 }}
              >
                ❌ {error}
              </div>
            </div>
          )}

          {/* Loading overlay */}
          {loading && (
            <LoadingOverlay
              title="กำลังตรวจสอบไฟล์..."
              subtitle="ระบบกำลังอ่านและตรวจสอบเงื่อนไขข้อมูลในไฟล์"
            />
          )}

          {/* Progress overlay */}
          {confirming && (
            <ProgressOverlay
              current={uploadProgress.current}
              total={uploadProgress.total}
              label="กำลังนำเข้าข้อมูล..."
            />
          )}

          {/* Preview result on page */}
          {preview && !confirming && (
            <div style={{ marginTop: 16 }}>
              <StatCards
                total={preview.totalRows}
                valid={preview.totalRows - preview.errorCount}
                warning={0}
                error={preview.errorCount}
              />
              <PreviewTable
                preview={preview}
                onOpenModal={() => setModalOpen(true)}
              />
            </div>
          )}

          {/* Preview Modal */}
          <PreviewModal
            preview={preview}
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onConfirm={handleConfirm}
            confirming={confirming}
            onValidate={() => handlePreview()}
            validating={loading}
            fileName={file?.name}
            title="ตัวอย่างข้อมูลนักเรียน"
          />

          {/* Confirm result */}
          {confirmResult && (
            <div>
              <div
                className="import-result-banner warn"
                style={{ marginTop: 16 }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: "var(--text-h)",
                    }}
                  >
                    ผลการนำเข้าข้อมูลนักเรียน
                  </div>
                  {confirmResult.errorCount === 0 ? (
                    <span className="import-badge import-badge-completed">
                      สำเร็จ
                    </span>
                  ) : (
                    <span className="import-badge import-badge-completed-warn">
                      สำเร็จ (มีข้อผิดพลาด)
                    </span>
                  )}
                </div>
              </div>
              <StatCards
                total={confirmResult.totalRows}
                valid={confirmResult.successCount}
                warning={confirmResult.skippedCount}
                error={confirmResult.errorCount}
              />
              <div className="import-actions" style={{ marginTop: 14 }}>
                {confirmResult.errorCount > 0 && (
                  <button
                    className="import-btn import-btn-outline"
                    onClick={() =>
                      importService.downloadErrorReport(confirmResult.reportId)
                    }
                  >
                    ดาวน์โหลดรายงาน Error
                  </button>
                )}
                {confirmResult.skippedCount > 0 && (
                  <button
                    className="import-btn import-btn-outline"
                    onClick={() =>
                      importService.downloadSkippedReport(
                        confirmResult.reportId,
                      )
                    }
                  >
                    ดาวน์โหลดรายงาน Skipped
                  </button>
                )}
                <button
                  className="import-btn import-btn-primary"
                  onClick={handleReset}
                >
                  นำเข้าไฟล์ใหม่
                </button>
              </div>
              <div className="import-form-note" style={{ marginTop: 10 }}>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                รายงานสามารถดาวน์โหลดได้ภายใน {confirmResult.reportExpiresIn}
              </div>
            </div>
          )}
        </div>

        {/* Preview Modal rendered inside main-col above */}

        {/* RIGHT INFO PANEL */}
        <div className="import-side-col">
          <div className="import-card">
            <div
              className="import-info-title"
              style={{ marginBottom: 12, fontSize: 13 }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              แนวทางการเตรียมไฟล์
            </div>
            <ul className="import-info-list" style={{ fontSize: 12 }}>
              <li>ใช้ไฟล์ที่มีหัวคอลัมน์ตรงตาม ONEC เท่านั้น</li>
              <li>ห้ามเปลี่ยนชื่อหัวคอลัมน์</li>
              <li>PersonID_Onec: ตัวเลข 13 หลัก</li>
              <li>AcademicYear_Onec, Semester_Onec: ห้ามว่าง</li>
              <li>FirstName_Onec, LastName_Onec: ห้ามว่าง</li>
              <li>
                รหัส Lookup ต้องตรงกับที่มีในระบบ (เช่น GenderID, GradeLevelID)
              </li>
              <li>รองรับ .csv และ .xlsx</li>
            </ul>
            <div className="import-divider" />
            <div
              className="import-info-title"
              style={{ marginBottom: 10, fontSize: 13 }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              คำอธิบายสถานะ
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                {
                  badge: (
                    <span className="import-badge import-badge-valid">
                      ถูกต้อง
                    </span>
                  ),
                  desc: "ข้อมูลครบถ้วน พร้อมนำเข้า",
                },
                {
                  badge: (
                    <span className="import-badge import-badge-error">
                      ข้อผิดพลาด
                    </span>
                  ),
                  desc: "ข้อมูลไม่ถูกต้อง จะไม่ถูกนำเข้า",
                },
              ].map((item) => (
                <div
                  key={item.desc}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    fontSize: 12,
                  }}
                >
                  <div style={{ flexShrink: 0, paddingTop: 1 }}>
                    {item.badge}
                  </div>
                  <div style={{ color: "var(--text-m)", lineHeight: 1.5 }}>
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Dropout Import ─────────────────────────────────
function TabDropoutImport() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadKey, setUploadKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [confirmResult, setConfirmResult] =
    useState<ImportConfirmResult | null>(null);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });
  const [hoveredExampleCol, setHoveredExampleCol] = useState<string | null>(null);
  const [pinnedExampleCol, setPinnedExampleCol] = useState<string | null>(null);

  const handlePreview = useCallback(
    async (fileArg?: File) => {
      const targetFile = fileArg ?? file;
      if (!targetFile) return;
      setLoading(true);
      setError("");
      setPreview(null);
      setConfirmResult(null);
      try {
        const result = await importService.previewDropout(targetFile);
        setPreview(result);
        setModalOpen(true); // เปิด modal อัตโนมัติหลังตรวจสอบสำเร็จ
      } catch (err: unknown) {
        const errorMsg =
          (err as ApiError).response?.data?.message ||
          "เกิดข้อผิดพลาดในการตรวจสอบไฟล์";
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [file],
  );

  const handleConfirm = async () => {
    if (!preview?.sessionId) return;
    setConfirming(true);
    setError("");
    const total = preview.totalRows - preview.errorCount;
    setUploadProgress({ current: 0, total });
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        const next = Math.min(prev.current + Math.ceil(total / 20), total);
        if (next >= total) clearInterval(interval);
        return { ...prev, current: next };
      });
    }, 200);
    try {
      const result = await importService.confirmDropout(preview.sessionId);
      clearInterval(interval);
      setUploadProgress({ current: total, total });
      setConfirmResult(result);
      setPreview(null);
      setModalOpen(false);
      setFile(null);
      setUploadKey((prev) => prev + 1);
    } catch (err: unknown) {
      clearInterval(interval);
      const errorMsg =
        (err as ApiError).response?.data?.message ||
        "เกิดข้อผิดพลาดในการนำเข้าข้อมูล";
      setError(errorMsg);
    } finally {
      setConfirming(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setConfirmResult(null);
    setError("");
    setModalOpen(false);
    setUploadProgress({ current: 0, total: 0 });
  };

  const validCount = preview
    ? preview.previewRows.filter((r) => !r.hasError).length
    : 0;

  return (
    <div>
      <div className="import-two-col">
        <div className="import-main-col">
          <div className="import-card">
            <div className="import-card-title">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--violet)"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="18" y1="8" x2="23" y2="13" />
                <line x1="23" y1="8" x2="18" y2="13" />
              </svg>
              นำเข้าข้อมูลเด็กหลุดออกจากระบบ
            </div>
            <div className="import-card-desc">
              อัปโหลดไฟล์ข้อมูลเด็กที่หลุดออกจากระบบการศึกษา
              ระบบจะตรวจสอบข้อมูลและซ้ำซ้อนก่อนนำเข้าจริง
            </div>
            <UploadZone
              key={uploadKey}
              file={file}
              onFile={(f) => {
                setFile(f);
                setPreview(null);
                setConfirmResult(null);
                setError("");
                setModalOpen(true);
              }}
            />
          </div>

          <div className="import-card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 12,
                flexWrap: "wrap",
              }}
            >
              <div className="import-card-title" style={{ marginBottom: 0 }}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--mint)"
                  strokeWidth="2"
                >
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                คอลัมน์ที่ต้องมีในไฟล์
              </div>
              <button
                className="import-btn import-btn-outline"
                type="button"
                style={{ fontSize: 11.5, padding: "6px 14px" }}
                onClick={() =>
                  exportTemplate(DROPOUT_COLS, "dropout_import_template.xlsx")
                }
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export Template
              </button>
            </div>
            <div className="import-checklist">
              {DROPOUT_COLS.map((col) => (
                <ColumnExampleItem
                  key={col}
                  col={col}
                  example={getColumnExample(col, DROPOUT_COLUMN_EXAMPLES)}
                  active={hoveredExampleCol === col || pinnedExampleCol === col}
                  hasFile={Boolean(file)}
                  onHover={setHoveredExampleCol}
                  onLeave={() => setHoveredExampleCol(null)}
                  onToggle={(selected) =>
                    setPinnedExampleCol((current) =>
                      current === selected ? null : selected,
                    )
                  }
                />
              ))}
            </div>
          </div>

          {error && (
            <div
              className="import-card"
              style={{
                background: "rgba(239,68,68,.08)",
                border: "1px solid rgba(239,68,68,.25)",
              }}
            >
              <div
                style={{ color: "var(--rose)", fontWeight: 600, fontSize: 13 }}
              >
                ❌ {error}
              </div>
            </div>
          )}

          {/* Loading overlay */}
          {loading && (
            <LoadingOverlay
              title="กำลังตรวจสอบไฟล์..."
              subtitle="ระบบกำลังอ่านและตรวจสอบเงื่อนไขข้อมูลในไฟล์"
            />
          )}

          {/* Progress overlay */}
          {confirming && (
            <ProgressOverlay
              current={uploadProgress.current}
              total={uploadProgress.total}
              label="กำลังนำเข้าข้อมูลเด็กหลุด..."
            />
          )}

          {/* Preview result on page */}
          {preview && !confirming && (
            <div style={{ marginTop: 16 }}>
              <StatCards
                total={preview.totalRows}
                valid={preview.totalRows - preview.errorCount}
                warning={0}
                error={preview.errorCount}
              />
              <PreviewTable
                preview={preview}
                onOpenModal={() => setModalOpen(true)}
              />
            </div>
          )}

          {/* Preview Modal */}
          <PreviewModal
            preview={preview}
            open={modalOpen}
            onClose={() => {
              setModalOpen(false);
              if (!preview) {
                setFile(null);
              }
            }}
            onConfirm={handleConfirm}
            confirming={confirming}
            onValidate={() => handlePreview()}
            validating={loading}
            fileName={file?.name}
            title="ตัวอย่างข้อมูลเด็กหลุด"
          />

          {confirmResult && (
            <div>
              <div
                className="import-result-banner warn"
                style={{ marginTop: 16 }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: "var(--text-h)",
                    }}
                  >
                    ผลการนำเข้าข้อมูลเด็กหลุด
                  </div>
                  {confirmResult.errorCount === 0 ? (
                    <span className="import-badge import-badge-completed">
                      สำเร็จ
                    </span>
                  ) : (
                    <span className="import-badge import-badge-completed-warn">
                      สำเร็จ (มีข้อผิดพลาด)
                    </span>
                  )}
                </div>
              </div>
              <StatCards
                total={confirmResult.totalRows}
                valid={confirmResult.successCount}
                warning={confirmResult.skippedCount}
                error={confirmResult.errorCount}
              />
              <div className="import-actions" style={{ marginTop: 14 }}>
                {confirmResult.errorCount > 0 && (
                  <button
                    className="import-btn import-btn-outline"
                    onClick={() =>
                      importService.downloadErrorReport(confirmResult.reportId)
                    }
                  >
                    ดาวน์โหลดรายงาน Error
                  </button>
                )}
                {confirmResult.skippedCount > 0 && (
                  <button
                    className="import-btn import-btn-outline"
                    onClick={() =>
                      importService.downloadSkippedReport(
                        confirmResult.reportId,
                      )
                    }
                  >
                    ดาวน์โหลดรายงาน Skipped
                  </button>
                )}
                <button
                  className="import-btn import-btn-primary"
                  onClick={handleReset}
                >
                  นำเข้าไฟล์ใหม่
                </button>
              </div>
              <div className="import-form-note" style={{ marginTop: 10 }}>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                รายงานสามารถดาวน์โหลดได้ภายใน {confirmResult.reportExpiresIn}
              </div>
            </div>
          )}
        </div>

        {/* Preview Modal rendered inside main-col above */}

        <div className="import-side-col">
          <div className="import-card">
            <div
              className="import-info-title"
              style={{ marginBottom: 12, fontSize: 13 }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              ข้อมูลเด็กหลุดจากระบบ
            </div>
            <ul className="import-info-list" style={{ fontSize: 12 }}>
              <li>ไฟล์ต้องมีคอลัมน์ ACADYEAR เป็นอย่างน้อย</li>
              <li>ถ้ามี PersonID_Onec จะเชื่อมโยงกับข้อมูลนักเรียนในระบบ</li>
              <li>ข้อมูลซ้ำ (PersonID + ปีการศึกษา) จะถูกข้ามอัตโนมัติ</li>
              <li>ระบบรองรับวันที่แบบ Excel serial number หรือ DD/MM/YYYY</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Import History (Mock — no backend endpoint) ─────
function TabHistory() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [historyRows, setHistoryRows] = useState<ImportHistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      setHistoryLoading(true);
      setHistoryError("");
      try {
        const rows = await importService.getImportHistory();
        if (isMounted) setHistoryRows(rows);
      } catch (err: unknown) {
        if (isMounted) {
          const errorMsg =
            (err as ApiError).response?.data?.message ||
            "ไม่สามารถดึงประวัติการนำเข้าได้";
          setHistoryError(errorMsg);
        }
      } finally {
        if (isMounted) setHistoryLoading(false);
      }
    };
    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = historyRows.filter((row) => {
    const matchType = typeFilter === "all" || row.importType === typeFilter;
    const matchStatus = statusFilter === "all" || row.status === statusFilter;
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      String(row.id).includes(q) ||
      (row.fileName || "").toLowerCase().includes(q) ||
      (row.userName || "").toLowerCase().includes(q) ||
      row.importType.includes(q);
    return matchType && matchStatus && matchQ;
  });

  const formatImportDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownload = async (id: number, type: "errors" | "raw") => {
    setDownloadingId(id);
    try {
      if (type === "errors") {
        await importService.downloadHistoryErrorList(id);
      } else {
        await importService.downloadHistoryErrorRaw(id);
      }
    } catch {
      alert("ไม่สามารถดาวน์โหลดได้");
    } finally {
      setDownloadingId(null);
    }
  };

  const historyTypeOptions = [
    { value: "all", label: "ทุกประเภท" },
    { value: "students", label: "ข้อมูลนักเรียน" },
    { value: "dropout", label: "ข้อมูลเด็กหลุด" },
  ];

  const historyStatusOptions = [
    { value: "all", label: "ทุกสถานะ" },
    { value: "completed", label: "สำเร็จ" },
    { value: "failed", label: "ล้มเหลว" },
  ];

  return (
    <div>
      <div className="import-card">
        <div className="import-card-title" style={{ marginBottom: 16 }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--sky)"
            strokeWidth="2"
          >
            <path d="M3 3h6l1.5 3-2 1.5A11 11 0 0017 14l1.5-2 3 1.5v6a2 2 0 01-2 2A17 17 0 012 5a2 2 0 012-2z" />
          </svg>
          ประวัติการนำเข้าข้อมูลทั้งหมด
        </div>

        {historyError && (
          <div
            className="import-card"
            style={{
              marginBottom: 16,
              background: "rgba(239,68,68,.08)",
              border: "1px solid rgba(239,68,68,.25)",
            }}
          >
            <div
              style={{ color: "var(--rose)", fontWeight: 600, fontSize: 13 }}
            >
              ❌ {historyError}
            </div>
          </div>
        )}

        <div className="import-history-filters" style={{ marginBottom: 16 }}>
          <div className="import-search-wrap" style={{ gridColumn: "span 2" }}>
            <svg
              className="import-search-icon"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="import-search"
              style={{ width: "100%" }}
              placeholder="ค้นหา Batch ID / ชื่อไฟล์ / ผู้ใช้..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="dashboard-lselect"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            {historyTypeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            className="dashboard-lselect"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {historyStatusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="import-table-wrap">
          <table className="import-table">
            <thead>
              <tr>
                <th>ประเภท</th>
                <th>ชื่อไฟล์</th>
                <th>ผู้นำเข้า</th>
                <th>วันที่นำเข้า</th>
                <th style={{ textAlign: "right" }}>ทั้งหมด</th>
                <th style={{ textAlign: "right" }}>สำเร็จ</th>
                <th style={{ textAlign: "right" }}>ข้าม</th>
                <th style={{ textAlign: "right" }}>ผิดพลาด</th>
                <th>สถานะ</th>
                <th>ดาวน์โหลด</th>
              </tr>
            </thead>
            <tbody>
              {historyLoading ? (
                <tr>
                  <td colSpan={10}>
                    <LoadingOverlay title="กำลังโหลดประวัติการนำเข้า..." />
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span
                        className={`import-badge ${r.importType === "dropout" ? "import-badge-processing" : "import-badge-valid"}`}
                        style={{ fontSize: 10 }}
                      >
                        {r.importType === "dropout"
                          ? "ข้อมูลเด็กหลุด"
                          : "ข้อมูลนักเรียน"}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>
                        {r.fileName}
                      </div>
                    </td>
                    <td style={{ fontSize: 11.5, color: "var(--text-m)" }}>
                      {r.userName || "-"}
                    </td>
                    <td
                      style={{
                        fontSize: 11.5,
                        color: "var(--text-m)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatImportDate(r.importedAt)}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      {r.totalRows.toLocaleString()}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        color: "var(--mint)",
                        fontWeight: 700,
                      }}
                    >
                      {r.successCount.toLocaleString()}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        color: "var(--amber)",
                        fontWeight: 700,
                      }}
                    >
                      {r.skippedCount.toLocaleString()}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        color:
                          r.errorCount > 0 ? "var(--rose)" : "var(--text-f)",
                        fontWeight: r.errorCount > 0 ? 700 : 400,
                      }}
                    >
                      {r.errorCount.toLocaleString()}
                    </td>
                    <td>
                      <HistoryBadge status={r.status} />
                    </td>

                    {/* ปุ่ม download — แสดงเฉพาะเมื่อมี error */}
                    <td>
                      {r.errorCount > 0 ? (
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                          }}
                        >
                          {/* ปุ่ม 1: Error List */}
                          <button
                            className="import-btn import-btn-outline"
                            style={{
                              fontSize: 11,
                              padding: "3px 8px",
                              whiteSpace: "nowrap",
                            }}
                            disabled={downloadingId === r.id}
                            onClick={() => handleDownload(r.id, "errors")}
                            title="ดาวน์โหลดรายการ error (row, personId, สาเหตุ)"
                          >
                            <svg
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              style={{ marginRight: 3 }}
                            >
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Error list
                          </button>

                          {/* ปุ่ม 2: Raw File เฉพาะ error rows */}
                          <button
                            className="import-btn import-btn-outline"
                            style={{
                              fontSize: 11,
                              padding: "3px 8px",
                              whiteSpace: "nowrap",
                              borderColor: "var(--rose)",
                              color: "var(--rose)",
                            }}
                            disabled={downloadingId === r.id}
                            onClick={() => handleDownload(r.id, "raw")}
                            title="ดาวน์โหลดไฟล์ต้นฉบับ เฉพาะแถวที่ error (column เดิมทุก column)"
                          >
                            <svg
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              style={{ marginRight: 3 }}
                            >
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            Raw file
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: "var(--text-f)" }}>
                          -
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
              {!historyLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={10}>
                    <div className="import-empty" style={{ padding: "32px 0" }}>
                      <div className="import-empty-title">ไม่พบข้อมูล</div>
                      <div className="import-empty-sub">
                        ลองเปลี่ยนเงื่อนไขการกรอง
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 14,
            fontSize: 12,
            color: "var(--text-m)",
          }}
        >
          <span>
            แสดง {filtered.length} รายการ จากทั้งหมด {historyRows.length} รายการ
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────
const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: "student",
    label: "1. นำเข้าข้อมูลนักเรียน",
    icon: (
      <svg
        className="import-tab-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    id: "dropout",
    label: "2. นำเข้าข้อมูลเด็กหลุด",
    icon: (
      <svg
        className="import-tab-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="18" y1="8" x2="23" y2="13" />
        <line x1="23" y1="8" x2="18" y2="13" />
      </svg>
    ),
  },
  {
    id: "history",
    label: "3. ประวัติการนำเข้า",
    icon: (
      <svg
        className="import-tab-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M3 3h6l1.5 3-2 1.5A11 11 0 0017 14l1.5-2 3 1.5v6a2 2 0 01-2 2A17 17 0 012 5a2 2 0 012-2z" />
      </svg>
    ),
  },
];

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState<TabId>("student");

  return (
    <div className="import-main">
      {/* Tab navigation */}
      <div className="import-tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`import-tab${activeTab === tab.id ? " active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "student" && <TabStudentImport />}
      {activeTab === "dropout" && <TabDropoutImport />}
      {activeTab === "history" && <TabHistory />}
    </div>
  );
}
