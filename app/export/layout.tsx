"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import UserProfileMenu from "../components/UserProfileMenu";
import { useAuth } from "../context/AuthContext";
import "../dashboard-report/dashboard.css";
import "./export.css";

export default function ExportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoggedIn, role, isInitialized } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    if (role !== "Policy User" && role !== "System Admin") {
      router.replace("/dashboard-report");
    }
  }, [isInitialized, isLoggedIn, role, router, pathname]);

  if (!isInitialized || !isLoggedIn || (role !== "Policy User" && role !== "System Admin")) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-spinner" />
      </div>
    );
  }

  return (
    <div className="export-shell">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="export-content">
        <main className="export-page-wrap">
          {/* Topbar */}
          <div className="export-topbar">
            <div className="export-topbar-left">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => setMobileOpen(true)}
                  className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-slate-200 text-slate-700"
                  aria-label="เปิดเมนู"
                >
                  ☰
                </button>
                <h1 className="export-topbar-title">ศูนย์รายงานวิเคราะห์</h1>
              </div>
              <span className="export-topbar-sub">
                Report &amp; Analytics Center ·{" "}
                {new Date().toLocaleDateString("th-TH", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="export-topbar-actions">
              <UserProfileMenu />
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
