import {
  StorageProfile,
  BankSoal,
  SyncStatus,
  UserProfile,
  CategoryMaster,
  TagItem,
  AuditLog,
  SystemSettings,
  SyncLog,
} from "../types";
import { AppStore } from "./store";

export interface StorageTestResult {
  success: boolean;
  latency_ms: number;
  apps_script: { connected: boolean; status: number; message: string };
  drive: { connected: boolean; folderId?: string; message: string };
  spreadsheet: { connected: boolean; spreadsheetId?: string; message: string };
  tables?: TableAuditInfo[];
  error_message?: string;
  connection_mode_used?: "PROXY" | "DIRECT_GAS";
}

export interface TableAuditInfo {
  id: string;
  name: string;
  label: string;
  exists: boolean;
  status: "POPULATED" | "EMPTY_HEADER_READY" | "NOT_CREATED";
  row_count: number;
  column_count: number;
  color: string;
  description: string;
}

export interface SpreadsheetAuditResult {
  success: boolean;
  spreadsheet_name?: string;
  spreadsheet_id?: string;
  total_tables_required: number;
  existing_tables_count: number;
  missing_tables_count: number;
  all_tables_ready: boolean;
  tables: TableAuditInfo[];
  message: string;
}

/**
 * Executes a direct request from the browser to Google Apps Script
 * Uses Content-Type: text/plain;charset=utf-8 to bypass CORS Preflight issues in Vercel & static hostings
 */
async function directCallAppsScript(
  appsScriptUrl: string,
  action: string,
  extraPayload: Record<string, any>,
  profile: StorageProfile
): Promise<any> {
  if (!appsScriptUrl || !appsScriptUrl.trim().startsWith("http")) {
    throw new Error("URL Google Apps Script belum diisi!");
  }

  const payload = {
    action,
    driveFolderId: (profile.drive_folder_id || "").trim(),
    spreadsheetId: (profile.spreadsheet_id || "").trim(),
    ...extraPayload,
    timestamp: new Date().toISOString(),
  };

  const response = await fetch(appsScriptUrl.trim(), {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();
  try {
    return JSON.parse(rawText);
  } catch {
    return {
      success: response.ok,
      message: rawText || "Respons dari Apps Script berhasil diterima.",
    };
  }
}

/**
 * Universal dispatcher that chooses between Server Proxy and Direct Apps Script (Vercel Mode)
 */
async function dispatchStorageRequest(
  endpoint: string,
  directAction: string,
  proxyBody: Record<string, any>,
  profile: StorageProfile,
  directPayload?: Record<string, any>
): Promise<{ data: any; modeUsed: "PROXY" | "DIRECT_GAS" }> {
  const settings = AppStore.getSettings();
  const mode = settings.connection_mode || profile.connection_mode || "AUTO";

  // 1. If forced DIRECT_GAS (Vercel Direct Mode)
  if (mode === "DIRECT_GAS") {
    const data = await directCallAppsScript(
      profile.apps_script_url,
      directAction,
      directPayload || proxyBody,
      profile
    );
    return { data, modeUsed: "DIRECT_GAS" };
  }

  // 2. If forced PROXY (Node.js Server Mode)
  if (mode === "PROXY") {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proxyBody),
    });
    const data = await res.json();
    return { data, modeUsed: "PROXY" };
  }

  // 3. AUTO / Hybrid Mode: Try Proxy first, auto-fallback to Direct GAS if 404 / error (Vercel Static Hosting)
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proxyBody),
    });

    // Check if proxy returned 404 or HTML (Vercel SPA fallback to index.html)
    const contentType = res.headers.get("content-type") || "";
    if (res.status === 404 || !contentType.includes("application/json")) {
      console.info(
        `[StorageService] Endpoint '${endpoint}' tidak tersedia (${res.status}). Beralih otomatis ke Direct Apps Script Bridge (Vercel/Static Mode)...`
      );
      const data = await directCallAppsScript(
        profile.apps_script_url,
        directAction,
        directPayload || proxyBody,
        profile
      );
      return { data, modeUsed: "DIRECT_GAS" };
    }

    const data = await res.json();
    return { data, modeUsed: "PROXY" };
  } catch (err: any) {
    console.info(
      `[StorageService] Proxy fetch gagal (${err.message}). Mengaktifkan Direct Apps Script Bridge...`
    );
    const data = await directCallAppsScript(
      profile.apps_script_url,
      directAction,
      directPayload || proxyBody,
      profile
    );
    return { data, modeUsed: "DIRECT_GAS" };
  }
}

