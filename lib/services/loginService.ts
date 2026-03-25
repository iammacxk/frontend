import api from "../api";
import type { LoginResponse } from "../../app/context/types";

export const authService = {
  /**
   * ล็อกอินเข้าสู่ระบบ
   * @param username ชื่อผู้ใช้งาน
   * @param password รหัสผ่าน
   * @returns ข้อมูล Token และ User
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>("/auth/login", {
      username,
      password,
    });
    return response.data;
  },

  /**
   * ถอดถอน Token หรือลงชื่อออก (ถ้า Backend มี Endpoint นี้)
   */
  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      // ignore
    }
  },
};
