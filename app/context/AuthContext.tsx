"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type {
  UserRole,
  RoleInfo,
  MenuPermission,
  UserProfile,
  AuthContextType,
} from "./types";
import { authService } from "../../lib/services/loginService";
import { schoolService } from "../../lib/services/schoolService";

const ROLE_NAME_MAP: Record<string, UserRole> = {
  "System Admin": "System Admin",
  ผู้ดูแลระบบ: "System Admin",
  admin: "System Admin",
  "Policy User": "Policy User",
  ระดับนโยบาย: "Policy User",
  ศึกษาธิการจังหวัด: "Policy User",
  ผู้บริหารสถานศึกษา: "Policy User",
  executive: "Policy User",
  "Area Admin": "Area Admin",
  ครูที่ปรึกษา: "Area Admin",
  ครูประจำชั้น: "Area Admin",
  teacher: "Area Admin",
  "School Admin": "School Admin",
  เจ้าหน้าที่โรงเรียน: "School Admin",
  staff: "School Admin",
  "External User": "External User",
  external: "External User",
  นักเรียน: "student",
  student: "student",
};

function normalizeRole(roleName: string | null | undefined): UserRole {
  if (!roleName) {
    return "External User";
  }

  return ROLE_NAME_MAP[roleName] ?? "External User";
}

function normalizeProfile(profile: UserProfile): UserProfile {
  return {
    ...profile,
    role: normalizeRole(profile.role),
  };
}

async function resolveSchoolNameForProfile(
  apiUser: { schoolId: number | null; schoolName: string | null; province?: string | null },
  role: UserRole
) {
  const fallbackArea = apiUser.province ?? apiUser.schoolName ?? "ทั่วประเทศ";

  if (role !== "School Admin" || apiUser.schoolId == null) {
    return {
      area: fallbackArea,
      schoolName: apiUser.schoolName ?? undefined,
    };
  }

  try {
    const school = await schoolService.getSchoolById(apiUser.schoolId);
    return {
      area: school.name,
      schoolName: school.name,
    };
  } catch (error) {
    console.error("Failed to resolve school name from schoolId", error);
    return {
      area: fallbackArea,
      schoolName: apiUser.schoolName ?? undefined,
    };
  }
}


export const ROLES: Record<UserRole, RoleInfo> = {
  "System Admin": {
    key: "System Admin",
    label: "System Admin",
    labelEn: "System Admin",
    level: "ระบบ",
    description: "ระดับดูแลระบบ",
  },
  student: {
    key: "student",
    label: "นักเรียน/ผู้ปกครอง",
    labelEn: "Student/Guardian",
    level: "ทั่วไป",
    description: "ระดับผู้ใช้งานทั่วไป",
  },
  "Area Admin": {
    key: "Area Admin",
    label: "Area Admin",
    labelEn: "Area Admin",
    level: "บริหารพื้นที่",
    description: "ระดับบริหารพื้นที่",
  },
  "School Admin": {
    key: "School Admin",
    label: "School Admin",
    labelEn: "School Admin",
    level: "โรงเรียน",
    description: "ระดับโรงเรียน",
  },
  "Policy User": {
    key: "Policy User",
    label: "Policy User",
    labelEn: "Policy User",
    level: "นโยบาย",
    description: "ระดับนโยบาย",
  },
  "External User": {
    key: "External User",
    label: "External User",
    labelEn: "External User",
    level: "ภายนอก",
    description: "ผู้ใช้ภายนอก",
  },
};