export class StorageService {
  /**
   * Performs an actual test connection to Apps Script, Drive folder, and Spreadsheet
   */
  static async testConnection(profile: StorageProfile): Promise<StorageTestResult> {
    const startTime = Date.now();

    if (!profile.apps_script_url || !profile.apps_script_url.trim().startsWith("http")) {
      const result: StorageTestResult = {
        success: false,
        latency_ms: 0,
        apps_script: { connected: false, status: 400, message: "URL Google Apps Script belum diisi" },
        drive: { connected: false, message: "URL Google Apps Script belum diisi" },
        spreadsheet: { connected: false, message: "URL Google Apps Script belum diisi" },
        error_message: "URL Google Apps Script Web App wajib diisi (diawali https://)",
      };

      AppStore.updateStorageHealth(profile.id, {
        health_status: "NOT_CONFIGURED",
        connection_status: "DISCONNECTED",
        latency_ms: 0,
        drive_connected: false,
        spreadsheet_connected: false,
        apps_script_connected: false,
        last_error: "URL Google Apps Script belum dikonfigurasi",
      });

      return result;
    }

    try {
      const { data, modeUsed } = await dispatchStorageRequest(
        "/api/storage/test",
        "test_connection",
        {
          appsScriptUrl: profile.apps_script_url.trim(),
          driveFolderId: (profile.drive_folder_id || "").trim(),
          spreadsheetId: (profile.spreadsheet_id || "").trim(),
        },
        profile,
        {
          driveFolderId: (profile.drive_folder_id || "").trim(),
          spreadsheetId: (profile.spreadsheet_id || "").trim(),
        }
      );

      const latency = Date.now() - startTime;

      const driveOk = Boolean(data.drive?.connected);
      const sheetsOk = Boolean(data.spreadsheet?.connected);
      const appsScriptOk = Boolean(data.appsScript?.connected || data.success);
      const isSuccess = Boolean(data.success && (driveOk || data.drive?.folderId) && (sheetsOk || data.spreadsheet?.spreadsheetId));

      let health: StorageProfile["health_status"] = "HEALTHY";
      if (!isSuccess) {
        if (!appsScriptOk) health = "ERROR";
        else if (!driveOk && !sheetsOk) health = "ERROR";
        else health = "DEGRADED";
      }

      const errorMessage = !isSuccess
        ? data.message || (!appsScriptOk ? "Apps Script tidak merespons" : !driveOk ? "Folder Google Drive gagal diakses" : "Google Spreadsheet gagal diakses")
        : undefined;

      AppStore.updateStorageHealth(profile.id, {
        health_status: health,
        connection_status: isSuccess ? "CONNECTED" : "DISCONNECTED",
        latency_ms: data.latency || latency,
        drive_connected: driveOk,
        spreadsheet_connected: sheetsOk,
        apps_script_connected: appsScriptOk,
        last_error: errorMessage,
      });

      return {
        success: isSuccess,
        latency_ms: data.latency || latency,
        connection_mode_used: modeUsed,
        apps_script: {
          connected: appsScriptOk,
          status: data.appsScript?.status || 200,
          message: data.appsScript?.message || (appsScriptOk ? `Google Apps Script terhubung (Mode: ${modeUsed})` : data.message || "Gagal menghubungi Apps Script"),
        },
        drive: {
          connected: driveOk,
          folderId: profile.drive_folder_id,
          message: data.drive?.message || (driveOk ? "Folder Google Drive siap" : "Folder Google Drive tidak dapat dibuka"),
        },
        spreadsheet: {
          connected: sheetsOk,
          spreadsheetId: profile.spreadsheet_id,
          message: data.spreadsheet?.message || (sheetsOk ? "Google Spreadsheet siap" : "Google Spreadsheet tidak dapat dibuka"),
        },
        error_message: errorMessage,
      };
    } catch (err: any) {
      const latency = Date.now() - startTime;
      const errorMsg = `Gagal uji koneksi: ${err.message}`;

      AppStore.updateStorageHealth(profile.id, {
        health_status: "ERROR",
        connection_status: "DISCONNECTED",
        latency_ms: latency,
        drive_connected: false,
        spreadsheet_connected: false,
        apps_script_connected: false,
        last_error: errorMsg,
      });

      return {
        success: false,
        latency_ms: latency,
        apps_script: { connected: false, status: 500, message: errorMsg },
        drive: { connected: false, message: errorMsg },
        spreadsheet: { connected: false, message: errorMsg },
        error_message: errorMsg,
      };
    }
  }

