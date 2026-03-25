"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ─── Mock Data ───────────────────────────────────────────
const MOCK_SUMMARY_DATA = [
  { classroom: "ม.1/1", total: 45, absent: 3, leave: 2, sick: 1, present: 39, rate: 86.7, submitted: true },
  { classroom: "ม.1/2", total: 42, absent: 1, leave: 0, sick: 2, present: 39, rate: 92.9, submitted: true },
  { classroom: "ม.1/3", total: 44, absent: 5, leave: 1, sick: 0, present: 38, rate: 86.4, submitted: true },
  { classroom: "ม.2/1", total: 40, absent: 2, leave: 3, sick: 1, present: 34, rate: 85.0, submitted: true },
  { classroom: "ม.2/2", total: 43, absent: 0, leave: 1, sick: 0, present: 42, rate: 97.7, submitted: true },
  { classroom: "ม.2/3", total: 41, absent: 4, leave: 1, sick: 2, present: 34, rate: 82.9, submitted: true },
  { classroom: "ม.3/1", total: 38, absent: 2, leave: 0, sick: 3, present: 33, rate: 86.8, submitted: false },
  { classroom: "ม.3/2", total: 40, absent: 0, leave: 0, sick: 0, present: 40, rate: 100, submitted: false },
  { classroom: "ม.3/3", total: 39, absent: 1, leave: 2, sick: 1, present: 35, rate: 89.7, submitted: false },
];

const MONTHLY_SUMMARY = [
  { month: "มิ.ย. 2567", totalAbsent: 45, totalLeave: 18, totalSick: 22, avgRate: 91.2 },
  { month: "ก.ค. 2567", totalAbsent: 52, totalLeave: 21, totalSick: 30, avgRate: 89.8 },
  { month: "ส.ค. 2567", totalAbsent: 38, totalLeave: 15, totalSick: 19, avgRate: 92.5 },
  { month: "ก.ย. 2567", totalAbsent: 41, totalLeave: 12, totalSick: 25, avgRate: 91.8 },
];

