"use client";

import { useEffect, useState } from "react";
import { dashBoardService } from "../../../lib/services/dashBoardService";
import { useProvince } from "../../context/ProvinceContext";
import { useTablePagination, TablePagination } from "../../components/TablePagination";

import { AtRiskStudent } from "../../../lib/types/dashboardTypes";

const YEAR_OPTIONS = [2564, 2565, 2566, 2567];

type RiskLevel = "สูง" | "กลาง" | "เฝ้าระวัง";
const RISK_MAP: Record<RiskLevel, { cls: string; color: string }> = {
  สูง: { cls: "dashboard-badge dashboard-b-rose", color: "var(--rose)" },
  กลาง: { cls: "dashboard-badge dashboard-b-amber", color: "var(--amber)" },
  เฝ้าระวัง: { cls: "dashboard-badge dashboard-b-sky", color: "var(--sky)" },
};

function handleCreateCase(studentName: string) {
  window.alert(`สร้างเคสติดตามสำหรับ ${studentName} แล้ว`);
}

export default function AtRiskStudentsPage() {
  const { selectedProvince, selectedYear, selectedSemester, setSelectedYear, setSelectedSemester } = useProvince();
  const [dataList, setDataList] = useState<AtRiskStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);
      try {
        const list = await dashBoardService.getRiskStudentsFlat({ 
          academicYear: selectedYear,
          semester: selectedSemester
        });
        const mappedList: AtRiskStudent[] = list.map((item) => {
          const rkLevel: AtRiskStudent["riskLevel"] =
            item.riskLevel === 'high' ? "สูง" :
            item.riskLevel === 'medium' ? "กลาง" : "เฝ้าระวัง";

          const absencePattern = item.unexcusedDays > 0 && item.excusedDays > 0
            ? `ขาดไม่ลา ${item.unexcusedDays} วัน / ลา ${item.excusedDays} วัน`
            : item.unexcusedDays > 0
              ? `ขาดไม่ลา ${item.unexcusedDays} วัน`
              : `ลา ${item.excusedDays} วัน`;

          return {
            studentId: String(item.studentId || "-"),
            name: `${item.firstName || ""} ${item.lastName || ""}`.trim() || "-",
            school: item.department || "-",
            grade: item.gradeLevel || "-",
            province: "-",
            riskLevel: rkLevel,
            absenceDays: Number(item.totalAbsentDays) || 0,
            absencePattern,
            latestAction: rkLevel === "สูง" ? "รอดำเนินการ" : "-",
          };
        });
        setDataList(mappedList);
      } catch (e) {
        console.error("Failed to fetch risk list: ", e);
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, [selectedYear, selectedSemester]);

  const fAtRisk = selectedProvince === "all" ? dataList : dataList.filter(s => s.province === selectedProvince);

  const total = fAtRisk.length;
  const high = fAtRisk.filter(
    (s: AtRiskStudent) => s.riskLevel === "สูง",
  ).length;
  const medium = fAtRisk.filter(
    (s: AtRiskStudent) => s.riskLevel === "กลาง",
  ).length;
  const watch = fAtRisk.filter(
    (s: AtRiskStudent) => s.riskLevel === "เฝ้าระวัง",
  ).length;
  return (
    <div className="dashboard-main">
      <div className="dashboard-page active">


        {/* Top Header Section */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div className="dashboard-sec-title">จัดการข้อมูลนักเรียนเสี่ยงหลุดออกจากระบบ</div>
            <div className="dashboard-sec-sub">ข้อมูลประจำปีการศึกษา {selectedYear} | ภาคเรียน {selectedSemester} | สรุปผลจากโมดูลจัดเก็บระบบ Risk</div>
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
          {/* <button className="btn btn-ghost" style={{ borderColor: "var(--dashboard-pager-border)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            Export CSV
          </button> */}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0', color: 'var(--text-m)' }}>กำลังโหลดข้อมูล...</div>
        ) : (
          <>
            {/* ── Stat Cards ── */}
      <div className="dashboard-bento" style={{ marginBottom: "14px" }}>
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
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="dashboard-kpi-num" style={{ color: "var(--amber)" }}>
            {total}
          </div>
          <div className="dashboard-kpi-lbl">นักเรียนเสี่ยงทั้งหมด</div>
          <span className="dashboard-kpi-trend dashboard-t-up">
            
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
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="dashboard-kpi-num" style={{ color: "var(--rose)" }}>
            {high}
          </div>
          <div className="dashboard-kpi-lbl">เสี่ยงสูง</div>
          <span className="dashboard-kpi-trend dashboard-t-up">
            ต้องเปิดเคสด่วน
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
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="dashboard-kpi-num" style={{ color: "var(--amber)" }}>
            {medium}
          </div>
          <div className="dashboard-kpi-lbl">เสี่ยงกลาง</div>
          <span className="dashboard-kpi-trend dashboard-t-flat">
            ≈ ติดตามต่อเนื่อง
          </span>
        </div>
        <div className="dashboard-card dashboard-kpi-card">
          <div
            className="dashboard-kpi-icon"
            style={{
              background: "rgba(40,128,208,.10)",
              border: "1px solid rgba(40,128,208,.18)",
              color: "var(--sky)",
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
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div className="dashboard-kpi-num" style={{ color: "var(--sky)" }}>
            {watch}
          </div>
          <div className="dashboard-kpi-lbl">เฝ้าระวัง</div>
          <span className="dashboard-kpi-trend dashboard-t-down">
            ▼ ระดับต่ำ
          </span>
        </div>
      </div>

            {/* ── Redesigned: Risk Donut + Paginated Urgent Cases ── */}
            <AtRiskMiddle data={fAtRisk} high={high} medium={medium} watch={watch} />

            {/* ── Full Table ── */}
            <AtRiskTable data={fAtRisk} />
          </>
        )}
      </div>
    </div>
  );
}

