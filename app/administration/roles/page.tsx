"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import api from "../../../lib/api";

type RoleItem = {
  id: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

type PermissionRow = {
  role: string;
  label: string;
  dashboard: string;
  students: string;
  absence: string;
  tracking: string;
  reports: string;
  import_: string;
  systemAdmin: string;
};

const DEFAULT_PERMISSIONS: PermissionRow[] = [
  { role: "System Admin", label: "System Admin", dashboard: "full", students: "full", absence: "full", tracking: "full", reports: "full", import_: "full", systemAdmin: "full" },
  { role: "Policy User", label: "Policy User", dashboard: "read", students: "none", absence: "none", tracking: "none", reports: "read", import_: "none", systemAdmin: "none" },
  { role: "province", label: "ศึกษาธิการจังหวัด", dashboard: "read", students: "read", absence: "none", tracking: "read", reports: "read", import_: "read", systemAdmin: "none" },
  { role: "district", label: "ระดับอำเภอ", dashboard: "read", students: "read", absence: "none", tracking: "write", reports: "read", import_: "none", systemAdmin: "none" },
  { role: "subdistrict", label: "ระดับตำบล", dashboard: "read", students: "read", absence: "none", tracking: "write", reports: "read", import_: "none", systemAdmin: "none" },
  { role: "School Admin", label: "School Admin", dashboard: "read", students: "write", absence: "write", tracking: "write", reports: "read", import_: "read", systemAdmin: "none" },
  { role: "Area Admin", label: "Area Admin", dashboard: "read", students: "write", absence: "write", tracking: "write", reports: "read", import_: "read", systemAdmin: "none" },
  { role: "External User", label: "External User", dashboard: "none", students: "none", absence: "none", tracking: "none", reports: "none", import_: "none", systemAdmin: "none" },
  { role: "student", label: "นักเรียน/ผู้ปกครอง", dashboard: "none", students: "none", absence: "none", tracking: "none", reports: "none", import_: "none", systemAdmin: "none" },
];

function PermBadge({ level }: { level: string }) {
  if (level === "full") return <span className="adm-badge adm-badge-admin">จัดการเต็ม</span>;
  if (level === "write") return <span className="adm-badge adm-badge-write">ดู+แก้ไข</span>;
  if (level === "read") return <span className="adm-badge adm-badge-read">ดูอย่างเดียว</span>;
  return <span className="adm-badge adm-badge-deny">ไม่มีสิทธิ์</span>;
}

const ADMIN_TABS = [
  { href: "/administration", label: "จัดการผู้ใช้", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
  { href: "/administration/roles", label: "บทบาทและสิทธิ์", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { href: "/administration/area-access", label: "ขอบเขตพื้นที่", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> },
  { href: "/administration/settings", label: "ตั้งค่าเกณฑ์", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
];

const modules = [
  { key: "dashboard", label: "รายงาน/สถิติ" },
  { key: "students", label: "รายชื่อนักเรียน" },
  { key: "absence", label: "ขาดเรียน" },
  { key: "tracking", label: "ติดตาม" },
  { key: "reports", label: "รายงาน" },
  { key: "import_", label: "นำเข้าข้อมูล" },
  { key: "admin", label: "System Admin" },
];

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null) {
    const response = "response" in error ? (error as { response?: { data?: { message?: string | string[] } } }).response : undefined;
    const message = response?.data?.message;
    if (Array.isArray(message)) {
      return message.join(", ");
    }
    if (typeof message === "string") {
      return message;
    }
  }
  return "ไม่สามารถดำเนินการได้";
}

export default function RolesPermissionPage() {
  const pathname = usePathname();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [roleName, setRoleName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadRoles = async () => {
      try {
        setLoading(true);
        const response = await api.get("/roles");
        setRoles(Array.isArray(response.data) ? response.data : []);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    };

    loadRoles();
  }, []);

  const permissions: PermissionRow[] = roles.length > 0
    ? roles.map((role) => ({
        role: role.name,
        label: role.name,
        dashboard: "read",
        students: "read",
        absence: "read",
        tracking: "read",
        reports: "read",
        import_: "read",
        systemAdmin: role.name === "System Admin" ? "full" : "none",
      }))
    : DEFAULT_PERMISSIONS;

  const handleCreateRole = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const trimmedName = roleName.trim();
    if (!trimmedName) {
      setError("กรุณากรอกชื่อ role");
      return;
    }

    try {
      setSaving(true);
      await api.post("/roles", { name: trimmedName });
      const response = await api.get("/roles");
      setRoles(Array.isArray(response.data) ? response.data : []);
      setRoleName("");
      setSuccess("เพิ่ม role เรียบร้อย");
    } catch (createError) {
      setError(getErrorMessage(createError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="adm-page">
      <div className="adm-tabs">
        {ADMIN_TABS.map((tab) => (
          <Link key={tab.href} href={tab.href} className={`adm-tab${pathname === tab.href ? " active" : ""}`}>
            {tab.icon} {tab.label}
          </Link>
        ))}
      </div>

      <div className="adm-card-desc" style={{ marginBottom: 16 }}>
        หน้านี้เชื่อม backend จริงสำหรับดูและเพิ่ม role ใหม่
      </div>

      <div className="adm-two-col">
        <div className="adm-card" style={{ padding: "18px 20px" }}>
          <div className="adm-card-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--adm-purple)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            เพิ่ม role ใหม่
          </div>

          <form onSubmit={handleCreateRole}>
            <div className="adm-form-grid" style={{ gridTemplateColumns: "1fr auto" }}>
              <div className="adm-form-group">
                <label className="adm-form-label" htmlFor="role-name">ชื่อ role</label>
                <input
                  id="role-name"
                  className="adm-form-input"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="เช่น coordinator"
                />
              </div>
              <div className="adm-form-group" style={{ justifyContent: "end" }}>
                <label className="adm-form-label" style={{ opacity: 0 }}>action</label>
                <button type="submit" className="adm-btn adm-btn-primary" disabled={saving}>
                  {saving ? "กำลังบันทึก..." : "เพิ่ม role"}
                </button>
              </div>
            </div>
          </form>

          {error ? <div className="adm-info-panel" style={{ marginTop: 12, background: "#fef2f2", borderColor: "#fecaca", color: "#991b1b" }}>{error}</div> : null}
          {success ? <div className="adm-info-panel" style={{ marginTop: 12, background: "#f0fdf4", borderColor: "#bbf7d0", color: "#166534" }}>{success}</div> : null}
        </div>

        <div className="adm-card" style={{ padding: "18px 20px" }}>
          <div className="adm-card-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--adm-blue)" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
            สรุป role ในระบบ
          </div>
          {loading ? (
            <div className="adm-card-desc" style={{ marginBottom: 0 }}>กำลังโหลดข้อมูล role...</div>
          ) : (
            <div className="adm-stat-grid" style={{ marginBottom: 0, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
              <div className="adm-stat-card">
                <div className="adm-stat-num" style={{ color: "var(--adm-purple)" }}>{roles.length}</div>
                <div className="adm-stat-lbl">role ทั้งหมด</div>
              </div>
              <div className="adm-stat-card">
                <div className="adm-stat-num" style={{ color: "var(--adm-blue)" }}>{roles.some((role) => role.name === "System Admin") ? 1 : 0}</div>
                <div className="adm-stat-lbl">System Admin</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="adm-card-desc" style={{ marginTop: 12, marginBottom: 16 }}>
        ตารางแสดงสิทธิ์การเข้าถึงของแต่ละบทบาท — <strong>จัดการเต็ม</strong> = ดู+เพิ่ม+แก้ไข+ลบ+ส่งออก | <strong>ดู+แก้ไข</strong> = ดู+เพิ่ม+แก้ไขได้ | <strong>ดูอย่างเดียว</strong> = อ่านได้เท่านั้น
      </div>

      <div className="adm-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px 12px" }}>
          <div className="adm-card-title" style={{ margin: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--adm-purple)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            เมทริกซ์สิทธิ์ตามบทบาท
          </div>
        </div>
        <div className="adm-table-wrap" style={{ borderRadius: 0, boxShadow: "none", border: "none" }}>
          <table className="adm-table">
            <thead>
              <tr>
                <th style={{ minWidth: 160 }}>บทบาท</th>
                {modules.map((m) => <th key={m.key} style={{ textAlign: "center" }}>{m.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {permissions.map((p) => (
                <tr key={p.role}>
                  <td style={{ fontWeight: 700 }}>{p.label}</td>
                  {modules.map((m) => (
                    <td key={m.key} style={{ textAlign: "center" }}>
                      <PermBadge level={p[m.key as keyof PermissionRow] as string} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="adm-info-panel">
        <div className="adm-info-title">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          หมายเหตุ
        </div>
        <ul className="adm-info-list">
          <li>ข้อมูล role จะถูกดึงจาก backend ผ่าน `GET /roles`</li>
          <li>การเพิ่ม role ใช้ `POST /roles` พร้อม field `name`</li>
          <li>ถ้าสร้าง role ซ้ำ จะได้ error ว่า role มีอยู่แล้ว</li>
        </ul>
      </div>
    </div>
  );
}
