"use client";
import React from "react";

const MOCK_SUPPORT = [
  { date: "12 ก.ย. 2567", type: "เยี่ยมบ้าน", description: "ครูที่ปรึกษา / หัวหน้าระดับ ลงพื้นที่เยี่ยมบ้าน สอบถามสาเหตุการขาดเรียน พบว่ามีปัญหาเศรษฐกิจในครอบครัว", provider: "ครูสมชาย ใจดี", color: "blue" as const },
  { date: "15 ก.ย. 2567", type: "ทุนการศึกษา", description: "ได้รับทุนช่วยเหลือค่าเดินทาง จำนวน 1,500 บาท/เดือน ผ่านกองทุนเสมอภาค", provider: "กสศ.", color: "green" as const },
  { date: "01 ก.ย. 2567", type: "ประสานงาน อบต.", description: "ประสานงานกับ อบต. วัดพระยาไกร เพื่อช่วยเหลือด้านครอบครัว", provider: "ครูสมชาย ใจดี", color: "purple" as const },
  { date: "20 ส.ค. 2567", type: "ให้คำปรึกษา", description: "แนะแนวอาชีพและวางแผนการเรียนต่อกับนักจิตวิทยาประจำโรงเรียน", provider: "อ.วรรณา ศรีสุข", color: "amber" as const },
];

export default function SupportHistoryPage() {
  return (
    <div className="sp-page">
      <div className="sp-two-col">
        <div>
          <div className="sp-card">
            <div className="sp-card-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sp-blue)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ประวัติการช่วยเหลือที่ได้รับ</div>
            <div className="sp-card-desc">แสดงรายการช่วยเหลือที่บันทึกไว้ในระบบ (อ่านอย่างเดียว)</div>
            <div className="sp-timeline">
              {MOCK_SUPPORT.map((s, i) => (<div key={i} className="sp-timeline-item"><div className={`sp-timeline-dot ${s.color}`} /><div className="sp-timeline-date">{s.date} · {s.provider}</div><div className="sp-timeline-text"><strong>{s.type}</strong></div><div style={{ fontSize: 12, color: "var(--sp-text-m)", marginTop: 3, lineHeight: 1.6 }}>{s.description}</div></div>))}
            </div>
          </div>
        </div>
        <div>
          <div className="sp-card">
            <div className="sp-card-title" style={{ fontSize: 13 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sp-green)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> สรุปการช่วยเหลือ</div>
            {[{ label: "เยี่ยมบ้าน", val: `${MOCK_SUPPORT.filter(s => s.type === "เยี่ยมบ้าน").length} ครั้ง` }, { label: "ทุนการศึกษา", val: `${MOCK_SUPPORT.filter(s => s.type === "ทุนการศึกษา").length} ครั้ง` }, { label: "ให้คำปรึกษา", val: `${MOCK_SUPPORT.filter(s => s.type === "ให้คำปรึกษา").length} ครั้ง` }, { label: "ประสานงาน", val: `${MOCK_SUPPORT.filter(s => s.type.includes("ประสานงาน")).length} ครั้ง` }, { label: "รวมทั้งหมด", val: `${MOCK_SUPPORT.length} ครั้ง` }].map(f => <div key={f.label} className="sp-field"><span className="sp-field-label">{f.label}</span><span className="sp-field-value">{f.val}</span></div>)}
          </div>
          <div className="sp-info-panel"><div className="sp-info-title"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> หมายเหตุ</div><ul className="sp-info-list"><li>ข้อมูลนี้แสดงแบบ &quot;อ่านอย่างเดียว&quot;</li><li>เฉพาะการช่วยเหลือที่บันทึกในระบบเท่านั้น</li><li>หากมีข้อสงสัย กรุณาติดต่อครูที่ปรึกษา / หัวหน้าระดับ</li></ul></div>
        </div>
      </div>
    </div>
  );
}
