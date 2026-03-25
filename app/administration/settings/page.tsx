"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_TABS = [
  { href: "/administration", label: "จัดการผู้ใช้", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
  { href: "/administration/roles", label: "บทบาทและสิทธิ์", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { href: "/administration/area-access", label: "ขอบเขตพื้นที่", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> },
  { href: "/administration/settings", label: "ตั้งค่าเกณฑ์", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
];

export default function SystemSettingsPage() {
  const pathname = usePathname();
  const [riskDays, setRiskDays] = useState(3);
  const [graceDays, setGraceDays] = useState(7);
  const [reportCutoff, setReportCutoff] = useState(25);
  const [saved, setSaved] = useState(false);

  return (
    <div className="adm-page">
      <div className="adm-tabs">{ADMIN_TABS.map((tab) => (<Link key={tab.href} href={tab.href} className={`adm-tab${pathname === tab.href ? " active" : ""}`}>{tab.icon} {tab.label}</Link>))}</div>
      <div className="adm-two-col">
        <div>
          <div className="adm-card"><div className="adm-card-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--adm-red)" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> เกณฑ์การขาดเรียนที่ถือว่าเสี่ยง</div><div className="adm-card-desc">กำหนดจำนวนวันขาดเรียนสะสมที่ระบบจะแจ้งเตือนว่านักเรียนอยู่ในกลุ่มเสี่ยง</div>
            <div className="adm-form-grid">
              <div className="adm-form-group"><label className="adm-form-label">จำนวนวันขาดเรียนที่เสี่ยง</label><div style={{ display: "flex", alignItems: "center", gap: 10 }}><input className="adm-form-input" type="number" value={riskDays} onChange={(e) => setRiskDays(Number(e.target.value))} style={{ width: 100 }} min={1} max={30} /><span style={{ fontSize: 13, color: "var(--adm-text-m)" }}>วัน/ภาคเรียน</span></div></div>
              <div className="adm-form-group"><label className="adm-form-label">เกณฑ์สร้างเคสติดตามอัตโนมัติ</label><div style={{ display: "flex", alignItems: "center", gap: 10 }}><input className="adm-form-input" type="number" defaultValue={10} style={{ width: 100 }} min={1} max={60} /><span style={{ fontSize: 13, color: "var(--adm-text-m)" }}>วัน (ขาดต่อเนื่อง)</span></div></div>
              <div className="adm-form-group"><label className="adm-form-label">เกณฑ์แจ้งเตือน &quot;หลุดออกจากระบบ&quot;</label><div style={{ display: "flex", alignItems: "center", gap: 10 }}><input className="adm-form-input" type="number" defaultValue={30} style={{ width: 100 }} min={1} max={90} /><span style={{ fontSize: 13, color: "var(--adm-text-m)" }}>วัน (ไม่มาเรียนเลย)</span></div></div>
            </div>
          </div>
          <div className="adm-card"><div className="adm-card-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--adm-amber)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ช่วงผ่อนผันข้อมูลล่าช้า</div><div className="adm-card-desc">กำหนดจำนวนวันที่อนุญาตให้โรงเรียนส่งข้อมูลขาดเรียนย้อนหลังหลังวันตัดรอบ</div><div className="adm-form-group" style={{ maxWidth: 300 }}><label className="adm-form-label">ช่วงผ่อนผัน</label><div style={{ display: "flex", alignItems: "center", gap: 10 }}><input className="adm-form-input" type="number" value={graceDays} onChange={(e) => setGraceDays(Number(e.target.value))} style={{ width: 100 }} min={0} max={30} /><span style={{ fontSize: 13, color: "var(--adm-text-m)" }}>วัน หลังวันตัดรอบ</span></div></div></div>
          <div className="adm-card"><div className="adm-card-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--adm-blue)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> วันตัดรอบรายงาน</div><div className="adm-card-desc">กำหนดวันที่ระบบจะตัดรอบข้อมูลเพื่อสรุปรายงานประจำเดือน</div>
            <div className="adm-form-grid" style={{ maxWidth: 500 }}>
              <div className="adm-form-group"><label className="adm-form-label">ตัดรอบทุกวันที่</label><div style={{ display: "flex", alignItems: "center", gap: 10 }}><input className="adm-form-input" type="number" value={reportCutoff} onChange={(e) => setReportCutoff(Number(e.target.value))} style={{ width: 100 }} min={1} max={31} /><span style={{ fontSize: 13, color: "var(--adm-text-m)" }}>ของทุกเดือน</span></div></div>
              <div className="adm-form-group"><label className="adm-form-label">รอบรายงาน</label><select className="adm-form-select"><option>รายเดือน</option><option>รายภาคเรียน</option><option>รายปีการศึกษา</option></select></div>
            </div>
          </div>
          <div className="adm-actions"><button className="adm-btn adm-btn-success" onClick={() => setSaved(true)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> บันทึกการตั้งค่า</button><button className="adm-btn adm-btn-outline">ค่าเริ่มต้น</button></div>
          {saved && <div style={{ marginTop: 14, padding: "12px 16px", background: "var(--surface-success)", border: "1px solid var(--surface-success-border)", borderRadius: 10, display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 600, color: "var(--surface-success-text)" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> บันทึกการตั้งค่าสำเร็จ</div>}
        </div>
        <div>
          <div className="adm-card"><div className="adm-info-title" style={{ marginBottom: 12, fontSize: 13, color: "var(--adm-text-h)" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> ค่าปัจจุบัน</div>
            {[{ label: "เกณฑ์เสี่ยง", val: `${riskDays} วัน/ภาคเรียน` }, { label: "สร้างเคสอัตโนมัติ", val: "10 วันต่อเนื่อง" }, { label: "เกณฑ์หลุดออกจากระบบ", val: "30 วัน" }, { label: "ช่วงผ่อนผัน", val: `${graceDays} วัน` }, { label: "วันตัดรอบ", val: `ทุกวันที่ ${reportCutoff}` }, { label: "รอบรายงาน", val: "รายเดือน" }].map(item => (<div key={item.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, paddingBottom: 7, borderBottom: "1px solid rgba(0,0,0,.05)", marginBottom: 7 }}><span style={{ color: "var(--adm-text-m)" }}>{item.label}</span><span style={{ fontWeight: 600, color: "var(--adm-text-h)" }}>{item.val}</span></div>))}
          </div>
          <div className="adm-info-panel"><div className="adm-info-title">คำแนะนำ</div><ul className="adm-info-list"><li>เกณฑ์เสี่ยงแนะนำ 3-5 วัน ตามนโยบาย สพฐ.</li><li>ช่วงผ่อนผันไม่ควรเกิน 7 วัน</li><li>วันตัดรอบควรตรงกับรอบรายงานของ สพฐ.</li><li>การเปลี่ยนเกณฑ์จะมีผลทันทีในรอบถัดไป</li></ul></div>
        </div>
      </div>
    </div>
  );
}
