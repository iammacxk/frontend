import api from '../api';
import type {
	DisabledListItem,
	DisabledSummary,
	DisabledListResponseItem,
	DisabledSummaryResponse,
	DisabilityTypeSummaryItem,
	DropoutListItem,
	DropoutSummary,
	DropoutListResponseItem,
	DropoutSummaryResponse,
	DropoutCauseSummaryItem,
	ExportBackendType,
	ExportFileFormat,
	ExportFilterOptions,
	ExportQueryParams,
	RawCountItem,
	RiskGroupedResponse,
	RiskSummary,
} from '../types/exportType';
import type { RepeatGradeItem } from '../types/repeatTypes';

type DownloadResponse = {
	data: Blob;
	headers: Record<string, string | undefined>;
};

type DropoutSummaryApi = {
	totalDropout: number;
	totalExternal: number;
	totalDropoutCombined: number;
	dropoutList: Array<{
		gradeLevel?: { name?: string | null } | null;
		dropoutReason?: string | null;
		province?: string | null;
	}>;
};

type DisabilityPreviewItem = {
	personId?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	disability?: string | null;
	gender?: string | null;
	nationality?: string | null;
	province?: string | null;
};

function normalizeCountItem(item: RawCountItem) {
	return {
		label: item.label ?? item.province ?? item.cause ?? item.gradeLevel ?? item.type ?? 'ไม่ระบุ',
		count: Number(item.count ?? 0),
	};
}

function normalizeDropoutListItem(item: DropoutListResponseItem): DropoutListItem {
	return {
		personId: item.personId ?? item.student?.personId ?? '-',
		firstName: item.firstName ?? item.student?.firstName ?? '-',
		lastName: item.lastName ?? item.student?.lastName ?? '-',
		gradeLevel: item.gradeLevel?.name ?? '-',
		academicYear: item.academicYear ?? '-',
		schoolName: item.schoolName ?? '-',
		statusCodeCause: item.statusCodeCause ?? '-',
		remark: item.remark ?? '-',
	};
}

function normalizeDisabledListItem(item: DisabledListResponseItem): DisabledListItem {
	const disability = typeof item.disability === 'string' ? item.disability : item.disability?.name;
	const gender = typeof item.gender === 'string' ? item.gender : item.gender?.name;
	const nationality = typeof item.nationality === 'string' ? item.nationality : item.nationality?.name;

	return {
		personId: item.personId ?? '-',
		firstName: item.firstName ?? '-',
		lastName: item.lastName ?? '-',
		disability: disability ?? '-',
		gender: gender ?? '-',
		nationality: nationality ?? '-',
	};
}

function parseFileName(disposition?: string): string | null {
	if (!disposition) {
		return null;
	}

	const encodedMatch = disposition.match(/filename\*=(?:UTF-8'')?([^;]+)/i);
	if (encodedMatch?.[1]) {
		return decodeURIComponent(encodedMatch[1].replace(/^"|"$/g, ''));
	}

	const plainMatch = disposition.match(/filename=([^;]+)/i);
	if (plainMatch?.[1]) {
		return plainMatch[1].replace(/^"|"$/g, '');
	}

	return null;
}

function triggerDownload(blob: Blob, filename: string) {
	const url = window.URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	window.URL.revokeObjectURL(url);
}

function buildQuery(params?: ExportQueryParams) {
	return Object.fromEntries(
		Object.entries(params ?? {}).filter(([, value]) => value != null && value !== ''),
	);
}

function toDropoutSummary(data: DropoutSummaryApi): DropoutSummary {
	const list = data.dropoutList ?? [];
	const total = data.totalDropoutCombined ?? list.length;

	const provinceMap = new Map<string, number>();
	const causeMap = new Map<string, number>();
	const gradeMap = new Map<string, number>();

	for (const item of list) {
		const province = item.province ?? 'ไม่ระบุ';
		provinceMap.set(province, (provinceMap.get(province) ?? 0) + 1);

		const cause = item.dropoutReason ?? 'ไม่ทราบสาเหตุ';
		causeMap.set(cause, (causeMap.get(cause) ?? 0) + 1);

		const grade = item.gradeLevel?.name ?? 'ไม่ระบุ';
		gradeMap.set(grade, (gradeMap.get(grade) ?? 0) + 1);
	}

	const toSorted = (m: Map<string, number>) =>
		[...m.entries()]
			.map(([label, count]) => ({ label, count }))
			.sort((a, b) => b.count - a.count);

	return {
		total,
		byProvince: toSorted(provinceMap),
		byCause: toSorted(causeMap),
		byGradeLevel: toSorted(gradeMap),
	};
}