const PER_PAGE = 8;
function AtRiskTable({ data }: { data: AtRiskStudent[] }) {
  const { page, totalPages, pageData, setPage } = useTablePagination(data, PER_PAGE);
  return (
    <div className="dashboard-card dashboard-b4" style={{ marginBottom: "14px" }}>
      <div className="dashboard-sec-hdr" style={{ marginBottom: 14 }}>
        <div>
          <div className="dashboard-sec-title">รายชื่อนักเรียนกลุ่มเสี่ยงทั้งหมด</div>
          <div className="dashboard-sec-sub">ตารางรายชื่อพร้อมจำนวนวันขาดและรูปแบบการขาดเรียน สามารถเปิดเคสติดตามได้ทันที</div>
        </div>
      </div>
      <div className="dashboard-ltable-wrap">
        <table className="dashboard-ltable">
          <thead>
            <tr>
              <th>นักเรียน</th>
              <th>โรงเรียน / ห้อง</th>
              <th>วันขาด</th>
              <th>รูปแบบการขาดเรียน</th>
              <th>สถานะเสี่ยง</th>
              <th>การดำเนินการล่าสุด</th>
              <th>เครื่องมือ</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((s) => {
              const rk = RISK_MAP[s.riskLevel as RiskLevel];
              const pct = Math.min(100, (s.absenceDays / 20) * 100);
              return (
                <tr key={s.studentId}>
                  <td>
                    <div className="dashboard-tc-name">{s.name}</div>
                    <div className="dashboard-tc-sub">{s.studentId}</div>
                  </td>
                  <td>
                    <div>{s.school}</div>
                    <div className="dashboard-tc-sub">ชั้น {s.grade}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: rk.color, fontSize: 15 }}>{s.absenceDays} วัน</div>
                    <div className="dashboard-rbar-wrap" style={{ marginTop: 4 }}>
                      <div className="dashboard-rbar-bg"><div className="dashboard-rbar-fill" style={{ width: `${pct}%`, background: rk.color }}></div></div>
                    </div>
                  </td>
                  <td style={{ maxWidth: "200px", whiteSpace: "normal", lineHeight: 1.5 }}>{s.absencePattern}</td>
                  <td><span className={rk.cls}>{s.riskLevel}</span></td>
                  <td style={{ maxWidth: "180px", whiteSpace: "normal", lineHeight: 1.5 }}>{s.latestAction}</td>
                  <td>
                    <button className="dashboard-abtn dashboard-abtn-navy" onClick={() => handleCreateCase(s.name)}>สร้างเคส</button>
                  </td>
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

/* ─────────── Redesigned Middle: Risk Donut + Paginated Urgent ─────────── */
function AtRiskMiddle({ data, high, medium, watch }: { data: AtRiskStudent[]; high: number; medium: number; watch: number }) {
  const total = data.length;
  const ITEMS_PER_PAGE = 3;
  const highRisk = data.filter(s => s.riskLevel === "สูง");
  const totalPages = Math.max(1, Math.ceil(highRisk.length / ITEMS_PER_PAGE));
  const [page, setPage] = useState<number>(0);
  const prev = () => setPage((p: number) => Math.max(0, p - 1));
  const next = () => setPage((p: number) => Math.min(totalPages - 1, p + 1));
  const pageItems = highRisk.slice(page * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE + ITEMS_PER_PAGE);

  const levelPriority: Record<string, number> = {
    "เสี่ยงสูง": 1,
    "เสี่ยงกลาง": 2,
    "เฝ้าระวัง": 3,
  };

  const levels = [
    { label: "เสี่ยงสูง", count: high, color: "#ef4444" },
    { label: "เสี่ยงกลาง", count: medium, color: "#f59e0b" },
    { label: "เฝ้าระวัง", count: watch, color: "#3b82f6" },
  ]
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return (levelPriority[a.label] ?? 99) - (levelPriority[b.label] ?? 99);
    })
    .map(r => ({ ...r, pct: total > 0 ? Math.round((r.count / total) * 100) : 0 }));

  const R = 40, CX = 52, CY = 52, CIRC = 2 * Math.PI * R, GAP = 3;
  let offset = CIRC / 4;
  const arcs = levels.map(seg => {
    const len = total > 0 ? (seg.count / total) * CIRC - GAP : 0;
    const dashOffset = CIRC - offset;
    offset += total > 0 ? (seg.count / total) * CIRC : 0;
    return { ...seg, len: Math.max(len, 0), dashOffset };
  });

  return (
    <div className="dashboard-bento" style={{ marginBottom: "14px", gridTemplateColumns: "1fr 1fr" }}>
      {/* LEFT: Risk Level Donut */}
      <div className="dashboard-card" style={{ background: "var(--dashboard-grad-red)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: "rgba(239,68,68,.06)", filter: "blur(18px)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(239,68,68,.10)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          </div>
          <div className="dashboard-sec-title" style={{ margin: 0 }}>สัดส่วนระดับความเสี่ยง</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ flexShrink: 0 }}>
            <svg viewBox="0 0 104 104" style={{ width: 110, height: 110 }}>
              <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--dashboard-progress-track)" strokeWidth={16} />
              {arcs.map(arc => (
                <circle key={arc.label} cx={CX} cy={CY} r={R} fill="none" stroke={arc.color} strokeWidth={16} strokeDasharray={`${arc.len} ${CIRC}`} strokeDashoffset={arc.dashOffset} strokeLinecap="butt" style={{ transition: "all .8s cubic-bezier(.4,0,.2,1)" }} />
              ))}
              <text x={CX} y={CY - 4} textAnchor="middle" fontSize={16} fontWeight={800} fill="var(--text-h, #111827)">{total}</text>
              <text x={CX} y={CY + 10} textAnchor="middle" fontSize={8} fill="var(--text-m, #6b7280)">คนเสี่ยง</text>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            {levels.map(r => (
              <div key={r.label} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 500, marginBottom: 3 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-b, #374151)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: r.color, display: "inline-block" }} />
                    {r.label}
                  </span>
                  <span style={{ color: r.color, fontWeight: 700 }}>{r.count} ({r.pct}%)</span>
                </div>
                <div style={{ height: 7, borderRadius: 4, background: "var(--dashboard-progress-track)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 4, width: `${r.pct}%`, background: `linear-gradient(90deg, ${r.color}cc, ${r.color})`, transition: "width 1s cubic-bezier(.4,0,.2,1)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Paginated High-Risk Cases */}
      <div className="dashboard-card" style={{ background: "var(--dashboard-grad-amber)", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: -25, left: -25, width: 90, height: 90, borderRadius: "50%", background: "rgba(245,158,11,.07)", filter: "blur(16px)", pointerEvents: "none" }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(245,158,11,.10)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            </div>
            <div className="dashboard-sec-title" style={{ margin: 0 }}>นักเรียนเสี่ยงสูง</div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: high > 0 ? "#ef4444" : "#94a3b8", borderRadius: 10, padding: "1px 8px", marginLeft: 4, animation: high > 0 ? "pulse-badge-risk 2s infinite" : "none" }}>{high}</span>
          </div>
          {highRisk.length > ITEMS_PER_PAGE && (
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

        {/* Case cards */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          {highRisk.length === 0 ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-m, #9ca3af)", fontSize: 13 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              ไม่มีนักเรียนเสี่ยงสูง
            </div>
          ) : (
            pageItems.map((s, idx) => (
              <div key={s.studentId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "var(--dashboard-card-soft-bg)", border: "1px solid var(--dashboard-card-soft-border)", backdropFilter: "blur(4px)", animation: `fadeSlideInRisk .35s ${idx * 60}ms both` }}>
                <div style={{ flexShrink: 0, position: "relative", width: 10, height: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", position: "absolute", top: 1, left: 1 }} />
                  <div style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid rgba(239,68,68,.3)", position: "absolute", top: -1, left: -1, animation: "ping-dot-risk 1.5s infinite" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 12.5, color: "var(--text-h, #111827)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                  <div style={{ fontSize: 10.5, color: "var(--text-m, #6b7280)", marginTop: 1 }}>{s.school} · ชั้น {s.grade}</div>
                  <div style={{ fontSize: 10, color: "var(--text-m, #9ca3af)", marginTop: 2 }}>ขาด {s.absenceDays} วัน · {s.latestAction}</div>
                </div>
                <button
                  style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 600, padding: "4px 10px", borderRadius: 6, border: "none", background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", cursor: "pointer", transition: "transform .15s, box-shadow .15s", boxShadow: "0 2px 6px rgba(239,68,68,.25)" }}
                  onMouseOver={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(239,68,68,.35)"; }}
                  onMouseOut={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 6px rgba(239,68,68,.25)"; }}
                  onClick={() => handleCreateCase(s.name)}
                >
                  สร้างเคส
                </button>
              </div>
            ))
          )}
        </div>

        {/* Pagination dots */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 12 }}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i)} style={{ width: page === i ? 18 : 7, height: 7, borderRadius: 4, border: "none", background: page === i ? "#ef4444" : "var(--dashboard-dot-inactive)", cursor: "pointer", transition: "all .3s cubic-bezier(.4,0,.2,1)" }} />
            ))}
          </div>
        )}

        <style>{`
          @keyframes fadeSlideInRisk { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes ping-dot-risk { 0% { transform: scale(1); opacity: 1; } 75% { transform: scale(1.8); opacity: 0; } 100% { transform: scale(1.8); opacity: 0; } }
          @keyframes pulse-badge-risk { 0%, 100% { opacity: 1; } 50% { opacity: .65; } }
        `}</style>
      </div>
    </div>
  );
}
