"use client";

import { useState } from "react";
import Link from "next/link";
import { useProvince } from "../../context/ProvinceContext";
import { useTablePagination, TablePagination } from "../../components/TablePagination";
import { CompletenessItem } from "../../../lib/types/dashboardTypes";

const YEAR_OPTIONS = [2564, 2565, 2566, 2567];


const completenessItems: CompletenessItem[] = [];

type CompStatus = "incomplete" | "grace" | "complete";
const STATUS_MAP: Record<
  CompStatus,
  { cls: string; lbl: string; alertCls: string }
> = {
  incomplete: {
    cls: "dashboard-badge dashboard-b-rose",
    lbl: "ข้อมูลยังไม่ครบ",
    alertCls: "dashboard-a-danger",
  },
  grace: {
    cls: "dashboard-badge dashboard-b-amber",
    lbl: "อยู่ในช่วงผ่อนผัน",
    alertCls: "dashboard-a-warn",
  },
  complete: {
    cls: "dashboard-badge dashboard-b-mint",
    lbl: "ข้อมูลครบถ้วน",
    alertCls: "",
  },
};

const STATUS_PRIORITY: Record<CompStatus, number> = {
  incomplete: 1,
  grace: 2,
  complete: 3,
};

export default function DataCompletenessPage() {
  const { selectedProvince, selectedYear, selectedSemester, setSelectedYear, setSelectedSemester } = useProvince();
  let fComplete = selectedProvince === "all" ? completenessItems : completenessItems.filter(s => s.province === selectedProvince);
  fComplete = [...fComplete].sort((a, b) => {
    const prioA = STATUS_PRIORITY[a.status as CompStatus] || 99;
    const prioB = STATUS_PRIORITY[b.status as CompStatus] || 99;
    return prioA - prioB;
  });

  const total = fComplete.length;
  const incomplete = fComplete.filter(
    (i: CompletenessItem) => i.status === "incomplete",
  ).length;
  const grace = fComplete.filter(
    (i: CompletenessItem) => i.status === "grace",
  ).length;
  const complete = fComplete.filter(
    (i: CompletenessItem) => i.status === "complete",
  ).length;
  const issues = fComplete.filter(
    (i: CompletenessItem) => i.status !== "complete",
  );

  const completePct = total > 0 ? Math.round((complete / total) * 100) : 0;

  return (
    <div className="dashboard-main">
      <div className="dashboard-page active">

      {/* Top Header Section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div className="dashboard-sec-title">ตรวจความครบถ้วนข้อมูลรายโรงเรียน</div>
          <div className="dashboard-sec-sub">ข้อมูลประจำปีการศึกษา {selectedYear} | ภาคเรียน {selectedSemester} | สรุปผลจากโมดูลจัดเก็บระบบ Data Completeness</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "var(--text-m)", fontWeight: 500 }}>ปีการศึกษา:</span>
            <select className="dashboard-lselect" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ minWidth: 130 }}>
              {YEAR_OPTIONS.map((year) => <option key={year} value={String(year)}>{year}</option>)}
            </select>
            <span style={{ fontSize: 13, color: "var(--text-m)", fontWeight: 500 }}>ภาคเรียน:</span>
            <select className="dashboard-lselect" value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} style={{ minWidth: 110 }}>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </div>
        </div>
      </div>


      {/* ── Stat Cards ── */}
      <div className="dashboard-bento" style={{ marginBottom: "14px" }}>
        <div className="dashboard-card dashboard-kpi-card">
          <div
            className="dashboard-kpi-icon"
            style={{
              background: "rgba(124,58,237,.10)",
              border: "1px solid rgba(124,58,237,.18)",
              color: "var(--violet)",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div className="dashboard-kpi-num" style={{ color: "var(--violet)" }}>
            {total}
          </div>
          <div className="dashboard-kpi-lbl">โรงเรียนทั้งหมด</div>
          <span className="dashboard-kpi-trend dashboard-t-flat">
            ≈ รอบเดือนนี้
          </span>
        </div>
        <div className="dashboard-card dashboard-kpi-card">
          <div
            className="dashboard-kpi-icon"
            style={{
              background: "rgba(232,69,122,.10)",
              border: "1px solid rgba(232,69,122,.18)",
              color: "var(--rose)",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div className="dashboard-kpi-num" style={{ color: "var(--rose)" }}>
            {incomplete}
          </div>
          <div className="dashboard-kpi-lbl">ข้อมูลยังไม่ครบ</div>
          <span className="dashboard-kpi-trend dashboard-t-up">
            ต้องติดตามด่วน
          </span>
        </div>
        <div className="dashboard-card dashboard-kpi-card">
          <div
            className="dashboard-kpi-icon"
            style={{
              background: "rgba(217,119,6,.10)",
              border: "1px solid rgba(217,119,6,.18)",
              color: "var(--amber)",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="dashboard-kpi-num" style={{ color: "var(--amber)" }}>
            {grace}
          </div>
          <div className="dashboard-kpi-lbl">อยู่ในช่วงผ่อนผัน</div>
          <span className="dashboard-kpi-trend dashboard-t-flat">
            ≈ ยังไม่ผิด SLA
          </span>
        </div>
        <div className="dashboard-card dashboard-kpi-card">
          <div
            className="dashboard-kpi-icon"
            style={{
              background: "rgba(26,170,136,.10)",
              border: "1px solid rgba(26,170,136,.18)",
              color: "var(--mint)",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="dashboard-kpi-num" style={{ color: "var(--mint)" }}>
            {complete}
          </div>
          <div className="dashboard-kpi-lbl">ข้อมูลครบถ้วน</div>
          <span className="dashboard-kpi-trend dashboard-t-down">
            ▼ ผ่าน validation แล้ว
          </span>
        </div>
      </div>

      {/* ── Redesigned: Completion Gauge + Paginated Issues ── */}
      <CompletenessMiddle issues={issues} complete={complete} total={total} completePct={completePct} />

      {/* ── Full Table ── */}
      <CompletenessTable data={fComplete} />
    </div>
  </div>
);
}

const PER_PAGE = 8;
function CompletenessTable({ data }: { data: CompletenessItem[] }) {
  const { page, totalPages, pageData, setPage } = useTablePagination(data, PER_PAGE);
  return (
    <div className="dashboard-card dashboard-b4" style={{ marginBottom: "14px" }}>
      <div className="dashboard-sec-hdr" style={{ marginBottom: 14 }}>
        <div>
          <div className="dashboard-sec-title">ตารางสถานะทุกโรงเรียน</div>
          <div className="dashboard-sec-sub">ตรวจความครบถ้วนของข้อมูลรายจังหวัด รายอำเภอ และรายโรงเรียน พร้อมสถานะการผ่อนผัน</div>
        </div>
      </div>
      <div className="dashboard-ltable-wrap">
        <table className="dashboard-ltable">
          <thead>
            <tr>
              <th>จังหวัด / อำเภอ</th>
              <th>โรงเรียน</th>
              <th>รอบข้อมูล</th>
              <th>ข้อมูลที่ขาด</th>
              <th>ครบกำหนด</th>
              <th>สถานะ</th>
              <th>หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((item) => {
              const st = STATUS_MAP[item.status as CompStatus];
              return (
                <tr key={`${item.province}-${item.school}-${item.submissionRound}`}>
                  <td>
                    <div className="dashboard-tc-name">{item.province}</div>
                    <div className="dashboard-tc-sub">{item.district}</div>
                  </td>
                  <td>{item.school}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{item.submissionRound}</td>
                  <td style={{ maxWidth: "200px", whiteSpace: "normal", lineHeight: 1.5 }}>{item.missingFields}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{item.dueDate}</td>
                  <td><span className={st.cls}>{st.lbl}</span></td>
                  <td style={{ maxWidth: "180px", whiteSpace: "normal", lineHeight: 1.5 }}>{item.note}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <TablePagination page={page} totalPages={totalPages} setPage={setPage} totalItems={data.length} perPage={PER_PAGE} />
    </div>
  );
}

/* ─────────── Redesigned Middle: Completion Gauge + Paginated Issues ─────────── */
function CompletenessMiddle({ issues, complete, total, completePct }: { issues: CompletenessItem[]; complete: number; total: number; completePct: number }) {
  const ITEMS_PER_PAGE = 3;
  const totalPages = Math.max(1, Math.ceil(issues.length / ITEMS_PER_PAGE));
  const [page, setPage] = useState(0);
  const prev = () => setPage(p => Math.max(0, p - 1));
  const next = () => setPage(p => Math.min(totalPages - 1, p + 1));
  const pageItems = issues.slice(page * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE + ITEMS_PER_PAGE);

  const R = 44, CX = 60, CY = 60, CIRC = 2 * Math.PI * R;

  return (
    <div className="dashboard-bento" style={{ marginBottom: "14px", gridTemplateColumns: "1fr 2fr" }}>
      {/* LEFT: Completion Gauge */}
      <div className="dashboard-card" style={{ background: "var(--dashboard-grad-green)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: "rgba(26,170,136,.06)", filter: "blur(18px)", pointerEvents: "none" }} />
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-h, #374151)" }}>อัตราความครบถ้วน</div>
        <div style={{ position: "relative", width: 130, height: 130 }}>
          <svg viewBox="0 0 120 120" style={{ width: 130, height: 130, transform: "rotate(-90deg)" }}>
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--dashboard-progress-track)" strokeWidth={14} />
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="url(#mintGradComp)" strokeWidth={14} strokeDasharray={CIRC} strokeDashoffset={CIRC - (completePct / 100) * CIRC} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)" }} />
            <defs>
              <linearGradient id="mintGradComp" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1aaa88" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
          </svg>
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#1aaa88" }}>{completePct}%</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-m, #6b7280)", marginTop: -2 }}>COMPLETE</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 15, fontSize: 11, fontWeight: 600, color: "var(--text-m, #6b7280)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#1aaa88" }} /> ครบ: {complete}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f43f5e" }} /> ขาด: {total - complete}</div>
        </div>
      </div>

      {/* RIGHT: Units with Issues */}
      <div className="dashboard-card" style={{ background: "var(--dashboard-grad-pink)", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: -25, left: -25, width: 90, height: 90, borderRadius: "50%", background: "rgba(244,63,94,.05)", filter: "blur(16px)", pointerEvents: "none" }} />
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(244,63,94,.10)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f43f5e" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            </div>
            <div className="dashboard-sec-title" style={{ margin: 0 }}>หน่วยงานที่มีประเด็น</div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: issues.length > 0 ? "#f43f5e" : "#94a3b8", borderRadius: 10, padding: "1px 8px", marginLeft: 4 }}>{issues.length}</span>
          </div>
          {issues.length > ITEMS_PER_PAGE && (
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <button onClick={prev} disabled={page === 0} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--dashboard-pager-border)", background: page === 0 ? "var(--dashboard-pager-bg-disabled)" : "var(--dashboard-pager-bg)", cursor: page === 0 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: page === 0 ? 0.35 : 1, transition: "all .15s" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <span style={{ fontSize: 10.5, color: "var(--text-m, #9ca3af)", fontWeight: 600, minWidth: 36, textAlign: "center" }}>{page + 1}/{totalPages}</span>
              <button onClick={next} disabled={page >= totalPages - 1} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--dashboard-pager-border)", background: page >= totalPages - 1 ? "var(--dashboard-pager-bg-disabled)" : "var(--dashboard-pager-bg)", cursor: page >= totalPages - 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: page >= totalPages - 1 ? 0.35 : 1, transition: "all .15s" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          )}
        </div>

        {/* Issue cards */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          {issues.length === 0 ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-m, #9ca3af)", fontSize: 13 }}>
              ทุกหน่วยงานส่งข้อมูลครบถ้วนแล้ว
            </div>
          ) : (
            pageItems.map((item, idx) => {
              const isInc = item.status === "incomplete";
              return (
                <div key={`${item.province}-${item.school}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "var(--dashboard-card-soft-bg)", border: "1px solid var(--dashboard-card-soft-border)", backdropFilter: "blur(4px)", animation: `fadeSlideInComp .35s ${idx * 60}ms both` }}>
                  <div style={{ flexShrink: 0, position: "relative", width: 10, height: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: isInc ? "#f43f5e" : "#f59e0b", position: "absolute", top: 1, left: 1 }} />
                    {isInc && <div style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid rgba(244,63,94,.3)", position: "absolute", top: -1, left: -1, animation: "ping-dot-comp 1.5s infinite" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: "var(--text-h, #111827)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.school}</div>
                    <div style={{ fontSize: 10, color: "var(--text-m, #6b7280)", marginTop: 1 }}>{item.province} · {item.district}</div>
                    <div style={{ fontSize: 9.5, color: isInc ? "#f43f5e" : "#b45309", fontWeight: 600, marginTop: 2 }}>{item.missingFields}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: isInc ? "#f43f5e" : "#b45309" }}>{isInc ? "ขาดข้อมูล" : "ผ่อนผัน"}</div>
                    <div style={{ fontSize: 9, color: "var(--text-m, #9ca3af)" }}>Due: {item.dueDate}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination dots */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 12 }}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i)} style={{ width: page === i ? 18 : 7, height: 7, borderRadius: 4, border: "none", background: page === i ? "#f43f5e" : "var(--dashboard-dot-inactive)", cursor: "pointer", transition: "all .3s cubic-bezier(.4,0,.2,1)" }} />
            ))}
          </div>
        )}

        <style>{`
          @keyframes fadeSlideInComp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes ping-dot-comp { 0% { transform: scale(1); opacity: 1; } 75% { transform: scale(1.8); opacity: 0; } 100% { transform: scale(1.8); opacity: 0; } }
        `}</style>
      </div>
    </div>
  );
}
