"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import UserProfileMenu from "../components/UserProfileMenu";
import { useAuth } from "../context/AuthContext";
import "../dashboard-report/dashboard.css";
import "./absence.css";

export default function AbsenceSubmissionLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoggedIn, role, isInitialized } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

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
                <span className="tb-crumb-current">ส่งรายชื่อคนขาดเรียน</span>
              </div>
              <div className="topbar-title-row">
                <div className="topbar-icon-wrap">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="17" y1="8" x2="23" y2="8" />
                  </svg>
                </div>
                <h1 className="topbar-title">ส่งรายชื่อคนขาดเรียน (Absence Submission)</h1>
              </div>
              <div className="topbar-sub">
                <span className="pulse" />
                <span>ระบบติดตามและช่วยเหลือผู้เรียน · สพฐ.</span>
                <span className="tb-divider">·</span>
                <span>รอบข้อมูล <strong>ภาคเรียนที่ 1 / 2567</strong></span>
              </div>
            </div>
            <div className="topbar-actions">
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
