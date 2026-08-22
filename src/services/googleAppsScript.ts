import {
  BankSoal,
  User,
  StatsOverview,
  CategoryItem,
  AuditLogItem,
  FilterParams,
  GoogleIntegrationConfig,
  GoogleStorageProfile,
  DriveSyncResult,
  MigrationReport,
  ConnectionTestResult,
} from '../types';

/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT CLIENT SERVICE
 * ==============================================================================
 * Backend Gateway Client untuk integrasi Google Drive (Penyimpanan PDF)
 * dan Google Spreadsheet (Database & Index Metadata).
 * 
 * Endpoint Wajib:
 * https://script.google.com/macros/s/AKfycbyF6dpVrbMemA7gy-Yt6Iyb9aw5CO8TxjtLAKpWzdZvbqucSmyAjvYpvF7D3XTw_g-EkA/exec
 * ==============================================================================
 */

export const GOOGLE_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyF6dpVrbMemA7gy-Yt6Iyb9aw5CO8TxjtLAKpWzdZvbqucSmyAjvYpvF7D3XTw_g-EkA/exec';

let activeUserId: string = 'u-1';

export function setApiActiveUser(userId: string) {
  activeUserId = userId;
  try {
    localStorage.setItem('bank_soal_user_id', userId);
  } catch {}
}

export function getApiActiveUser(): string {
  try {
    const saved = localStorage.getItem('bank_soal_user_id');
    if (saved) activeUserId = saved;
  } catch {}
  return activeUserId;
}

/**
 * Server-Side Proxy Request Helper
 * Meneruskan request melalui backend Express untuk menghindari isu CORS pada browser,
 * menjaga token dan keamanan, serta memastikan data tersimpan sinkron di Google Drive & Sheets.
 */
async function proxyRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('x-user-id', getApiActiveUser());
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const res = await fetch(endpoint, { ...options, headers });
    if (!res.ok) {
      let errMsg = 'Terjadi kesalahan sistem';
      try {
        const errJson = await res.json();
        errMsg = errJson.error || errJson.message || errMsg;
      } catch {
        errMsg = `HTTP Error ${res.status}: ${res.statusText}`;
      }
      throw new Error(errMsg);
    }
    return (await res.json()) as T;
  } catch (err: any) {
    if (err.message && err.message.includes('Failed to fetch')) {
      throw new Error('Server Google Apps Script tidak dapat dihubungi.');
    }
    throw err;
  }
}

/**
 * Layanan Tunggal Integrasi Google Apps Script
 */
