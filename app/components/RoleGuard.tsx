"use client";

import { useAuth } from "../context/AuthContext";
import { type UserRole } from "../context/types";
import { ShieldAlert, Lock } from "lucide-react";
import Link from "next/link";
import { getDefaultRoute, ROLES } from "../context/AuthContext";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  /** If true, show a subtle message instead of the full access denied page */
  inline?: boolean;
}

export default function RoleGuard({
  children,
  allowedRoles,
  inline = false,
}: RoleGuardProps) {
  const { role, isLoggedIn, user, isInitialized } = useAuth();

  if (!isInitialized) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not logged in
  if (!isLoggedIn || !role) {
    if (inline) return null;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Lock size={32} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          กรุณาเข้าสู่ระบบ
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          คุณต้องเข้าสู่ระบบก่อนเพื่อเข้าถึงหน้านี้
        </p>
        <Link
          href="/login"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          ไปหน้าเข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  // Role not allowed
  if (!allowedRoles.includes(role)) {
    if (inline) return null;
    const roleName = ROLES[role]?.label ?? role;
    const defaultRoute = getDefaultRoute(role);

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <ShieldAlert size={32} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          ไม่มีสิทธิ์เข้าถึง
        </h2>
        <p className="text-sm text-gray-500 mb-1">
          บทบาท <span className="font-semibold text-gray-700">&ldquo;{roleName}&rdquo;</span> ไม่มีสิทธิ์เข้าถึงหน้านี้
        </p>
        <p className="text-xs text-gray-400 mb-6">
          กรุณาติดต่อผู้ดูแลระบบหากคุณต้องการสิทธิ์เพิ่มเติม
        </p>
        <div className="flex gap-3">
          <Link
            href={defaultRoute}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            กลับหน้าหลัก
          </Link>
          <Link
            href="/login"
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            เปลี่ยนบัญชี
          </Link>
        </div>

        {/* Permission hint */}
        <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200 text-left max-w-sm w-full">
          <p className="text-xs font-semibold text-gray-600 mb-2">
            บทบาทที่สามารถเข้าถึงหน้านี้:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {allowedRoles.map((r) => (
              <span
                key={r}
                className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium"
              >
                {ROLES[r]?.label ?? r}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * A badge component showing the current user role in the corner of a page.
 * Useful for mockup demonstration.
 */
export function RoleBadge() {
  const { role, user } = useAuth();
  if (!role || !user) return null;
  const roleInfo = ROLES[role];

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-3 flex items-center gap-3 max-w-xs">
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
        {user.nameShort}
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-900">{user.name}</p>
        <p className="text-[10px] text-gray-500">
          {roleInfo.label} — {user.area}
        </p>
      </div>
    </div>
  );
}
