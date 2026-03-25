import api from "../api";
import type {
  RepeatGradeFilter,
  RepeatGradeItem,
  RepeatGradeSummaryResponse,
} from "../types/repeatTypes";

type ApiErrorResponse = {
  response?: {
    status?: number;
  };
};

function hasApiResponse(error: unknown): error is ApiErrorResponse {
  return typeof error === "object" && error !== null && "response" in error;
}

export const repeatService = {
  /**
   * summary + repeatedList
   * GET /report-repeat-grade/summary
   */
  async getSummary(
    params?: RepeatGradeFilter
  ): Promise<RepeatGradeSummaryResponse> {
    try {
      const res = await api.get<RepeatGradeSummaryResponse>(
        "/report-repeat-grade/summary",
        { params }
      );
      return res.data;
    } catch (error: unknown) {
      if (hasApiResponse(error) && error.response?.status === 404) {
        return {
          totalRepeated: 0,
          poorGpa: 0,
          attendanceOverThreshold: 0,
          transferOrPersonal: 0,
          unknown: 0,
          repeatedList: [],
        };
      }
      throw error;
    }
  },

  /**
   * ดึงเฉพาะ list สำหรับตาราง
   */
  async getAll(params?: RepeatGradeFilter): Promise<RepeatGradeItem[]> {
    const summary = await this.getSummary(params);
    return summary.repeatedList ?? [];
  },
};