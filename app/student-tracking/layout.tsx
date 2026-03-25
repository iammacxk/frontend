"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import UserProfileMenu from "../components/UserProfileMenu";
import { useAuth } from "../context/AuthContext";
import { schoolService } from "../../lib/services/schoolService";
import "../dashboard-report/dashboard.css";
import "./tracking.css";

export default function StudentTrackingLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoggedIn, role, isInitialized, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [schoolName, setSchoolName] = useState<string>("");

  // Fetch real school name from DB by schoolId
  useEffect(() => {
    if (role === "School Admin" && user?.schoolId) {
      schoolService.getSchoolById(user.schoolId)
        .then((s) => setSchoolName(s.name))
        .catch(() => setSchoolName(user.area || ""));
    }
  }, [role, user?.schoolId, user?.area]);

  useEffect(() => {
    if (role !== "School Admin" && user?.area) {
      setSchoolName(user.area);
    }
  }, [role, user?.area]);

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
                <span className="tb-crumb-current">ติดตามนักเรียน</span>
              </div>
              <div className="topbar-title-row">
                <div className="topbar-icon-wrap">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <h1 className="topbar-title">ติดตามนักเรียน (Student Tracking)</h1>
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
              <button className="btn btn-ghost">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                คู่มือการใช้งาน
              </button>
              <UserProfileMenu />
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