// ===== Menu Permission Matrix =====
// Defines which roles can access which routes
export const MENU_PERMISSIONS: MenuPermission[] = [
  // ─── Administration (System Admin เท่านั้น) ───
  {
    href: "/administration",
    label: "ตั้งค่าระบบ",
    allowedRoles: ["System Admin"],
  },

  // ─── Dashboard (Policy User + Area Admin) ───
  {
    href: "/dashboard-report",
    label: "ภาพรวม Dashboard",
    allowedRoles: ["Policy User", "Area Admin"],
  },
  {
    href: "/dashboard-report/Dropped-OutStudents",
    label: "นักเรียนหลุดออกจากระบบ",
    allowedRoles: ["Policy User", "Area Admin"],
    hideInSidebar: true,
  },
  {
    href: "/dashboard-report/RepeatedGradeStudents",
    label: "รายชื่อนักเรียนซ้ำชั้น",
    allowedRoles: ["Policy User", "Area Admin"],
    hideInSidebar: true,
  },
  {
    href: "/dashboard-report/At-RiskStudents",
    label: "รายชื่อนักเรียนเสี่ยง",
    allowedRoles: ["Policy User", "Area Admin"],
    hideInSidebar: true,
  },
  {
    href: "/dashboard-report/DataCompleteness",
    label: "ความครบถ้วนข้อมูล",
    allowedRoles: ["Policy User", "Area Admin"],
    hideInSidebar: true,
  },

  // ─── Import (Policy User + School Admin) ───
  {
    href: "/import",
    label: "นำเข้าข้อมูล",
    allowedRoles: ["Policy User", "School Admin"],
  },

  // ─── Export (Policy User เท่านั้น) ───
  {
    href: "/export",
    label: "ส่งออกรายงาน",
    allowedRoles: ["Policy User"],
  },

  // ─── School Admin menus ───
  {
    href: "/student-profile",
    label: "แฟ้มข้อมูลนักเรียน",
    allowedRoles: ["School Admin"],
  },
  {
    href: "/student-tracking",
    label: "ติดตามและจัดการเคส",
    allowedRoles: ["School Admin"],
    children: [
      {
        href: "/student-tracking",
        label: "รายการเคสติดตาม",
        allowedRoles: ["School Admin"],
      },
      {
        href: "/student-tracking/detail",
        label: "รายละเอียดเคส",
        allowedRoles: ["School Admin"],
      },
    ],
  },

  // ─── Student portal (student role) ───
  {
    href: "/student-profile",
    label: "ข้อมูลส่วนตัวนักเรียน",
    allowedRoles: ["student"],
    children: [
      {
        href: "/student-profile",
        label: "ข้อมูลส่วนตัว",
        allowedRoles: ["student"],
      },
      {
        href: "/student-profile/attendance",
        label: "ประวัติการเข้าเรียน",
        allowedRoles: ["student"],
      },
    ],
  },
];

// // ===== Demo User Accounts =====
// export const DEMO_ACCOUNTS: DemoAccount[] = [
//   {
//     username: "admin",
//     password: "1234",
//     profile: {
//       name: "System Admin",
//       nameShort: "แอด",
//       email: "admin@sts-system.go.th",
//       role: "System Admin",
//       area: "ทั่วประเทศ",
//     },
//   },
//   {
//     username: "wichai",
//     password: "1234",
//     profile: {
//       name: "วิชัย นโยบาย",
//       nameShort: "วช",
//       email: "wichai@edu.go.th",
//       role: "Policy User",
//       area: "สภาการศึกษา",
//     },
//   },
//   {
//     username: "prasert",
//     password: "1234",
//     profile: {
//       name: "ประเสริฐ มั่นคง",
//       nameShort: "ปส",
//       email: "prasert@edu.go.th",
//       role: "Policy User",
//       area: "ศึกษาธิการจังหวัด",
//     },
//   },
//   {
//     username: "somying",
//     password: "1234",
//     profile: {
//       name: "สมหญิง รักเรียน",
//       nameShort: "สญ",
//       email: "somying@edu.go.th",
//       role: "Policy User",
//       area: "ผู้อำนวยการโรงเรียน A",
//     },
//   },
//   {
//     username: "somchai",
//     password: "1234",
//     profile: {
//       name: "สมชาย ใจดี",
//       nameShort: "สม",
//       email: "somchai@edu.go.th",
//       role: "Area Admin",
//       area: "ครูโรงเรียน A",
//       schoolId: "school-a",
//     },
//   },
//   // {
//   //   username: "kanokwan",
//   //   password: "1234",
//   //   profile: {
//   //     name: "กนกวรรณ ศรีสุข",
//   //     nameShort: "กน",
//   //     email: "kanokwan@edu.go.th",
//   //     role: "School Admin",
//   //     area: "เจ้าหน้าที่โรงเรียนสวนกุหลาบ",
//   //     schoolId: "ม.1/2",
//   //   },
//   // },
//   {
//     username: "student",
//     password: "1234",
//     profile: {
//       name: "ด.ช. สมชาย มีรักดี",
//       nameShort: "สม",
//       email: "student@sts-system.go.th",
//       role: "student",
//       area: "โรงเรียน A",
//       schoolId: "school-a",
//     },
//   },
//   {
//     username: "staff",
//     password: "staff",
//     profile: {
//       name: "School Admin",
//       nameShort: "ทน",
//       email: "staff@school-a.go.th",
//       role: "School Admin",
//       area: "โรงเรียน A",
//       schoolId: "school-a",
//     },
//   },
// ];

