"use client";
import React from "react";

const MOCK_ATTENDANCE = [
  { month: "มิ.ย. 2567", absent: 2, leave: 1, sick: 0, totalDays: 22, rate: 86.4 },
  { month: "ก.ค. 2567", absent: 3, leave: 0, sick: 1, totalDays: 23, rate: 82.6 },
  { month: "ส.ค. 2567", absent: 1, leave: 1, sick: 2, totalDays: 22, rate: 81.8 },
  { month: "ก.ย. 2567", absent: 5, leave: 0, sick: 1, totalDays: 21, rate: 71.4 },
];

export default function AttendanceHistoryPage() {
  const totalAbsent = MOCK_ATTENDANCE.reduce((s, r) => s + r.absent, 0);
  const totalLeave = MOCK_ATTENDANCE.reduce((s, r) => s + r.leave, 0);
  const totalSick = MOCK_ATTENDANCE.reduce((s, r) => s + r.sick, 0);
  const avgRate = MOCK_ATTENDANCE.reduce((s, r) => s + r.rate, 0) / MOCK_ATTENDANCE.length;

  return (
    <div className="sp-page">
      <div className="sp-stat-grid">
        <div className="sp-stat-card"><div className="sp-stat-num" style={{ color: "var(--sp-red)" }}>{totalAbsent}</div><div className="sp-stat-lbl">ขาดเรียนรวม</div></div>
        <div className="sp-stat-card"><div className="sp-stat-num" style={{ color: "var(--sp-blue)" }}>{totalLeave}</div><div className="sp-stat-lbl">ลารวม</div></div>
        <div className="sp-stat-card"><div className="sp-stat-num" style={{ color: "var(--sp-amber)" }}>{totalSick}</div><div className="sp-stat-lbl">ป่วยรวม</div></div>
        <div className="sp-stat-card"><div className="sp-stat-num" style={{ color: avgRate >= 85 ? "var(--sp-green)" : "var(--sp-amber)" }}>{avgRate.toFixed(1)}%</div><div className="sp-stat-lbl">อัตรามาเรียนเฉลี่ย</div></div>
      </div>
      <div className="sp-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px 12px" }}><div className="sp-card-title" style={{ margin: 0 }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--sp-blue)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> สถิติการขาดเรียนรายเดือน (ภาคเรียนที่ 1/2567)</div></div>
        <div className="sp-table-wrap" style={{ borderRadius: 0, boxShadow: "none", border: "none" }}>
          <table className="sp-table">
            <thead><tr><th>เดือน</th><th>ขาด</th><th>ลา</th><th>ป่วย</th><th>วันเรียนทั้งหมด</th><th>อัตรามาเรียน</th></tr></thead>
            <tbody>{MOCK_ATTENDANCE.map((r) => (<tr key={r.month}><td style={{ fontWeight: 700 }}>{r.month}</td><td style={{ color: r.absent >= 3 ? "var(--sp-red)" : "var(--sp-text-h)", fontWeight: r.absent >= 3 ? 700 : 400 }}>{r.absent} วัน</td><td>{r.leave} วัน</td><td>{r.sick} วัน</td><td>{r.totalDays} วัน</td><td><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div className="sp-completion-bar" style={{ width: 80 }}><div className={`sp-completion-fill ${r.rate >= 85 ? "green" : r.rate >= 75 ? "amber" : "red"}`} style={{ width: `${r.rate}%` }} /></div><span style={{ fontSize: 12, fontWeight: 700, color: r.rate >= 85 ? "var(--sp-green)" : r.rate >= 75 ? "var(--sp-amber)" : "var(--sp-red)" }}>{r.rate.toFixed(1)}%</span></div></td></tr>))}</tbody>
          </table>
        </div>
      </div>
      <div className="sp-info-panel"><div className="sp-info-title"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> หมายเหตุ</div><ul className="sp-info-list"><li>แสดงเฉพาะข้อมูลของตัวเองเท่านั้น</li><li>ขาดเรียนสะสม 3 วันขึ้นไป จะแสดงเป็นสีแดง</li><li>อัตรามาเรียนต่ำกว่า 80% ถือว่าอยู่ในกลุ่มเสี่ยง</li></ul></div>
    </div>
  );
}
