import api from '../api';

export const studentService = {
  // Example: Fetch all students
  getStudents: async (params?: any) => {
    const response = await api.get('/students', { params });
    return response.data;
  },

  // Example: Get student details
  getStudentById: async (id: string) => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  // Example: Create student
  createStudent: async (studentData: any) => {
    const response = await api.post('/students', studentData);
    return response.data;
  },
};
