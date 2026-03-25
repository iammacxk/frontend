import api from '../api';
import {
  DropoutSummary,
  DropoutTrend,
  DropoutStudent,
  DropoutMapItem,
  DropoutDistrictMapItem,
  RiskSummary,
  RiskGroupedResponse,
  RiskStudent
} from '../types/dashboardTypes';

type ApiErrorResponse = {
  response?: {
    status?: number;
  };
};

function hasApiResponse(error: unknown): error is ApiErrorResponse {
  return typeof error === 'object' && error !== null && 'response' in error;
}

export const dashBoardService = {
  // ============================================
  // DROPOUT APIs — /report-dropout-student
  // ============================================

  /** สรุปยอด dropout (มี dropoutList อยู่ภายใน response) */
  getDropoutSummary: async (params?: {
    academicYear?: string;
    semester?: string;
    gradeLevelId?: string;
    schoolId?: string;
    departmentId?: string;
  }): Promise<DropoutSummary> => {
    try {
      const response = await api.get('/report-dropout-student/summary', { params });
      return response.data;
    } catch (error: unknown) {
      if (hasApiResponse(error) && error.response?.status === 404) {
        return { totalDropout: 0, totalGraduated: 0, dropoutList: [] };
      }
      throw error;
    }
  },

  /** ดึงเฉพาะรายชื่อ dropout จาก summary endpoint */
  getDropoutList: async (params?: {
    academicYear?: string;
    semester?: string;
    gradeLevelId?: string;
    schoolId?: string;
    departmentId?: string;
  }): Promise<DropoutStudent[]> => {
    try {
      const response = await api.get('/report-dropout-student/summary', { params });
      return response.data?.dropoutList ?? [];
    } catch (error: unknown) {
      if (hasApiResponse(error) && error.response?.status === 404) return [];
      throw error;
    }
  },

  /** ข้อมูลแผนที่เด็กหลุด จัดกลุ่มตามจังหวัด */
  getDropoutMap: async (params?: {
    academicYear?: string;
    semester?: string;
    gradeLevelId?: string;
    schoolId?: string;
    departmentId?: string;
  }): Promise<DropoutMapItem[]> => {
    try {
      const response = await api.get('/report-dropout-student/map', { params });
      return response.data;
    } catch (error: unknown) {
      if (hasApiResponse(error) && error.response?.status === 404) return [];
      throw error;
    }
  },

  /** ดึงข้อมูลแผนที่จัดกลุ่มตามจังหวัด+เขต/อำเภอ */
  getDropoutMapDistrict: async (params?: {
    academicYear?: string;
    semester?: string;
    gradeLevelId?: string;
    schoolId?: string;
    departmentId?: string;
    province?: string;
  }): Promise<DropoutDistrictMapItem[]> => {
    try {
      const response = await api.get('/report-dropout-student/map-district', { params });
      return response.data;
    } catch (error: unknown) {
      if (hasApiResponse(error) && error.response?.status === 404) return [];
      throw error;
    }
  },

  getDropoutTrend: async (year: string, semester?: string): Promise<DropoutTrend[]> => {
    try {
      const response = await api.get('/report-dropout-student/trend', {
        params: { year, semester }
      });
      return response.data;
    } catch (error: unknown) {
      if (hasApiResponse(error) && error.response?.status === 404) return [];
      throw error;
    }
  },

  // ============================================
  // RISK APIs — /attendance2/report
  // ============================================

  getRiskSummary: async (params?: {
    academicYear?: string;
    semester?: string;
  }): Promise<RiskSummary> => {
    try {
      const response = await api.get('/attendance2/report/summary', { params });
      return response.data;
    } catch (error: unknown) {
      if (hasApiResponse(error) && error.response?.status === 404) {
        return {
          academicYear: params?.academicYear || '',
          high: 0, medium: 0, watch: 0, neverAbsent: 0, total: 0, totalRisk: 0, totalRiskIncludeWatch: 0
        };
      }
      throw error;
    }
  },

  getRiskStudentsGrouped: async (params?: {
    academicYear?: string;
    semester?: string;
  }): Promise<RiskGroupedResponse> => {
    try {
      const response = await api.get('/attendance2/report/students/grouped', { params });
      return response.data;
    } catch (error: unknown) {
      if (hasApiResponse(error) && error.response?.status === 404) return { high: [], medium: [], watch: [], normal: [] };
      throw error;
    }
  },

  getRiskStudentsFlat: async (params?: {
    academicYear?: string;
    semester?: string;
    riskLevel?: 'high' | 'medium' | 'watch' | 'normal' | string;
  }): Promise<RiskStudent[]> => {
    try {
      const response = await api.get('/attendance2/report/students', { params });
      return response.data;
    } catch (error: unknown) {
      if (hasApiResponse(error) && error.response?.status === 404) return [];
      throw error;
    }
  }
};