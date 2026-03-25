"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface UserRecord {
  id: string; name: string; email: string; role: string; area: string; status: "active" | "inactive"; lastLogin: string;
}

const MOCK_USERS: UserRecord[] = [
  { id: "U001", name: "System Admin", email: "admin@sts-system.go.th", role: "System Admin", area: "ทั่วประเทศ", status: "active", lastLogin: "17 มี.ค. 2569 10:30" },
  { id: "U002", name: "วิชัย นโยบาย", email: "wichai@edu.go.th", role: "Policy User", area: "ส่วนกลาง", status: "active", lastLogin: "16 มี.ค. 2569 14:22" },
  { id: "U003", name: "ประเสริฐ มั่นคง", email: "prasert@edu.go.th", role: "ศึกษาธิการจังหวัด", area: "กรุงเทพมหานคร", status: "active", lastLogin: "15 มี.ค. 2569 09:10" },
  { id: "U004", name: "สมหญิง รักเรียน", email: "somying@edu.go.th", role: "School Admin", area: "โรงเรียนวัดสุทธิวราราม", status: "active", lastLogin: "17 มี.ค. 2569 08:45" },
  { id: "U005", name: "สมชาย ใจดี", email: "somchai@edu.go.th", role: "Area Admin", area: "โรงเรียนวัดสุทธิวราราม", status: "active", lastLogin: "17 มี.ค. 2569 07:30" },
  { id: "U006", name: "เจ้าหน้าที่ อำเภอ", email: "district@edu.go.th", role: "ระดับอำเภอ", area: "บางคอแหลม", status: "active", lastLogin: "14 มี.ค. 2569 16:00" },
  { id: "U007", name: "เจ้าหน้าที่ ตำบล", email: "subdistrict@edu.go.th", role: "ระดับตำบล", area: "วัดพระยาไกร", status: "inactive", lastLogin: "01 มี.ค. 2569 11:20" },
  { id: "U008", name: "ครูสุดา รักดี", email: "suda@school-a.go.th", role: "Area Admin", area: "โรงเรียน A", status: "active", lastLogin: "16 มี.ค. 2569 13:15" },
  { id: "U009", name: "School Admin", email: "staff@school-a.go.th", role: "School Admin", area: "โรงเรียน A", status: "active", lastLogin: "17 มี.ค. 2569 09:00" },
];

