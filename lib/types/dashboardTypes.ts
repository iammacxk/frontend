

export type StudentStatus = "new" | "monitoring" | "resolved";
export type CompletenessStatus = "complete" | "incomplete" | "grace";

// ── UI-Layer types (used by sub-pages for display) ──

/** นักเรียนเสี่ยงหลุดออก (ใช้แสดงผลในหน้า At-Risk) */
export interface AtRiskStudent {
  studentId: string;
  name: string;
  school: string;      
  grade: string;       
  province: string;
  absenceDays: number;  
  absencePattern: string;
  riskLevel: "สูง" | "กลาง" | "เฝ้าระวัง";
  latestAction: string;
}

/** นักเรียนหลุดออกจากระบบ (ใช้แสดงผลในหน้า Dropped-Out) */
export interface DroppedOutStudent {
  studentId: string;
  name: string;
  school: string;
  grade: string;
  province: string;
  lastSeen: string;
  groupedReason: string;
  detail: string;
  supportStatus: StudentStatus;
}

/** นักเรียนซ้ำชั้น */
export interface RepeatedGradeStudent {
  studentId: string;
  name: string;
  school: string;
  province: string;
  previousYear: string;
  previousGrade: string;
  currentYear: string;
  currentGrade: string;
  homeroomTeacher: string;
  remark: string;
}

/** ความครบถ้วนของข้อมูล */
export interface CompletenessItem {
  province: string;
  district: string;
  school: string;
  submissionRound: string;
  status: CompletenessStatus;
  missingFields: string;
  dueDate: string;
  note: string;
}

// ============================================
// DROPOUT TYPES (Aligned with Backend)
// ============================================

export interface DropoutTrend {
  year: string;
  dropout: number;
}

/** ข้อมูลดิบจาก Backend dropout endpoint (StudentPerTerm entity) */
export interface DropoutStudent {
  id?: number;
  academicYear?: string;
  semester?: string;
  schoolAdmissionYear?: string;
  gpax?: string;
  student_id?: number;
  school_id?: number;
  gradeLevel_id?: number;
  studentStatus_id?: number;
  department_id?: number;
  createdAt?: string;
  updatedAt?: string;
  dropoutReason?: string;
}

export interface DropoutSummary {
  totalDropout: number;
  totalGraduated: number;
  dropoutList: DropoutStudent[];
}

export interface DropoutMapItem {
  province: string;
  count: number;
  reasons: { reason: string; count: number }[];
}

export interface DropoutDistrictMapItem {
  province: string;
  district: string;
  count: number;
  reasons: { reason: string; count: number }[];
}

export interface DropoutComparison {
  current: number;
  previous: number;
  diff: number;
  trend: "increase" | "decrease" | "same";
}

// ============================================
// RISK TYPES (Aligned with Backend /attendance2)
// ============================================

export interface RiskSummary {
  academicYear: string;
  semester?: string;
  high: number;
  medium: number;
  watch: number;
  neverAbsent: number;
  total: number;
  totalRisk: number;
  totalRiskIncludeWatch: number;
}

/** ข้อมูลดิบจาก Backend risk endpoint */
export interface RiskStudent {
  studentId: number;
  firstName: string;
  lastName: string;
  gradeLevel: string | null;
  department: string | null;
  studentStatus: string | null;
  gpax: string | null;
  unexcusedDays: number;
  excusedDays: number;
  totalAbsentDays: number;
  weightedDays: number;
  riskLevel: 'high' | 'medium' | 'watch' | 'normal' | string;
}

export interface RiskGroupedResponse {
  high: RiskStudent[];
  medium: RiskStudent[];
  watch: RiskStudent[];
  normal: RiskStudent[];
}
