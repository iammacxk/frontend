"use client";

import { useState, useEffect, useCallback } from "react";
import { useProvince } from "../../context/ProvinceContext";
import { useTablePagination, TablePagination } from "../../components/TablePagination";
import { repeatService } from "../../../lib/services/repeatService";
import type { RepeatGradeItem } from "../../../lib/types/repeatTypes";

const YEAR_OPTIONS = [2564, 2565, 2566, 2567];

function exportCSV(data: RepeatGradeItem[]) {
  const headers = [
    "รหัสนักเรียน", "บัตรประชาชน", "ชื่อ-สกุล", "โรงเรียน",
    "ปีที่แล้ว", "ชั้นเดิม", "ปีนี้", "ชั้นปัจจุบัน", "สาขา",
  ];
  const rows = data.map((s) => [
    s.studentId ?? "-",
    s.personId ?? "-",
    s.fullName,
    s.schoolName ?? "-",
    s.previousAcademicYear,
    s.previousGradeLevelName ?? "-",
    s.academicYear,
    s.gradeLevelName ?? "-",
    s.departmentName ?? "-",
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "repeated-grade-students.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function RepeatedGradeStudentsPage() {
  const { selectedProvince, selectedYear, selectedSemester, setSelectedYear, setSelectedSemester } = useProvince();

  const [allData, setAllData] = useState<RepeatGradeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // แปลงค่ารวมภาคเรียนเป็น undefined ก่อนส่ง API
      const semesterParam = selectedSemester === "all" ? undefined : selectedSemester;
      
      // ส่ง year และ semester เข้า API
      const data = await repeatService.getAll({
        academicYear: selectedYear,
        semester: semesterParam,
      });
      setAllData(data);
    } catch {
      setError("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedSemester]); // เพิ่ม dependencies เพื่อให้ fetch ใหม่เมื่อค่าเปลี่ยน

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Filter by year and semester ──
  const filtered = allData.filter((s) => {
    // กรองซ้ำฝั่งหน้าเว็บตามภาคเรียน
    const yearMatch = !selectedYear || String(s.academicYear) === String(selectedYear);
    const semesterMatch = selectedSemester === "all" || String(s.semester) === String(selectedSemester);
    
    return yearMatch && semesterMatch;
  });

  const currentY = Number(selectedYear) || 2566;
  const prevY = currentY - 1;

  const total = filtered.length;

  // สรุปตามโรงเรียน
  const schoolMap = new Map<string, number>();
  filtered.forEach((s) => {
    const name = s.schoolName ?? "ไม่ระบุ";
    schoolMap.set(name, (schoolMap.get(name) || 0) + 1);
  });
  const schools = Array.from(schoolMap.entries())
    .map(([name, cnt]) => ({ name, cnt }))
    .sort((a, b) => b.cnt - a.cnt)
    .slice(0, 6);
  const maxCnt = schools.length > 0 ? schools[0].cnt : 1;
  const medals = ["🥇", "🥈", "🥉"];

  if (loading) {
    return (
      <div className="dashboard-main">
        <div className="dashboard-page active">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, flexDirection: "column", gap: 12 }}>
            <div style={{ width: 32, height: 32, border: "3px solid var(--brand, #4f67ff)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: 13, color: "var(--text-m)" }}>กำลังโหลดข้อมูลนักเรียนซ้ำชั้น...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-main">
        <div className="dashboard-page active">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, flexDirection: "column", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--rose, #e8457a)" }}>{error}</span>
            <button className="btn btn-navy" onClick={fetchData}>ลองใหม่</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-main">
      <div className="dashboard-page active">

        {/* Top Header Section */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div className="dashboard-sec-title">จัดการข้อมูลนักเรียนซ้ำชั้น</div>
            <div className="dashboard-sec-sub">
              ข้อมูลประจำปีการศึกษา {selectedYear} | {selectedSemester === "all" ? "รวมภาคเรียน" : `ภาคเรียน ${selectedSemester}`} | สรุปผลจากโมดูลจัดเก็บระบบ Repeater
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: "var(--text-m)", fontWeight: 500 }}>ปีการศึกษา:</span>
              <select className="dashboard-lselect" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ minWidth: 130 }}>
                {YEAR_OPTIONS.map((year) => <option key={year} value={String(year)}>{year}</option>)}
              </select>
              
              <span style={{ fontSize: 13, color: "var(--text-m)", fontWeight: 500 }}>ภาคเรียน:</span>
              <select 
                className="dashboard-lselect" 
                value={selectedSemester} 
                onChange={(e) => setSelectedSemester(e.target.value)} 
                style={{ minWidth: 140 }}
              >
                <option value="all">ทั้งหมด</option>
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </div>
          </div>
          {/* <button className="btn btn-ghost" onClick={() => exportCSV(filtered)} style={{ alignSelf: "flex-start", marginTop: 4 }}>
            <span className="btn-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </span>{" "}
            Export CSV
          </button> */}
        </div>

        {/* ── Stat Cards ── */}
        <div className="dashboard-bento" style={{ marginBottom: "14px" }}>
          <div className="dashboard-card dashboard-kpi-card">
            <div className="dashboard-kpi-icon" style={{ background: "rgba(224,112,48,.10)", border: "1px solid rgba(224,112,48,.18)", color: "var(--peach)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
            </div>
            <div className="dashboard-kpi-num" style={{ color: "var(--peach)" }}>{total}</div>
            <div className="dashboard-kpi-lbl">รายการทั้งหมด</div>
            <span className="dashboard-kpi-trend dashboard-t-flat">ปีการศึกษา {selectedYear}</span>
          </div>

          <div className="dashboard-card dashboard-kpi-card">
            <div className="dashboard-kpi-icon" style={{ background: "rgba(232,69,122,.10)", border: "1px solid rgba(232,69,122,.18)", color: "var(--rose)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div className="dashboard-kpi-num" style={{ color: "var(--rose)" }}>{schools.length}</div>
            <div className="dashboard-kpi-lbl">โรงเรียนที่มีซ้ำชั้น</div>
            <span className="dashboard-kpi-trend dashboard-t-flat">≈ ตรวจสอบรายโรงเรียน</span>
          </div>

          <div className="dashboard-card dashboard-kpi-card">
            <div className="dashboard-kpi-icon" style={{ background: "rgba(217,119,6,.10)", border: "1px solid rgba(217,119,6,.18)", color: "var(--amber)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="dashboard-kpi-num" style={{ color: "var(--amber)" }}>{allData.length}</div>
            <div className="dashboard-kpi-lbl">ซ้ำชั้น (ทุกปี)</div>
            <span className="dashboard-kpi-trend dashboard-t-flat">≈ ข้อมูลสะสมทั้งหมด</span>
          </div>

          <div className="dashboard-card dashboard-kpi-card">
            <div className="dashboard-kpi-icon" style={{ background: "rgba(124,58,237,.10)", border: "1px solid rgba(124,58,237,.18)", color: "var(--violet)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
              </svg>
            </div>
            <div className="dashboard-kpi-num" style={{ color: "var(--violet)" }}>
              {filtered.filter(s => s.gradeLevelName?.includes("ม.")).length}
            </div>
            <div className="dashboard-kpi-lbl">ระดับมัธยม</div>
            <span className="dashboard-kpi-trend dashboard-t-flat">
              ประถม {filtered.filter(s => s.gradeLevelName?.includes("ป.")).length} คน
            </span>
          </div>
        </div>

        {/* ── Charts Row ── */}
        <div className="dashboard-bento" style={{ marginBottom: "14px", gridTemplateColumns: "1fr 1fr" }}>
          {/* Grade Level Distribution */}
          <GradeLevelCard data={filtered} />
          {/* School Ranking */}
          <div className="dashboard-card" style={{ background: "var(--dashboard-grad-violet)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", bottom: -25, left: -25, width: 90, height: 90, borderRadius: "50%", background: "rgba(124,58,237,.06)", filter: "blur(16px)", pointerEvents: "none" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(124,58,237,.10)", display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div className="dashboard-sec-title" style={{ margin: 0 }}>โรงเรียนที่มีนักเรียนซ้ำชั้นสูงสุด</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {schools.map((s, i) => (
                <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 22, fontSize: 14, textAlign: "center", flexShrink: 0 }}>
                    {i < 3 ? medals[i] : <span style={{ color: "var(--text-m, #9ca3af)", fontSize: 11, fontWeight: 600 }}>{i + 1}</span>}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-h, #374151)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>{s.name}</div>
                    <div style={{ height: 6, borderRadius: 3, background: "var(--dashboard-progress-track)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 3, width: `${(s.cnt / maxCnt) * 100}%`, background: i === 0 ? "linear-gradient(90deg, #e07030, #f97316)" : i === 1 ? "linear-gradient(90deg, #8b5cf6, #a78bfa)" : "linear-gradient(90deg, #94a3b8, #cbd5e1)", transition: "width 1s cubic-bezier(.4,0,.2,1)" }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? "#e07030" : i === 1 ? "#8b5cf6" : "#64748b", minWidth: 24, textAlign: "right" }}>{s.cnt}</span>
                </div>
              ))}
              {schools.length === 0 && <div style={{ color: "var(--text-m, #9ca3af)", textAlign: "center", fontSize: 12, padding: 16 }}>ไม่มีข้อมูล</div>}
            </div>
          </div>
        </div>

        <RepeaterTable data={filtered} currentYear={currentY} previousYear={prevY} />
      </div>
    </div>
  );
}

// ── Grade Level Donut Card ──
function GradeLevelCard({ data }: { data: RepeatGradeItem[] }) {
  const gradeMap = new Map<string, number>();
  data.forEach(s => {
    const g = s.gradeLevelName ?? "ไม่ระบุ";
    gradeMap.set(g, (gradeMap.get(g) || 0) + 1);
  });
  const total = data.length;

  // Group into primary / secondary / other
  const primary = data.filter(s => s.gradeLevelName?.includes("ป.")).length;
  const secondary = data.filter(s => s.gradeLevelName?.includes("ม.")).length;
  const other = total - primary - secondary;

  const segments = [
    { label: "ระดับประถม (ป.1–6)", count: primary, color: "#ef4444" },
    { label: "ระดับมัธยม (ม.1–6)", count: secondary, color: "#f97316" },
    { label: "อื่นๆ", count: other, color: "#8b5cf6" },
  ].map(r => ({ ...r, pct: total > 0 ? Math.round((r.count / total) * 100) : 0 }));

  const R = 40, CX = 52, CY = 52, CIRC = 2 * Math.PI * R, GAP = 3;
  let offset = CIRC / 4;
  const arcs = segments.map(seg => {
    const len = total > 0 ? (seg.count / total) * CIRC - GAP : 0;
    const dashOffset = CIRC - offset;
    offset += total > 0 ? (seg.count / total) * CIRC : 0;
    return { ...seg, len: Math.max(len, 0), dashOffset };
  });

  return (
    <div className="dashboard-card" style={{ background: "var(--dashboard-grad-orange)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: "rgba(224,112,48,.06)", filter: "blur(18px)", pointerEvents: "none" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(224,112,48,.10)", display: "flex", alignItems: "center", justifyContent: "center", color: "#e07030" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        </div>
        <div className="dashboard-sec-title" style={{ margin: 0 }}>สรุปตามระดับชั้น</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ flexShrink: 0 }}>
          <svg viewBox="0 0 104 104" style={{ width: 110, height: 110 }}>
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--dashboard-progress-track)" strokeWidth={16} />
            {arcs.map(arc => (
              <circle key={arc.label} cx={CX} cy={CY} r={R} fill="none" stroke={arc.color} strokeWidth={16}
                strokeDasharray={`${arc.len} ${CIRC}`} strokeDashoffset={arc.dashOffset}
                strokeLinecap="butt" style={{ transition: "all .8s cubic-bezier(.4,0,.2,1)" }} />
            ))}
            <text x={CX} y={CY - 4} textAnchor="middle" fontSize={16} fontWeight={800} fill="var(--text-h, #111827)">{total}</text>
            <text x={CX} y={CY + 10} textAnchor="middle" fontSize={8} fill="var(--text-m, #6b7280)">คนซ้ำชั้น</text>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          {segments.map(r => (
            <div key={r.label} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 500, marginBottom: 3 }}>
                <span style={{ color: "var(--text-h, #374151)" }}>{r.label}</span>
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
  );
}

// ── Data Table ──
const PER_PAGE = 8;
function RepeaterTable({ data, currentYear, previousYear }: { data: RepeatGradeItem[]; currentYear: number; previousYear: number }) {
  const { page, totalPages, pageData, setPage } = useTablePagination(data, PER_PAGE);
  return (
    <div className="dashboard-card dashboard-b4" style={{ marginBottom: "14px" }}>
      <div className="dashboard-sec-hdr" style={{ marginBottom: 14 }}>
        <div>
          <div className="dashboard-sec-title">รายชื่อนักเรียนซ้ำชั้น</div>
          <div className="dashboard-sec-sub">เทียบระดับชั้นปีที่แล้ว ({previousYear}) และปีนี้ ({currentYear}) เพื่อวางมาตรการช่วยเหลือ</div>
        </div>
      </div>
      <div className="dashboard-ltable-wrap">
        <table className="dashboard-ltable">
          <thead>
            <tr>
              <th>นักเรียน</th>
              <th>โรงเรียน / สาขา</th>
              <th>ปีที่แล้ว ({previousYear})</th>
              <th>ปีนี้ ({currentYear})</th>
              <th>เลขประจำตัวประชาชน</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((s, idx) => (
              <tr key={`${s.studentId}-${idx}`}>
                <td>
                  <div className="dashboard-tc-name">{s.fullName || "ไม่ระบุชื่อ"}</div>
                  <div className="dashboard-tc-sub">รหัส {s.studentId ?? "-"}</div>
                </td>
                <td>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-h)" }}>{s.schoolName ?? "-"}</div>
                  <div className="dashboard-tc-sub">{s.departmentName ?? "-"}</div>
                </td>
                <td>
                  <span className="dashboard-badge dashboard-b-rose" style={{ marginBottom: 2 }}>{s.previousGradeLevelName ?? "-"}</span>
                  <div className="dashboard-tc-sub">ปีการศึกษา {s.previousAcademicYear}</div>
                </td>
                <td>
                  <span className="dashboard-badge dashboard-b-sky" style={{ marginBottom: 2 }}>{s.gradeLevelName ?? "-"}</span>
                  <div className="dashboard-tc-sub">ปีการศึกษา {s.academicYear}</div>
                </td>
                <td style={{ fontSize: 12, color: "var(--text-m)" }}>{s.personId ?? "-"}</td>
              </tr>
            ))}
            {pageData.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--text-m)", padding: 24, fontSize: 13 }}>
                  ไม่พบข้อมูลนักเรียนซ้ำชั้นในปีการศึกษา {currentYear}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <TablePagination page={page} totalPages={totalPages} setPage={setPage} totalItems={data.length} perPage={PER_PAGE} />
    </div>
  );
}