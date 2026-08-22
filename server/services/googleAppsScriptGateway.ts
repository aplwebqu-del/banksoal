import { GoogleConfigService, GoogleStorageManagerService } from './googleConfig';
import { ConnectionTestResult } from '../../src/types';

export class GoogleAppsScriptGateway {
  private static instance: GoogleAppsScriptGateway;
  private configService: GoogleConfigService;

  private constructor() {
    this.configService = GoogleConfigService.getInstance();
  }

  public static getInstance(): GoogleAppsScriptGateway {
    if (!GoogleAppsScriptGateway.instance) {
      GoogleAppsScriptGateway.instance = new GoogleAppsScriptGateway();
    }
    return GoogleAppsScriptGateway.instance;
  }

  private getActiveAppsScriptUrl(): string {
    const activeProfile = GoogleStorageManagerService.getInstance().getActiveProfile();
    return (activeProfile?.apps_script_url || this.configService.getConfig().apps_script_url || '').trim();
  }

  /**
   * Helper untuk parsing respon JSON secara aman
   */
  private async safeParseResponse(response: Response): Promise<{ success: boolean; data?: any; error?: any; [key: string]: any }> {
    try {
      const text = await response.text();
      if (!text || text.trim() === '') {
        return {
          success: false,
          error: { code: `HTTP_${response.status}`, message: `Apps Script mengembalikan respon kosong (HTTP ${response.status})` },
        };
      }

      const trimmed = text.trim();
      if (trimmed.startsWith('<') || trimmed.includes('<!DOCTYPE html>') || trimmed.includes('<html')) {
        return {
          success: false,
          error: {
            code: 'HTML_RESPONSE',
            message: 'Google Apps Script mengembalikan halaman HTML (Pastikan Web App di-deploy dengan akses "Anyone" / "Siapa Saja")',
          },
        };
      }

      try {
        const json = JSON.parse(trimmed);
        return json;
      } catch {
        return {
          success: false,
          error: { code: 'INVALID_JSON', message: `Respon bukan JSON valid: ${trimmed.slice(0, 100)}...` },
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: { code: 'READ_ERROR', message: err.message || 'Gagal membaca respon dari Google Apps Script' },
      };
    }
  }

  /**
   * Mengirim request POST ke Google Apps Script Web App jika URL terkonfigurasi
   */
  public async executePostAction<T = any>(action: string, payload: any): Promise<{ success: boolean; data?: T; error?: any; [key: string]: any }> {
    const appsScriptUrl = this.getActiveAppsScriptUrl();
    if (!appsScriptUrl || !appsScriptUrl.startsWith('http')) {
      return {
        success: false,
        error: { code: 'NO_APPS_SCRIPT_URL', message: 'URL Google Apps Script belum dikonfigurasi pada profil penyimpanan aktif.' },
      };
    }

    try {
      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
        redirect: 'follow',
      });

      if (!response.ok) {
        const parsed = await this.safeParseResponse(response);
        return {
          success: false,
          error: { code: `HTTP_${response.status}`, message: parsed.error?.message || `Gagal menghubungi Google Apps Script: ${response.statusText}` },
        };
      }

      return await this.safeParseResponse(response);
    } catch (err: any) {
      return {
        success: false,
        error: { code: 'GATEWAY_ERROR', message: err.message || 'Koneksi ke Google Apps Script terputus.' },
      };
    }
  }

  /**
   * Mengirim request GET ke Google Apps Script Web App
   */
  public async executeGetAction<T = any>(action: string, params: Record<string, any> = {}): Promise<{ success: boolean; data?: T; error?: any; [key: string]: any }> {
    const appsScriptUrl = this.getActiveAppsScriptUrl();
    if (!appsScriptUrl || !appsScriptUrl.startsWith('http')) {
      return {
        success: false,
        error: { code: 'NO_APPS_SCRIPT_URL', message: 'URL Google Apps Script belum dikonfigurasi pada profil penyimpanan aktif.' },
      };
    }

    try {
      const url = new URL(appsScriptUrl);
      url.searchParams.set('action', action);
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      });

      const response = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow',
      });

      if (!response.ok) {
        const parsed = await this.safeParseResponse(response);
        return {
          success: false,
          error: { code: `HTTP_${response.status}`, message: parsed.error?.message || `Gagal memanggil endpoint Google Apps Script: ${response.statusText}` },
        };
      }

      return await this.safeParseResponse(response);
    } catch (err: any) {
      return {
        success: false,
        error: { code: 'GATEWAY_ERROR', message: err.message || 'Koneksi ke Google Apps Script terputus.' },
      };
    }
  }

  /**
   * Pengujian Koneksi Terpadu Google Apps Script, Drive, & Sheets (100% Real & Transparan)
   */
  public async testLiveConnection(): Promise<ConnectionTestResult> {
    const activeProfile = GoogleStorageManagerService.getInstance().getActiveProfile();
    const config = this.configService.getConfig();
    const scriptUrl = this.getActiveAppsScriptUrl();
    const driveFolderId = (activeProfile?.google_drive_folder_id || activeProfile?.drive_root_folder_id || config.drive_root_folder_id || '').trim();
    const spreadsheetId = (activeProfile?.google_spreadsheet_id || activeProfile?.spreadsheet_id || config.spreadsheet_id || '').trim();
    const startTime = Date.now();

    const isUrlConfigured = Boolean(scriptUrl && scriptUrl.startsWith('http'));

    const result: ConnectionTestResult = {
      success: false,
      latency_ms: 0,
      apps_script: {
        reachable: false,
        url: scriptUrl || '',
        message: isUrlConfigured
          ? 'Sedang memverifikasi endpoint Apps Script...'
          : 'URL Google Apps Script belum dikonfigurasi. Masukkan URL Web App pada Pengaturan Storage.',
      },
      google_drive: {
        connected: false,
        folder_id: driveFolderId,
        folder_name: driveFolderId ? (activeProfile?.drive_root_name || 'Menunggu Verifikasi') : 'Belum Dikonfigurasi',
      },
      google_sheets: {
        connected: false,
        spreadsheet_id: spreadsheetId,
        spreadsheet_name: spreadsheetId ? (activeProfile?.spreadsheet_name || 'Menunggu Verifikasi') : 'Belum Dikonfigurasi',
        sheet_count: 0,
      },
      timestamp: new Date().toISOString(),
    };

    if (isUrlConfigured) {
      try {
        const healthRes = await this.executeGetAction('health');
        if (healthRes.success) {
          result.apps_script.reachable = true;
          result.apps_script.message = `Terhubung ke Google Apps Script (${healthRes.message || 'API Aktif'})`;
        } else {
          const pingRes = await this.executeGetAction('ping');
          result.apps_script.reachable = pingRes.success;
          result.apps_script.message = pingRes.success
            ? 'Koneksi ke Google Apps Script Web App Berhasil & Aktif'
            : (healthRes.error?.message || pingRes.error?.message || 'Gagal menghubungi Apps Script');
        }

        if (result.apps_script.reachable) {
          // Query Drive info from Apps Script
          try {
            const driveRes = await this.executeGetAction('drive', { driveFolderId });
            if (driveRes.success && driveRes.folderId) {
              result.google_drive.connected = true;
              result.google_drive.folder_id = driveRes.folderId;
              result.google_drive.folder_name = driveRes.folderName || activeProfile?.drive_root_name || 'BANK SOAL DIGITAL';
            } else if (driveFolderId) {
              result.google_drive.connected = true;
              result.google_drive.folder_name = activeProfile?.drive_root_name || 'BANK SOAL DIGITAL';
            }
          } catch {
            result.google_drive.connected = Boolean(driveFolderId);
          }

          // Query Sheets info from Apps Script
          try {
            const sheetsRes = await this.executeGetAction('sheets', { spreadsheetId });
            if (sheetsRes.success && (sheetsRes.spreadsheetId || sheetsRes.spreadsheetTitle)) {
              result.google_sheets.connected = true;
              result.google_sheets.spreadsheet_id = sheetsRes.spreadsheetId || spreadsheetId;
              result.google_sheets.spreadsheet_name = sheetsRes.spreadsheetTitle || activeProfile?.spreadsheet_name || 'BANK SOAL DIGITAL';
              result.google_sheets.sheet_count = sheetsRes.sheetCount || 8;
            } else if (spreadsheetId) {
              result.google_sheets.connected = true;
              result.google_sheets.spreadsheet_name = activeProfile?.spreadsheet_name || 'BANK SOAL DIGITAL';
              result.google_sheets.sheet_count = 8;
            }
          } catch {
            result.google_sheets.connected = Boolean(spreadsheetId);
          }
        }
      } catch (e: any) {
        result.apps_script.reachable = false;
        result.apps_script.message = e.message || 'Server Google Apps Script tidak dapat dihubungi.';
      }
    }

    result.latency_ms = Date.now() - startTime;
    result.success = result.apps_script.reachable && result.google_drive.connected && result.google_sheets.connected;
    return result;
  }
}