export const googleAppsScriptService = {
  /**
   * ==============================================================================
   * MULTI GOOGLE STORAGE PROFILES CLIENT
   * ==============================================================================
   */
  getStorageProfiles: async (): Promise<{ profiles: GoogleStorageProfile[]; active_profile: GoogleStorageProfile }> => {
    return proxyRequest<{ profiles: GoogleStorageProfile[]; active_profile: GoogleStorageProfile }>('/api/storage');
  },

  getActiveStorageProfile: async (): Promise<{ profile: GoogleStorageProfile }> => {
    return proxyRequest<{ profile: GoogleStorageProfile }>('/api/storage/active');
  },

  createStorageProfile: async (data: Partial<GoogleStorageProfile>): Promise<{ success: boolean; profile: GoogleStorageProfile }> => {
    return proxyRequest<{ success: boolean; profile: GoogleStorageProfile }>('/api/storage', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateStorageProfile: async (id: string, updates: Partial<GoogleStorageProfile>): Promise<{ success: boolean; profile: GoogleStorageProfile }> => {
    return proxyRequest<{ success: boolean; profile: GoogleStorageProfile }>(`/api/storage/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteStorageProfile: async (id: string): Promise<{ success: boolean; message: string; newActiveId?: string }> => {
    return proxyRequest<{ success: boolean; message: string; newActiveId?: string }>(`/api/storage/${id}`, {
      method: 'DELETE',
    });
  },

  setActiveStorageProfile: async (id: string): Promise<{ success: boolean; message: string; active_profile: GoogleStorageProfile }> => {
    return proxyRequest<{ success: boolean; message: string; active_profile: GoogleStorageProfile }>(`/api/storage/${id}/activate`, {
      method: 'POST',
    });
  },

  deactivateStorageProfile: async (id: string): Promise<{ success: boolean; message: string; active_profile: GoogleStorageProfile }> => {
    return proxyRequest<{ success: boolean; message: string; active_profile: GoogleStorageProfile }>(`/api/storage/${id}/deactivate`, {
      method: 'POST',
    });
  },

  testStorageProfile: async (id: string): Promise<ConnectionTestResult> => {
    return proxyRequest<ConnectionTestResult>(`/api/storage/${id}/test`, {
      method: 'POST',
    });
  },

  testCustomStorageProfile: async (data: Partial<GoogleStorageProfile>): Promise<ConnectionTestResult> => {
    return proxyRequest<ConnectionTestResult>('/api/storage/test', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  syncStorageProfile: async (id?: string): Promise<DriveSyncResult> => {
    const endpoint = id ? `/api/storage/${id}/sync` : '/api/storage/active/sync';
    return proxyRequest<DriveSyncResult>(endpoint, {
      method: 'POST',
    });
  },

  /**
   * Health Check ke Google Apps Script Web App
   */
  healthCheck: async (): Promise<{ success: boolean; status: string; message: string; timestamp?: string }> => {
    try {
      const res = await proxyRequest<ConnectionTestResult>('/api/google/test-connection', { method: 'POST' });
      return {
        success: res.apps_script.reachable,
        status: res.apps_script.reachable ? 'ONLINE' : 'OFFLINE',
        message: res.apps_script.message,
        timestamp: res.timestamp,
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'OFFLINE',
        message: 'Server Google Apps Script tidak dapat dihubungi.',
      };
    }
  },

  /**
   * Dapatkan Informasi Folder Utama Google Drive
   */
  getDriveInfo: async (): Promise<{ success: boolean; folderName: string; folderId: string; status: string }> => {
    try {
      const configRes = await proxyRequest<{ config: GoogleIntegrationConfig }>('/api/google/config');
      return {
        success: true,
        folderName: configRes.config.drive_root_name || 'BANK SOAL DIGITAL',
        folderId: configRes.config.drive_root_folder_id,
        status: 'ONLINE',
      };
    } catch {
      return {
        success: false,
        folderName: 'BANK SOAL DIGITAL',
        folderId: '1xptzL_8Ev9xP8vWqg38-_M9CnQhgbQ2C',
        status: 'OFFLINE',
      };
    }
  },

  /**
   * Dapatkan Informasi Spreadsheet Metadata Google Sheets
   */
  getSheetsInfo: async (): Promise<{ success: boolean; spreadsheetName: string; spreadsheetId: string; status: string }> => {
    try {
      const configRes = await proxyRequest<{ config: GoogleIntegrationConfig }>('/api/google/config');
      return {
        success: true,
        spreadsheetName: configRes.config.spreadsheet_name || 'BANK SOAL DIGITAL',
        spreadsheetId: configRes.config.spreadsheet_id,
        status: 'ONLINE',
      };
    } catch {
      return {
        success: false,
        spreadsheetName: 'BANK SOAL DIGITAL',
        spreadsheetId: '1xetHb6N-ylyV3P2vs-okohHbsX1MnxfptJDJlqVYwPc',
        status: 'OFFLINE',
      };
    }
  },

  /**
   * Uji Koneksi Live Lengkap (Apps Script, Drive, Sheets)
   */
  testConnection: (): Promise<ConnectionTestResult> => {
    return proxyRequest<ConnectionTestResult>('/api/google/test-connection', { method: 'POST' });
  },

  /**
   * Mengambil daftar dokumen Bank Soal dari Google Spreadsheet
   */
  getDocuments: (params: FilterParams = {}): Promise<{ items: BankSoal[]; total: number; page: number; totalPages: number }> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    return proxyRequest<{ items: BankSoal[]; total: number; page: number; totalPages: number }>(
      `/api/bank-soal?${query.toString()}`
    );
  },

  /**
   * Pencarian Multi-Filter Bank Soal
   */
  searchDocuments: (filters: FilterParams): Promise<{ items: BankSoal[]; total: number; page: number; totalPages: number }> => {
    return googleAppsScriptService.getDocuments(filters);
  },

  /**
   * Mengambil 1 dokumen Bank Soal berdasarkan ID dari Google Spreadsheet
   */
  getDocument: (id: string): Promise<{ item: BankSoal }> => {
    return proxyRequest<{ item: BankSoal }>(`/api/bank-soal/${id}`);
  },

  /**
   * Upload Berkas PDF ke Google Drive dan Rekam Metadata ke Google Spreadsheet
   */
  uploadPdf: async (formData: FormData): Promise<{ files: any[] }> => {
    try {
      return await proxyRequest<{ files: any[] }>('/api/upload', {
        method: 'POST',
        body: formData,
      });
    } catch (err: any) {
      throw new Error('Upload PDF gagal. File belum dianggap tersimpan: ' + (err.message || ''));
    }
  },

  /**
   * Menyimpan Record Bank Soal ke Google Spreadsheet
   */
  createDocument: (data: Partial<BankSoal>): Promise<{ item: BankSoal }> => {
    return proxyRequest<{ item: BankSoal }>('/api/bank-soal', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update Metadata Bank Soal di Google Spreadsheet
   */
  updateDocument: (id: string, data: Partial<BankSoal>): Promise<{ item: BankSoal }> => {
    return proxyRequest<{ item: BankSoal }>(`/api/bank-soal/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Hapus Bank Soal (Hapus metadata di Spreadsheet & berkas di Google Drive)
   */
  deleteDocument: (id: string): Promise<{ success: boolean; message: string }> => {
    return proxyRequest<{ success: boolean; message: string }>(`/api/bank-soal/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Tambah Versi Baru Bank Soal (Upload file baru ke Drive & catat riwayat versi di Sheets)
   */
  uploadVersion: (id: string, formData: FormData): Promise<{ item: BankSoal }> => {
    return proxyRequest<{ item: BankSoal }>(`/api/bank-soal/${id}/version`, {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Toggle Status Favorit
   */
  toggleFavorite: (id: string): Promise<{ is_favorite: boolean }> => {
    return proxyRequest<{ is_favorite: boolean }>(`/api/bank-soal/${id}/favorite`, {
      method: 'POST',
    });
  },

  /**
   * Statistik Dashboard dari Google Sheets
   */
  getStats: (): Promise<StatsOverview> => {
    return proxyRequest<StatsOverview>('/api/stats');
  },

  /**
   * Kategori Mata Pelajaran & Jenjang
   */
  getCategories: (): Promise<{ categories: CategoryItem[] }> => {
    return proxyRequest<{ categories: CategoryItem[] }>('/api/categories');
  },

  /**
   * Tags
   */
  getTags: (): Promise<{ tags: { tag: string; count: number }[] }> => {
    return proxyRequest<{ tags: { tag: string; count: number }[] }>('/api/tags');
  },

  /**
   * Audit Logs
   */
  getAuditLogs: (limit = 100): Promise<{ logs: AuditLogItem[] }> => {
    return proxyRequest<{ logs: AuditLogItem[] }>(`/api/admin/audit-logs?limit=${limit}`);
  },

  /**
   * Sinkronisasi Dua Arah Google Drive ↔ Google Sheets
   */
  syncDriveAndSheets: (): Promise<DriveSyncResult> => {
    return proxyRequest<DriveSyncResult>('/api/google/sync', { method: 'POST' });
  },

  /**
   * Migrasi Data Legacy ke Google Drive & Google Sheets
   */
  runLegacyMigration: (records?: any[]): Promise<MigrationReport> => {
    return proxyRequest<MigrationReport>('/api/google/migrate-legacy', {
      method: 'POST',
      body: JSON.stringify({ records }),
    });
  },

  /**
   * Cek Duplikasi File Hash / Judul
   */
  checkDuplicates: (hash?: string, title?: string, filename?: string) => {
    return proxyRequest<{ isDuplicate: boolean; matchType?: string; existingItem?: BankSoal }>(
      '/api/check-duplicates',
      {
        method: 'POST',
        body: JSON.stringify({ hash, title, filename }),
      }
    );
  },

  /**
   * AI Metadata Suggestion via Gemini
   */
  suggestMetadata: (filename: string, rawText?: string) => {
    return proxyRequest<{ metadata: any }>('/api/ai/suggest-metadata', {
      method: 'POST',
      body: JSON.stringify({ filename, rawText }),
    });
  },

  /**
   * Pengguna
   */
  getCurrentUser: (): Promise<{ user: User }> => proxyRequest<{ user: User }>('/api/auth/me'),
  getUsers: (): Promise<{ users: User[] }> => proxyRequest<{ users: User[] }>('/api/auth/users'),
  switchUser: (userId: string): Promise<{ success: boolean; user: User }> => {
    setApiActiveUser(userId);
    return proxyRequest<{ success: boolean; user: User }>('/api/auth/switch', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },
};

export default googleAppsScriptService;
