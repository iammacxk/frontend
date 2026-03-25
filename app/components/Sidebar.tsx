"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  AlertTriangle,
  FileBarChart,
  Upload,
  Download,
  Settings,
  GraduationCap,
  ChevronRight,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth, getVisibleMenus } from "../context/AuthContext";

const iconMap: Record<string, typeof LayoutDashboard> = {
  "/dashboard-report": LayoutDashboard,
  "/student-profile": Users,
  "/student-tracking": AlertTriangle,
  "/import": Upload,
  "/export": Download,
  "/administration": Settings,
  // legacy
  "/students": Users,
  "/attendance": ClipboardCheck,
  "/tracking": AlertTriangle,
  "/reports": FileBarChart,
  "/admin/users": Settings,
  "/portal": GraduationCap,
};

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { role } = useAuth();
  // dropdown state: key = menu href, value = open/close
  const [dropdownOpen, setDropdownOpen] = useState<Record<string, boolean>>({});

  // Filter menu items based on role
  const visibleMenus = role ? getVisibleMenus(role) : [];

  // Close mobile sidebar on route change
  useEffect(() => {
    onMobileClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg text-[#d7e0ff] hover:text-white hover:bg-white/10 transition-colors"
          title={collapsed ? "เปิดเมนู" : "ย่อเมนู"}
          aria-label={collapsed ? "เปิดเมนู" : "ย่อเมนู"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>
        <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0">
          <Image src="/sts.png" alt="STS Logo" width={40} height={40} className="w-full h-full object-cover" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden flex-1 min-w-0">
            <h1 className="text-[14px] font-semibold leading-tight text-white truncate">Student Tracking</h1>
            <p className="text-[11px] text-[#96a3c9] truncate">ระบบติดตามผู้เรียน</p>
          </div>
        )}
        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="md:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2.5 overflow-y-auto">
        {visibleMenus.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = iconMap[item.href] || LayoutDashboard;
          // ถ้ามี children และหลังจาก filter แล้วยังมีสิทธิ์เห็น ให้แสดงเป็น dropdown
          const visibleChildren = item.children
            ? item.children.filter((sub) => !sub.allowedRoles || (role && sub.allowedRoles.includes(role)))
            : [];

          if (visibleChildren.length > 0) {
            const isDropdown = dropdownOpen[item.href] || false;
            return (
              <div key={item.href} className="mb-0.5">
                <div
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-all cursor-pointer select-none ${isActive
                      ? "bg-[#4f67ff] text-white"
                      : "text-[#c7d2f0] hover:bg-white/10 hover:text-white"
                    }`}
                  onClick={() => setDropdownOpen((prev) => ({ ...prev, [item.href]: !isDropdown }))}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span className="flex-1 text-[13.5px]">{item.label}</span>}
                  {!collapsed && (
                    <span className={`transition-transform duration-200 text-[#a8b5df] ${isDropdown ? "rotate-90 text-white" : ""}`}>
                      <ChevronRight size={15} />
                    </span>
                  )}
                </div>
                {/* เมนูย่อย dropdown */}
                {!collapsed && isDropdown && (
                  <div
                    className="mt-1 space-y-0.5 border-l border-white/20 ml-5.5 pl-2"
                  >
                    {visibleChildren.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`flex items-center gap-2 px-3 py-1.75 rounded-md text-[12.5px] font-medium transition-all ${isSubActive
                              ? "text-white bg-white/12"
                              : "text-[#a8b5df] hover:text-white hover:bg-white/8"
                            }`}
                        >
                          <span className={`w-1.25 h-1.25 rounded-full shrink-0 transition-all ${isSubActive ? "bg-white" : "bg-[#6072a6]"
                            }`} />
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          // เมนูปกติ
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13.5px] font-medium transition-all ${isActive
                  ? "bg-[#4f67ff] text-white"
                  : "text-[#c7d2f0] hover:bg-white/10 hover:text-white"
                }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {item.href === "/tracking" && !collapsed && (
                <span className="bg-[#dc2626] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  12
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="px-4 py-3 text-[10px] text-[#8fa0cf] border-t border-white/10">
          © 2026 Student Tracking System
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-[#121b43] text-white transition-all duration-300 ${collapsed ? "w-20" : "w-60"
          } min-h-screen sticky top-0`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          {/* Drawer */}
          <aside className="relative flex flex-col bg-[#121b43] text-white w-72 max-w-[85vw] h-full shadow-2xl animate-slide-in-left">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
