// ============================================
// REPEAT-GRADE TYPES (Aligned with Backend /report-repeat-grade)
// ============================================

/** ข้อมูลดิบแต่ละรายการจาก Backend */
export interface RepeatGradeItem {
  studentId: number | null;
  personId: string | null;
  fullName: string;

  academicYear: string;
  semester: string | null;

  previousAcademicYear: string;
  previousSemester: string | null;

  schoolId: number | null;
  schoolCode: string | null;
  schoolName: string | null;

  gradeLevelId: number | null;
  gradeLevelCode: string | null;
  gradeLevelName: string | null;

  previousGradeLevelId: number | null;
  previousGradeLevelCode: string | null;
  previousGradeLevelName: string | null;

  departmentId: number | null;
  departmentCode: string | null;
  departmentName: string | null;

  currentGpax: string | null;
  gpaxYearAvg: string | number | null;

  absentDays: number;
  excusedDays: number;
  unexcusedDays: number;
  weightedDays: number;
  riskLevel: "high" | "medium" | "watch" | "normal" | string | null;

  reason: string;
}

/** query filter */
export interface RepeatGradeFilter {
  academicYear?: string;
  semester?: string;
}

/** response จาก /report-repeat-grade/summary */
export interface RepeatGradeSummaryResponse {
  totalRepeated: number;
  poorGpa: number;
  attendanceOverThreshold: number;
  transferOrPersonal: number;
  unknown: number;
  repeatedList: RepeatGradeItem[];
}