"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import UserProfileMenu from "../components/UserProfileMenu";
import { useAuth, getDefaultRoute } from "../context/AuthContext";
import { ProvinceProvider, useProvince } from "../context/ProvinceContext";
import "./dashboard.css";
const pageDescriptions: Record<string, string> = {
  "/dashboard-report":
    "หน้าเดียวสำหรับผู้บริหารใช้ดูภาพรวม สถานะความเสี่ยง และจุดที่ต้องตัดสินใจในรอบข้อมูลล่าสุด",
  "/dashboard-report/Dropped-OutStudents":
    "ตารางรายชื่อนักเรียนที่หลุดออกจากระบบ พร้อมเหตุผลที่ถูกจัดกลุ่มและการส่งออกข้อมูล",
  "/dashboard-report/RepeatedGradeStudents":
    "ติดตามนักเรียนซ้ำชั้น โดยเทียบระดับชั้นปีที่แล้วและปีนี้เพื่อใช้วางแผนช่วยเหลือ",
  "/dashboard-report/At-RiskStudents":
    "ดูจำนวนนักเรียนเสี่ยง รูปแบบการขาดเรียน และเปิดเคสติดตามได้จากหน้านี้ทันที",
  "/dashboard-report/DataCompleteness":
    "ตรวจความครบถ้วนของข้อมูลรายจังหวัด รายอำเภอ และรายโรงเรียน พร้อมสถานะการผ่อนผัน",
};
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProvinceProvider>
      <InnerDashboardLayout>{children}</InnerDashboardLayout>
    </ProvinceProvider>
  );
}
function InnerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoggedIn, role, isInitialized } = useAuth();
  const { selectedProvince, setSelectedProvince } = useProvince();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    if (role === "student" || role === "School Admin") {
      router.replace(getDefaultRoute(role));
    }
    if (role === "System Admin") {
      router.replace("/administration");
    }
  }, [isInitialized, isLoggedIn, role, router, pathname]);

  // Lock Area Admin's selectedProvince to their own province on mount
  useEffect(() => {
    if (role === "Area Admin" && user?.province) {
      setSelectedProvince(user.province);
    } else if (role === "Policy User") {
      setSelectedProvince("all");
    }
  }, [role, user?.province, setSelectedProvince]);
  if (!isInitialized || !isLoggedIn || role === "student" || role === "School Admin" || role === "System Admin") {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-spinner" />
      </div>
    );
  }
  return (
    <div className="dashboard-shell">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
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
              {/* Breadcrumb */}
              <div className="topbar-breadcrumb">
                <span className="tb-crumb-root">สพฐ.</span>
                <span className="tb-crumb-sep">›</span>
                <span className="tb-crumb-current" id="tb-crumb-page">
                  {(() => {
                    switch (pathname) {
                      case "/dashboard-report":
                        return "รายงานและสถิติ";
                      case "/dashboard-report/Dropped-OutStudents":
                        return "นักเรียนหลุดออกจากระบบ";
                      case "/dashboard-report/RepeatedGradeStudents":
                        return "นักเรียนซ้ำชั้น";
                      case "/dashboard-report/At-RiskStudents":
                        return "นักเรียนเสี่ยง";
                      case "/dashboard-report/DataCompleteness":
                        return "ความครบถ้วนข้อมูล";
                      default:
                        return "Dashboard";
                    }
                  })()}
                </span>
              </div>
              {/* Title row */}
              <div className="topbar-title-row">
                <div className="topbar-icon-wrap" id="tb-icon">
                  {(() => {
                    switch (pathname) {
                      case "/dashboard-report":
                        return (
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                          </svg>
                        );
                      case "/dashboard-report/Dropped-OutStudents":
                        return (
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M16 17l5-5-5-5M19.8 12H9M13 22a10 10 0 110-20" />
                          </svg>
                        );
                      case "/dashboard-report/RepeatedGradeStudents":
                        return (
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="23 4 23 10 17 10" />
                            <polyline points="1 20 1 14 7 14" />
                            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                          </svg>
                        );
                      case "/dashboard-report/At-RiskStudents":
                        return (
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        );
                      case "/dashboard-report/DataCompleteness":
                        return (
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                          </svg>
                        );
                      default:
                        return (
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                          </svg>
                        );
                    }
                  })()}
                </div>
                <h1 className="topbar-title" id="page-title">
                  {(() => {
                    switch (pathname) {
                      case "/dashboard-report":
                        return "ภาพรวม / Dashboard";
                      case "/dashboard-report/Dropped-OutStudents":
                        return "นักเรียนหลุดออกจากระบบ";
                      case "/dashboard-report/RepeatedGradeStudents":
                        return "นักเรียนซ้ำชั้น";
                      case "/dashboard-report/At-RiskStudents":
                        return "นักเรียนเสี่ยง";
                      case "/dashboard-report/DataCompleteness":
                        return "ความครบถ้วนข้อมูล";
                      default:
                        return "Dashboard";
                    }
                  })()}
                </h1>
              </div>
              {/* Sub line */}
              <div className="topbar-sub">
                <span className="pulse"></span>
                <span>อัปเดตล่าสุด: {new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })} · {new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.</span>
                <span className="tb-divider">·</span>
                <span id="tb-record-count">
                  {/* ข้อมูลทั้งหมดซ่อนชั่วคราวระหว่างเชื่อมต่อ backend */}
                </span>
              </div>
            </div>
            {/* Action buttons */}
            <div className="topbar-actions">
              {/* Province / Area Selector — role-aware */}
              {role === "Area Admin" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "var(--card-bg, #f0f4ff)",
                    border: "1px solid var(--border-color, #d0d7f0)",
                    borderRadius: 8,
                    padding: "5px 12px",
                    marginRight: 12,
                    fontSize: 13,
                    color: "var(--text-m)",
                    fontWeight: 500,
                    maxWidth: 320,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: "var(--accent, #4f6ef7)" }}>
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                    {user?.province && (
                      <span style={{
                        background: "var(--accent-soft, #e8ecff)",
                        color: "var(--accent, #4f6ef7)",
                        borderRadius: 5,
                        padding: "1px 7px",
                        fontSize: 12,
                        fontWeight: 600,
                      }}>
                        {user.province}
                      </span>
                    )}
                    {user?.district && (
                      <>
                        <span style={{ color: "var(--text-muted, #9ba3bc)", fontSize: 11 }}>›</span>
                        <span style={{
                          background: "var(--bg-soft, #f4f6ff)",
                          color: "var(--text-m)",
                          borderRadius: 5,
                          padding: "1px 7px",
                          fontSize: 12,
                        }}>
                          {user.district}
                        </span>
                      </>
                    )}
                    {user?.subDistrict && (
                      <>
                        <span style={{ color: "var(--text-muted, #9ba3bc)", fontSize: 11 }}>›</span>
                        <span style={{
                          background: "var(--bg-soft, #f4f6ff)",
                          color: "var(--text-m)",
                          borderRadius: 5,
                          padding: "1px 7px",
                          fontSize: 12,
                        }}>
                          {user.subDistrict}
                        </span>
                      </>
                    )}
                    {!user?.province && !user?.district && !user?.subDistrict && (
                      <span style={{ color: "var(--text-muted, #9ba3bc)" }}>พื้นที่ที่รับผิดชอบ</span>
                    )}
                  </div>
                </div>
              )}
              <UserProfileMenu />
            </div>
          </div>
          {/* Dashboard Sub-navigation Tabs */}
          <div className="dashboard-subnav">
            {[
              { href: "/dashboard-report", label: "ภาพรวม Dashboard" },
              {
                href: "/dashboard-report/Dropped-OutStudents",
                label: "นักเรียนที่หลุดออก",
              },
              {
                href: "/dashboard-report/RepeatedGradeStudents",
                label: "นักเรียนซ้ำชั้น",
              },
              {
                href: "/dashboard-report/At-RiskStudents",
                label: "นักเรียนเสี่ยง",
              },
              {
                href: "/dashboard-report/DataCompleteness",
                label: "ความครบถ้วนข้อมูล",
              },
            ].map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  style={{
                    padding: "0.75rem 0.25rem",
                    fontSize: "0.875rem",
                    fontWeight: isActive ? 600 : 500,
                    color: isActive
                      ? "var(--dashboard-subnav-active)"
                      : "var(--dashboard-subnav-text)",
                    borderBottom: isActive
                      ? "2px solid var(--dashboard-subnav-active)"
                      : "2px solid transparent",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s",
                  }}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