const ADMIN_TABS = [
  { href: "/administration", label: "จัดการผู้ใช้", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg> },
  { href: "/administration/roles", label: "บทบาทและสิทธิ์", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> },
  { href: "/administration/area-access", label: "ขอบเขตพื้นที่", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg> },
  { href: "/administration/settings", label: "ตั้งค่าเกณฑ์", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" /></svg> },
];

function TabUserManagement() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const filtered = MOCK_USERS.filter((u) => { if (roleFilter !== "all" && u.role !== roleFilter) return false; if (search) { const q = search.toLowerCase(); return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q); } return true; });
  const activeCount = MOCK_USERS.filter(u => u.status === "active").length;
  const roles = [...new Set(MOCK_USERS.map(u => u.role))];

  return (
    <div>
      <div className="adm-stat-grid">
        <div className="adm-stat-card"><div className="adm-stat-num" style={{ color: "var(--adm-blue)" }}>{MOCK_USERS.length}</div><div className="adm-stat-lbl">ผู้ใช้ทั้งหมด</div></div>
        <div className="adm-stat-card"><div className="adm-stat-num" style={{ color: "var(--adm-green)" }}>{activeCount}</div><div className="adm-stat-lbl">ใช้งานอยู่</div></div>
        <div className="adm-stat-card"><div className="adm-stat-num" style={{ color: "var(--adm-text-m)" }}>{MOCK_USERS.length - activeCount}</div><div className="adm-stat-lbl">ปิดใช้งาน</div></div>
        <div className="adm-stat-card"><div className="adm-stat-num" style={{ color: "var(--adm-purple)" }}>{roles.length}</div><div className="adm-stat-lbl">บทบาท</div></div>
      </div>
      <div className="adm-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div className="adm-card-title" style={{ margin: 0 }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--adm-blue)" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg> จัดการผู้ใช้งาน <span style={{ fontSize: 12, fontWeight: 500, color: "var(--adm-text-m)" }}>({filtered.length} คน)</span></div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div className="adm-search-wrap"><svg className="adm-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg><input className="adm-search" placeholder="ค้นหาชื่อ / อีเมล..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <select className="adm-form-select" style={{ width: "auto", minWidth: 140 }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}><option value="all">ทุกบทบาท</option>{roles.map(r => <option key={r} value={r}>{r}</option>)}</select>
            <button className="adm-btn adm-btn-primary" style={{ fontSize: 12 }} onClick={() => setShowAddModal(!showAddModal)}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg> เพิ่มผู้ใช้</button>
          </div>
        </div>
        {showAddModal && (<div style={{ padding: "0 20px 16px" }}><div className="adm-card" style={{ background: "var(--surface-info)", borderColor: "var(--surface-info-border)", marginBottom: 0 }}><div className="adm-card-title" style={{ fontSize: 13 }}>เพิ่มผู้ใช้ใหม่</div><div className="adm-form-grid"><div className="adm-form-group"><label className="adm-form-label">ชื่อ-สกุล</label><input className="adm-form-input" placeholder="ระบุชื่อผู้ใช้" /></div><div className="adm-form-group"><label className="adm-form-label">อีเมล</label><input className="adm-form-input" placeholder="email@example.com" type="email" /></div><div className="adm-form-group"><label className="adm-form-label">บทบาท</label><select className="adm-form-select"><option>System Admin</option><option>Policy User</option><option>Area Admin</option><option>School Admin</option><option>External User</option><option>student</option></select></div><div className="adm-form-group"><label className="adm-form-label">พื้นที่</label><input className="adm-form-input" placeholder="ระบุพื้นที่รับผิดชอบ" /></div></div><div className="adm-actions"><button className="adm-btn adm-btn-success" style={{ fontSize: 12 }}>บันทึก</button><button className="adm-btn adm-btn-outline" style={{ fontSize: 12 }} onClick={() => setShowAddModal(false)}>ยกเลิก</button></div></div></div>)}
        <div className="adm-table-wrap" style={{ borderRadius: 0, boxShadow: "none", border: "none" }}>
          <table className="adm-table">
            <thead><tr><th>รหัส</th><th>ชื่อ-สกุล</th><th>อีเมล</th><th>บทบาท</th><th>พื้นที่</th><th>สถานะ</th><th>เข้าสู่ระบบล่าสุด</th><th>จัดการ</th></tr></thead>
            <tbody>{filtered.map((u) => (<tr key={u.id}><td style={{ fontFamily: "monospace", fontSize: 11.5, color: "var(--adm-blue)" }}>{u.id}</td><td style={{ fontWeight: 700 }}>{u.name}</td><td style={{ fontSize: 11.5 }}>{u.email}</td><td><span className="adm-badge adm-badge-admin" style={{ fontSize: 10 }}>{u.role}</span></td><td style={{ fontSize: 11.5 }}>{u.area}</td><td>{u.status === "active" ? <span className="adm-badge adm-badge-active">ใช้งาน</span> : <span className="adm-badge adm-badge-inactive">ปิดใช้งาน</span>}</td><td style={{ fontSize: 11.5, color: "var(--adm-text-m)" }}>{u.lastLogin}</td><td><div style={{ display: "flex", gap: 4 }}><button className="adm-btn adm-btn-outline" style={{ padding: "3px 8px", fontSize: 10 }}>แก้ไข</button><button className="adm-btn adm-btn-amber" style={{ padding: "3px 8px", fontSize: 10 }}>รีเซ็ต</button><button className="adm-btn adm-btn-danger" style={{ padding: "3px 8px", fontSize: 10 }}>{u.status === "active" ? "ปิด" : "เปิด"}</button></div></td></tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdministrationPage() {
  const pathname = usePathname();
  return (
    <div className="adm-page">
      <div className="adm-tabs">{ADMIN_TABS.map((tab) => (<Link key={tab.href} href={tab.href} className={`adm-tab${pathname === tab.href ? " active" : ""}`}>{tab.icon} {tab.label}</Link>))}</div>
      <TabUserManagement />
    </div>
  );
}
