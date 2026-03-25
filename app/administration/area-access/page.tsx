"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MOCK_AREA_ASSIGNMENTS = [
  { id: "A001", userName: "System Admin", role: "System Admin", level: "ประเทศ", areaName: "ทั่วประเทศ", scope: "ทุกจังหวัด ทุกอำเภอ ทุกตำบล" },
  { id: "A002", userName: "วิชัย นโยบาย", role: "Policy User", level: "ประเทศ", areaName: "ส่วนกลาง", scope: "ทุกจังหวัด (อ่านอย่างเดียว)" },
  { id: "A003", userName: "ประเสริฐ มั่นคง", role: "ศึกษาธิการจังหวัด", level: "จังหวัด", areaName: "กรุงเทพมหานคร", scope: "ทุกอำเภอในกรุงเทพฯ" },
  { id: "A004", userName: "เจ้าหน้าที่ อำเภอ", role: "ระดับอำเภอ", level: "อำเภอ", areaName: "บางคอแหลม", scope: "ทุกตำบลใน อ.บางคอแหลม" },
  { id: "A005", userName: "เจ้าหน้าที่ ตำบล", role: "ระดับตำบล", level: "ตำบล", areaName: "วัดพระยาไกร", scope: "เฉพาะ ต.วัดพระยาไกร" },
  { id: "A006", userName: "สมหญิง รักเรียน", role: "School Admin", level: "โรงเรียน", areaName: "โรงเรียนวัดสุทธิวราราม", scope: "เฉพาะโรงเรียนวัดสุทธิฯ" },
  { id: "A007", userName: "สมชาย ใจดี", role: "Area Admin", level: "โรงเรียน", areaName: "โรงเรียนวัดสุทธิวราราม", scope: "เฉพาะห้อง ม.2/3" },
  { id: "A008", userName: "ครูสุดา รักดี", role: "Area Admin", level: "โรงเรียน", areaName: "โรงเรียน A", scope: "เฉพาะห้อง ป.5/1" },
];

const ADMIN_TABS = [
  { href: "/administration", label: "จัดการผู้ใช้", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
  { href: "/administration/roles", label: "บทบาทและสิทธิ์", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { href: "/administration/area-access", label: "ขอบเขตพื้นที่", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> },
  { href: "/administration/settings", label: "ตั้งค่าเกณฑ์", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
];

export default function AreaAccessPage() {
  const pathname = usePathname();
  const [levelFilter, setLevelFilter] = useState("all");
  const levels = [...new Set(MOCK_AREA_ASSIGNMENTS.map(a => a.level))];
  const filtered = MOCK_AREA_ASSIGNMENTS.filter(a => levelFilter === "all" || a.level === levelFilter);

  return (
    <div className="adm-page">
      <div className="adm-tabs">{ADMIN_TABS.map((tab) => (<Link key={tab.href} href={tab.href} className={`adm-tab${pathname === tab.href ? " active" : ""}`}>{tab.icon} {tab.label}</Link>))}</div>
      <div className="adm-two-col">
        <div>
          <div className="adm-card"><div className="adm-card-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--adm-blue)" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg> ตัวกรอง</div><div className="adm-form-grid"><div className="adm-form-group"><label className="adm-form-label">ระดับพื้นที่</label><select className="adm-form-select" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}><option value="all">ทุกระดับ</option>{levels.map(l => <option key={l} value={l}>{l}</option>)}</select></div></div></div>
          <div className="adm-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px 12px" }}><div className="adm-card-title" style={{ margin: 0 }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--adm-cyan)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> ขอบเขตพื้นที่ข้อมูลของผู้ใช้</div></div>
            <div className="adm-table-wrap" style={{ borderRadius: 0, boxShadow: "none", border: "none" }}>
              <table className="adm-table">
                <thead><tr><th>ผู้ใช้</th><th>บทบาท</th><th>ระดับ</th><th>พื้นที่</th><th>ขอบเขต</th><th>จัดการ</th></tr></thead>
                <tbody>{filtered.map((a) => (<tr key={a.id}><td style={{ fontWeight: 700 }}>{a.userName}</td><td><span className="adm-badge adm-badge-admin" style={{ fontSize: 10 }}>{a.role}</span></td><td><span className="adm-badge" style={{ background: a.level === "ประเทศ" ? "#faf5ff" : a.level === "จังหวัด" ? "#eff6ff" : a.level === "อำเภอ" ? "#fff7ed" : a.level === "ตำบล" ? "#f0fdf4" : "#f8fafc", color: a.level === "ประเทศ" ? "#7c3aed" : a.level === "จังหวัด" ? "#1d4ed8" : a.level === "อำเภอ" ? "#c2410c" : a.level === "ตำบล" ? "#15803d" : "#475569", border: "1px solid", borderColor: a.level === "ประเทศ" ? "#ddd6fe" : a.level === "จังหวัด" ? "#bfdbfe" : a.level === "อำเภอ" ? "#fed7aa" : a.level === "ตำบล" ? "#bbf7d0" : "#cbd5e1" }}>{a.level}</span></td><td style={{ fontWeight: 600 }}>{a.areaName}</td><td style={{ fontSize: 11.5, color: "var(--adm-text-m)", whiteSpace: "normal", maxWidth: 200 }}>{a.scope}</td><td><button className="adm-btn adm-btn-outline" style={{ padding: "3px 8px", fontSize: 10 }}>แก้ไข</button></td></tr>))}</tbody>
              </table>
            </div>
          </div>
        </div>
        <div>
          <div className="adm-card"><div className="adm-info-title" style={{ marginBottom: 12, fontSize: 13, color: "var(--adm-text-h)" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> ลำดับชั้นพื้นที่</div><div style={{ fontSize: 12, lineHeight: 2, color: "var(--adm-text-m)" }}><div>🌐 <strong style={{ color: "var(--adm-purple)" }}>ประเทศ</strong> — เห็นข้อมูลทุกจังหวัด</div><div style={{ paddingLeft: 16 }}>🏛 <strong style={{ color: "var(--adm-blue)" }}>จังหวัด</strong> — เห็นเฉพาะจังหวัดตัวเอง</div><div style={{ paddingLeft: 32 }}>🏘 <strong style={{ color: "var(--adm-amber)" }}>อำเภอ</strong> — เห็นเฉพาะอำเภอตัวเอง</div><div style={{ paddingLeft: 48 }}>🏡 <strong style={{ color: "var(--adm-green)" }}>ตำบล</strong> — เห็นเฉพาะตำบลตัวเอง</div><div style={{ paddingLeft: 64 }}>🏫 <strong style={{ color: "var(--adm-text-h)" }}>โรงเรียน</strong> — เห็นเฉพาะโรงเรียน/ห้อง</div></div></div>
          <div className="adm-info-panel"><div className="adm-info-title">หลักการกำหนดพื้นที่</div><ul className="adm-info-list"><li>ผู้ใช้เห็นข้อมูลเฉพาะพื้นที่ที่ตนรับผิดชอบ</li><li>ระดับสูงกว่าเห็นข้อมูลรวมของระดับย่อย</li><li>ครูที่ปรึกษา / หัวหน้าระดับ จะเห็นเฉพาะห้องที่ตนรับผิดชอบ</li><li>เจ้าหน้าที่โรงเรียนเห็นทุกห้องในโรงเรียนตัวเอง</li></ul></div>
        </div>
      </div>
    </div>
  );
}
