// ===== Role Definitions =====
export type UserRole =
  | "System Admin"  // ระดับดูแลระบบ
  | "student"       // ระดับผู้ใช้งานทั่วไป
  | "Area Admin"    // ระดับบริหารพื้นที่
  | "School Admin"  // ระดับโรงเรียน
  | "Policy User"   // ระดับนโยบาย
  | "External User"; // ผู้ใช้ภายนอก

export interface RoleInfo {
  key: UserRole;
  label: string;
  labelEn: string;
  level: string;
  description: string;
}

// ===== Menu Permission Matrix =====
export interface MenuPermission {
  href: string;
  label: string;
  allowedRoles: UserRole[];
  children?: MenuPermission[];
  hideInSidebar?: boolean;
}

// ===== User Profile & API Types =====
export interface ApiUser {
  id: number;
  username: string;
  name: string;
  roleId: number;
  roleName: string;
  schoolId: number | null;
  schoolName: string | null;
  province?: string | null;
  district?: string | null;
  subDistrict?: string | null;
}

export interface LoginResponse {
  access_token: string;
  user: ApiUser;
}
export interface UserProfile {
  name: string;
  nameShort: string;
  email: string;
  role: UserRole;
  area: string;
  schoolId?: string;       // รหัสโรงเรียน — ใช้สำหรับกรองข้อมูล (School Admin)
  schoolName?: string;     // ชื่อโรงเรียนจริง — ใช้แสดงผลเมื่อ resolve จาก schoolId
  province?: string;       // จังหวัด — ใช้สำหรับกรองข้อมูล (Area Admin)
  district?: string;       // อำเภอ — ใช้สำหรับกรองข้อมูล (Area Admin)
  subDistrict?: string;    // ตำบล — ใช้สำหรับกรองข้อมูล (Area Admin)
}

// ===== Demo User Accounts =====
export interface DemoAccount {
  username: string;
  password: string;
  profile: UserProfile;
}

// ===== Auth Context =====
export interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  isLoggedIn: boolean;
  isInitialized: boolean;
  login: (profile: UserProfile) => void;
  loginByUsername: (username: string, password: string) => Promise<UserProfile | null>;
  logout: () => void;
  canAccess: (href: string) => boolean;
}

// ===== Theme Context =====
export interface ThemeContextType {
  isDark: boolean;
  toggleDark: () => void;
}
