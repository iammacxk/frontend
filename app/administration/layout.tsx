"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import UserProfileMenu from "../components/UserProfileMenu";
import { useAuth, getDefaultRoute } from "../context/AuthContext";
import "../dashboard-report/dashboard.css";
import "./admin.css";

export default function AdministrationLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoggedIn, role, isInitialized } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    if (role !== "System Admin") {
      router.replace(getDefaultRoute(role!));
    }
  }, [isInitialized, isLoggedIn, role, router]);

  if (!isInitialized || !isLoggedIn || role !== "System Admin") {
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
                <span className="tb-crumb-current">ผู้ดูแลระบบ</span>
              </div>
              <div className="topbar-title-row">
                <div className="topbar-icon-wrap">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <h1 className="topbar-title">ผู้ดูแลระบบ (Administration)</h1>
              </div>
              <div className="topbar-sub">
                <span className="pulse" />
                <span>ระบบติดตามและช่วยเหลือผู้เรียน · สพฐ.</span>
              </div>
            </div>
            <div className="topbar-actions">
              <UserProfileMenu />
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
