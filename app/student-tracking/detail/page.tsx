"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type CaseStatus = "pending" | "active" | "closed" | "escalated";
type CaseReason = "เสี่ยง" | "หลุด" | "อื่นๆ";
type TrackingResult = "พบตัว" | "ไม่พบตัว" | "ย้ายที่อยู่" | "ปัญหาครอบครัว" | "อื่นๆ";

interface TrackingCase {
  id: string; studentName: string; citizenId: string; classroom: string; school: string; area: string; status: CaseStatus; reason: CaseReason; assignee: string; createdDate: string; lastUpdate: string; absentDays: number; trackingResult?: TrackingResult; note?: string;
}

interface TrackingLog {
  date: string; action: string; by: string; result?: TrackingResult; note?: string; color: "blue" | "green" | "red" | "amber" | "purple";
}

const MOCK_CASE: TrackingCase = {
  id: "TRK-2567-001", studentName: "เด็กชายสมชาย ใจดี", citizenId: "1-1001-00001-00-0", classroom: "ม.2/3", school: "โรงเรียนวัดสุทธิวราราม", area: "กรุงเทพมหานคร", status: "active", reason: "เสี่ยง", assignee: "ครูสมชาย ใจดี", createdDate: "2567-08-15", lastUpdate: "2567-09-01", absentDays: 15, trackingResult: "พบตัว", note: "พบตัวที่บ้าน พ่อแม่ให้ข้อมูลว่ามีปัญหาครอบครัว",
};

const MOCK_TIMELINE: TrackingLog[] = [
  { date: "02 ก.ย. 2567", action: "สร้างเคสติดตาม", by: "ระบบอัตโนมัติ", note: "ขาดเรียนสะสม 15 วัน", color: "blue" },
  { date: "05 ก.ย. 2567", action: "มอบหมายครูที่ปรึกษา", by: "ผู้บริหารโรงเรียน", note: "มอบหมาย ครูสมชาย ใจดี", color: "blue" },
  { date: "08 ก.ย. 2567", action: "ลงพื้นที่เยี่ยมบ้าน ครั้งที่ 1", by: "ครูสมชาย ใจดี", result: "ไม่พบตัว", note: "ไม่มีคนอยู่บ้าน เพื่อนบ้านแจ้งว่าครอบครัวไปทำงาน", color: "amber" },
  { date: "12 ก.ย. 2567", action: "ลงพื้นที่เยี่ยมบ้าน ครั้งที่ 2", by: "ครูสมชาย ใจดี", result: "พบตัว", note: "พบตัว พ่อแม่ให้ข้อมูลว่ามีปัญหาครอบครัว นักเรียนต้องช่วยทำงาน", color: "green" },
  { date: "15 ก.ย. 2567", action: "บันทึกผลและปรึกษาผู้บริหาร", by: "ครูสมชาย ใจดี", note: "เสนอให้ช่วยเหลือด้านทุนการศึกษาและประสานงานกับ อบต.", color: "purple" },
];

function StatusBadge({ status }: { status: CaseStatus }) {
  const map: Record<CaseStatus, { cls: string; label: string }> = { pending: { cls: "trk-badge-pending", label: "รอติดตาม" }, active: { cls: "trk-badge-active", label: "กำลังติดตาม" }, closed: { cls: "trk-badge-closed", label: "ปิดแล้ว" }, escalated: { cls: "trk-badge-escalated", label: "ส่งต่อแล้ว" } };
  const { cls, label } = map[status]; return <span className={`trk-badge ${cls}`}>{label}</span>;
}
function ReasonBadge({ reason }: { reason: CaseReason }) {
  const map: Record<CaseReason, { cls: string }> = { "เสี่ยง": { cls: "trk-badge-risk" }, "หลุด": { cls: "trk-badge-dropout" }, "อื่นๆ": { cls: "trk-badge-other" } };
  return <span className={`trk-badge ${map[reason].cls}`}>{reason}</span>;
}
function ResultBadge({ result }: { result: TrackingResult }) {
  const map: Record<TrackingResult, { cls: string }> = { "พบตัว": { cls: "trk-badge-found" }, "ไม่พบตัว": { cls: "trk-badge-notfound" }, "ย้ายที่อยู่": { cls: "trk-badge-moved" }, "ปัญหาครอบครัว": { cls: "trk-badge-family" }, "อื่นๆ": { cls: "trk-badge-other" } };
  return <span className={`trk-badge ${map[result].cls}`}>{result}</span>;
}