// export function findAccount(username: string, password: string): DemoAccount | undefined {
//   return DEMO_ACCOUNTS.find(
//     (a) => a.username.toLowerCase() === username.toLowerCase() && a.password === password
//   );
// }

export function canAccessRoute(role: UserRole, href: string): boolean {
  // Find all matching permissions
  const matchingPerms = MENU_PERMISSIONS.filter((m) => href.startsWith(m.href));
  if (matchingPerms.length === 0) return false;

  // Find the most specific match (longest href)
  const bestMatch = matchingPerms.reduce((prev, current) =>
    (prev.href.length > current.href.length) ? prev : current
  );

  // If role is undefined/null, handle it
  if (!role) return false;

  // Check if role is in the main allowedRoles
  if (!bestMatch.allowedRoles.includes(role)) return false;

  // If the path is exact to a child, check child permission
  if (bestMatch.children && href.length > bestMatch.href.length) {
    const childMatch = bestMatch.children.find(c => href.startsWith(c.href));
    if (childMatch && childMatch.allowedRoles) {
      return childMatch.allowedRoles.includes(role);
    }
  }

  return true;
}

export function getDefaultRoute(role: UserRole): string {
  if (role === "System Admin") return "/administration";
  if (role === "School Admin") return "/student-profile";
  if (role === "student") return "/student-profile";
  return "/dashboard-report"; // Policy User, Area Admin
}

export function getVisibleMenus(role: UserRole): MenuPermission[] {
  return MENU_PERMISSIONS.filter((m) => m.allowedRoles.includes(role) && !m.hideInSidebar);
}

// ===== Context =====
const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isLoggedIn: false,
  isInitialized: false,
  login: () => { },
  loginByUsername: async () => null,
  logout: () => { },
  canAccess: () => false,
});


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const storedProfile = localStorage.getItem("userProfile");
    if (!storedProfile) {
      return null;
    }

    try {
      return normalizeProfile(JSON.parse(storedProfile) as UserProfile);
    } catch (e) {
      console.error("Failed to parse user profile from localStorage", e);
      return null;
    }
  });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsInitialized(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    if (user?.role !== "School Admin" || !user.schoolId) return;

    let cancelled = false;

    schoolService.getSchoolById(user.schoolId)
      .then((school) => {
        if (cancelled || !school?.name) return;

        const nextProfile: UserProfile = {
          ...user,
          area: school.name,
          schoolName: school.name,
        };

        if (nextProfile.area !== user.area || nextProfile.schoolName !== user.schoolName) {
          setUser(nextProfile);
          localStorage.setItem("userProfile", JSON.stringify(nextProfile));
        }
      })
      .catch((error) => {
        console.error("Failed to refresh school name from cached profile", error);
      });

    return () => {
      cancelled = true;
    };
  }, [isInitialized, user?.role, user?.schoolId, user?.area, user?.schoolName]);

  const login = useCallback((profile: UserProfile) => {
    const normalizedProfile = normalizeProfile(profile);
    setUser(normalizedProfile);
    if (typeof window !== "undefined") {
      localStorage.setItem("userProfile", JSON.stringify(normalizedProfile));
    }
  }, []);

  const loginByUsername = useCallback(async (username: string, password: string): Promise<UserProfile | null> => {
    try {
      const response = await authService.login(username, password);

      if (response && response.user) {
        const apiUser = response.user;

        const role: UserRole = normalizeRole(apiUser.roleName);
        const resolvedSchool = await resolveSchoolNameForProfile(apiUser, role);

        const userProfile: UserProfile = {
          name: apiUser.name ?? apiUser.username,
          nameShort: (apiUser.name ?? apiUser.username).substring(0, 2),
          email: `${apiUser.username}@sts-system.go.th`,
          role,
          area: resolvedSchool.area,
          schoolId: apiUser.schoolId?.toString(),
          schoolName: resolvedSchool.schoolName,
          province: apiUser.province ?? undefined,
          district: apiUser.district ?? undefined,
          subDistrict: apiUser.subDistrict ?? undefined,
        };

        if (response.access_token) {
          localStorage.setItem('token', response.access_token);
        }
        localStorage.setItem('userProfile', JSON.stringify(userProfile));

        setUser(userProfile);
        return userProfile;
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error; // Re-throw to handle error message in login page
    }

    return null;
  }, []);


  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
    setUser(null);
  }, []);


  const canAccess = useCallback(
    (href: string) => {
      if (!user) return false;
      return canAccessRoute(user.role, href);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        isLoggedIn: !!user,
        isInitialized,
        login,
        loginByUsername,
        logout,
        canAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
