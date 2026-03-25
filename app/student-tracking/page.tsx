"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";

type CaseStatus = "pending" | "active" | "closed" | "escalated";
type CaseReason = "เสี่ยง" | "หลุด" | "อื่นๆ";

interface TrackingCase {
  id: string; studentName: string; citizenId: string; classroom: string; school: string; area: string; status: CaseStatus; reason: CaseReason; assignee: string; createdDate: string; lastUpdate: string; absentDays: number;
}

const MOCK_CASES: TrackingCase[] = [
  { id: "TRK-2567-001", studentName: "เด็กชายสมชาย ใจดี", citizenId: "1-1001-00001-00-0", classroom: "ม.2/3", school: "โรงเรียนวัดสุทธิวราราม", area: "กรุงเทพมหานคร", status: "active", reason: "เสี่ยง", assignee: "ครูสมชาย ใจดี", createdDate: "2567-08-15", lastUpdate: "2567-09-01", absentDays: 15 },
  { id: "TRK-2567-002", studentName: "เด็กหญิงกัญญา สายทอง", citizenId: "1-1001-00002-00-1", classroom: "ม.1/2", school: "โรงเรียนสวนกุหลาบ", area: "กรุงเทพมหานคร", status: "pending", reason: "หลุด", assignee: "ครูกนกวรรณ ศรีสุข", createdDate: "2567-09-01", lastUpdate: "2567-09-01", absentDays: 30 },
  { id: "TRK-2567-003", studentName: "เด็กชายณัฐพงษ์ ทองดี", citizenId: "1-1002-00003-00-2", classroom: "ม.3/1", school: "โรงเรียนวัดสุทธิวราราม", area: "กรุงเทพมหานคร", status: "closed", reason: "เสี่ยง", assignee: "ครูสมชาย ใจดี", createdDate: "2567-07-10", lastUpdate: "2567-08-25", absentDays: 8 },
  { id: "TRK-2567-004", studentName: "เด็กหญิงพิมพ์ใจ รุ่งเรือง", citizenId: "1-1003-00005-00-4", classroom: "ป.5/1", school: "โรงเรียน A", area: "เชียงใหม่", status: "escalated", reason: "หลุด", assignee: "ครูสุดา รักดี", createdDate: "2567-08-01", lastUpdate: "2567-09-02", absentDays: 45 },
  { id: "TRK-2567-005", studentName: "เด็กชายวิรัตน์ ดาวเรือง", citizenId: "1-1004-00007-00-5", classroom: "ม.2/1", school: "โรงเรียนวัดสุทธิวราราม", area: "กรุงเทพมหานคร", status: "active", reason: "อื่นๆ", assignee: "ครูสมชาย ใจดี", createdDate: "2567-08-20", lastUpdate: "2567-08-30", absentDays: 12 },
  { id: "TRK-2567-006", studentName: "เด็กหญิงสุวรรณา ศรีทอง", citizenId: "1-2001-00011-00-5", classroom: "ป.3/1", school: "โรงเรียน A", area: "เชียงใหม่", status: "pending", reason: "เสี่ยง", assignee: "ครูสุดา รักดี", createdDate: "2567-09-02", lastUpdate: "2567-09-02", absentDays: 10 },
  { id: "TRK-2567-007", studentName: "เด็กชายมะรอซะ แวหะมะ", citizenId: "1-3001-00014-00-8", classroom: "ม.1/3", school: "วัดสามัคคีธรรม", area: "นราธิวาส", status: "active", reason: "หลุด", assignee: "เจ้าหน้าที่ ตำบล", createdDate: "2567-07-20", lastUpdate: "2567-08-28", absentDays: 60 },
];

function StatusBadge({ status }: { status: CaseStatus }) {
  const map: Record<CaseStatus, { cls: string; label: string }> = { pending: { cls: "trk-badge-pending", label: "รอติดตาม" }, active: { cls: "trk-badge-active", label: "กำลังติดตาม" }, closed: { cls: "trk-badge-closed", label: "ปิดแล้ว" }, escalated: { cls: "trk-badge-escalated", label: "ส่งต่อแล้ว" } };
  const { cls, label } = map[status]; return <span className={`trk-badge ${cls}`}>{label}</span>;
}
function ReasonBadge({ reason }: { reason: CaseReason }) {
  const map: Record<CaseReason, { cls: string }> = { "เสี่ยง": { cls: "trk-badge-risk" }, "หลุด": { cls: "trk-badge-dropout" }, "อื่นๆ": { cls: "trk-badge-other" } };
  return <span className={`trk-badge ${map[reason].cls}`}>{reason}</span>;
}