  /**
   * Dispatch upload with failover across active & secondary profiles
   */
  static async uploadWithFailover(
    bankSoalPayload: any,
    fileBase64?: string
  ): Promise<{
    success: boolean;
    storageProfileUsed: StorageProfile;
    driveFileId?: string;
    webViewUrl?: string;
    downloadUrl?: string;
    sheetSynced: boolean;
    syncStatus: SyncStatus;
    error?: string;
  }> {
    const profiles = AppStore.getStorageProfiles().sort((a, b) => a.priority - b.priority);
    const activeProfile = profiles.find((p) => p.is_active) || profiles[0];

    if (!activeProfile || !activeProfile.apps_script_url) {
      throw new Error(
        "Profil Google Storage belum dikonfigurasi! Buka menu 'Penyimpanan Google' dan masukkan URL Web App Apps Script, ID Folder Drive, dan ID Spreadsheet."
      );
    }

    const candidateProfiles = [
      activeProfile,
      ...profiles.filter((p) => p.id !== activeProfile?.id && p.apps_script_url),
    ].filter(Boolean);

    let lastErrorMessage = "";

    for (const profile of candidateProfiles) {
      try {
        const { data: resJson } = await dispatchStorageRequest(
          "/api/storage/sync",
          "upload_file",
          {
            action: "upload_file",
            storageProfile: profile,
            bankSoalItem: {
              ...bankSoalPayload,
              file_base64: fileBase64,
            },
          },
          profile,
          {
            payload: {
              ...bankSoalPayload,
              file_base64: fileBase64,
            },
            bankSoalItem: {
              ...bankSoalPayload,
              file_base64: fileBase64,
            },
          }
        );

        if (resJson && resJson.success) {
          const driveFileId = resJson.file_id || "";
          const webViewUrl = resJson.web_view_url || (driveFileId ? `https://drive.google.com/file/d/${driveFileId}/view` : "");
          const downloadUrl = resJson.download_url || (driveFileId ? `https://drive.google.com/uc?export=download&id=${driveFileId}` : "");
          const sheetSynced = resJson.sheet_synced ?? true;
          const syncStatus: SyncStatus = sheetSynced ? "SYNCED" : "PARTIAL";

          AppStore.recordSyncLog({
            storage_profile_id: profile.id,
            storage_profile_name: profile.name,
            bank_soal_id: bankSoalPayload.id || "new",
            bank_soal_title: bankSoalPayload.title || "Dokumen PDF",
            action: "UPLOAD_DRIVE",
            status: sheetSynced ? "SUCCESS" : "PARTIAL",
            retry_count: 1,
          });

          return {
            success: true,
            storageProfileUsed: profile,
            driveFileId,
            webViewUrl,
            downloadUrl,
            sheetSynced,
            syncStatus,
          };
        } else {
          lastErrorMessage = resJson?.message || `Gagal upload pada profil ${profile.name}`;
          AppStore.recordSyncLog({
            storage_profile_id: profile.id,
            storage_profile_name: profile.name,
            bank_soal_id: bankSoalPayload.id || "new",
            bank_soal_title: bankSoalPayload.title || "Dokumen PDF",
            action: "UPLOAD_DRIVE",
            status: "FAILED",
            retry_count: 1,
            error_message: lastErrorMessage,
          });
        }
      } catch (err: any) {
        lastErrorMessage = err.message;
        console.warn(`Storage profile ${profile.name} failed:`, err);
        AppStore.recordSyncLog({
          storage_profile_id: profile.id,
          storage_profile_name: profile.name,
          bank_soal_id: bankSoalPayload.id || "new",
          bank_soal_title: bankSoalPayload.title || "Dokumen PDF",
          action: "UPLOAD_DRIVE",
          status: "FAILED",
          retry_count: 1,
          error_message: err.message,
        });
      }
    }

    throw new Error(
      lastErrorMessage || "Gagal mengunggah file ke Google Drive & Sheets. Periksa koneksi Apps Script dan izin folder."
    );
  }

