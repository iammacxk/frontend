import api from '../api';

export interface SchoolInfo {
  id: number;
  name: string;
  code?: string;
}

export const schoolService = {
  getSchoolById: async (id: number | string): Promise<SchoolInfo> => {
    const response = await api.get(`/schools/${id}`);
    return response.data;
  },

  getAllSchools: async (): Promise<SchoolInfo[]> => {
    const response = await api.get('/schools');
    return response.data;
  },
};
