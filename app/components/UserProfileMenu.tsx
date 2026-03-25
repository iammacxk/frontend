"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, Moon, Sun } from "lucide-react";
import { ROLES, useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function UserProfileMenu() {
  const { user, role, logout } = useAuth();
  const { isDark, toggleDark } = useTheme();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!user) {
    return null;
  }

  const roleInfo = role ? ROLES[role] : undefined;
  const roleLabel = roleInfo?.label ?? role ?? "";

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="การแจ้งเตือน"
      >
        <Bell size={18} />
      </button>

      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-md px-1.5 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="เปิดเมนูผู้ใช้"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#efaaaa] dark:bg-rose-900/60 text-white text-[11px] font-bold">
            {user.nameShort}
          </span>
          <span className="hidden sm:block text-left leading-tight">
            <span className="block text-[11px] font-semibold truncate max-w-35">{user.name}</span>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400">{roleLabel}</span>
          </span>
          <ChevronDown size={15} className={`text-slate-500 dark:text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg z-40 transition-colors">
            <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-700 sm:hidden">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-200 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{roleLabel}</p>
            </div>

            <button
              type="button"
              onClick={() => {
                toggleDark();
                setOpen(false);
              }}
              className="w-full inline-flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {isDark ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} className="text-slate-600 dark:text-slate-400" />}
              <span>{isDark ? "ธีมของแอป - สว่าง" : "ธีมของแอป - มืด"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                handleLogout();
              }}
              className="w-full inline-flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-slate-100 dark:border-slate-700"
            >
              <LogOut size={16} />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