function mergeCountList(a: Array<{ label: string; count: number }>, b: Array<{ label: string; count: number }>) {
	const merged = new Map<string, number>();
	for (const item of a) {
		merged.set(item.label, (merged.get(item.label) ?? 0) + item.count);
	}
	for (const item of b) {
		merged.set(item.label, (merged.get(item.label) ?? 0) + item.count);
	}

	return [...merged.entries()]
		.map(([label, count]) => ({ label, count }))
		.sort((x, y) => y.count - x.count);
}

function selectRepeatGradeItems(items: RepeatGradeItem[], params: ExportQueryParams = {}): RepeatGradeItem[] {
	const query = buildQuery(params);

	return items.filter((item) => {
		if (query.academicYear && item.academicYear !== query.academicYear) {
			return false;
		}
		if (query.semester && item.semester !== query.semester) {
			return false;
		}
		return true;
	});
}

export const exportService = {
	getFilterOptions: async (): Promise<ExportFilterOptions> => {
		const response = await api.get<{ academicYears?: string[]; provinces?: string[] }>('/report/filter-options');
		return {
			academicYears: response.data.academicYears?.length ? response.data.academicYears : ['2567'],
			provinces: response.data.provinces ?? [],
		};
	},

	getRiskSummary: async (params: ExportQueryParams): Promise<RiskSummary> => {
		const query = buildQuery(params);

		// When semester is not selected (both terms), compute by summing term 1 + term 2
		// so yearly numbers match the expected "semester1 + semester2" behavior.
		if (!query.semester) {
			const fetchSemesterSummary = async (semester: '1' | '2'): Promise<RiskSummary> => {
				try {
					const response = await api.get<RiskSummary>('/attendance2/report/summary', {
						params: { ...query, semester },
					});
					return response.data;
				} catch {
					return {
						academicYear: String(query.academicYear ?? ''),
						semester,
						high: 0,
						medium: 0,
						watch: 0,
						normal: 0,
						neverAbsent: 0,
						total: 0,
						totalRisk: 0,
						totalRiskIncludeWatch: 0,
					};
				}
			};

			const [s1, s2] = await Promise.all([
				fetchSemesterSummary('1'),
				fetchSemesterSummary('2'),
			]);

			const high = s1.high + s2.high;
			const medium = s1.medium + s2.medium;
			const watch = s1.watch + s2.watch;
			const normal = s1.normal + s2.normal;
			const neverAbsent = s1.neverAbsent + s2.neverAbsent;
			const total = s1.total + s2.total;

			return {
				academicYear: String(query.academicYear ?? s1.academicYear ?? s2.academicYear ?? ''),
				high,
				medium,
				watch,
				normal,
				neverAbsent,
				total,
				totalRisk: high + medium,
				totalRiskIncludeWatch: high + medium + watch,
			};
		}

		const response = await api.get<RiskSummary>('/attendance2/report/summary', {
			params: query,
		});
		return response.data;
	},

	getRiskStudentsGrouped: async (params: ExportQueryParams): Promise<RiskGroupedResponse> => {
		const query = buildQuery(params);

		if (query.academicYear && !query.semester) {
			const fetchSemesterGrouped = async (semester: '1' | '2'): Promise<RiskGroupedResponse> => {
				try {
					const response = await api.get<RiskGroupedResponse>('/attendance2/report/students/grouped', {
						params: { ...query, semester },
					});
					return response.data;
				} catch {
					return { high: [], medium: [], watch: [], normal: [] };
				}
			};

			const [s1, s2] = await Promise.all([
				fetchSemesterGrouped('1'),
				fetchSemesterGrouped('2'),
			]);

			return {
				high: [...s1.high, ...s2.high],
				medium: [...s1.medium, ...s2.medium],
				watch: [...s1.watch, ...s2.watch],
				normal: [...s1.normal, ...s2.normal],
			};
		}

		const response = await api.get<RiskGroupedResponse>('/attendance2/report/students/grouped', {
			params: query,
		});
		return response.data;
	},

	getDropoutSummary: async (params: ExportQueryParams): Promise<DropoutSummary> => {
		const query = buildQuery(params);

		if (query.academicYear && !query.semester) {
			const fetchSemesterSummary = async (semester: '1' | '2'): Promise<DropoutSummary> => {
				try {
					const response = await api.get<DropoutSummaryApi>('/report-dropout-student/summary', {
						params: { ...query, semester },
					});
					return toDropoutSummary(response.data);
				} catch {
					return {
						total: 0,
						byProvince: [],
						byCause: [],
						byGradeLevel: [],
					};
				}
			};

			const [s1, s2] = await Promise.all([
				fetchSemesterSummary('1'),
				fetchSemesterSummary('2'),
			]);

			return {
				total: s1.total + s2.total,
				byProvince: mergeCountList(s1.byProvince, s2.byProvince),
				byCause: mergeCountList(s1.byCause, s2.byCause),
				byGradeLevel: mergeCountList(s1.byGradeLevel, s2.byGradeLevel),
			};
		}

		// Try new endpoint first (richer data), fall back to old /report/dropout/summary
		try {
			const response = await api.get<DropoutSummaryApi>('/report-dropout-student/summary', { params: query });
			return toDropoutSummary(response.data);
		} catch {
			// fallback to old endpoint
			const response = await api.get<DropoutSummaryResponse>('/report/dropout/summary', {
				params: query,
			});
			return {
				total: Number(response.data.total ?? 0),
				byProvince: response.data.byProvince.map(normalizeCountItem),
				byCause: response.data.byCause.map(normalizeCountItem),
				byGradeLevel: response.data.byGradeLevel.map(normalizeCountItem),
			};
		}
	},

	getDropoutCauseSummary: async (params: ExportQueryParams): Promise<DropoutCauseSummaryItem[]> => {
		// Compute from new endpoint's dropoutList (has dropoutReason)
		try {
			const response = await api.get<{
				totalDropoutCombined: number;
				dropoutList: Array<{ dropoutReason?: string | null }>;
			}>('/report-dropout-student/summary', { params: buildQuery(params) });

			const list = response.data.dropoutList ?? [];
			const total = list.length;

			const causeMap = new Map<string, number>();
			for (const item of list) {
				const key = item.dropoutReason ?? 'ไม่ทราบสาเหตุ';
				causeMap.set(key, (causeMap.get(key) ?? 0) + 1);
			}

			return [...causeMap.entries()]
				.sort((a, b) => b[1] - a[1])
				.map(([cause, count]) => ({
					cause,
					count,
					percentage: total > 0 ? ((count / total) * 100).toFixed(2) : '0.00',
				}));
		} catch {
			// fallback to old endpoint
			const response = await api.get<DropoutCauseSummaryItem[]>('/export/dropout-summary', {
				params: buildQuery(params),
			});
			return response.data;
		}
	},

	getDropoutList: async (params: ExportQueryParams = {}): Promise<DropoutListItem[]> => {
		const query = buildQuery(params);

		if (query.academicYear && !query.semester) {
			const fetchSemesterList = async (semester: '1' | '2'): Promise<DropoutListItem[]> => {
				try {
					const response = await api.get<{
						dropoutList: DropoutListResponseItem[];
					}>('/report-dropout-student/summary', {
						params: { ...query, semester },
					});
					return (response.data.dropoutList ?? []).map(normalizeDropoutListItem);
				} catch {
					return [];
				}
			};

			const [s1, s2] = await Promise.all([
				fetchSemesterList('1'),
				fetchSemesterList('2'),
			]);
			return [...s1, ...s2];
		}

		try {
			const response = await api.get<{
				dropoutList: DropoutListResponseItem[];
			}>('/report-dropout-student/summary', { params: query });
			return (response.data.dropoutList ?? []).map(normalizeDropoutListItem);
		} catch {
			const response = await api.get<DropoutListResponseItem[]>('/report/dropout/list', {
				params: query,
			});
			return response.data.map(normalizeDropoutListItem);
		}
	},


	getRepeatGradeList: async (params: ExportQueryParams = {}): Promise<RepeatGradeItem[]> => {
		const response = await api.get<RepeatGradeItem[]>('/repeat-grade');
		return selectRepeatGradeItems(response.data, params);
	},

	getRepeatGradeListByAcademicYear: async (academicYear: string): Promise<RepeatGradeItem[]> => {
		const response = await api.get<RepeatGradeItem[]>('/repeat-grade');
		return selectRepeatGradeItems(response.data, { academicYear });
	},

	getDisabledSummary: async (params: ExportQueryParams = {}): Promise<DisabledSummary> => {
		try {
			const response = await api.get<DisabilityPreviewItem[]>('/export/preview', {
				params: { type: 'disability', ...buildQuery(params) },
			});
			const rows = response.data ?? [];

			const byType = new Map<string, number>();
			const byProvince = new Map<string, number>();
			for (const row of rows) {
				const type = row.disability ?? 'ไม่ระบุ';
				const province = row.province ?? 'ไม่ระบุ';
				byType.set(type, (byType.get(type) ?? 0) + 1);
				byProvince.set(province, (byProvince.get(province) ?? 0) + 1);
			}

			const toSorted = (m: Map<string, number>) =>
				[...m.entries()]
					.map(([label, count]) => ({ label, count }))
					.sort((a, b) => b.count - a.count);

			return {
				total: rows.length,
				byDisabilityType: toSorted(byType),
				byProvince: toSorted(byProvince),
			};
		} catch {
			// fallback: old endpoint
			const response = await api.get<DisabledSummaryResponse>('/report/disabled/summary');
			return {
				total: Number(response.data.total ?? 0),
				byDisabilityType: (response.data.byDisabilityType ?? []).map(normalizeCountItem),
				byProvince: (response.data.byProvince ?? []).map(normalizeCountItem),
			};
		}
	},

	getDisabilityTypeSummary: async (params: ExportQueryParams = {}): Promise<DisabilityTypeSummaryItem[]> => {
		try {
			const summary = await exportService.getDisabledSummary(params);
			return summary.byDisabilityType.map((item) => ({
				type: item.label,
				count: item.count,
				percentage: summary.total > 0 ? ((item.count / summary.total) * 100).toFixed(2) : '0.00',
			}));
		} catch {
			return [];
		}
	},

	getDisabledList: async (params: ExportQueryParams = {}): Promise<DisabledListItem[]> => {
		try {
			const response = await api.get<DisabilityPreviewItem[]>('/export/preview', {
				params: { type: 'disability', ...buildQuery(params) },
			});
			return (response.data ?? []).map((item) => ({
				personId: item.personId ?? '-',
				firstName: item.firstName ?? '-',
				lastName: item.lastName ?? '-',
				disability: item.disability ?? '-',
				gender: item.gender ?? '-',
				nationality: item.nationality ?? '-',
			}));
		} catch {
			const response = await api.get<DisabledListResponseItem[]>('/report/disabled/list');
			return response.data.map(normalizeDisabledListItem);
		}
	},

	downloadReport: async (
		type: ExportBackendType,
		format: ExportFileFormat,
		params?: ExportQueryParams,
	): Promise<void> => {
		const query = buildQuery(params);

		// Backend dropout PDF can return empty when semester is omitted.
		// Force semester 1 as a safe default for PDF export.
		if (type === 'dropout' && format === 'pdf' && !query.semester) {
			query.semester = '1';
		}

		const response = (await api.get(`/export/${format}`, {
			params: { type, ...query },
			responseType: 'blob',
		})) as DownloadResponse;

		const fallbackName = `${type}.${format}`;
		const fileName = parseFileName(response.headers['content-disposition']) ?? fallbackName;
		triggerDownload(response.data, fileName);
	},
};
