"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import * as XLSXStyle from "xlsx-js-style";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { exportService } from "@/lib/services/exportService";
import type {
  DisabledListItem,
  DisabledSummary,
  DisabilityTypeSummaryItem,
  DropoutCauseSummaryItem,
  DropoutListItem,
  DropoutSummary,
  ExportBackendType,
  ExportFilterOptions,
  ExportPageTab,
  ExportQueryParams,
  RiskSummary,
} from "@/lib/types/exportType";
import type { RepeatGradeItem } from "@/lib/types/repeatTypes";

type SummaryCard = {
  label: string;
  value: string;
  color: string;
  bg: string;
  border: string;
  trend?: string;
  trendDir?: "up" | "down";
};

type ToastState = {
  type: "success" | "processing" | "error";
  message: string;
};

const TABS: { key: ExportPageTab; label: string; icon: React.ReactNode }[] = [
  {
    key: "at-risk",
    label: "นักเรียนเสี่ยงหลุด",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    key: "dropout",
    label: "นักเรียนหลุดออกจากระบบ",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 17l5-5-5-5M19.8 12H9M13 22a10 10 0 110-20" />
      </svg>
    ),
  },
  {
    key: "repeated",
    label: "เลื่อนชั้น / ซ้ำชั้น",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
      </svg>
    ),
  },
  {
    key: "disabled",
    label: "นักเรียนพิการ",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
  },
];

const SEMESTER_OPTIONS = [
  { label: "ทั้งปี", value: "" },
  { label: "ภาคเรียนที่ 1", value: "1" },
  { label: "ภาคเรียนที่ 2", value: "2" },
];

const SEMESTER_OPTIONS_AT_RISK = SEMESTER_OPTIONS.filter((option) => option.value !== "");
const SEMESTER_OPTIONS_DROPOUT = SEMESTER_OPTIONS.filter((option) => option.value !== "");

const TARGET_ACADEMIC_YEARS = ["2564", "2565", "2566","2567"];

function formatNumber(value: number) {
  return value.toLocaleString("th-TH");
}

