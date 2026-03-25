"use client";

import { useState, useMemo, ReactNode, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

/* ─── Reusable paginated table wrapper ─── */
export function useTablePagination<T>(data: T[], perPage = 10) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(data.length / perPage));

  // reset when data shrinks
  const safePage = Math.min(page, totalPages - 1);
  if (safePage !== page) setPage(safePage);

  const pageData = useMemo(
    () => data.slice(safePage * perPage, safePage * perPage + perPage),
    [data, safePage, perPage],
  );

  return { page: safePage, totalPages, pageData, setPage };
}

export function TablePagination({
  page,
  totalPages,
  setPage,
  totalItems,
  perPage,
}: {
  page: number;
  totalPages: number;
  setPage: (p: number) => void;
  totalItems: number;
  perPage: number;
}) {
  const { isDark } = useTheme();
  const from = page * perPage + 1;
  const to = Math.min((page + 1) * perPage, totalItems);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 0 0",
        borderTop: `1px solid ${isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.06)"}`,
        marginTop: 8,
        fontSize: 12,
      }}
    >
      {/* Left: range info */}
      <span style={{ color: "var(--text-m, #9ca3af)", fontWeight: 500 }}>
        แสดง {from}–{to} จาก {totalItems} รายการ
      </span>

      {/* Right: pagination controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {/* First */}
        <PgBtn
          disabled={page === 0}
          onClick={() => setPage(0)}
          isDark={isDark}
          label={
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="11 17 6 12 11 7" />
              <polyline points="18 17 13 12 18 7" />
            </svg>
          }
        />
        {/* Prev */}
        <PgBtn
          disabled={page === 0}
          onClick={() => setPage(page - 1)}
          isDark={isDark}
          label={
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          }
        />

        {/* Page numbers */}
        {getVisiblePages(page, totalPages).map((p, i) =>
          p === -1 ? (
            <span key={`sep-${i}`} style={{ color: isDark ? "#4b5563" : "#d1d5db", fontSize: 11, margin: "0 2px" }}>
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                border: p === page ? "none" : `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,.06)"}`,
                background:
                  p === page
                    ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                    : isDark ? "rgba(30,41,59,0.5)" : "transparent",
                color: p === page ? "#fff" : isDark ? "#cbd5e1" : "#6b7280",
                fontWeight: p === page ? 700 : 500,
                fontSize: 11,
                cursor: "pointer",
                transition: "all .2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {p + 1}
            </button>
          ),
        )}

        {/* Next */}
        <PgBtn
          disabled={page >= totalPages - 1}
          onClick={() => setPage(page + 1)}
          isDark={isDark}
          label={
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          }
        />
        {/* Last */}
        <PgBtn
          disabled={page >= totalPages - 1}
          onClick={() => setPage(totalPages - 1)}
          isDark={isDark}
          label={
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="13 17 18 12 13 7" />
              <polyline points="6 17 11 12 6 7" />
            </svg>
          }
        />
      </div>
    </div>
  );
}

function PgBtn({
  disabled,
  onClick,
  label,
  isDark = false,
}: {
  disabled: boolean;
  onClick: () => void;
  label: ReactNode;
  isDark?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        border: `1px solid ${isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.06)"}`,
        background: disabled ? (isDark ? "rgba(255,255,255,.02)" : "rgba(0,0,0,.02)") : (isDark ? "rgba(30,41,59,0.5)" : "#fff"),
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.35 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all .15s",
        color: isDark ? "#cbd5e1" : "#374151",
      }}
    >
      {label}
    </button>
  );
}

function getVisiblePages(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const pages: number[] = [];
  pages.push(0);
  if (current > 2) pages.push(-1);
  for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 3) pages.push(-1);
  pages.push(total - 1);
  return pages;
}