export default function CaseDetailPage() {
  const pathname = usePathname();
  const fileRef = useRef<HTMLInputElement>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [trackingResult, setTrackingResult] = useState<TrackingResult>("พบตัว");
  const [detailNote, setDetailNote] = useState("");
  const [saved, setSaved] = useState(false);
  const caseData = MOCK_CASE;

  const tabs = [
    { href: "/student-tracking", label: "รายการเคสติดตาม", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg> },
    { href: "/student-tracking/detail", label: "รายละเอียดเคส", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg> },
  ];

  return (
    <div className="trk-page">
      <div className="trk-tabs">
        {tabs.map((tab) => (<Link key={tab.href} href={tab.href} className={`trk-tab${pathname === tab.href ? " active" : ""}`}>{tab.icon} {tab.label}</Link>))}
      </div>

      <Link href="/student-tracking" className="trk-btn trk-btn-outline" style={{ marginBottom: 16, fontSize: 12, display: "inline-flex", textDecoration: "none" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg> กลับไปรายการเคส
      </Link>

      <div className="trk-two-col">
        <div>
          <div className="trk-card">
            <div className="trk-case-header">
              <div className="trk-case-avatar">{caseData.studentName.charAt(3)}</div>
              <div className="trk-case-info"><div className="trk-case-name">{caseData.studentName}</div><div className="trk-case-meta"><span>🆔 {caseData.citizenId}</span><span>🏫 {caseData.classroom} · {caseData.school}</span><span>📍 {caseData.area}</span></div></div>
              <StatusBadge status={caseData.status} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 10 }}>
              {[{ label: "รหัสเคส", val: caseData.id, color: "var(--trk-blue)" }, { label: "เหตุผล", val: caseData.reason, color: caseData.reason === "หลุด" ? "var(--trk-red)" : "var(--trk-amber)" }, { label: "ขาดสะสม", val: `${caseData.absentDays} วัน`, color: caseData.absentDays > 20 ? "var(--trk-red)" : "var(--trk-amber)" }, { label: "ผู้รับผิดชอบ", val: caseData.assignee, color: "var(--trk-text-h)" }].map(item => (
                <div key={item.label} style={{ textAlign: "center", padding: "10px 0", background: "var(--surface-muted)", borderRadius: 10 }}><div style={{ fontSize: 10, fontWeight: 700, color: "var(--trk-text-m)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 3 }}>{item.label}</div><div style={{ fontSize: 14, fontWeight: 800, color: item.color }}>{item.val}</div></div>
              ))}
            </div>
          </div>

          <div className="trk-card">
            <div className="trk-card-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--trk-blue)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> ประวัติการติดตาม</div>
            <div className="trk-timeline">
              {MOCK_TIMELINE.map((log, i) => (
                <div key={i} className="trk-timeline-item"><div className={`trk-timeline-dot ${log.color}`} /><div className="trk-timeline-date">{log.date} · {log.by}</div><div className="trk-timeline-text"><strong>{log.action}</strong>{log.result && <> — <ResultBadge result={log.result} /></>}</div>{log.note && <div style={{ fontSize: 12, color: "var(--trk-text-m)", marginTop: 3, lineHeight: 1.5 }}>{log.note}</div>}</div>
              ))}
            </div>
          </div>

          <div className="trk-card">
            <div className="trk-card-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--trk-green)" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg> บันทึกผลติดตาม</div>
            <div className="trk-form-grid" style={{ marginBottom: 14 }}>
              <div className="trk-form-group"><label className="trk-form-label">ผลการติดตาม</label><select className="trk-form-select" value={trackingResult} onChange={(e) => setTrackingResult(e.target.value as TrackingResult)}><option value="พบตัว">พบตัว</option><option value="ไม่พบตัว">ไม่พบตัว</option><option value="ย้ายที่อยู่">ย้ายที่อยู่</option><option value="ปัญหาครอบครัว">ปัญหาครอบครัว</option><option value="อื่นๆ">อื่นๆ</option></select></div>
              <div className="trk-form-group"><label className="trk-form-label">วันที่ลงพื้นที่</label><input type="date" className="trk-form-input" defaultValue="2567-09-15" /></div>
            </div>
            <div className="trk-form-group" style={{ marginBottom: 14 }}><label className="trk-form-label">รายละเอียด / บันทึกผล</label><textarea className="trk-form-textarea" placeholder="รายละเอียดการติดตาม สิ่งที่พบ ปัญหา และข้อเสนอแนะ..." value={detailNote} onChange={(e) => setDetailNote(e.target.value)} /></div>
            <div className="trk-form-group" style={{ marginBottom: 14 }}>
              <label className="trk-form-label">แนบหลักฐาน (ถ้ามี)</label>
              <div className="trk-dropzone" onClick={() => fileRef.current?.click()}>
                <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) setEvidenceFile(f); }} />
                <div className="trk-dropzone-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg></div>
                <div className="trk-dropzone-title">แนบรูปถ่ายหรือเอกสาร</div><div className="trk-dropzone-sub">รองรับ JPG, PNG, PDF · ขนาดสูงสุด 10 MB</div>
              </div>
              {evidenceFile && <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, padding: "8px 12px", background: "var(--surface-success)", border: "1px solid var(--surface-success-border)", borderRadius: 8, fontSize: 12 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg><span style={{ fontWeight: 600 }}>{evidenceFile.name}</span><span style={{ color: "var(--trk-text-m)" }}>({(evidenceFile.size / 1024).toFixed(1)} KB)</span></div>}
            </div>
            <div className="trk-actions">
              <button className="trk-btn trk-btn-success" onClick={() => setSaved(true)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg> บันทึกผลติดตาม</button>
              <button className="trk-btn trk-btn-purple"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg> ส่งต่อเคสระดับสูง</button>
              <button className="trk-btn trk-btn-outline" onClick={() => setSaved(false)}>ปิดเคส</button>
            </div>
            {saved && <div style={{ marginTop: 14, padding: "12px 16px", background: "var(--surface-success)", border: "1px solid var(--surface-success-border)", borderRadius: 10, display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 600, color: "var(--surface-success-text)" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg> บันทึกผลติดตามสำเร็จ</div>}
          </div>
        </div>

        <div>
          <div className="trk-card">
            <div className="trk-card-title" style={{ fontSize: 13 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--trk-blue)" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v2" /><circle cx="12" cy="7" r="4" /></svg> ข้อมูลนักเรียน</div>
            {[{ label: "ชื่อ-สกุล", val: caseData.studentName }, { label: "เลขประชาชน", val: caseData.citizenId }, { label: "ห้องเรียน", val: caseData.classroom }, { label: "โรงเรียน", val: caseData.school }, { label: "พื้นที่", val: caseData.area }, { label: "วันที่สร้างเคส", val: caseData.createdDate }, { label: "อัปเดตล่าสุด", val: caseData.lastUpdate }].map(item => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, paddingBottom: 7, borderBottom: "1px solid rgba(0,0,0,.05)", marginBottom: 7 }}><span style={{ color: "var(--trk-text-m)" }}>{item.label}</span><span style={{ fontWeight: 600, color: "var(--trk-text-h)", textAlign: "right", maxWidth: 180 }}>{item.val}</span></div>
            ))}
          </div>
          <div className="trk-card" style={{ marginTop: 0 }}>
            <div className="trk-card-title" style={{ fontSize: 13 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--trk-amber)" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg> สรุปสถานะเคส</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span style={{ color: "var(--trk-text-m)" }}>สถานะ</span><StatusBadge status={caseData.status} /></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span style={{ color: "var(--trk-text-m)" }}>เหตุผล</span><ReasonBadge reason={caseData.reason} /></div>
              {caseData.trackingResult && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span style={{ color: "var(--trk-text-m)" }}>ผลล่าสุด</span><ResultBadge result={caseData.trackingResult} /></div>}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span style={{ color: "var(--trk-text-m)" }}>จำนวนติดตาม</span><span style={{ fontWeight: 700 }}>{MOCK_TIMELINE.filter(l => l.action.includes("ลงพื้นที่")).length} ครั้ง</span></div>
            </div>
          </div>
          <div className="trk-info-panel"><div className="trk-info-title"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg> การดำเนินการส่งต่อ</div><ul className="trk-info-list"><li>กดปุ่ม <strong>&quot;ส่งต่อเคสระดับสูง&quot;</strong> เพื่อส่งเรื่องไปยังผู้บริหาร / ระดับอำเภอ</li><li>แนบหลักฐานเพื่อประกอบการพิจารณา</li><li>เคสที่ส่งต่อจะเปลี่ยนสถานะเป็น <strong>&quot;ส่งต่อแล้ว&quot;</strong></li><li>ผู้บริหารสามารถดูเคสและดำเนินการต่อได้ทันที</li></ul></div>
        </div>
      </div>
    </div>
  );
}
