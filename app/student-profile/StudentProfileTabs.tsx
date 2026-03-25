"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";


const SP_TABS = [
  {
    href: "/student-profile",
    label: "ข้อมูลส่วนตัว",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    href: "/student-profile/academic",
    label: "ประวัติการศึกษา",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 8.5 3 12 0v-5" />
      </svg>
    ),
  },
  {
    href: "/student-profile/vaccination",
    label: "ประวัติวัคซีน",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    href: "/student-profile/support",
    label: "การช่วยเหลือ",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
  },
];

export default function StudentProfileTabs() {
  const pathname = usePathname();
  // ไม่แสดงแท็บในหน้า attendance
  if (pathname === "/student-profile/attendance") return null;
  return (
    <div className="sp-tabs">
      {SP_TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`sp-tab${pathname === tab.href ? " active" : ""}`}
        >
          {tab.icon} {tab.label}
        </Link>
      ))}
    </div>
  );
}