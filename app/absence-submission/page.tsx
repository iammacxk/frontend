"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type AbsenceType = "ขาด" | "ลา" | "ป่วย";

interface AbsentEntry {
  id: string; citizenId: string; studentName: string; date: string; absenceType: AbsenceType; classroom: string; note: string;
}

const MOCK_ABSENT_ENTRIES: AbsentEntry[] = [
  { id: "1", citizenId: "1-1001-00001-00-0", studentName: "เด็กชายสมชาย ใจดี", date: "2567-09-02", absenceType: "ขาด", classroom: "ม.2/3", note: "" },
  { id: "2", citizenId: "1-1001-00002-00-1", studentName: "เด็กหญิงกัญญา สายทอง", date: "2567-09-02", absenceType: "ป่วย", classroom: "ม.2/3", note: "ไข้หวัด" },
  { id: "3", citizenId: "1-1002-00003-00-2", studentName: "เด็กชายณัฐพงษ์ ทองดี", date: "2567-09-02", absenceType: "ลา", classroom: "ม.2/3", note: "ธุระครอบครัว" },
  { id: "4", citizenId: "1-1003-00005-00-4", studentName: "เด็กหญิงพิมพ์ใจ รุ่งเรือง", date: "2567-09-02", absenceType: "ขาด", classroom: "ม.2/3", note: "" },
  { id: "5", citizenId: "1-1004-00007-00-5", studentName: "เด็กชายวิรัตน์ ดาวเรือง", date: "2567-09-02", absenceType: "ป่วย", classroom: "ม.2/3", note: "ปวดท้อง" },
];

function AbsenceTypeBadge({ type }: { type: AbsenceType }) {
  if (type === "ขาด") return <span className="abs-badge abs-badge-absent">ขาด</span>;
  if (type === "ลา") return <span className="abs-badge abs-badge-leave">ลา</span>;
  if (type === "ป่วย") return <span className="abs-badge abs-badge-sick">ป่วย</span>;
  return null;
}

function UploadZone({ file, onFile }: { file: File | null; onFile: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); };
  return (
    <div className={`abs-dropzone${drag ? " drag-over" : ""}`} onClick={() => ref.current?.click()} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={handleDrop}>
      <input ref={ref} type="file" accept=".csv,.xlsx" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      <div className="abs-dropzone-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg></div>
      <div className="abs-dropzone-title">ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์</div>
      <div className="abs-dropzone-sub">รองรับ CSV และ XLSX · รายชื่อคนที่ขาดเรียนเท่านั้น</div>
      {file && (
        <div className="abs-file-selected" onClick={(e) => e.stopPropagation()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
          <span style={{ fontWeight: 700, color: "var(--abs-text-h)" }}>{file.name}</span>
          <span style={{ color: "var(--abs-text-m)", fontSize: 11 }}>({(file.size / 1024).toFixed(1)} KB)</span>
        </div>
      )}
    </div>
  );
}

function StatCards({ absent, leave, sick, total }: { absent: number; leave: number; sick: number; total: number }) {
  return (
    <div className="abs-stat-grid">
      <div className="abs-stat-card"><div className="abs-stat-num" style={{ color: "var(--abs-blue)" }}>{total}</div><div className="abs-stat-lbl">รายการทั้งหมด</div></div>
      <div className="abs-stat-card"><div className="abs-stat-num" style={{ color: "var(--abs-red)" }}>{absent}</div><div className="abs-stat-lbl">ขาดเรียน</div></div>
      <div className="abs-stat-card"><div className="abs-stat-num" style={{ color: "var(--abs-cyan)" }}>{leave}</div><div className="abs-stat-lbl">ลา</div></div>
      <div className="abs-stat-card"><div className="abs-stat-num" style={{ color: "var(--abs-amber)" }}>{sick}</div><div className="abs-stat-lbl">ป่วย</div></div>
    </div>
  );
}

