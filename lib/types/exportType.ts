import type { RepeatGradeItem } from './repeatTypes';

export type ExportPageTab = 'at-risk' | 'dropout' | 'repeated' | 'disabled';

export type ExportBackendType =
	| 'attendance-risk'
	| 'dropout'
	| 'repeat-grade'
	| 'disability';

export type ExportFileFormat = 'xlsx' | 'pdf';

export interface ExportFilterOptions {
	academicYears: string[];
	provinces: string[];
}

export interface ExportQueryParams {
	academicYear?: string;
	semester?: string;
}

export interface CountItem {
	label: string;
	count: number;
}

export interface DropoutCauseSummaryItem {
	cause: string;
	count: number;
	percentage: string;
}

export interface DisabilityTypeSummaryItem {
	type: string;
	count: number;
	percentage: string;
}

export interface RawCountItem {
	label?: string;
	province?: string;
	cause?: string;
	gradeLevel?: string;
	type?: string;
	count?: number | string;
}

export interface DropoutSummaryResponse {
	total: number | string;
	byProvince: Array<{ province?: string; count?: number | string }>;
	byCause: Array<{ cause?: string; count?: number | string }>;
	byGradeLevel: Array<{ gradeLevel?: string; count?: number | string }>;
}

export interface DropoutListResponseItem {
	personId?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	gradeLevel?: { name?: string | null } | null;
	academicYear?: string | null;
	schoolName?: string | null;
	statusCodeCause?: string | null;
	remark?: string | null;
	student?: {
		personId?: string | null;
		firstName?: string | null;
		lastName?: string | null;
	} | null;
}

export interface DisabledSummaryResponse {
	total: number | string;
	byDisabilityType: Array<{ type?: string; count?: number | string }>;
	byProvince: Array<{ province?: string; count?: number | string }>;
}

export interface DisabledListResponseItem {
	personId?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	disability?: string | { name?: string | null } | null;
	gender?: string | { name?: string | null } | null;
	nationality?: string | { name?: string | null } | null;
}

export interface RiskSummary {
	academicYear: string;
	semester?: string;
	high: number;
	medium: number;
	watch: number;
	normal: number;
	neverAbsent: number;
	total: number;
	totalRisk: number;
	totalRiskIncludeWatch: number;
}

export interface RiskStudentItem {
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
	high: RiskStudentItem[];
	medium: RiskStudentItem[];
	watch: RiskStudentItem[];
	normal: RiskStudentItem[];
}

export interface DropoutSummary {
	total: number;
	byProvince: CountItem[];
	byCause: CountItem[];
	byGradeLevel: CountItem[];
}

export interface DropoutListItem {
	personId: string;
	firstName: string;
	lastName: string;
	gradeLevel: string;
	academicYear: string;
	schoolName: string;
	statusCodeCause: string;
	remark: string;
}

export interface DisabledSummary {
	total: number;
	byDisabilityType: CountItem[];
	byProvince: CountItem[];
}

export interface DisabledListItem {
	personId: string;
	firstName: string;
	lastName: string;
	disability: string;
	gender: string;
	nationality: string;
}

export type { RepeatGradeItem };