export default function AbsenceSummaryPage() {
  const pathname = usePathname();
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");

  const totalStudents = MOCK_SUMMARY_DATA.reduce((s, r) => s + r.total, 0);
  const totalAbsent = MOCK_SUMMARY_DATA.reduce((s, r) => s + r.absent, 0);
  const totalLeave = MOCK_SUMMARY_DATA.reduce((s, r) => s + r.leave, 0);
  const totalSick = MOCK_SUMMARY_DATA.reduce((s, r) => s + r.sick, 0);
  const submittedCount = MOCK_SUMMARY_DATA.filter(r => r.submitted).length;

  const tabs = [
    { href: "/absence-submission", label: "ส่งข้อมูลคนที่ขาด", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /><line x1="17" y1="8" x2="23" y2="8" /></svg> },
    { href: "/absence-submission/summary", label: "สรุปการขาดเรียน", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 118 2.83" /><path d="M22 12A10 10 0 0012 2v10z" /></svg> },
  ];

  return (
    <div className="abs-page">
      <div className="abs-tabs">
        {tabs.map((tab) => (
          <Link key={tab.href} href={tab.href} className={`abs-tab${pathname === tab.href ? " active" : ""}`}>
            {tab.icon} {tab.label}
          </Link>
        ))}
      </div>

      {/* Stat overview */}
      <div className="abs-stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
        <div className="abs-stat-card"><div className="abs-stat-num" style={{ color: "var(--abs-blue)" }}>{totalStudents}</div><div className="abs-stat-lbl">นักเรียนทั้งหมด</div></div>
        <div className="abs-stat-card"><div className="abs-stat-num" style={{ color: "var(--abs-red)" }}>{totalAbsent}</div><div className="abs-stat-lbl">ขาดเรียน</div></div>
        <div className="abs-stat-card"><div className="abs-stat-num" style={{ color: "var(--abs-cyan)" }}>{totalLeave}</div><div className="abs-stat-lbl">ลา</div></div>
        <div className="abs-stat-card"><div className="abs-stat-num" style={{ color: "var(--abs-amber)" }}>{totalSick}</div><div className="abs-stat-lbl">ป่วย</div></div>
        <div className="abs-stat-card"><div className="abs-stat-num" style={{ color: "var(--abs-green)" }}>{submittedCount}/{MOCK_SUMMARY_DATA.length}</div><div className="abs-stat-lbl">ห้องที่ส่งแล้ว</div></div>
      </div>

      <div className="abs-two-col">
        <div className="abs-main-col">
          {/* Filters */}
          <div className="abs-card">
            <div className="abs-card-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--abs-blue)" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
              ตัวกรอง
            </div>
            <div className="abs-form-grid">
              <div className="abs-form-group"><label className="abs-form-label">ระดับชั้น</label>
                <select className="abs-form-select" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
                  <option value="all">ทุกระดับ</option><option value="ม.1">ม.1</option><option value="ม.2">ม.2</option><option value="ม.3">ม.3</option>
                </select>
              </div>
              <div className="abs-form-group"><label className="abs-form-label">เดือน</label>
                <select className="abs-form-select" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
                  <option value="all">ทุกเดือน</option><option value="มิ.ย.">มิถุนายน</option><option value="ก.ค.">กรกฎาคม</option><option value="ส.ค.">สิงหาคม</option><option value="ก.ย.">กันยายน</option>
                </select>
              </div>
              <div className="abs-form-group"><label className="abs-form-label">วันที่เริ่มต้น</label><input type="date" className="abs-form-input" defaultValue="2567-06-01" /></div>
              <div className="abs-form-group"><label className="abs-form-label">วันที่สิ้นสุด</label><input type="date" className="abs-form-input" defaultValue="2567-09-30" /></div>
            </div>
          </div>

          {/* Per-room table */}
          <div className="abs-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px 12px" }}>
              <div className="abs-card-title" style={{ margin: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--abs-blue)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
                สรุปรายห้อง
              </div>
            </div>
            <div className="abs-table-wrap" style={{ borderRadius: 0, boxShadow: "none", border: "none" }}>
              <table className="abs-table">
                <thead><tr><th>ห้อง</th><th>นักเรียนทั้งหมด</th><th>ขาด</th><th>ลา</th><th>ป่วย</th><th>มาเรียน</th><th>อัตรามาเรียน</th><th>สถานะการส่ง</th></tr></thead>
                <tbody>
                  {MOCK_SUMMARY_DATA.filter(r => filterLevel === "all" || r.classroom.startsWith(filterLevel)).map((r) => (
                    <tr key={r.classroom}>
                      <td style={{ fontWeight: 700 }}>{r.classroom}</td>
                      <td>{r.total}</td>
                      <td style={{ color: r.absent > 3 ? "var(--abs-red)" : "var(--abs-text-h)", fontWeight: r.absent > 3 ? 700 : 400 }}>{r.absent}</td>
                      <td>{r.leave}</td><td>{r.sick}</td><td>{r.present}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="abs-completion-bar" style={{ width: 80 }}><div className={`abs-completion-fill ${r.rate >= 90 ? "green" : r.rate >= 80 ? "amber" : "red"}`} style={{ width: `${r.rate}%` }} /></div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: r.rate >= 90 ? "var(--abs-green)" : r.rate >= 80 ? "var(--abs-amber)" : "var(--abs-red)" }}>{r.rate.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td>{r.submitted ? <span className="abs-badge abs-badge-valid">ส่งแล้ว</span> : <span className="abs-badge abs-badge-warning">ยังไม่ส่ง</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly trend */}
          <div className="abs-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px 12px" }}>
              <div className="abs-card-title" style={{ margin: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--abs-purple)" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                แนวโน้มรายเดือน
              </div>
            </div>
            <div className="abs-table-wrap" style={{ borderRadius: 0, boxShadow: "none", border: "none" }}>
              <table className="abs-table">
                <thead><tr><th>เดือน</th><th>ขาดเรียน</th><th>ลา</th><th>ป่วย</th><th>อัตรามาเรียนเฉลี่ย</th></tr></thead>
                <tbody>
                  {MONTHLY_SUMMARY.map((m) => (
                    <tr key={m.month}>
                      <td style={{ fontWeight: 700 }}>{m.month}</td>
                      <td style={{ color: "var(--abs-red)", fontWeight: 600 }}>{m.totalAbsent}</td>
                      <td>{m.totalLeave}</td><td>{m.totalSick}</td>
                      <td><span style={{ fontWeight: 700, color: m.avgRate >= 90 ? "var(--abs-green)" : "var(--abs-amber)" }}>{m.avgRate.toFixed(1)}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="abs-side-col">
          <div className="abs-card">
            <div className="abs-info-title" style={{ marginBottom: 12, fontSize: 13, color: "var(--abs-text-h)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--abs-amber)" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              สถานะความครบถ้วน
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span style={{ color: "var(--abs-text-m)" }}>ห้องที่ส่งแล้ว</span><span style={{ fontWeight: 700, color: "var(--abs-green)" }}>{submittedCount} ห้อง</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span style={{ color: "var(--abs-text-m)" }}>ยังไม่ส่ง</span><span style={{ fontWeight: 700, color: "var(--abs-red)" }}>{MOCK_SUMMARY_DATA.length - submittedCount} ห้อง</span></div>
              <div className="abs-completion-bar" style={{ height: 10 }}><div className="abs-completion-fill green" style={{ width: `${(submittedCount / MOCK_SUMMARY_DATA.length) * 100}%` }} /></div>
              <div style={{ fontSize: 11, color: "var(--abs-text-m)", textAlign: "center" }}>{((submittedCount / MOCK_SUMMARY_DATA.length) * 100).toFixed(0)}% ครบถ้วน</div>
            </div>
            <div className="abs-divider" />
            <div className="abs-info-title" style={{ marginBottom: 10, fontSize: 12, color: "var(--abs-text-h)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              ห้องที่ยังไม่ส่ง
            </div>
            {MOCK_SUMMARY_DATA.filter(r => !r.submitted).map(r => (
              <div key={r.classroom} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(0,0,0,.04)", fontSize: 12 }}>
                <span style={{ fontWeight: 600 }}>{r.classroom}</span>
                <span className="abs-badge abs-badge-warning" style={{ fontSize: 10 }}>รอส่ง</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
