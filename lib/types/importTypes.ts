// ===== Import Preview Types =====

export interface PreviewCell {
  value: any;
  hasError: boolean;
  errorMessage?: string;
}

export interface PreviewRow {
  rowNumber: number;
  hasError: boolean;
  cells: Record<string, PreviewCell>;
}

export interface PreviewResult {
  sessionId: string;
  totalRows: number;
  previewRows: PreviewRow[];
  errorCount: number;
  expiresAt: string;
}

// ===== Import Confirm / Direct Import Types =====

export type ImportType = 'students' | 'dropout';

export interface ImportHistoryRecord {
  id: number;
  userId: number | null;
  userName: string | null;
  fileName: string;
  importType: ImportType;
  totalRows: number;
  successCount: number;
  skippedCount: number;
  errorCount: number;
  status: 'completed' | 'failed';
  importedAt: string;
}

export interface ImportConfirmResult {
  totalRows: number;
  successCount: number;
  skippedCount: number;
  errorCount: number;
  reportId: string;
  reportExpiresIn: string;
}
