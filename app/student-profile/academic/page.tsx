"use client";
import React from "react";

const MOCK_ACADEMIC = [
  { year: "2567", semester: "1", level: "ม.2", classroom: "ม.2/3", status: "กำลังเรียน", school: "โรงเรียนวัดสุทธิวราราม" },
  { year: "2566", semester: "2", level: "ม.1", classroom: "ม.1/3", status: "จบ", school: "โรงเรียนวัดสุทธิวราราม" },
  { year: "2566", semester: "1", level: "ม.1", classroom: "ม.1/3", status: "จบ", school: "โรงเรียนวัดสุทธิวราราม" },
  { year: "2565", semester: "2", level: "ป.6", classroom: "ป.6/2", status: "จบ", school: "โรงเรียนสารสาสน์วิเทศ" },
  { year: "2565", semester: "1", level: "ป.6", classroom: "ป.6/2", status: "จบ", school: "โรงเรียนสารสาสน์วิเทศ" },
  { year: "2564", semester: "2", level: "ป.5", classroom: "ป.5/2", status: "จบ", school: "โรงเรียนสารสาสน์วิเทศ" },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "กำลังเรียน") return <span className="sp-badge sp-badge-active">กำลังเรียน</span>;
  if (status === "จบ") return <span className="sp-badge sp-badge-completed">จบ</span>;
  if (status === "ย้าย") return <span className="sp-badge sp-badge-transferred">ย้าย</span>;
  return <span className="sp-badge sp-badge-other">{status}</span>;
}

export default function AcademicHistoryPage() {
  return (
    <div className="sp-page">
      <div className="sp-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px 12px" }}><div className="sp-card-title" style={{ margin: 0 }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--sp-blue)" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 8.5 3 12 0v-5"/></svg> ประวัติการศึกษา</div></div>
        <div className="sp-table-wrap" style={{ borderRadius: 0, boxShadow: "none", border: "none" }}>
          <table className="sp-table">
            <thead><tr><th>ปีการศึกษา</th><th>ภาคเรียน</th><th>ระดับชั้น</th><th>ห้อง</th><th>โรงเรียน</th><th>สถานะ</th></tr></thead>
            <tbody>{MOCK_ACADEMIC.map((r, i) => (<tr key={i}><td style={{ fontWeight: 700 }}>{r.year}</td><td>{r.semester}</td><td>{r.level}</td><td>{r.classroom}</td><td style={{ fontSize: 11.5 }}>{r.school}</td><td><StatusBadge status={r.status} /></td></tr>))}</tbody>
          </table>
        </div>
      </div>
      <div className="sp-info-panel"><div className="sp-info-title"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> ข้อมูลเพิ่มเติม</div><ul className="sp-info-list"><li>ประวัติการศึกษาแสดงตามข้อมูลในระบบ สพฐ.</li><li>หากมีการย้ายโรงเรียน จะแสดงชื่อโรงเรียนเดิม</li><li>สถานะ &quot;กำลังเรียน&quot; หมายถึง ภาคเรียนปัจจุบัน</li></ul></div>
    </div>
  );
}