  /**
   * Retries synchronization for a specific Bank Soal record
   */
  static async retrySync(bankSoal: BankSoal): Promise<{ success: boolean; message: string }> {
    const activeStorage = AppStore.getActiveStorageProfile();
    if (!activeStorage || !activeStorage.apps_script_url) {
      return { success: false, message: "Storage aktif belum memiliki URL Apps Script." };
    }

    try {
      const { data: resJson } = await dispatchStorageRequest(
        "/api/storage/sync",
        "sync_bank_soal",
        {
          action: "sync_bank_soal",
          storageProfile: activeStorage,
          bankSoalItem: bankSoal,
        },
        activeStorage,
        {
          payload: bankSoal,
          bankSoalItem: bankSoal,
        }
      );

      if (resJson && resJson.success) {
        AppStore.updateBankSoal(bankSoal.id, {
          sync_status: "SYNCED",
          sync_attempts: (bankSoal.sync_attempts || 1) + 1,
          last_sync_error: undefined,
        });

        AppStore.recordSyncLog({
          storage_profile_id: activeStorage.id,
          storage_profile_name: activeStorage.name,
          bank_soal_id: bankSoal.id,
          bank_soal_title: bankSoal.title,
          action: "RETRY_SYNC",
          status: "SUCCESS",
          retry_count: (bankSoal.sync_attempts || 1) + 1,
        });

        return { success: true, message: "Data berhasil disinkronkan ke Spreadsheet!" };
      } else {
        const errorMsg = resJson?.message || "Gagal update row di Spreadsheet";
        AppStore.updateBankSoal(bankSoal.id, {
          sync_status: "FAILED",
          sync_attempts: (bankSoal.sync_attempts || 1) + 1,
          last_sync_error: errorMsg,
        });
        return { success: false, message: errorMsg };
      }
    } catch (err: any) {
      AppStore.updateBankSoal(bankSoal.id, {
        sync_status: "FAILED",
        sync_attempts: (bankSoal.sync_attempts || 1) + 1,
        last_sync_error: err.message,
      });
      return { success: false, message: err.message };
    }
  }

  /**
   * Pulls all live rows directly from Google Spreadsheet
   */
  static async pullFromSpreadsheet(profile?: StorageProfile): Promise<{ success: boolean; count: number; items: BankSoal[]; message: string }> {
    const target = profile || AppStore.getActiveStorageProfile();
    if (!target || !target.apps_script_url) {
      return { success: false, count: 0, items: [], message: "Google Storage belum dikonfigurasi." };
    }

    try {
      const { data } = await dispatchStorageRequest(
        "/api/storage/fetch-all",
        "fetch_all",
        { storageProfile: target },
        target
      );

      if (data && data.success) {
        return {
          success: true,
          count: data.items ? data.items.length : 0,
          items: data.items || [],
          message: data.message || `Berhasil memuat ${data.items ? data.items.length : 0} berkas dari Spreadsheet.`,
        };
      } else {
        return {
          success: false,
          count: 0,
          items: [],
          message: data?.message || "Gagal memuat data dari Spreadsheet.",
        };
      }
    } catch (err: any) {
      return {
        success: false,
        count: 0,
        items: [],
        message: `Koneksi gagal: ${err.message}`,
      };
    }
  }