function exportToExcel(rows: Record<string, string | number>[], sheetName: string, filePrefix: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filePrefix}_${new Date().toLocaleDateString("th-TH")}.xlsx`);
}

let sarabunFontBase64: string | null = null;

async function loadSarabunFontBase64() {
  if (sarabunFontBase64) {
    return sarabunFontBase64;
  }

  const response = await fetch("/fonts/Sarabun-Regular.ttf");
  if (!response.ok) {
    throw new Error("ไม่สามารถโหลดฟอนต์ภาษาไทยได้");
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  sarabunFontBase64 = btoa(binary);
  return sarabunFontBase64;
}

async function applyThaiFont(doc: jsPDF) {
  const fontBase64 = await loadSarabunFontBase64();
  const pdfDoc = doc as unknown as {
    addFileToVFS: (name: string, data: string) => void;
    addFont: (fileName: string, fontName: string, fontStyle: string) => void;
    setFont: (fontName: string, fontStyle?: string) => void;
  };

  pdfDoc.addFileToVFS("Sarabun-Regular.ttf", fontBase64);
  pdfDoc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
  pdfDoc.setFont("Sarabun", "normal");
}

async function exportRepeatedPdf(rows: RepeatGradeItem[], academicYear: string) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  await applyThaiFont(doc);

  doc.setFontSize(16);
  doc.text(`รายงานนักเรียนซ้ำชั้น ปีการศึกษา ${academicYear}`, doc.internal.pageSize.getWidth() / 2, 36, {
    align: "center",
  });
  doc.setFontSize(9);
  doc.setTextColor(136, 136, 136);
  doc.text(
    `ส่งออกเมื่อ: ${new Date().toLocaleString("th-TH")} | ทั้งหมด ${rows.length.toLocaleString("th-TH")} รายการ`,
    doc.internal.pageSize.getWidth() - 40,
    54,
    { align: "right" },
  );
  doc.setTextColor(0, 0, 0);

  autoTable(doc, {
    startY: 66,
    theme: "grid",
    head: [["ลำดับ", "รหัสนักเรียน", "ชื่อ-สกุล", "ระดับชั้น", "แผนก", "โรงเรียน", "วันขาด", "สาเหตุ"]],
    body: rows.map((item, index) => [
      index + 1,
      item.personId ?? "-",
      item.fullName || "-",
      item.gradeLevelName || "-",
      item.departmentName || "-",
      item.schoolName || "-",
      item.absentDays ?? 0,
      item.reason || "-",
    ]),
    styles: {
      font: "Sarabun",
      fontSize: 8,
      cellPadding: 4,
      overflow: "linebreak",
      valign: "middle",
      textColor: [0, 0, 0],
      lineColor: [209, 213, 219],
      lineWidth: 0.5,
    },
    headStyles: {
      font: "Sarabun",
      fontStyle: "normal",
      fillColor: [44, 62, 80],
      textColor: [255, 255, 255],
      halign: "center",
    },
    bodyStyles: {
      font: "Sarabun",
      fontStyle: "normal",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 40, halign: "center" },
      1: { cellWidth: 72, halign: "center" },
      2: { cellWidth: 130 },
      3: { cellWidth: 70, halign: "center" },
      4: { cellWidth: 85 },
      5: { cellWidth: 130 },
      6: { cellWidth: 50, halign: "center" },
      7: { cellWidth: 120 },
    },
    margin: { left: 24, right: 24 },
  });

  doc.save(`รายงานนักเรียนซ้ำชั้น_${academicYear}.pdf`);
}

type AtRiskExportRow = {
  semesterLabel: string;
  studentId: number;
  firstName: string;
  lastName: string;
  gradeLevel: string;
  department: string;
  unexcusedDays: number;
  excusedDays: number;
  totalAbsentDays: number;
  riskLabel: string;
};

const AT_RISK_PRIORITY: Record<string, number> = {
  "เสี่ยงสูง": 1,
  "เสี่ยงกลาง": 2,
  "เฝ้าระวัง": 3,
  "ปกติ": 4,
};

function mapGroupedRiskRows(
  grouped: Awaited<ReturnType<typeof exportService.getRiskStudentsGrouped>>,
  semesterLabel: string,
) {
  const toRow = (
    item: (typeof grouped.high)[number],
    riskLabel: string,
  ): AtRiskExportRow => ({
    semesterLabel,
    studentId: item.studentId,
    firstName: item.firstName ?? "",
    lastName: item.lastName ?? "",
    gradeLevel: item.gradeLevel ?? "-",
    department: item.department ?? "-",
    unexcusedDays: item.unexcusedDays ?? 0,
    excusedDays: item.excusedDays ?? 0,
    totalAbsentDays: item.totalAbsentDays ?? 0,
    riskLabel,
  });

  return [
    ...grouped.high.map((item) => toRow(item, "เสี่ยงสูง")),
    ...grouped.medium.map((item) => toRow(item, "เสี่ยงกลาง")),
    ...grouped.watch.map((item) => toRow(item, "เฝ้าระวัง")),
    ...grouped.normal.map((item) => toRow(item, "ปกติ")),
  ];
}

function sortAtRiskRows(a: AtRiskExportRow, b: AtRiskExportRow) {
  const p = (AT_RISK_PRIORITY[a.riskLabel] ?? 99) - (AT_RISK_PRIORITY[b.riskLabel] ?? 99);
  if (p !== 0) return p;
  return b.totalAbsentDays - a.totalAbsentDays;
}

function exportStyledExcel(
  header: string[],
  body: Array<Array<string | number>>,
  sheetName: string,
  filePrefix: string,
  styleByColumn?: Record<number, Record<string, unknown>>,
) {
  const ws = XLSXStyle.utils.aoa_to_sheet([header, ...body]);
  ws["!cols"] = header.map(() => ({ wch: 16 }));

  const headerStyle = {
    fill: { fgColor: { rgb: "2563EB" } },
    font: { bold: true, color: { rgb: "FFFFFF" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "D1D5DB" } },
      bottom: { style: "thin", color: { rgb: "D1D5DB" } },
      left: { style: "thin", color: { rgb: "D1D5DB" } },
      right: { style: "thin", color: { rgb: "D1D5DB" } },
    },
  };
  const baseCellStyle = {
    border: {
      top: { style: "thin", color: { rgb: "E5E7EB" } },
      bottom: { style: "thin", color: { rgb: "E5E7EB" } },
      left: { style: "thin", color: { rgb: "E5E7EB" } },
      right: { style: "thin", color: { rgb: "E5E7EB" } },
    },
    alignment: { vertical: "center", horizontal: "left" },
  };

  for (let col = 0; col < header.length; col += 1) {
    const cellRef = XLSXStyle.utils.encode_cell({ r: 0, c: col });
    if (ws[cellRef]) {
      ws[cellRef].s = headerStyle;
    }
  }

  for (let row = 0; row < body.length; row += 1) {
    for (let col = 0; col < header.length; col += 1) {
      const cellRef = XLSXStyle.utils.encode_cell({ r: row + 1, c: col });
      if (!ws[cellRef]) continue;
      ws[cellRef].s = {
        ...baseCellStyle,
        ...(styleByColumn?.[col] ?? {}),
      };
    }
  }

  const wb = XLSXStyle.utils.book_new();
  XLSXStyle.utils.book_append_sheet(wb, ws, sheetName);
  XLSXStyle.writeFile(wb, `${filePrefix}_${new Date().toLocaleDateString("th-TH")}.xlsx`);
}

function countBy<T>(items: T[], selector: (item: T) => string | null | undefined) {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = selector(item) || "ไม่ระบุ";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function getDropoutTotalFromCause(
  summary: DropoutSummary,
  causeSummary?: DropoutCauseSummaryItem[],
) {
  if (causeSummary && causeSummary.length > 0) {
    return causeSummary.reduce((sum, item) => sum + item.count, 0);
  }
  return summary.byCause.reduce((sum, item) => sum + item.count, 0);
}

function SummaryCards({ cards }: { cards: SummaryCard[] }) {
  return (
    <div className="export-summary-grid">
      {cards.map((card) => (
        <div key={card.label} className="export-summary-card">
          <div
            className="export-sc-icon"
            style={{ background: card.bg, border: `1px solid ${card.border}`, color: card.color }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div className="export-sc-num" style={{ color: card.color }}>
            {card.value}
          </div>
          <div className="export-sc-label">{card.label}</div>
          {card.trend ? <span className={`export-sc-trend ${card.trendDir ?? "up"}`}>{card.trend}</span> : null}
        </div>
      ))}
    </div>
  );
}

const PAGE_SIZE_BAR = 10;

function BarChart({
  data,
  color,
  maxVal,
}: {
  data: { label: string; value: number }[];
  color: string;
  maxVal?: number;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE_BAR));
  const slice = data.slice(page * PAGE_SIZE_BAR, (page + 1) * PAGE_SIZE_BAR);
  const max = Math.max(maxVal ?? 0, ...data.map((item) => item.value), 1);

  return (
    <div className="export-bar-container">
      {slice.map((item) => (
        <div key={item.label} className="export-bar-row">
          <span className="export-bar-label">{item.label}</span>
          <div className="export-bar-track">
            <div
              className="export-bar-fill"
              style={{ width: `${(item.value / max) * 100}%`, background: color }}
            >
              <span className="export-bar-value">{formatNumber(item.value)}</span>
            </div>
          </div>
        </div>
      ))}
      {totalPages > 1 && (
        <div className="export-bar-pagination">
          <button
            className="export-bar-page-btn"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >&#8592; ก่อนหน้า</button>
          <span className="export-bar-page-info">{page + 1} / {totalPages}</span>
          <button
            className="export-bar-page-btn"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
          >ถัดไป &#8594;</button>
        </div>
      )}
    </div>
  );
}

function DonutChart({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: { label: string; value: number; color: string }[];
  centerLabel: string;
  centerValue: string;
}) {
  const total = Math.max(segments.reduce((sum, segment) => sum + segment.value, 0), 1);
  const r = 54;
  const cx = 88;
  const cy = 88;
  const circ = 2 * Math.PI * r;
  const gap = 4;

  const arcs = segments.reduce(
    (acc, segment) => {
      const segmentCirc = (segment.value / total) * circ;
      const len = segmentCirc - gap;
      const dashOffset = circ - acc.offset;

      return {
        offset: acc.offset + segmentCirc,
        arcs: [...acc.arcs, { ...segment, len: Math.max(len, 0), dashOffset }],
      };
    },
    {
      offset: circ / 4,
      arcs: [] as Array<{ label: string; value: number; color: string; len: number; dashOffset: number }>,
    },
  ).arcs;

  return (
    <div className="export-donut-container">
      <div style={{ position: "relative", flexShrink: 0 }}>
        <svg viewBox="0 0 176 176" style={{ width: 160, height: 160, display: "block" }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,.06)" strokeWidth={22} />
          {arcs.map((segment) => (
            <circle
              key={segment.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={segment.color}
              strokeWidth={22}
              strokeDasharray={`${segment.len} ${circ}`}
              strokeDashoffset={segment.dashOffset}
              strokeLinecap="butt"
            />
          ))}
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize={22} fontWeight={800} fill="var(--text-h, #111827)">
            {centerValue}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize={9} fill="var(--text-m, #6b7280)" fontWeight={500}>
            {centerLabel}
          </text>
        </svg>
      </div>
      <div className="export-donut-legend">
        {segments.map((segment) => {
          const pct = ((segment.value / total) * 100).toFixed(1);
          return (
            <div key={segment.label} className="export-donut-legend-item">
              <span className="export-donut-legend-dot" style={{ background: segment.color }} />
              <span className="export-donut-legend-text">{segment.label}</span>
              <span className="export-donut-legend-value" style={{ color: segment.color }}>
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LineChart({
  series,
  years,
}: {
  series: { label: string; values: number[]; color: string }[];
  years: string[];
}) {
  const allValues = series.flatMap((item) => item.values);
  const max = Math.max(...allValues, 1) * 1.1;
  const min = Math.min(...allValues, 0) * 0.9;
  const range = max - min || 1;
  const width = 500;
  const height = 180;
  const padLeft = 50;
  const padRight = 20;
  const padTop = 10;
  const padBottom = 30;
  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;

  const toX = (index: number) =>
    years.length === 1 ? padLeft + chartWidth / 2 : padLeft + (index / (years.length - 1)) * chartWidth;
  const toY = (value: number) => padTop + chartHeight - ((value - min) / range) * chartHeight;

  return (
    <div className="export-line-chart-area">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: "visible" }}>
        <defs>
          {series.map((item) => (
            <linearGradient key={item.label} id={`lg-${item.label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={item.color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={item.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {[0.25, 0.5, 0.75].map((part) => {
          const y = padTop + chartHeight * (1 - part);
          const value = Math.round(min + range * part);
          return (
            <React.Fragment key={part}>
              <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="rgba(0,0,0,.06)" strokeWidth="1" />
              <text x={padLeft - 6} y={y + 4} textAnchor="end" fontSize="9" fill="var(--text-m, #9ca3af)">
                {formatNumber(value)}
              </text>
            </React.Fragment>
          );
        })}
        {years.map((year, index) => (
          <text key={year} x={toX(index)} y={height - 6} textAnchor="middle" fontSize="10" fill="var(--text-m, #9ca3af)">
            {year}
          </text>
        ))}
        {series.map((item) => {
          const points = item.values.map((value, index) => `${toX(index)},${toY(value)}`).join(" ");
          const area = `M${toX(0)},${toY(item.values[0] ?? 0)} ${item.values
            .map((value, index) => `L${toX(index)},${toY(value)}`)
            .join(" ")} L${toX(item.values.length - 1)},${padTop + chartHeight} L${toX(0)},${padTop + chartHeight} Z`;

          return (
            <React.Fragment key={item.label}>
              <path d={area} fill={`url(#lg-${item.label})`} />
              <polyline points={points} fill="none" stroke={item.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {item.values.map((value, index) => (
                <circle
                  key={`${item.label}-${index}`}
                  cx={toX(index)}
                  cy={toY(value)}
                  r={index === item.values.length - 1 ? 5 : 3.5}
                  fill={item.color}
                  stroke={index === item.values.length - 1 ? "white" : "none"}
                  strokeWidth={2}
                />
              ))}
            </React.Fragment>
          );
        })}
      </svg>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
        {series.map((item) => (
          <span key={item.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: item.color, display: "inline-block" }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="export-chart-card full-width" style={{ minHeight: 220, display: "grid", placeItems: "center" }}>
      <div className="export-spinner" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="export-chart-card full-width" style={{ minHeight: 220, display: "grid", placeItems: "center", textAlign: "center", color: "#991b1b" }}>
      <div>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>โหลดข้อมูลไม่สำเร็จ</div>
        <div style={{ fontSize: 13 }}>{message}</div>
      </div>
    </div>
  );
}

function AtRiskSection({ summary }: { summary: RiskSummary }) {
  const absenceHistoryCount = summary.high + summary.medium + summary.watch + summary.normal;

  const cards: SummaryCard[] = [
    {
      label: "นักเรียนที่มีประวัติขาดเรียน",
      value: formatNumber(absenceHistoryCount),
      color: "#9a3412",
      bg: "rgba(154,52,18,.10)",
      border: "rgba(154,52,18,.18)",
    },
    {
      label: "เสี่ยงสูง",
      value: formatNumber(summary.high),
      color: "#991b1b",
      bg: "rgba(153,27,27,.10)",
      border: "rgba(153,27,27,.18)",
    },
    {
      label: "เสี่ยงกลาง",
      value: formatNumber(summary.medium),
      color: "#b45309",
      bg: "rgba(180,83,9,.10)",
      border: "rgba(180,83,9,.18)",
    },
    {
      label: "เฝ้าระวัง / ปกติ",
      value: formatNumber(summary.watch + summary.normal),
      color: "#166534",
      bg: "rgba(22,101,52,.10)",
      border: "rgba(22,101,52,.18)",
    },
  ];

  const donutSegments = [
    { label: "เสี่ยงสูง", value: summary.high, color: "#991b1b" },
    { label: "เสี่ยงกลาง", value: summary.medium, color: "#b45309" },
    { label: "เฝ้าระวัง", value: summary.watch, color: "#0f766e" },
    { label: "ปกติ", value: summary.normal, color: "#166534" },
  ];

  const totalRisk = summary.high + summary.medium + summary.watch + summary.normal;

  return (
    <>
      <SummaryCards cards={cards} />
      <div className="export-charts-grid">
        <div className="export-chart-card">
          <div className="export-chart-title">สัดส่วนระดับความเสี่ยง</div>
          <div className="export-chart-subtitle">Donut Chart — แสดงภาพรวมของนักเรียนที่มีประวัติขาดเรียน</div>
          <div className="export-chart-body">
            <DonutChart segments={donutSegments} centerValue={formatNumber(totalRisk)} centerLabel="คน" />
          </div>
        </div>
        <div className="export-chart-card">
          <div className="export-chart-title">สรุประดับความเสี่ยง</div>
          <div className="export-chart-subtitle">Bar Chart — เปรียบเทียบแต่ละระดับ</div>
          <div className="export-chart-body">
            <BarChart data={donutSegments.map((segment) => ({ label: segment.label, value: segment.value }))} color="#9a3412" />
          </div>
        </div>
      </div>
      <div className="export-table-section">
        <div className="export-table-header">
          <span className="export-table-title">ตาราง: ระดับความเสี่ยงจากข้อมูลจริง</span>
        </div>
        <div className="export-table-wrap">
          <table className="export-table">
            <thead>
              <tr>
                <th>ระดับ</th>
                <th>จำนวน</th>
                <th>สัดส่วน</th>
              </tr>
            </thead>
            <tbody>
              {donutSegments.map((segment) => (
                <tr key={segment.label}>
                  <td className="bold">{segment.label}</td>
                  <td>{formatNumber(segment.value)}</td>
                  <td>{totalRisk > 0 ? `${((segment.value / totalRisk) * 100).toFixed(1)}%` : "0.0%"}</td>
                </tr>
              ))}
              <tr>
                <td className="bold">ไม่เคยขาด</td>
                <td>{formatNumber(summary.neverAbsent)}</td>
                <td>{summary.total > 0 ? `${((summary.neverAbsent / summary.total) * 100).toFixed(1)}%` : "0.0%"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function DropoutSection({ summary, causeSummary }: { summary: DropoutSummary; causeSummary: DropoutCauseSummaryItem[] }) {
  const displayedTotal = getDropoutTotalFromCause(summary, causeSummary);

  const cards: SummaryCard[] = [
    {
      label: "นักเรียนหลุดทั้งหมด",
      value: formatNumber(displayedTotal),
      color: "#991b1b",
      bg: "rgba(153,27,27,.10)",
      border: "rgba(153,27,27,.18)",
    },
    {
      label: "จังหวัดที่มีข้อมูล",
      value: formatNumber(summary.byProvince.length),
      color: "#3730a3",
      bg: "rgba(55,48,163,.10)",
      border: "rgba(55,48,163,.18)",
    },
    {
      label: "สาเหตุการออก",
      value: formatNumber(causeSummary.length || summary.byCause.length),
      color: "#9a3412",
      bg: "rgba(154,52,18,.10)",
      border: "rgba(154,52,18,.18)",
    },
    {
      label: "ระดับชั้นที่พบ",
      value: formatNumber(summary.byGradeLevel.length),
      color: "#166534",
      bg: "rgba(22,101,52,.10)",
      border: "rgba(22,101,52,.18)",
    },
  ];

  return (
    <>
      <SummaryCards cards={cards} />
      <div className="export-charts-grid">
        <div className="export-chart-card">
          <div className="export-chart-title">นักเรียนหลุดออกจากระบบแยกตามจังหวัด</div>
          <div className="export-chart-subtitle">Bar Chart — จังหวัดที่มีสัดส่วนสูงสุด</div>
          <div className="export-chart-body">
            <BarChart data={summary.byProvince.map((item) => ({ label: item.label, value: item.count }))} color="#be123c" />
          </div>
        </div>
        <div className="export-chart-card">
          <div className="export-chart-title">สาเหตุการหลุดออกจากระบบ</div>
          <div className="export-chart-subtitle">Bar Chart — สาเหตุที่พบมากที่สุด</div>
          <div className="export-chart-body">
            <BarChart data={summary.byCause.map((item) => ({ label: item.label, value: item.count }))} color="#3730a3" />
          </div>
        </div>
      </div>
      <div className="export-table-section">
        <div className="export-table-header">
          <span className="export-table-title">ตาราง: สาเหตุการออกจากระบบ (จำนวน / ร้อยละ)</span>
        </div>
        <div className="export-table-wrap">
          <table className="export-table">
            <thead>
              <tr>
                <th>สาเหตุการออก</th>
                <th>จำนวน (คน)</th>
                <th>ร้อยละ (%)</th>
              </tr>
            </thead>
            <tbody>
              {causeSummary.length > 0 ? causeSummary.map((item) => (
                <tr key={item.cause}>
                  <td className="bold">{item.cause}</td>
                  <td>{formatNumber(item.count)}</td>
                  <td>{item.percentage}%</td>
                </tr>
              )) : summary.byCause.map((item) => {
                const pct = displayedTotal > 0 ? ((item.count / displayedTotal) * 100).toFixed(2) : "0.00";
                return (
                  <tr key={item.label}>
                    <td className="bold">{item.label}</td>
                    <td>{formatNumber(item.count)}</td>
                    <td>{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

const PAGE_SIZE_TABLE = 10;

function RepeatedSection({ items, selectedAcademicYear }: { items: RepeatGradeItem[]; selectedAcademicYear: string }) {
  const [tablePage, setTablePage] = useState(0);
  const repeatedInYear = useMemo(() => {
    return items.filter((item) => item.academicYear === selectedAcademicYear);
  }, [items, selectedAcademicYear]);

  const repeatedByYear = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      counts.set(item.academicYear, (counts.get(item.academicYear) ?? 0) + 1);
    }

    const years = TARGET_ACADEMIC_YEARS;
    return {
      years,
      values: years.map((year) => counts.get(year) ?? 0),
    };
  }, [items]);
  const repeatedByGrade = useMemo(() => countBy(repeatedInYear, (item) => item.gradeLevelName), [repeatedInYear]);

  useEffect(() => {
    setTablePage(0);
  }, [selectedAcademicYear]);

  const totalTablePages = Math.max(1, Math.ceil(repeatedInYear.length / PAGE_SIZE_TABLE));
  const tableSlice = repeatedInYear.slice(tablePage * PAGE_SIZE_TABLE, (tablePage + 1) * PAGE_SIZE_TABLE);

  const cards: SummaryCard[] = [
    {
      label: "รายการซ้ำชั้นทั้งหมด",
      value: formatNumber(repeatedInYear.length),
      color: "#1e3a8a",
      bg: "rgba(30,58,138,.10)",
      border: "rgba(30,58,138,.18)",
    },
    {
      label: "ปีการศึกษาที่พบ",
      value: formatNumber(new Set(repeatedInYear.map((item) => item.academicYear)).size),
      color: "#166534",
      bg: "rgba(22,101,52,.10)",
      border: "rgba(22,101,52,.18)",
    },
    {
      label: "โรงเรียนที่เกี่ยวข้อง",
      value: formatNumber(new Set(repeatedInYear.map((item) => item.schoolName || "ไม่ระบุ")).size),
      color: "#9a3412",
      bg: "rgba(154,52,18,.10)",
      border: "rgba(154,52,18,.18)",
    },
    {
      label: "ระดับชั้นที่พบ",
      value: formatNumber(new Set(repeatedInYear.map((item) => item.gradeLevelName || "ไม่ระบุ")).size),
      color: "#991b1b",
      bg: "rgba(153,27,27,.10)",
      border: "rgba(153,27,27,.18)",
    },
  ];

  return (
    <>
      <SummaryCards cards={cards} />
      <div className="export-charts-grid">
        <div className="export-chart-card">
          <div className="export-chart-title">แนวโน้มการซ้ำชั้นตามปีการศึกษา</div>
          <div className="export-chart-subtitle">Line Chart — แนวโน้มรวมทุกปีการศึกษาในช่วงที่กำหนด</div>
          <div className="export-chart-body">
            <LineChart
              years={repeatedByYear.years}
              series={[
                {
                  label: "ซ้ำชั้น",
                  color: "#991b1b",
                  values: repeatedByYear.values,
                },
              ]}
            />
          </div>
        </div>
        <div className="export-chart-card">
          <div className="export-chart-title">ซ้ำชั้นแยกตามระดับชั้น</div>
          <div className="export-chart-subtitle">Bar Chart — ระดับชั้นที่มีการซ้ำชั้นมากที่สุด</div>
          <div className="export-chart-body">
            <BarChart data={repeatedByGrade.map((item) => ({ label: item.label, value: item.count }))} color="#1e3a8a" />
          </div>
        </div>
      </div>
      <div className="export-table-section">
        <div className="export-table-header">
          <span className="export-table-title">ตาราง: รายชื่อรายการนักเรียนซ้ำชั้น ปี {selectedAcademicYear} ({formatNumber(repeatedInYear.length)} รายการ)</span>
        </div>
        <div className="export-table-wrap">
          <table className="export-table">
            <thead>
              <tr>
                <th>รหัส</th>
                <th>ชื่อ-สกุล</th>
                <th>โรงเรียน</th>
                <th>ระดับชั้น</th>
                <th>ปีการศึกษาปัจจุบัน</th>
                <th>ปีก่อนหน้า</th>
              </tr>
            </thead>
            <tbody>
              {tableSlice.map((item) => (
                <tr key={`${item.studentId ?? item.personId ?? item.fullName}-${item.academicYear}`}>
                  <td className="bold">{item.personId ?? "-"}</td>
                  <td>{item.fullName || "-"}</td>
                  <td>{item.schoolName ?? "-"}</td>
                  <td>{item.gradeLevelName ?? "-"}</td>
                  <td>{item.academicYear}</td>
                  <td>{item.previousAcademicYear}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalTablePages > 1 && (
          <div className="export-table-pagination">
            <button
              className="export-bar-page-btn"
              onClick={() => setTablePage((p) => Math.max(0, p - 1))}
              disabled={tablePage === 0}
            >&#8592; ก่อนหน้า</button>
            <span className="export-bar-page-info">หน้า {tablePage + 1} / {totalTablePages}</span>
            <button
              className="export-bar-page-btn"
              onClick={() => setTablePage((p) => Math.min(totalTablePages - 1, p + 1))}
              disabled={tablePage === totalTablePages - 1}
            >ถัดไป &#8594;</button>
          </div>
        )}
      </div>
    </>
  );
}

function DisabledSection({ summary, list, typeSummary }: { summary: DisabledSummary; list: DisabledListItem[]; typeSummary: DisabilityTypeSummaryItem[] }) {
  const cards: SummaryCard[] = [
    {
      label: "นักเรียนพิการทั้งหมด",
      value: formatNumber(summary.total),
      color: "#3730a3",
      bg: "rgba(55,48,163,.10)",
      border: "rgba(55,48,163,.18)",
    },
    {
      label: "ประเภทความพิการ",
      value: formatNumber(typeSummary.length || summary.byDisabilityType.length),
      color: "#166534",
      bg: "rgba(22,101,52,.10)",
      border: "rgba(22,101,52,.18)",
    },
    {
      label: "จังหวัดที่มีข้อมูล",
      value: formatNumber(summary.byProvince.length),
      color: "#9a3412",
      bg: "rgba(154,52,18,.10)",
      border: "rgba(154,52,18,.18)",
    },
    {
      label: "รายการแสดงผล",
      value: formatNumber(list.length),
      color: "#991b1b",
      bg: "rgba(153,27,27,.10)",
      border: "rgba(153,27,27,.18)",
    },
  ];

  const palette = ["#991b1b", "#a16207", "#b45309", "#166534", "#1e40af", "#4338ca", "#9d174d", "#0f766e", "#312e81"];

  return (
    <>
      <SummaryCards cards={cards} />
      <div className="export-charts-grid">
        <div className="export-chart-card">
          <div className="export-chart-title">ประเภทความพิการ</div>
          <div className="export-chart-subtitle">Donut Chart — ตามสัดส่วนประเภท</div>
          <div className="export-chart-body">
            <DonutChart
              segments={(typeSummary.length > 0 ? typeSummary.map((item, index) => ({ label: item.type, value: item.count, color: palette[index % palette.length] })) : summary.byDisabilityType.map((item, index) => ({
                label: item.label,
                value: item.count,
                color: palette[index % palette.length],
              })))}
              centerValue={formatNumber(summary.total)}
              centerLabel="คน"
            />
          </div>
        </div>
        <div className="export-chart-card">
          <div className="export-chart-title">จำนวนนักเรียนพิการแยกตามจังหวัด</div>
          <div className="export-chart-subtitle">Bar Chart — จังหวัดที่มีข้อมูลมากที่สุด</div>
          <div className="export-chart-body">
            <BarChart data={summary.byProvince.map((item) => ({ label: item.label, value: item.count }))} color="#3730a3" />
          </div>
        </div>
      </div>
      <div className="export-table-section">
        <div className="export-table-header">
          <span className="export-table-title">ตาราง: ประเภทความพิการ — จำนวน / ร้อยละ </span>
        </div>
        <div className="export-table-wrap">
          <table className="export-table">
            <thead>
              <tr>
                <th>ประเภทความพิการ</th>
                <th>จำนวน (คน)</th>
                <th>ร้อยละ (%)</th>
              </tr>
            </thead>
            <tbody>
              {typeSummary.length > 0
                ? typeSummary.map((item) => (
                    <tr key={item.type}>
                      <td className="bold">{item.type}</td>
                      <td>{formatNumber(item.count)}</td>
                      <td>{item.percentage}%</td>
                    </tr>
                  ))
                : summary.byDisabilityType.map((item) => {
                    const pct = summary.total > 0 ? ((item.count / summary.total) * 100).toFixed(2) : "0.00";
                    return (
                      <tr key={item.label}>
                        <td className="bold">{item.label}</td>
                        <td>{formatNumber(item.count)}</td>
                        <td>{pct}%</td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default function ExportPage() {
  const [activeTab, setActiveTab] = useState<ExportPageTab>("at-risk");
  const [filterOptions, setFilterOptions] = useState<ExportFilterOptions | null>(null);
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [isLoadingTab, setIsLoadingTab] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [riskSummary, setRiskSummary] = useState<RiskSummary | null>(null);
  const [dropoutSummary, setDropoutSummary] = useState<DropoutSummary | null>(null);
  const [dropoutCauseSummary, setDropoutCauseSummary] = useState<DropoutCauseSummaryItem[]>([]);
  const [repeatItems, setRepeatItems] = useState<RepeatGradeItem[]>([]);
  const [disabledSummary, setDisabledSummary] = useState<DisabledSummary | null>(null);
  const [disabledList, setDisabledList] = useState<DisabledListItem[]>([]);
  const [disabilityTypeSummary, setDisabilityTypeSummary] = useState<DisabilityTypeSummaryItem[]>([]);
  const showSemesterFilter = activeTab === "at-risk" || activeTab === "dropout";
  const effectiveSemester = (activeTab === "at-risk" || activeTab === "dropout") ? (semester || "1") : semester;
  const availableAcademicYears = useMemo(() => TARGET_ACADEMIC_YEARS, []);

  const showToast = useCallback((type: ToastState["type"], message: string, duration = 3000) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), duration);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadFilters = async () => {
      setIsLoadingFilters(true);
      try {
        const options = await exportService.getFilterOptions();
        if (cancelled) {
          return;
        }
        setFilterOptions(options);
        setAcademicYear((current) => current || options.academicYears[0] || TARGET_ACADEMIC_YEARS[0]);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "ไม่สามารถโหลดตัวกรองได้");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingFilters(false);
        }
      }
    };

    void loadFilters();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (availableAcademicYears.length === 0) {
      return;
    }

    setAcademicYear((current) => {
      if (current && availableAcademicYears.includes(current)) {
        return current;
      }
      return availableAcademicYears[0];
    });
  }, [availableAcademicYears]);

  useEffect(() => {
    if (!academicYear) {
      return;
    }

    let cancelled = false;

    const loadTabData = async () => {
      setIsLoadingTab(true);
      setError(null);

      try {
        if (activeTab === "at-risk") {
          const summary = await exportService.getRiskSummary({ academicYear, semester: effectiveSemester || undefined });
          if (!cancelled) {
            setRiskSummary(summary);
          }
        } else if (activeTab === "dropout") {
          const summary = await exportService.getDropoutSummary({ academicYear, semester: effectiveSemester || undefined });
          if (!cancelled) {
            setDropoutSummary(summary);
            // Derive cause summary from byCause (already computed in getDropoutSummary)
            const total = getDropoutTotalFromCause(summary);
            const causeSummary: DropoutCauseSummaryItem[] = summary.byCause.map((item) => ({
              cause: item.label,
              count: item.count,
              percentage: total > 0 ? ((item.count / total) * 100).toFixed(2) : "0.00",
            }));
            setDropoutCauseSummary(causeSummary);
          }
        } else if (activeTab === "repeated") {
          const items = await exportService.getRepeatGradeList();
          if (!cancelled) {
            setRepeatItems(items);
          }
        } else if (activeTab === "disabled") {
          const [summary, list, typeSummary] = await Promise.all([
            exportService.getDisabledSummary({ academicYear }),
            exportService.getDisabledList({ academicYear }),
            exportService.getDisabilityTypeSummary({ academicYear }),
          ]);
          if (!cancelled) {
            setDisabledSummary(summary);
            setDisabledList(list);
            setDisabilityTypeSummary(typeSummary);
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "ไม่สามารถโหลดข้อมูลรายงานได้");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTab(false);
        }
      }
    };

    void loadTabData();

    return () => {
      cancelled = true;
    };
  }, [activeTab, academicYear, effectiveSemester]);

  const activeSummary = useMemo<SummaryCard[] | null>(() => {
    if (activeTab === "at-risk" && riskSummary) {
      const absenceHistoryCount = riskSummary.high + riskSummary.medium + riskSummary.watch + riskSummary.normal;

      return [
        {
          label: "นักเรียนที่มีประวัติขาดเรียน",
          value: formatNumber(absenceHistoryCount),
          color: "#9a3412",
          bg: "rgba(154,52,18,.10)",
          border: "rgba(154,52,18,.18)",
        },
        {
          label: "เสี่ยงสูง",
          value: formatNumber(riskSummary.high),
          color: "#991b1b",
          bg: "rgba(153,27,27,.10)",
          border: "rgba(153,27,27,.18)",
        },
        {
          label: "เสี่ยงกลาง",
          value: formatNumber(riskSummary.medium),
          color: "#b45309",
          bg: "rgba(180,83,9,.10)",
          border: "rgba(180,83,9,.18)",
        },
        {
          label: "เฝ้าระวัง / ปกติ",
          value: formatNumber(riskSummary.watch + riskSummary.normal),
          color: "#166534",
          bg: "rgba(22,101,52,.10)",
          border: "rgba(22,101,52,.18)",
        },
      ];
    }

    if (activeTab === "dropout" && dropoutSummary) {
      const displayedTotal = getDropoutTotalFromCause(dropoutSummary, dropoutCauseSummary);
      return [
        {
          label: "นักเรียนหลุดทั้งหมด",
          value: formatNumber(displayedTotal),
          color: "#991b1b",
          bg: "rgba(153,27,27,.10)",
          border: "rgba(153,27,27,.18)",
        },
        {
          label: "จังหวัดที่มีข้อมูล",
          value: formatNumber(dropoutSummary.byProvince.length),
          color: "#3730a3",
          bg: "rgba(55,48,163,.10)",
          border: "rgba(55,48,163,.18)",
        },
        {
          label: "สาเหตุการออก",
          value: formatNumber(dropoutSummary.byCause.length),
          color: "#9a3412",
          bg: "rgba(154,52,18,.10)",
          border: "rgba(154,52,18,.18)",
        },
        {
          label: "ระดับชั้นที่พบ",
          value: formatNumber(dropoutSummary.byGradeLevel.length),
          color: "#166534",
          bg: "rgba(22,101,52,.10)",
          border: "rgba(22,101,52,.18)",
        },
      ];
    }

    if (activeTab === "repeated") {
      return [
        {
          label: "รายการซ้ำชั้นทั้งหมด",
          value: formatNumber(repeatItems.length),
          color: "#1e3a8a",
          bg: "rgba(30,58,138,.10)",
          border: "rgba(30,58,138,.18)",
        },
        {
          label: "ปีการศึกษาที่พบ",
          value: formatNumber(new Set(repeatItems.map((item) => item.academicYear)).size),
          color: "#166534",
          bg: "rgba(22,101,52,.10)",
          border: "rgba(22,101,52,.18)",
        },
        {
          label: "โรงเรียนที่เกี่ยวข้อง",
          value: formatNumber(new Set(repeatItems.map((item) => item.schoolName || "ไม่ระบุ")).size),
          color: "#9a3412",
          bg: "rgba(154,52,18,.10)",
          border: "rgba(154,52,18,.18)",
        },
        {
          label: "ระดับชั้นที่พบ",
          value: formatNumber(new Set(repeatItems.map((item) => item.gradeLevelName || "ไม่ระบุ")).size),
          color: "#991b1b",
          bg: "rgba(153,27,27,.10)",
          border: "rgba(153,27,27,.18)",
        },
      ];
    }

    if (activeTab === "disabled" && disabledSummary) {
      return [
        {
          label: "นักเรียนพิการทั้งหมด",
          value: formatNumber(disabledSummary.total),
          color: "#3730a3",
          bg: "rgba(55,48,163,.10)",
          border: "rgba(55,48,163,.18)",
        },
        {
          label: "ประเภทความพิการ",
          value: formatNumber(disabledSummary.byDisabilityType.length),
          color: "#166534",
          bg: "rgba(22,101,52,.10)",
          border: "rgba(22,101,52,.18)",
        },
        {
          label: "จังหวัดที่มีข้อมูล",
          value: formatNumber(disabledSummary.byProvince.length),
          color: "#9a3412",
          bg: "rgba(154,52,18,.10)",
          border: "rgba(154,52,18,.18)",
        },
        {
          label: "รายการแสดงผล",
          value: formatNumber(disabledList.length),
          color: "#991b1b",
          bg: "rgba(153,27,27,.10)",
          border: "rgba(153,27,27,.18)",
        },
      ];
    }

    return null;
  }, [activeTab, disabledList.length, disabledSummary, dropoutCauseSummary, dropoutSummary, repeatItems, riskSummary]);

  const activeTitle = useMemo(() => {
    switch (activeTab) {
      case "at-risk":
        return "สถิตินักเรียนเสี่ยงหลุดออกจากระบบ";
      case "dropout":
        return "สถิตินักเรียนหลุดออกจากระบบ";
      case "repeated":
        return "สถิติการเลื่อนชั้นและซ้ำชั้น";
      case "disabled":
        return "สถิตินักเรียนพิการและเด็กพิเศษ";
    }
  }, [activeTab]);

  const fetchAtRiskExportRows = useCallback(async (): Promise<AtRiskExportRow[]> => {
    const selectedSemester = effectiveSemester || "1";
    const grouped = await exportService.getRiskStudentsGrouped({
      academicYear,
      semester: selectedSemester,
    });
    const allRows = mapGroupedRiskRows(grouped, `ภาคเรียน ${selectedSemester}`);

    return allRows.sort(sortAtRiskRows);
  }, [academicYear, effectiveSemester]);

  const fetchDropoutExportRows = useCallback(async (): Promise<DropoutListItem[]> => {
    return exportService.getDropoutList({ academicYear, semester: effectiveSemester || undefined });
  }, [academicYear, effectiveSemester]);

  const handleExportPercentExcel = useCallback(() => {
    try {
      if (activeTab === "at-risk") {
        if (!riskSummary) {
          showToast("error", "ยังไม่มีข้อมูลสำหรับส่งออก");
          return;
        }
        const totalRisk = riskSummary.high + riskSummary.medium + riskSummary.watch + riskSummary.normal;
        const rows = [
          { ระดับ: "เสี่ยงสูง", จำนวน: riskSummary.high, "ร้อยละ (%)": totalRisk > 0 ? ((riskSummary.high / totalRisk) * 100).toFixed(2) : "0.00" },
          { ระดับ: "เสี่ยงกลาง", จำนวน: riskSummary.medium, "ร้อยละ (%)": totalRisk > 0 ? ((riskSummary.medium / totalRisk) * 100).toFixed(2) : "0.00" },
          { ระดับ: "เฝ้าระวัง", จำนวน: riskSummary.watch, "ร้อยละ (%)": totalRisk > 0 ? ((riskSummary.watch / totalRisk) * 100).toFixed(2) : "0.00" },
          { ระดับ: "ปกติ", จำนวน: riskSummary.normal, "ร้อยละ (%)": totalRisk > 0 ? ((riskSummary.normal / totalRisk) * 100).toFixed(2) : "0.00" },
          { ระดับ: "ไม่เคยขาด", จำนวน: riskSummary.neverAbsent, "ร้อยละ (%)": riskSummary.total > 0 ? ((riskSummary.neverAbsent / riskSummary.total) * 100).toFixed(2) : "0.00" },
        ];
        exportToExcel(rows, "ระดับความเสี่ยง", "สัดส่วนความเสี่ยง");
      } else if (activeTab === "dropout") {
        if (!dropoutSummary) {
          showToast("error", "ยังไม่มีข้อมูลสำหรับส่งออก");
          return;
        }
        const rows = (dropoutCauseSummary.length > 0
          ? dropoutCauseSummary.map((item) => ({
              สาเหตุการออก: item.cause,
              จำนวน: item.count,
              "ร้อยละ (%)": item.percentage,
            }))
          : (() => {
              const displayedTotal = getDropoutTotalFromCause(dropoutSummary);
              return dropoutSummary.byCause.map((item) => ({
              สาเหตุการออก: item.label,
              จำนวน: item.count,
              "ร้อยละ (%)": displayedTotal > 0 ? ((item.count / displayedTotal) * 100).toFixed(2) : "0.00",
            }));
            })());
        exportToExcel(rows, "สาเหตุการออก", "สัดส่วนสาเหตุการออก");
      } else if (activeTab === "repeated") {
        const repeatedInYear = repeatItems.filter((item) => item.academicYear === academicYear);
        if (repeatedInYear.length === 0) {
          showToast("error", "ยังไม่มีข้อมูลสำหรับส่งออก");
          return;
        }
        const grouped = countBy(repeatedInYear, (item) => item.gradeLevelName);
        const total = repeatedInYear.length;
        const rows = grouped.map((item) => ({
          ระดับชั้น: item.label,
          จำนวน: item.count,
          "ร้อยละ (%)": total > 0 ? ((item.count / total) * 100).toFixed(2) : "0.00",
        }));
        exportToExcel(rows, "ซ้ำชั้นตามระดับชั้น", "สัดส่วนซ้ำชั้น");
      } else if (activeTab === "disabled") {
        if (!disabledSummary) {
          showToast("error", "ยังไม่มีข้อมูลสำหรับส่งออก");
          return;
        }
        const rows = (disabilityTypeSummary.length > 0
          ? disabilityTypeSummary.map((item) => ({
              ประเภทความพิการ: item.type,
              จำนวน: item.count,
              "ร้อยละ (%)": item.percentage,
            }))
          : disabledSummary.byDisabilityType.map((item) => ({
              ประเภทความพิการ: item.label,
              จำนวน: item.count,
              "ร้อยละ (%)": disabledSummary.total > 0 ? ((item.count / disabledSummary.total) * 100).toFixed(2) : "0.00",
            })));
        exportToExcel(rows, "ประเภทความพิการ", "สัดส่วนประเภทความพิการ");
      }
      showToast("success", "ดาวน์โหลด Excel (ร้อยละ) สำเร็จ");
    } catch (exportError) {
      showToast(
        "error",
        exportError instanceof Error ? exportError.message : "ไม่สามารถส่งออก Excel (ร้อยละ) ได้",
      );
    }
  }, [
    activeTab,
    academicYear,
    disabledSummary,
    disabilityTypeSummary,
    dropoutCauseSummary,
    dropoutSummary,
    repeatItems,
    riskSummary,
    showToast,
  ]);

  const handleExportAtRiskXLSX = useCallback(async () => {
    if (!academicYear) {
      showToast("error", "กรุณาเลือกปีการศึกษา");
      return;
    }

    try {
      showToast("processing", "กำลังสร้างไฟล์ Excel รายชื่อนักเรียนเสี่ยง...", 1500);
      const allRows = await fetchAtRiskExportRows();
      const header = [
        "ลำดับ",
        "ภาคเรียน",
        "รหัสนักเรียน",
        "ชื่อ",
        "นามสกุล",
        "ระดับชั้น",
        "กลุ่ม/แผนก",
        "ขาดไม่ลา",
        "ขาดมีลา",
        "รวมวันขาด",
        "ระดับความเสี่ยง",
      ];
      const body = allRows.map((item, index) => [
        index + 1,
        item.semesterLabel,
        item.studentId,
        item.firstName,
        item.lastName,
        item.gradeLevel,
        item.department,
        item.unexcusedDays,
        item.excusedDays,
        item.totalAbsentDays,
        item.riskLabel,
      ]);

      const ws = XLSXStyle.utils.aoa_to_sheet([header, ...body]);
      ws["!cols"] = [
        { wch: 8 },
        { wch: 12 },
        { wch: 14 },
        { wch: 16 },
        { wch: 18 },
        { wch: 12 },
        { wch: 18 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 14 },
      ];

      const headerStyle = {
        fill: { fgColor: { rgb: "2563EB" } },
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "D1D5DB" } },
          bottom: { style: "thin", color: { rgb: "D1D5DB" } },
          left: { style: "thin", color: { rgb: "D1D5DB" } },
          right: { style: "thin", color: { rgb: "D1D5DB" } },
        },
      };
      const baseCellStyle = {
        border: {
          top: { style: "thin", color: { rgb: "E5E7EB" } },
          bottom: { style: "thin", color: { rgb: "E5E7EB" } },
          left: { style: "thin", color: { rgb: "E5E7EB" } },
          right: { style: "thin", color: { rgb: "E5E7EB" } },
        },
      };
      const riskStyles: Record<string, { fill: { fgColor: { rgb: string } }; font: { color: { rgb: string }; bold: boolean } }> = {
        "เสี่ยงสูง": { fill: { fgColor: { rgb: "FEE2E2" } }, font: { color: { rgb: "991B1B" }, bold: true } },
        "เสี่ยงกลาง": { fill: { fgColor: { rgb: "FFEDD5" } }, font: { color: { rgb: "9A3412" }, bold: true } },
        "เฝ้าระวัง": { fill: { fgColor: { rgb: "FEF9C3" } }, font: { color: { rgb: "A16207" }, bold: true } },
        "ปกติ": { fill: { fgColor: { rgb: "DCFCE7" } }, font: { color: { rgb: "166534" }, bold: true } },
      };

      for (let col = 0; col < header.length; col += 1) {
        const cellRef = XLSXStyle.utils.encode_cell({ r: 0, c: col });
        if (ws[cellRef]) {
          ws[cellRef].s = headerStyle;
        }
      }

      for (let row = 0; row < body.length; row += 1) {
        for (let col = 0; col < header.length; col += 1) {
          const cellRef = XLSXStyle.utils.encode_cell({ r: row + 1, c: col });
          if (!ws[cellRef]) continue;
          ws[cellRef].s = {
            ...baseCellStyle,
            alignment: {
              vertical: "center",
              horizontal: col >= 7 && col <= 9 ? "center" : "left",
            },
          };
        }
        const riskCellRef = XLSXStyle.utils.encode_cell({ r: row + 1, c: 10 });
        if (ws[riskCellRef]) {
          ws[riskCellRef].s = {
            ...baseCellStyle,
            alignment: { horizontal: "center", vertical: "center" },
            ...(riskStyles[allRows[row].riskLabel] ?? {}),
          };
        }
      }

      const wb = XLSXStyle.utils.book_new();
      XLSXStyle.utils.book_append_sheet(wb, ws, "รายชื่อนักเรียนเสี่ยง");
      const semesterLabel = `term-${effectiveSemester || "1"}`;
      XLSXStyle.writeFile(wb, `รายชื่อนักเรียนเสี่ยง_${academicYear}_${semesterLabel}_${new Date().toLocaleDateString("th-TH")}.xlsx`);
      showToast("success", "ดาวน์โหลด Excel รายชื่อนักเรียนเสี่ยงสำเร็จ");
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "ไม่สามารถส่งออก Excel รายชื่อนักเรียนเสี่ยงได้",
      );
    }
  }, [academicYear, effectiveSemester, fetchAtRiskExportRows, showToast]);

  const handleExportDropoutXLSX = useCallback(async () => {
    if (!academicYear) {
      showToast("error", "กรุณาเลือกปีการศึกษา");
      return;
    }

    try {
      showToast("processing", "กำลังสร้างไฟล์ Excel รายชื่อนักเรียนหลุดออกจากระบบ...", 1500);
      const rows = await fetchDropoutExportRows();
      const body = rows.map((item, index) => [
        index + 1,
        item.personId || "-",
        item.firstName || "-",
        item.lastName || "-",
        item.gradeLevel || "-",
        item.schoolName || "-",
        item.statusCodeCause || "-",
        item.remark || "-",
      ]);
      exportStyledExcel(
        ["ลำดับ", "รหัสนักเรียน", "ชื่อ", "นามสกุล", "ระดับชั้น", "โรงเรียน", "สาเหตุ", "หมายเหตุ"],
        body,
        "รายชื่อหลุดออกจากระบบ",
        `รายชื่อนักเรียนหลุดออกจากระบบ_${academicYear}_${semester || "all"}`,
      );
      showToast("success", "ดาวน์โหลด Excel รายชื่อนักเรียนหลุดออกจากระบบสำเร็จ");
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "ไม่สามารถส่งออก Excel รายชื่อนักเรียนหลุดออกจากระบบได้",
      );
    }
  }, [academicYear, fetchDropoutExportRows, semester, showToast]);

  const handleExportRepeatedXLSX = useCallback(async () => {
    if (!academicYear) {
      showToast("error", "กรุณาเลือกปีการศึกษา");
      return;
    }

    try {
      showToast("processing", "กำลังสร้างไฟล์ Excel รายการเลื่อนชั้น/ซ้ำชั้น...", 1500);
      const rows = repeatItems
        .filter((item) => item.academicYear === academicYear)
        .sort((a, b) => (b.absentDays ?? 0) - (a.absentDays ?? 0));
      const body = rows.map((item, index) => [
        index + 1,
        item.personId ?? "-",
        item.fullName || "-",
        item.gradeLevelName || "-",
        item.departmentName || "-",
        item.schoolName || "-",
        item.absentDays ?? 0,
        item.reason || "-",
      ]);
      exportStyledExcel(
        ["ลำดับ", "รหัสนักเรียน", "ชื่อ-สกุล", "ระดับชั้น", "แผนก", "โรงเรียน", "วันขาด", "สาเหตุ"],
        body,
        "รายการเลื่อนชั้นซ้ำชั้น",
        `รายการเลื่อนชั้นซ้ำชั้น_${academicYear}`,
      );
      showToast("success", "ดาวน์โหลด Excel รายการเลื่อนชั้น/ซ้ำชั้นสำเร็จ");
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "ไม่สามารถส่งออก Excel รายการเลื่อนชั้น/ซ้ำชั้นได้",
      );
    }
  }, [academicYear, repeatItems, showToast]);

  const handleExportDisabledXLSX = useCallback(async () => {
    if (!academicYear) {
      showToast("error", "กรุณาเลือกปีการศึกษา");
      return;
    }

    try {
      showToast("processing", "กำลังสร้างไฟล์ Excel รายชื่อนักเรียนพิการ...", 1500);
      const body = disabledList.map((item, index) => [
        index + 1,
        item.personId || "-",
        item.firstName || "-",
        item.lastName || "-",
        item.disability || "-",
        item.gender || "-",
        item.nationality || "-",
      ]);
      exportStyledExcel(
        ["ลำดับ", "รหัสนักเรียน", "ชื่อ", "นามสกุล", "ประเภทความพิการ", "เพศ", "สัญชาติ"],
        body,
        "รายชื่อนักเรียนพิการ",
        `รายชื่อนักเรียนพิการ_${academicYear}`,
      );
      showToast("success", "ดาวน์โหลด Excel รายชื่อนักเรียนพิการสำเร็จ");
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "ไม่สามารถส่งออก Excel รายชื่อนักเรียนพิการได้",
      );
    }
  }, [academicYear, disabledList, showToast]);

  const handleExportPDF = useCallback(async () => {
    if (!academicYear) {
      showToast("error", "กรุณาเลือกปีการศึกษา");
      return;
    }

    const reportTypeByTab: Record<ExportPageTab, ExportBackendType> = {
      "at-risk": "attendance-risk",
      dropout: "dropout",
      repeated: "repeat-grade",
      disabled: "disability",
    };

    if (activeTab === "repeated") {
      const rows = repeatItems
        .filter((item) => item.academicYear === academicYear)
        .sort((a, b) => (b.absentDays ?? 0) - (a.absentDays ?? 0));

      if (rows.length === 0) {
        showToast("error", "ยังไม่มีข้อมูลสำหรับส่งออก");
        return;
      }

      try {
        showToast("processing", "กำลังดาวน์โหลดไฟล์ PDF...", 1500);
        await exportRepeatedPdf(rows, academicYear);
        showToast("success", "ดาวน์โหลด PDF สำเร็จ");
      } catch (error) {
        showToast(
          "error",
          error instanceof Error ? error.message : "ไม่สามารถส่งออก PDF ได้",
        );
      }
      return;
    }

    const params: ExportQueryParams = { academicYear };
    if (activeTab === "at-risk" || activeTab === "dropout") {
      params.semester = effectiveSemester || undefined;
    }

    try {
      showToast("processing", "กำลังดาวน์โหลดไฟล์ PDF...", 1500);
      await exportService.downloadReport(reportTypeByTab[activeTab], "pdf", params);
      showToast("success", "ดาวน์โหลด PDF สำเร็จ");
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "ไม่สามารถส่งออก PDF ได้",
      );
    }
  }, [academicYear, activeTab, effectiveSemester, repeatItems, showToast]);

  const handleExportXLSX = useCallback(() => {
    if (activeTab === "at-risk") {
      void handleExportAtRiskXLSX();
      return;
    }
    if (activeTab === "dropout") {
      void handleExportDropoutXLSX();
      return;
    }
    if (activeTab === "repeated") {
      void handleExportRepeatedXLSX();
      return;
    }
    void handleExportDisabledXLSX();
  }, [
    activeTab,
    handleExportAtRiskXLSX,
    handleExportDisabledXLSX,
    handleExportDropoutXLSX,
    handleExportRepeatedXLSX,
  ]);

  const isReady = !isLoadingFilters && academicYear.length > 0;

  return (
    <>
      <div className="print-header">
        <div className="print-header-top">
          <img src="/sts.png" alt="STS Logo" className="print-header-logo" />
          <div className="print-header-text">
            <h2 className="print-header-org">กระทรวงศึกษาธิการ / สำนักงานเลขาธิการสภาการศึกษา</h2>
            <h1 className="print-header-title">รายงานสรุปข้อมูลนักเรียน: {activeTitle}</h1>
            <h3 className="print-header-subtitle">ศูนย์รายงานวิเคราะห์ (Report & Analytics Center)</h3>
          </div>
        </div>
        <div className="print-header-meta">
          <div className="print-header-meta-left">
            <span>
              <span className="print-meta-label">ปีการศึกษา:</span> {academicYear || "-"}
            </span>
            {showSemesterFilter ? (
              <span>
                <span className="print-meta-label">ภาคเรียน:</span> {effectiveSemester || "ทั้งปี"}
              </span>
            ) : null}
          </div>
          <div className="print-header-meta-right">
            <span>
              <span className="print-meta-label">วันที่พิมพ์:</span>{" "}
              {new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
      </div>
      <div className="print-watermark">CONFIDENTIAL</div>

      <div className="export-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`export-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="export-tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="export-filter-bar">
        <div className="export-filter-group">
          <span className="export-filter-label">ปีการศึกษา:</span>
          <select
            className="export-filter-select"
            value={academicYear}
            onChange={(event) => setAcademicYear(event.target.value)}
            disabled={!filterOptions}
          >
            {availableAcademicYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        {showSemesterFilter ? (
          <div className="export-filter-group">
            <span className="export-filter-label">ภาคเรียน:</span>
            <select
              className="export-filter-select"
              value={(activeTab === "at-risk" || activeTab === "dropout") ? (semester || "1") : semester}
              onChange={(event) => setSemester(event.target.value)}
            >
              {(activeTab === "at-risk" ? SEMESTER_OPTIONS_AT_RISK : SEMESTER_OPTIONS_DROPOUT).map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <div className="export-main">
        {!isReady || isLoadingTab ? (
          <LoadingCard />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <>
            {activeTab === "at-risk" && riskSummary ? <AtRiskSection summary={riskSummary} /> : null}
            {activeTab === "dropout" && dropoutSummary ? <DropoutSection summary={dropoutSummary} causeSummary={dropoutCauseSummary} /> : null}
            {activeTab === "repeated" ? <RepeatedSection items={repeatItems} selectedAcademicYear={academicYear} /> : null}
            {activeTab === "disabled" && disabledSummary ? <DisabledSection summary={disabledSummary} list={disabledList} typeSummary={disabilityTypeSummary} /> : null}

            <div className="print-footer">
              <div className="print-footer-signature">
                <div className="print-footer-sig-block">
                  <div className="print-footer-sig-line" />
                  <div className="print-footer-sig-label">(ลงชื่อผู้รายงาน)</div>
                  <div className="print-footer-sig-title">ตำแหน่งผู้บริหาร/ผู้อำนวยการ</div>
                </div>
              </div>
              <div className="print-footer-ref">
                <span>Ref: STS-RPT-{new Date().getFullYear() + 543}-{Math.floor(Math.random() * 10000).toString().padStart(4, "0")}</span>
                <span>เอกสารราชการ ใช้ภายในองค์กรเท่านั้น</span>
              </div>
              <div className="print-footer-confidential">ห้ามเผยแพร่ก่อนได้รับอนุญาต (STRICTLY CONFIDENTIAL)</div>
            </div>
          </>
        )}
      </div>

      <div className="export-actions-bar">
        <div style={{ fontSize: 13, color: "var(--text-m, #6b7280)" }}>
          <strong style={{ color: "var(--text-h, #111827)" }}>{activeTitle}</strong> — {academicYear || "-"}{showSemesterFilter ? ` · ${effectiveSemester || "ทั้งปี"}` : ""}
        </div>
        <div className="spacer" />
        <button className="export-btn export-btn-secondary" onClick={handleExportPDF} disabled={!isReady || isLoadingTab}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          ส่งออก PDF
        </button>
        <button className="export-btn export-btn-secondary" onClick={handleExportXLSX} disabled={!isReady || isLoadingTab}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          ส่งออก Excel (ข้อมูลทั้งหมด)
        </button>
        <button className="export-btn export-btn-success" onClick={handleExportPercentExcel} disabled={!isReady || isLoadingTab}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          ส่งออก Excel (ร้อยละ)
        </button>
      </div>

      {toast ? (
        <div className={`export-toast ${toast.type}`}>
          {toast.type === "processing" ? <div className="export-spinner" /> : null}
          {toast.message}
        </div>
      ) : null}
    </>
  );
}