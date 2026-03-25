"use client";
import React from "react";

const STUDENT_INFO = {
  name: "เด็กชายสมชาย ใจดี", citizenId: "1-10XX-XXXXX-XX-0", citizenIdFull: "1-1001-00001-00-0",
  dob: "15 มกราคม 2555", age: "14 ปี", gender: "ชาย", bloodType: "O",
  school: "โรงเรียนวัดสุทธิวราราม", level: "ม.2/3",
  address: "123/45 ซ.สุขุมวิท 22 แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110",
  guardian: "นายทองดี ใจดี (บิดา)", guardianPhone: "081-XXX-XXXX", enrollDate: "16 พ.ค. 2566",
};

function TabPersonalInfo() {
  return (
    <div>
      <div className="sp-profile-header">
        <div className="sp-avatar">{STUDENT_INFO.name.charAt(3)}</div>
        <div>
          <div className="sp-profile-name">{STUDENT_INFO.name}</div>
          <div className="sp-profile-meta"><span>🆔 {STUDENT_INFO.citizenId}</span><span>🏫 {STUDENT_INFO.level} · {STUDENT_INFO.school}</span><span>📅 อายุ {STUDENT_INFO.age}</span></div>
        </div>
      </div>
      <div className="sp-two-col">
        <div>
          <div className="sp-card">
            <div className="sp-card-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sp-blue)" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v2"/><circle cx="12" cy="7" r="4"/></svg> ข้อมูลส่วนตัว</div>
            {[{ label: "ชื่อ-สกุล", val: STUDENT_INFO.name }, { label: "เลขประจำตัวประชาชน", val: STUDENT_INFO.citizenId }, { label: "วันเกิด", val: STUDENT_INFO.dob }, { label: "อายุ", val: STUDENT_INFO.age }, { label: "เพศ", val: STUDENT_INFO.gender }, { label: "หมู่เลือด", val: STUDENT_INFO.bloodType }].map(f => <div key={f.label} className="sp-field"><span className="sp-field-label">{f.label}</span><span className="sp-field-value">{f.val}</span></div>)}
          </div>
          <div className="sp-card">
            <div className="sp-card-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sp-green)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> ที่อยู่</div>
            <div className="sp-field"><span className="sp-field-label">ที่อยู่ปัจจุบัน</span></div>
            <div style={{ fontSize: 13, color: "var(--sp-text-h)", lineHeight: 1.8, marginTop: 4 }}>{STUDENT_INFO.address}</div>
          </div>
        </div>
        <div>
          <div className="sp-card">
            <div className="sp-card-title" style={{ fontSize: 13 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sp-blue)" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> ข้อมูลการศึกษาปัจจุบัน</div>
            {[{ label: "โรงเรียน", val: STUDENT_INFO.school }, { label: "ระดับชั้น / ห้อง", val: STUDENT_INFO.level }, { label: "วันที่ลงทะเบียน", val: STUDENT_INFO.enrollDate }].map(f => <div key={f.label} className="sp-field"><span className="sp-field-label">{f.label}</span><span className="sp-field-value" style={{ maxWidth: 180 }}>{f.val}</span></div>)}
          </div>
          <div className="sp-card">
            <div className="sp-card-title" style={{ fontSize: 13 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sp-amber)" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/></svg> ผู้ปกครอง</div>
            {[{ label: "ชื่อผู้ปกครอง", val: STUDENT_INFO.guardian }, { label: "โทรศัพท์", val: STUDENT_INFO.guardianPhone }].map(f => <div key={f.label} className="sp-field"><span className="sp-field-label">{f.label}</span><span className="sp-field-value">{f.val}</span></div>)}
          </div>
          <div className="sp-info-panel"><div className="sp-info-title"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> หมายเหตุ</div><ul className="sp-info-list"><li>ข้อมูลบางส่วนถูกปิดบังเพื่อความปลอดภัย</li><li>หากข้อมูลไม่ถูกต้อง กรุณาแจ้งครูที่ปรึกษา / หัวหน้าระดับ</li></ul></div>
        </div>
      </div>
    </div>
  );
}

export default function StudentProfilePage() {
  return (
    <div className="sp-page">
      <TabPersonalInfo />
    </div>
  );
}