  /**
   * Pushes all current Bank Soal records to Google Spreadsheet in bulk
   */
  static async pushAllToSpreadsheet(items: BankSoal[], profile?: StorageProfile): Promise<{ success: boolean; synced_count: number; message: string }> {
    const target = profile || AppStore.getActiveStorageProfile();
    if (!target || !target.apps_script_url) {
      return { success: false, synced_count: 0, message: "Google Storage belum dikonfigurasi." };
    }

    try {
      const { data } = await dispatchStorageRequest(
        "/api/storage/push-all",
        "push_all",
        {
          storageProfile: target,
          items: items,
        },
        target,
        { items: items }
      );

      if (data && data.success) {
        return {
          success: true,
          synced_count: data.synced_count || items.length,
          message: data.message || `Berhasil mengekspor ${items.length} naskah ke Google Spreadsheet.`,
        };
      } else {
        return {
          success: false,
          synced_count: 0,
          message: data?.message || "Gagal mengekspor data ke Spreadsheet.",
        };
      }
    } catch (err: any) {
      return {
        success: false,
        synced_count: 0,
        message: `Koneksi gagal: ${err.message}`,
      };
    }
  }

  /**
   * Audits all 7 database tables in the Google Spreadsheet
   */
  static async auditSpreadsheetTables(profile?: StorageProfile): Promise<SpreadsheetAuditResult> {
    const target = profile || AppStore.getActiveStorageProfile();
    if (!target || !target.apps_script_url) {
      return {
        success: false,
        total_tables_required: 7,
        existing_tables_count: 0,
        missing_tables_count: 7,
        all_tables_ready: false,
        tables: [],
        message: "Google Storage belum dikonfigurasi. Masukkan URL Apps Script dan ID Spreadsheet.",
      };
    }

    try {
      const { data } = await dispatchStorageRequest(
        "/api/storage/audit-tables",
        "audit_tables",
        { storageProfile: target },
        target
      );

      if (data && data.success) {
        return data as SpreadsheetAuditResult;
      } else {
        return {
          success: false,
          total_tables_required: 7,
          existing_tables_count: 0,
          missing_tables_count: 7,
          all_tables_ready: false,
          tables: data?.tables || [],
          message: data?.message || "Gagal mengaudit tabel Google Spreadsheet.",
        };
      }
    } catch (err: any) {
      return {
        success: false,
        total_tables_required: 7,
        existing_tables_count: 0,
        missing_tables_count: 7,
        all_tables_ready: false,
        tables: [],
        message: `Koneksi audit gagal: ${err.message}`,
      };
    }
  }