export default function StudentTrackingPage() {
  const pathname = usePathname();
  const { role, user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [search, setSearch] = useState("");

  // School Admin sees only their own school's cases
  const scopedCases = role === "School Admin" && user?.area
    ? MOCK_CASES.filter((c) => c.school === user.area)
    : MOCK_CASES;

  const filtered = scopedCases.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (areaFilter !== "all" && c.area !== areaFilter) return false;
    if (assigneeFilter !== "all" && c.assignee !== assigneeFilter) return false;
    if (search) { const q = search.toLowerCase(); return c.studentName.toLowerCase().includes(q) || c.citizenId.includes(q) || c.id.toLowerCase().includes(q); }
    return true;
  });

  const pendingCount = scopedCases.filter(c => c.status === "pending").length;
  const activeCount = scopedCases.filter(c => c.status === "active").length;
  const closedCount = scopedCases.filter(c => c.status === "closed").length;
  const escalatedCount = scopedCases.filter(c => c.status === "escalated").length;
  const areas = [...new Set(scopedCases.map(c => c.area))];
  const assignees = [...new Set(scopedCases.map(c => c.assignee))];

  const tabs = [
    { href: "/student-tracking", label: "รายการเคสติดตาม", badge: pendingCount + activeCount, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg> },
    { href: "/student-tracking/detail", label: "รายละเอียดเคส", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg> },
  ];

  return (
    <div className="trk-page">
      <div className="trk-tabs">
        {tabs.map((tab) => (
          <Link key={tab.href} href={tab.href} className={`trk-tab${pathname === tab.href ? " active" : ""}`}>
            {tab.icon} {tab.label} {"badge" in tab && tab.badge ? <span className="tab-badge">{tab.badge}</span> : null}
          </Link>
        ))}
      </div>

      <div className="trk-stat-grid">
        <div className="trk-stat-card"><div className="trk-stat-num" style={{ color: "var(--trk-amber)" }}>{pendingCount}</div><div className="trk-stat-lbl">รอติดตาม</div></div>
        <div className="trk-stat-card"><div className="trk-stat-num" style={{ color: "var(--trk-blue)" }}>{activeCount}</div><div className="trk-stat-lbl">กำลังติดตาม</div></div>
        <div className="trk-stat-card"><div className="trk-stat-num" style={{ color: "var(--trk-green)" }}>{closedCount}</div><div className="trk-stat-lbl">ปิดแล้ว</div></div>
        <div className="trk-stat-card"><div className="trk-stat-num" style={{ color: "var(--trk-purple)" }}>{escalatedCount}</div><div className="trk-stat-lbl">ส่งต่อแล้ว</div></div>
      </div>

      <div className="trk-card">
        <div className="trk-card-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--trk-blue)" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg> ตัวกรอง</div>
        <div className="trk-form-grid">
          <div className="trk-form-group"><label className="trk-form-label">สถานะ</label><select className="trk-form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">ทุกสถานะ</option><option value="pending">รอติดตาม</option><option value="active">กำลังติดตาม</option><option value="closed">ปิดแล้ว</option><option value="escalated">ส่งต่อแล้ว</option></select></div>
          <div className="trk-form-group"><label className="trk-form-label">พื้นที่</label><select className="trk-form-select" value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}><option value="all">ทุกพื้นที่</option>{areas.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
          <div className="trk-form-group"><label className="trk-form-label">ผู้รับผิดชอบ</label><select className="trk-form-select" value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}><option value="all">ทุกคน</option>{assignees.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
          <div className="trk-form-group"><label className="trk-form-label">ค้นหา</label><div className="trk-search-wrap" style={{ maxWidth: "100%" }}><svg className="trk-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg><input className="trk-search" placeholder="ชื่อ / รหัสประชาชน / รหัสเคส..." value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>
        </div>
      </div>

      <div className="trk-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="trk-card-title" style={{ margin: 0 }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--trk-blue)" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg> รายการเคสติดตาม <span style={{ fontSize: 12, fontWeight: 500, color: "var(--trk-text-m)" }}>({filtered.length} เคส)</span></div>
          <button className="trk-btn trk-btn-outline" style={{ fontSize: 12 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg> ดาวน์โหลด</button>
        </div>
        <div className="trk-table-wrap" style={{ borderRadius: 0, boxShadow: "none", border: "none" }}>
          <table className="trk-table">
            <thead><tr><th>รหัสเคส</th><th>ชื่อ-สกุล</th><th>ห้อง</th><th>โรงเรียน</th><th>พื้นที่</th><th>สถานะ</th><th>เหตุผล</th><th>ขาดสะสม</th><th>ผู้รับผิดชอบ</th><th>อัปเดตล่าสุด</th><th></th></tr></thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td><span style={{ fontFamily: "monospace", fontSize: 11.5, fontWeight: 600, color: "var(--trk-blue)" }}>{c.id}</span></td>
                  <td style={{ fontWeight: 700 }}>{c.studentName}</td>
                  <td>{c.classroom}</td>
                  <td style={{ fontSize: 11.5 }}>{c.school}</td>
                  <td style={{ fontSize: 11.5 }}>{c.area}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td><ReasonBadge reason={c.reason} /></td>
                  <td style={{ fontWeight: 700, color: c.absentDays > 20 ? "var(--trk-red)" : c.absentDays > 10 ? "var(--trk-amber)" : "var(--trk-text-h)" }}>{c.absentDays} วัน</td>
                  <td style={{ fontSize: 11.5 }}>{c.assignee}</td>
                  <td style={{ fontSize: 11.5, color: "var(--trk-text-m)" }}>{c.lastUpdate}</td>
                  <td><Link href="/student-tracking/detail" className="trk-btn trk-btn-outline" style={{ padding: "4px 10px", fontSize: 11, textDecoration: "none" }}>ดูรายละเอียด</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