function TabSubmitAbsent() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"upload" | "manual">("upload");
  const [selectedDate, setSelectedDate] = useState("2567-09-02");
  const [selectedClassroom, setSelectedClassroom] = useState("ม.2/3");
  const [validated, setValidated] = useState(false);
  const [entries, setEntries] = useState<AbsentEntry[]>(MOCK_ABSENT_ENTRIES);
  const [manualRows, setManualRows] = useState([{ citizenId: "", studentName: "", absenceType: "ขาด" as AbsenceType, note: "" }]);

  const addManualRow = () => setManualRows([...manualRows, { citizenId: "", studentName: "", absenceType: "ขาด", note: "" }]);
  const removeManualRow = (idx: number) => setManualRows(manualRows.filter((_, i) => i !== idx));
  const absentCount = entries.filter(e => e.absenceType === "ขาด").length;
  const leaveCount = entries.filter(e => e.absenceType === "ลา").length;
  const sickCount = entries.filter(e => e.absenceType === "ป่วย").length;

  return (
    <div>
      <div className="abs-two-col">
        <div className="abs-main-col">
          <div className="abs-card">
            <div className="abs-card-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--abs-blue)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> เลือกวันที่และห้องเรียน</div>
            <div className="abs-form-grid">
              <div className="abs-form-group"><label className="abs-form-label">วันที่ขาดเรียน</label><input type="date" className="abs-form-input" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} /></div>
              <div className="abs-form-group"><label className="abs-form-label">ระดับชั้น</label><select className="abs-form-select"><option>ม.1</option><option>ม.2</option><option>ม.3</option><option>ม.4</option><option>ม.5</option><option>ม.6</option><option>ป.1</option><option>ป.2</option><option>ป.3</option><option>ป.4</option><option>ป.5</option><option>ป.6</option></select></div>
              <div className="abs-form-group"><label className="abs-form-label">ห้อง</label><select className="abs-form-select" value={selectedClassroom} onChange={(e) => setSelectedClassroom(e.target.value)}><option>ม.2/1</option><option>ม.2/2</option><option>ม.2/3</option><option>ม.2/4</option></select></div>
              <div className="abs-form-group"><label className="abs-form-label">โรงเรียน</label><select className="abs-form-select"><option>โรงเรียนวัดสุทธิวราราม</option><option>โรงเรียนสวนกุหลาบ</option><option>โรงเรียน A</option></select></div>
            </div>
          </div>

          <div className="abs-card">
            <div className="abs-card-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--abs-blue)" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg> วิธีการส่งข้อมูล</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button className={`abs-btn ${mode === "upload" ? "abs-btn-primary" : "abs-btn-outline"}`} onClick={() => setMode("upload")}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg> อัปโหลดไฟล์</button>
              <button className={`abs-btn ${mode === "manual" ? "abs-btn-primary" : "abs-btn-outline"}`} onClick={() => setMode("manual")}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg> กรอกเอง</button>
            </div>
            {mode === "upload" ? (
              <>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}><button className="abs-btn abs-btn-outline" style={{ fontSize: 12 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg> ดาวน์โหลดเทมเพลต</button></div>
                <UploadZone file={file} onFile={setFile} />
              </>
            ) : (
              <div>
                <div className="abs-card-desc">กรอกเลขประจำตัวประชาชน 13 หลัก หรือชื่อนักเรียน พร้อมระบุประเภทการขาด</div>
                <div className="abs-entry-row" style={{ borderBottom: "2px solid var(--abs-border)", fontWeight: 700, fontSize: 11, color: "var(--abs-text-m)", textTransform: "uppercase", letterSpacing: "0.3px" }}><span>เลขประจำตัวประชาชน</span><span>ชื่อ-สกุล</span><span>ประเภท</span><span>หมายเหตุ</span><span></span></div>
                {manualRows.map((row, idx) => (
                  <div className="abs-entry-row" key={idx}>
                    <input placeholder="X-XXXX-XXXXX-XX-X" value={row.citizenId} onChange={(e) => { const u = [...manualRows]; u[idx].citizenId = e.target.value; setManualRows(u); }} style={{ fontFamily: "monospace" }} />
                    <input placeholder="ชื่อ-สกุล นักเรียน" value={row.studentName} onChange={(e) => { const u = [...manualRows]; u[idx].studentName = e.target.value; setManualRows(u); }} />
                    <select value={row.absenceType} onChange={(e) => { const u = [...manualRows]; u[idx].absenceType = e.target.value as AbsenceType; setManualRows(u); }}><option value="ขาด">ขาด</option><option value="ลา">ลา</option><option value="ป่วย">ป่วย</option></select>
                    <input placeholder="หมายเหตุ" value={row.note} onChange={(e) => { const u = [...manualRows]; u[idx].note = e.target.value; setManualRows(u); }} />
                    <button className="abs-remove-btn" onClick={() => removeManualRow(idx)} title="ลบ">×</button>
                  </div>
                ))}
                <button className="abs-btn abs-btn-outline" style={{ marginTop: 12, fontSize: 12 }} onClick={addManualRow}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg> เพิ่มแถว</button>
              </div>
            )}
          </div>

          {(file || mode === "manual") && (
            <>
              <StatCards total={entries.length} absent={absentCount} leave={leaveCount} sick={sickCount} />
              <div className="abs-card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div className="abs-card-title" style={{ margin: 0 }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--abs-blue)" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg> ตัวอย่างข้อมูลก่อนส่ง <span className="abs-badge abs-badge-info" style={{ fontSize: 10 }}>ยังไม่ส่ง</span></div>
                </div>
                <div className="abs-table-wrap" style={{ borderRadius: 0, boxShadow: "none", border: "none" }}>
                  <table className="abs-table">
                    <thead><tr><th>#</th><th>เลขประจำตัวประชาชน</th><th>ชื่อ-สกุล</th><th>วันที่ขาด</th><th>ประเภท</th><th>ห้อง</th><th>หมายเหตุ</th></tr></thead>
                    <tbody>{entries.map((e, i) => (<tr key={e.id}><td style={{ color: "var(--abs-text-m)", fontSize: 11 }}>{i + 1}</td><td><span style={{ fontFamily: "monospace", fontSize: 12 }}>{e.citizenId}</span></td><td style={{ fontWeight: 600 }}>{e.studentName}</td><td>{e.date}</td><td><AbsenceTypeBadge type={e.absenceType} /></td><td>{e.classroom}</td><td style={{ color: e.note ? "var(--abs-text-h)" : "var(--abs-text-f)", fontSize: 12 }}>{e.note || "—"}</td></tr>))}</tbody>
                  </table>
                </div>
              </div>
              <div className="abs-info-panel" style={{ marginBottom: 14 }}><div className="abs-info-title"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg> ข้อมูลขั้นต่ำที่ต้องส่ง</div><ul className="abs-info-list"><li>เลขประจำตัวประชาชน 13 หลัก</li><li>วันที่ขาดเรียน</li><li>ประเภทการขาด (ขาด / ลา / ป่วย)</li><li>ห้องเรียน หรือให้ระบบผูกจากฐานนักเรียนอัตโนมัติ</li></ul></div>
              <div className="abs-actions">
                <button className="abs-btn abs-btn-primary" onClick={() => setValidated(true)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg> ตรวจสอบข้อมูล</button>
                <button className="abs-btn abs-btn-success" disabled={!validated}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg> ส่งข้อมูล</button>
                <button className="abs-btn abs-btn-danger" onClick={() => { setFile(null); setValidated(false); setEntries([]); }}>ยกเลิก</button>
              </div>
            </>
          )}
        </div>

        <div className="abs-side-col">
          <div className="abs-card">
            <div className="abs-info-title" style={{ marginBottom: 12, fontSize: 13, color: "var(--abs-text-h)" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg> แนวทางการส่งข้อมูล</div>
            <ul className="abs-info-list" style={{ fontSize: 12 }}><li>ส่งเฉพาะรายชื่อนักเรียนที่ <strong>ไม่มาเรียน</strong></li><li>เลขประจำตัวประชาชน 13 หลัก (ไม่มีขีด)</li><li>ประเภท: ขาด / ลา / ป่วย</li><li>วันที่ต้องเป็นรูปแบบ YYYY-MM-DD</li><li>ส่งได้ทั้งอัปโหลดไฟล์ หรือกรอกมือ</li><li>ระบบจะตรวจสอบความถูกต้องก่อนบันทึก</li></ul>
            <div className="abs-divider" />
            <div className="abs-info-title" style={{ marginBottom: 10, fontSize: 13, color: "var(--abs-text-h)" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--abs-green)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg> คำอธิบายประเภท</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[{ badge: <span className="abs-badge abs-badge-absent">ขาด</span>, desc: "ไม่มาเรียนโดยไม่แจ้งเหตุผล" }, { badge: <span className="abs-badge abs-badge-leave">ลา</span>, desc: "แจ้งลาล่วงหน้า / ลากิจ" }, { badge: <span className="abs-badge abs-badge-sick">ป่วย</span>, desc: "ลาป่วย มีใบรับรองแพทย์หรือผู้ปกครองแจ้ง" }].map((item) => (
                <div key={item.desc} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 12 }}><div style={{ flexShrink: 0, paddingTop: 1 }}>{item.badge}</div><div style={{ color: "var(--abs-text-m)", lineHeight: 1.5 }}>{item.desc}</div></div>
              ))}
            </div>
          </div>
          <div className="abs-card" style={{ marginTop: 0 }}>
            <div className="abs-info-title" style={{ marginBottom: 10, fontSize: 13, color: "var(--abs-text-h)" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" /><polyline points="13 2 13 9 20 9" /></svg> สถิติการส่งล่าสุด</div>
            {[{ label: "วันที่ส่งล่าสุด", val: "02 ก.ย. 2567" }, { label: "ส่งโดย", val: "ครูสมชาย ใจดี" }, { label: "ห้อง", val: "ม.2/3" }, { label: "จำนวนคนขาด", val: "5 คน" }, { label: "สถานะ", val: "ส่งสำเร็จ" }].map((item) => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, paddingBottom: 7, borderBottom: "1px solid rgba(0,0,0,.05)", marginBottom: 7 }}><span style={{ color: "var(--abs-text-m)" }}>{item.label}</span><span style={{ fontWeight: 600, color: "var(--abs-text-h)" }}>{item.val}</span></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AbsenceSubmissionPage() {
  const pathname = usePathname();
  const tabs = [
    { href: "/absence-submission", label: "ส่งข้อมูลคนที่ขาด", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /><line x1="17" y1="8" x2="23" y2="8" /></svg> },
    { href: "/absence-submission/summary", label: "สรุปการขาดเรียน", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 118 2.83" /><path d="M22 12A10 10 0 0012 2v10z" /></svg> },
  ];
  return (
    <div className="abs-page">
      <div className="abs-tabs">
        {tabs.map((tab) => (<Link key={tab.href} href={tab.href} className={`abs-tab${pathname === tab.href ? " active" : ""}`}>{tab.icon} {tab.label}</Link>))}
      </div>
      <TabSubmitAbsent />
    </div>
  );
}
