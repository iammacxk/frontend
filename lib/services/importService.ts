import api from "../api";
import type {
  PreviewResult,
  ImportConfirmResult,
  ImportHistoryRecord,
} from "../types/importTypes";

// ─── Helper: build FormData from File ─────────────────────
function buildFormData(file: File): FormData {
  const fd = new FormData();
  fd.append("file", file);
  return fd;
}

const MULTIPART_HEADERS = { "Content-Type": "multipart/form-data" };

// ─── Import Service ───────────────────────────────────────

export const importService = {
  // ========== PREVIEW ==========

  /** Preview student file (first 100 rows + validation) */
  previewStudents: async (file: File): Promise<PreviewResult> => {
    const res = await api.post<PreviewResult>(
      "/import/students/preview",
      buildFormData(file),
      { headers: MULTIPART_HEADERS },
    );
    return res.data;
  },

  /** Preview dropout file (first 100 rows + validation) */
  previewDropout: async (file: File): Promise<PreviewResult> => {
    const res = await api.post<PreviewResult>(
      "/import/dropout/preview",
      buildFormData(file),
      { headers: MULTIPART_HEADERS },
    );
    return res.data;
  },

  // ========== CONFIRM ==========

  /** Confirm student import after preview */
  confirmStudents: async (sessionId: string): Promise<ImportConfirmResult> => {
    const res = await api.post<ImportConfirmResult>(
      `/import/students/confirm/${sessionId}`,
    );
    return res.data;
  },

  /** Confirm dropout import after preview */
  confirmDropout: async (sessionId: string): Promise<ImportConfirmResult> => {
    const res = await api.post<ImportConfirmResult>(
      `/import/dropout/confirm/${sessionId}`,
    );
    return res.data;
  },

  // ========== DIRECT IMPORT (no preview) ==========

  /** Direct student import */
  importStudentsDirect: async (file: File): Promise<ImportConfirmResult> => {
    const res = await api.post<ImportConfirmResult>(
      "/import/students",
      buildFormData(file),
      { headers: MULTIPART_HEADERS },
    );
    return res.data;
  },

  /** Direct dropout import */
  importDropoutDirect: async (file: File): Promise<ImportConfirmResult> => {
    const res = await api.post<ImportConfirmResult>(
      "/import/dropout",
      buildFormData(file),
      { headers: MULTIPART_HEADERS },
    );
    return res.data;
  },

  // ========== DOWNLOAD REPORTS ==========

  /** Download error report as xlsx */
  downloadErrorReport: async (reportId: string): Promise<void> => {
    const res = await api.get(`/import/report/${reportId}/errors`, {
      responseType: "blob",
    });
    triggerDownload(res.data, "import_errors.xlsx");
  },

  /** Download skipped report as xlsx */
  downloadSkippedReport: async (reportId: string): Promise<void> => {
    const res = await api.get(`/import/report/${reportId}/skipped`, {
      responseType: "blob",
    });
    triggerDownload(res.data, "import_skipped.xlsx");
  },

  /** Fetch import history from backend */
  getImportHistory: async (): Promise<ImportHistoryRecord[]> => {
    const res = await api.get<ImportHistoryRecord[]>("/import/history");
    return res.data;
  },

  // Download error list จาก history (ถาวร ไม่มีหมดอายุ)
  async downloadHistoryErrorList(id: number): Promise<void> {
    const res = await api.get(`/import/history/${id}/errors/download`, {
      responseType: "blob",
    });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `error_list_${id}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Download raw file เฉพาะ error rows (column เดิมทุก column)
  async downloadHistoryErrorRaw(id: number): Promise<void> {
    const res = await api.get(`/import/history/${id}/errors/raw`, {
      responseType: "blob",
    });
    // ดึงชื่อไฟล์จาก Content-Disposition header
    const disposition = res.headers["content-disposition"] as
      | string
      | undefined;
    const match = disposition?.match(/filename="(.+)"/);
    const fileName = match?.[1] ?? `error_raw_${id}.xlsx`;

    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  },
};

// ─── Utility: trigger file download ──────────────────────
function triggerDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
