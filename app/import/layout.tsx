"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import UserProfileMenu from "../components/UserProfileMenu";
import { useAuth } from "../context/AuthContext";
import { schoolService } from "../../lib/services/schoolService";
import "../dashboard-report/dashboard.css";
import "./import.css";

export default function ImportLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoggedIn, role, isInitialized, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [schoolName, setSchoolName] = useState<string>("");

  // Fetch real school name from DB by schoolId
  useEffect(() => {
    if (user?.schoolName) {
      setSchoolName(user.schoolName);
      return;
    }

    if (role === "School Admin" && user?.schoolId) {
      schoolService.getSchoolById(user.schoolId)
        .then((s) => setSchoolName(s.name))
        .catch(() => setSchoolName(user.area || ""));
    } else if (user?.area) {
      setSchoolName(user.area);
    }
  }, [role, user?.schoolId, user?.schoolName, user?.area]);

  useEffect(() => {
    if (!isInitialized) return;
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    if (role === "student") {
      router.replace("/portal");
    }
  }, [isInitialized, isLoggedIn, role, router]);

  if (!isInitialized || !isLoggedIn || role === "student") {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-spinner" />
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="dashboard-content">
        <main className="dashboard-page-wrap">
          <div className="topbar">
            <div className="topbar-left">
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-slate-200 text-slate-700"
                aria-label="เปิดเมนู"
              >
                ☰
              </button>
              <div className="topbar-breadcrumb">
                <span className="tb-crumb-root">หน้าหลัก</span>
                <span className="tb-crumb-sep">›</span>
                <span className="tb-crumb-current">นำเข้าข้อมูล</span>
              </div>
              <div className="topbar-title-row">
                <div className="topbar-icon-wrap">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <h1 className="topbar-title">นำเข้าข้อมูล (Data Import)</h1>
              </div>
              <div className="topbar-sub">
                <span className="pulse" />
                <span>ระบบติดตามและช่วยเหลือผู้เรียน · สพฐ.</span>
                <span className="tb-divider">·</span>
                <span>รอบข้อมูล <strong>ภาคเรียนที่ 1 / 2567</strong></span>
              </div>
            </div>
            <div className="topbar-actions">
              {/* School Admin: แสดงชื่อโรงเรียนที่รับผิดชอบ */}
              {role === "School Admin" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "var(--card-bg, #f0f4ff)",
                    border: "1px solid var(--border-color, #d0d7f0)",
                    borderRadius: 8,
                    padding: "5px 12px",
                    fontSize: 13,
                    color: "var(--text-m)",
                    fontWeight: 500,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: "var(--accent, #4f6ef7)" }}>
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span style={{ color: "var(--text-muted, #9ba3bc)", marginRight: 2 }}>โรงเรียน:</span>
                  <span style={{
                    background: "var(--accent-soft, #e8ecff)",
                    color: "var(--accent, #4f6ef7)",
                    borderRadius: 5,
                    padding: "1px 8px",
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    {schoolName || "ไม่ระบุ"}
                  </span>
                </div>
              )}
              <button className="btn btn-ghost" onClick={() => setIsGuideOpen(true)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                คู่มือการนำเข้า
              </button>
              <UserProfileMenu />
            </div>
          </div>
          {children}
        </main>
      </div>

      {/* User Guide Modal */}
      {isGuideOpen && (
        <div className="import-modal-backdrop" onClick={() => setIsGuideOpen(false)} style={{ zIndex: 1100 }}>
          <div
            className="import-modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 520, height: "auto", maxHeight: "90vh", overflow: "hidden" }}
          >
            <div className="import-modal-header" style={{ padding: "20px 24px 16px" }}>
              <div className="import-modal-title" style={{ fontSize: 17 }}>
                <div style={{ width: 32, height: 32, borderRadius: "10px", background: "rgba(40, 128, 208, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 2 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--sky)" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                ขั้นตอนการใช้งานระบบนำเข้าข้อมูล
              </div>
              <button className="import-modal-close" onClick={() => setIsGuideOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div style={{ padding: "8px 24px 24px", overflowY: "auto" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {[
                  { step: 1, title: "เลือกประเภทข้อมูล", desc: "เลือกแท็บ 'ข้อมูลนักเรียน' หรือ 'ข้อมูลเด็กหลุด' จากแถบด้านบนเพื่อให้ตรงกับไฟล์ที่ต้องการนำเข้า" },
                  { step: 2, title: "เตรียมไฟล์ตามมาตรฐาน", desc: "ตรวจสอบให้แน่ใจว่าไฟล์ (Excel/CSV) มีหัวคอลัมน์ถูกต้องตามรูปแบบเทมเพลตมาตรฐาน ONEC" },
                  { step: 3, title: "อัปโหลดไฟล์", desc: "ลากไฟล์มาวางในพื้นที่ 'Dropzone' หรือคลิกเพื่อเลือกไฟล์จากเครื่องคอมพิวเตอร์ของคุณ" },
                  { step: 4, title: "ตรวจสอบข้อมูล (Preview)", desc: "ระบบจะแสดงตัวอย่างข้อมูล 100 แถวแรก ให้ตรวจสอบแถวที่เป็นสีแดง (Error) และแก้ไขในไฟล์ต้นฉบับ" },
                  { step: 5, title: "ยืนยันการนำเข้า", desc: "เมื่อข้อมูลถูกต้องครบถ้วนแล้ว ให้กดปุ่ม 'ยืนยันการนำเข้า' เพื่อบันทึกข้อมูลลงในระบบจริง" },
                  { step: 6, title: "ตรวจสอบผลการทำงาน", desc: "ดาวน์โหลดรายงานสรุปผลหลังการนำเข้าเสร็จสิ้น เพื่อดูรายละเอียดรายการที่บันทึกสำเร็จหรือล้มเหลว" }
                ].map((item) => (
                  <div key={item.step} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{
                      flexShrink: 0, width: 28, height: 28, borderRadius: "50%",
                      background: "linear-gradient(135deg, var(--navy-700), var(--navy-500))",
                      color: "#fff", fontSize: 13, fontWeight: 800,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginTop: 2, boxShadow: "0 3px 8px rgba(10, 22, 40, 0.15)"
                    }}>
                      {item.step}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-h)", marginBottom: 3 }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--text-m)", lineHeight: 1.6 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: 24, padding: "14px 18px", borderRadius: "14px",
                background: "rgba(40, 128, 208, 0.05)", border: "1px solid rgba(40, 128, 208, 0.15)",
                display: "flex", gap: 12, alignItems: "flex-start"
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--sky)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <div style={{ fontSize: 11.5, color: "var(--sky)", fontWeight: 500, lineHeight: 1.6 }}>
                  คำแนะนำ: การนำเข้าข้อมูลจำนวนมากอาจใช้เวลาประมวลผลสักครู่ กรุณาอย่าปิดหน้าต่างเบราว์เซอร์จนกว่าระบบจะทำงานเสร็จสิ้น
                </div>
              </div>
            </div>

            <div className="import-modal-footer" style={{ padding: "16px 24px" }}>
              <button
                className="import-btn import-btn-primary"
                onClick={() => setIsGuideOpen(false)}
                style={{ width: "100%", justifyContent: "center", padding: "10px" }}
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
