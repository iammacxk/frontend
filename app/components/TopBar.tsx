"use client";

import { Bell, Search, ChevronDown, Shield, Menu, Moon, Sun } from "lucide-react";
import { useAuth, ROLES } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

interface TopBarProps {
  onMenuToggle?: () => void;
}

export default function TopBar({ onMenuToggle }: TopBarProps) {
  const { user, role } = useAuth();
  const { isDark, toggleDark } = useTheme();

  return (
    <header className="h-14 sm:h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-10 transition-colors">
      {/* Left: hamburger + search */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xl">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-400 transition-colors"
        >
          <Menu size={22} />
        </button>

        <div className="relative w-full hidden sm:block">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
          />
          <input
            type="text"
            placeholder="ค้นหานักเรียน, รหัสประจำตัว..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Role badge — hide on very small screens */}
        {role && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800/60 transition-colors">
            <Shield size={14} className="text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
              {ROLES[role].label}
            </span>
          </div>
        )}

        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          title={isDark ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
        >
          {isDark ? (
            <Sun size={20} className="text-amber-400" />
          ) : (
            <Moon size={20} className="text-gray-600" />
          )}
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
          <Bell size={20} className="text-gray-600 dark:text-slate-400" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* School Selector — hide on small screens */}
        <button className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-sm transition-colors">
          <span className="text-gray-700 dark:text-slate-300 truncate max-w-45">
            {user?.area ?? "โรงเรียนวัดสุทธิวราราม"}
          </span>
          <ChevronDown size={16} className="text-gray-400 dark:text-slate-500 shrink-0" />
        </button>

        {/* User Info */}
        {user && (
          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-gray-200 dark:border-slate-800 transition-colors">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user.nameShort}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-gray-900 dark:text-slate-200 leading-tight">{user.name}</p>
              <p className="text-[10px] text-gray-500 dark:text-slate-400 leading-tight">
                {role ? ROLES[role].label : ""}
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
