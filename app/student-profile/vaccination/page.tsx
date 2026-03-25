"use client";
import React from "react";

const MOCK_VACCINATION = [
  { id: "V001", name: "วัคซีนโควิด-19 (Pfizer)", dose: "เข็ม 1", date: "15 มิ.ย. 2564", facility: "รพ.จุฬาลงกรณ์", lot: "FC3558", sideEffect: "ปวดแขน เล็กน้อย", verified: true },
  { id: "V002", name: "วัคซีนโควิด-19 (Pfizer)", dose: "เข็ม 2", date: "06 ก.ค. 2564", facility: "รพ.จุฬาลงกรณ์", lot: "FC3596", sideEffect: "มีไข้ต่ำ 1 วัน", verified: true },
  { id: "V003", name: "วัคซีนโควิด-19 (Pfizer)", dose: "เข็ม 3 (กระตุ้น)", date: "15 ม.ค. 2565", facility: "รพ.จุฬาลงกรณ์", lot: "FC8721", sideEffect: "ไม่มี", verified: true },
  { id: "V004", name: "วัคซีนไข้หวัดใหญ่ 4 สายพันธุ์", dose: "เข็มเดียว", date: "10 มิ.ย. 2567", facility: "ศูนย์สุขภาพโรงเรียน", lot: "FLU-2024-A", sideEffect: "ไม่มี", verified: true },
  { id: "V005", name: "วัคซีน HPV", dose: "เข็ม 1", date: "20 ส.ค. 2567", facility: "รพ.สต. วัดพระยาไกร", lot: "HPV-091", sideEffect: "ไม่มี", verified: false },
  { id: "V006", name: "วัคซีนบาดทะยัก-คอตีบ (dT)", dose: "เข็มกระตุ้น", date: "05 ก.ค. 2566", facility: "รพ.สต. วัดพระยาไกร", lot: "DT-2023-B", sideEffect: "ปวดบริเวณฉีด", verified: true },
];

export default function VaccinationHistoryPage() {
  const verifiedCount = MOCK_VACCINATION.filter(v => v.verified).length;

  return (
    <div className="sp-page">
      <div className="sp-stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="sp-stat-card"><div className="sp-stat-num" style={{ color: "var(--sp-blue)" }}>{MOCK_VACCINATION.length}</div><div className="sp-stat-lbl">รายการทั้งหมด</div></div>
        <div className="sp-stat-card"><div className="sp-stat-num" style={{ color: "var(--sp-green)" }}>{verifiedCount}</div><div className="sp-stat-lbl">ยืนยันแล้ว</div></div>
        <div className="sp-stat-card"><div className="sp-stat-num" style={{ color: "var(--sp-amber)" }}>{MOCK_VACCINATION.length - verifiedCount}</div><div className="sp-stat-lbl">ยังไม่ยืนยัน</div></div>
      </div>
      <div className="sp-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px 12px" }}><div className="sp-card-title" style={{ margin: 0 }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--sp-green)" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> ประวัติการได้รับวัคซีน</div></div>
        <div className="sp-table-wrap" style={{ borderRadius: 0, boxShadow: "none", border: "none" }}>
          <table className="sp-table">
            <thead><tr><th>ชื่อวัคซีน</th><th>เข็มที่</th><th>วันที่ได้รับ</th><th>สถานพยาบาล</th><th>เลขล็อต</th><th>อาการหลังฉีด</th><th>สถานะ</th></tr></thead>
            <tbody>{MOCK_VACCINATION.map((v) => (<tr key={v.id}><td style={{ fontWeight: 700 }}>{v.name}</td><td>{v.dose}</td><td>{v.date}</td><td style={{ fontSize: 11.5 }}>{v.facility}</td><td><span style={{ fontFamily: "monospace", fontSize: 11 }}>{v.lot}</span></td><td style={{ fontSize: 11.5, color: v.sideEffect === "ไม่มี" ? "var(--sp-text-f)" : "var(--sp-text-h)" }}>{v.sideEffect}</td><td>{v.verified ? <span className="sp-badge sp-badge-verified">✓ ยืนยันแล้ว</span> : <span className="sp-badge sp-badge-unverified">⏳ ยังไม่ยืนยัน</span>}</td></tr>))}</tbody>
          </table>
        </div>
      </div>
      <div className="sp-info-panel"><div className="sp-info-title"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> สถานะข้อมูลวัคซีน</div><ul className="sp-info-list"><li><strong>✓ ยืนยันแล้ว</strong> — มีหลักฐานจากหน่วยงานสาธารณสุข</li><li><strong>⏳ ยังไม่ยืนยัน</strong> — ข้อมูลจากการกรอก/นำเข้า รอการยืนยัน</li><li>ข้อมูลวัคซีนแสดงตามนโยบายความเป็นส่วนตัว</li><li>หากข้อมูลไม่ถูกต้อง กรุณาแจ้งครูที่ปรึกษา / หัวหน้าระดับ</li></ul></div>
    </div>
  );
}