  /**
   * Automatically initializes all 7 tables in Google Spreadsheet with styled headers & initial seeds
   */
  static async initializeAllTables(
    profile?: StorageProfile,
    customSeedData?: {
      users?: UserProfile[];
      bank_soal?: BankSoal[];
      categories?: CategoryMaster[];
      tags?: TagItem[];
      audit_logs?: AuditLog[];
      settings?: Partial<SystemSettings>;
      sync_logs?: SyncLog[];
    }
  ): Promise<{
    success: boolean;
    created_sheets?: string[];
    updated_sheets?: string[];
    tables?: TableAuditInfo[];
    message: string;
  }> {
    const target = profile || AppStore.getActiveStorageProfile();
    if (!target || !target.apps_script_url) {
      return { success: false, message: "Google Storage belum dikonfigurasi." };
    }

    const seedData = customSeedData || {
      users: AppStore.getUsers(),
      bank_soal: AppStore.getBankSoalList(),
      categories: AppStore.getCategories(),
      tags: AppStore.getTags(),
      audit_logs: AppStore.getAuditLogs(),
      settings: AppStore.getSettings(),
      sync_logs: AppStore.getSyncLogs(),
    };

    try {
      const { data } = await dispatchStorageRequest(
        "/api/storage/init-tables",
        "init_tables",
        {
          storageProfile: target,
          seedData,
        },
        target,
        { seedData }
      );

      if (data && data.success) {
        AppStore.recordAuditLog({
          action: "STORAGE_UPDATE",
          target_type: "StorageProfile",
          target_id: target.id,
          target_title: target.name,
          details: `Inisialisasi 7 tabel database pada Google Spreadsheet: USERS, BANK_SOAL, CATEGORIES, TAGS, ACTIVITY_LOG, SETTINGS, SYNC_LOG`,
        });
        return {
          success: true,
          created_sheets: data.created_sheets,
          updated_sheets: data.updated_sheets,
          tables: data.tables,
          message: data.message || "7 Tabel Database Spreadsheet berhasil dibuat dan diisi data awal!",
        };
      } else {
        return {
          success: false,
          message: data?.message || "Gagal inisialisasi tabel di Google Spreadsheet.",
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Koneksi inisialisasi gagal: ${err.message}`,
      };
    }
  }

  /**
   * Fetches all 7 tables from Google Spreadsheet and loads them into AppStore
   */
  static async fetchAllTablesFromSpreadsheet(profile?: StorageProfile): Promise<{
    success: boolean;
    counts?: Record<string, number>;
    message: string;
  }> {
    const target = profile || AppStore.getActiveStorageProfile();
    if (!target || !target.apps_script_url) {
      return { success: false, message: "Google Storage belum dikonfigurasi." };
    }

    try {
      const { data } = await dispatchStorageRequest(
        "/api/storage/fetch-all-tables",
        "fetch_all_tables",
        { storageProfile: target },
        target
      );

      if (data && data.success && data.tables) {
        if (data.tables.users && data.tables.users.length > 0) {
          AppStore.hydrateUsers(data.tables.users);
        }
        if (data.tables.bank_soal && data.tables.bank_soal.length > 0) {
          AppStore.hydrateBankSoal(data.tables.bank_soal);
        }
        if (data.tables.categories && data.tables.categories.length > 0) {
          AppStore.hydrateCategories(data.tables.categories);
        }
        if (data.tables.tags && data.tables.tags.length > 0) {
          AppStore.hydrateTags(data.tables.tags);
        }
        if (data.tables.settings && Object.keys(data.tables.settings).length > 0) {
          AppStore.saveSettings(data.tables.settings);
        }

        AppStore.recordAuditLog({
          action: "SYNC",
          target_type: "StorageProfile",
          target_id: target.id,
          target_title: target.name,
          details: `Tarik seluruh database (7 tabel) dari Google Spreadsheet`,
        });

        return {
          success: true,
          counts: data.counts,
          message: data.message || "Seluruh data 7 tabel berhasil ditarik dari Google Spreadsheet!",
        };
      } else {
        return {
          success: false,
          message: data?.message || "Gagal memuat seluruh tabel dari Spreadsheet.",
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Koneksi gagal: ${err.message}`,
      };
    }
  }

  /**
   * Pushes all 7 tables in current state to Google Spreadsheet
   */
  static async pushAllTablesToSpreadsheet(profile?: StorageProfile): Promise<{
    success: boolean;
    tables?: TableAuditInfo[];
    message: string;
  }> {
    const target = profile || AppStore.getActiveStorageProfile();
    if (!target || !target.apps_script_url) {
      return { success: false, message: "Google Storage belum dikonfigurasi." };
    }

    const payloadTables = {
      users: AppStore.getUsers(),
      bank_soal: AppStore.getBankSoalList(),
      categories: AppStore.getCategories(),
      tags: AppStore.getTags(),
      activity_logs: AppStore.getAuditLogs(),
      settings: AppStore.getSettings(),
      sync_logs: AppStore.getSyncLogs(),
    };

    try {
      const { data } = await dispatchStorageRequest(
        "/api/storage/sync-all-tables",
        "sync_all_tables",
        {
          storageProfile: target,
          tables: payloadTables,
        },
        target,
        { tables: payloadTables }
      );

      if (data && data.success) {
        AppStore.recordAuditLog({
          action: "SYNC",
          target_type: "StorageProfile",
          target_id: target.id,
          target_title: target.name,
          details: `Ekspor sinkronisasi seluruh 7 tabel ke Google Spreadsheet`,
        });

        return {
          success: true,
          tables: data.tables,
          message: data.message || "Seluruh data 7 tabel berhasil disinkronkan ke Google Spreadsheet!",
        };
      } else {
        return {
          success: false,
          message: data?.message || "Gagal sinkronisasi data ke Spreadsheet.",
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Koneksi gagal: ${err.message}`,
      };
    }
  }
}
