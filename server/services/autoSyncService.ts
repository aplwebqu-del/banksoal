import { BankSoalService } from './bankSoalService';
import { GoogleSheetsRepository } from './googleSheetsRepository';
import { GoogleAppsScriptGateway } from './googleAppsScriptGateway';
import { GoogleStorageManagerService } from './googleConfig';
import { DriveSyncResult } from '../../src/types';

export interface AutoSyncStatus {
  is_syncing: boolean;
  last_sync_time: string | null;
  next_sync_time: string | null;
  sync_interval_minutes: number;
  auto_sync_enabled: boolean;
  new_items_found_last_sync: number;
  last_sync_summary: string;
  total_runs: number;
  connection: {
    online: boolean;
    apps_script_url: string;
    drive_folder_id: string;
    spreadsheet_id: string;
    profile_name: string;
    latency_ms: number;
    message: string;
  };
}

export class AutoSyncService {
  private static instance: AutoSyncService;
  private intervalTimer: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private lastSyncTime: string | null = null;
  private nextSyncTime: string | null = null;
  private readonly INTERVAL_MS = 15 * 60 * 1000; // 15 Menit
  private newItemsFoundLastSync = 0;
  private lastSyncSummary = 'Belum pernah sinkronisasi';
  private totalRuns = 0;

  private constructor() {
    this.scheduleNextRun();
  }

  public static getInstance(): AutoSyncService {
    if (!AutoSyncService.instance) {
      AutoSyncService.instance = new AutoSyncService();
    }
    return AutoSyncService.instance;
  }

  private scheduleNextRun(): void {
    const nextDate = new Date(Date.now() + this.INTERVAL_MS);
    this.nextSyncTime = nextDate.toISOString();
  }

  /**
   * Memulai background scheduler auto-sync (15 menit)
   */
  public start(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
    }

    console.log('[AutoSyncService] Memulai background scheduler auto-sync (interval 15 menit).');
    this.scheduleNextRun();

    this.intervalTimer = setInterval(() => {
      this.runPeriodicSync().catch((err) => {
        console.error('[AutoSyncService] Gagal menjalankan auto-sync periodik:', err);
      });
    }, this.INTERVAL_MS);

    // Jalankan pemeriksaan awal setelah server siap
    setTimeout(() => {
      this.runPeriodicSync(true).catch((err) => {
        console.warn('[AutoSyncService] Pemeriksaan awal gagal:', err.message);
      });
    }, 10000);
  }

  public stop(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  /**
   * Eksekusi Auto-Sync Berkala Google Drive & Google Sheets
   */
  public async runPeriodicSync(isInitial = false): Promise<DriveSyncResult | null> {
    if (this.isSyncing) {
      console.log('[AutoSyncService] Sync sedang berlangsung, melewati putaran saat ini.');
      return null;
    }

    const activeProfile = GoogleStorageManagerService.getInstance().getActiveProfile();
    const hasAppsScript = Boolean(activeProfile?.apps_script_url && activeProfile.apps_script_url.startsWith('http'));

    this.isSyncing = true;
    const startTime = Date.now();

    try {
      console.log(`[AutoSyncService] Menjalankan auto-sync ${isInitial ? '(Initial Boot)' : '(15-min Schedule)'}...`);
      
      let addedCount = 0;
      if (hasAppsScript) {
        try {
          const pullRes = await this.pullFromGoogleSheets();
          if (pullRes.success) {
            addedCount = pullRes.added || 0;
          }
        } catch (pullErr: any) {
          console.warn('[AutoSyncService] Gagal menarik data dari Sheets:', pullErr.message);
        }
      }

      const bankSoalService = BankSoalService.getInstance();
      const syncResult = await bankSoalService.syncGoogleDriveAndSheets();

      this.lastSyncTime = new Date().toISOString();
      this.scheduleNextRun();
      this.totalRuns++;

      const newDriveFiles = syncResult.unindexed_count || 0;
      this.newItemsFoundLastSync = addedCount + newDriveFiles;

      if (this.newItemsFoundLastSync > 0) {
        this.lastSyncSummary = `Ditemukan ${this.newItemsFoundLastSync} soal baru (${addedCount} dari Sheets, ${newDriveFiles} dari Drive).`;
      } else {
        this.lastSyncSummary = `Sinkronisasi selesai dalam ${Date.now() - startTime}ms. Semua data terkini.`;
      }

      console.log(`[AutoSyncService] ${this.lastSyncSummary}`);
      return syncResult;
    } catch (err: any) {
      console.error('[AutoSyncService] Error saat auto-sync:', err);
      this.lastSyncSummary = `Gagal sinkronisasi: ${err.message || 'Kesalahan jaringan'}`;
      this.lastSyncTime = new Date().toISOString();
      this.scheduleNextRun();
      return null;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Tarik Data dari Spreadsheet secara Langsung & Perbarui Cache Aplikasi
   */
  public async pullFromGoogleSheets(): Promise<{
    success: boolean;
    total: number;
    added: number;
    updated: number;
    message: string;
    items?: any[];
  }> {
    const gateway = GoogleAppsScriptGateway.getInstance();
    const repo = GoogleSheetsRepository.getInstance();
    const activeProfile = GoogleStorageManagerService.getInstance().getActiveProfile();

    if (!activeProfile?.apps_script_url || !activeProfile.apps_script_url.startsWith('http')) {
      return {
        success: false,
        total: 0,
        added: 0,
        updated: 0,
        message: 'URL Google Apps Script belum dikonfigurasi pada profil penyimpanan aktif.',
      };
    }

    try {
      const response = await gateway.executeGetAction<any>('getBankSoal', {
        status: 'all',
        limit: 1000,
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal mengambil data dari Google Sheets Web App.');
      }

      const rawItems = response.data?.items || (Array.isArray(response.data) ? response.data : []);
      repo.invalidateAllCache();

      this.lastSyncTime = new Date().toISOString();
      this.scheduleNextRun();

      return {
        success: true,
        total: rawItems.length,
        added: 0,
        updated: rawItems.length,
        message: `Berhasil menyinkronkan ${rawItems.length} naskah soal dari Google Sheets.`,
        items: rawItems,
      };
    } catch (err: any) {
      return {
        success: false,
        total: 0,
        added: 0,
        updated: 0,
        message: err.message || 'Gagal terhubung ke Google Sheets untuk menarik data.',
      };
    }
  }

  /**
   * Ambil status Auto-Sync dan status koneksi terpadu secara instan
   */
  public async getStatus(): Promise<AutoSyncStatus> {
    const activeProfile = GoogleStorageManagerService.getInstance().getActiveProfile();
    const gateway = GoogleAppsScriptGateway.getInstance();

    let online = false;
    let latency = 0;
    let message = 'Belum terhubung ke Google Apps Script Web App';

    if (activeProfile?.apps_script_url && activeProfile.apps_script_url.startsWith('http')) {
      const start = Date.now();
      try {
        const pingRes = await gateway.executeGetAction('ping');
        latency = Date.now() - start;
        if (pingRes.success) {
          online = true;
          message = `Google Apps Script & Storage Online (${latency}ms)`;
        } else {
          message = pingRes.error?.message || 'Apps Script tidak merespons dengan normal';
        }
      } catch (e: any) {
        message = e.message || 'Koneksi ke Apps Script gagal';
      }
    } else {
      message = 'URL Apps Script belum diisi di Pengaturan';
    }

    return {
      is_syncing: this.isSyncing,
      last_sync_time: this.lastSyncTime,
      next_sync_time: this.nextSyncTime,
      sync_interval_minutes: 15,
      auto_sync_enabled: true,
      new_items_found_last_sync: this.newItemsFoundLastSync,
      last_sync_summary: this.lastSyncSummary,
      total_runs: this.totalRuns,
      connection: {
        online,
        apps_script_url: activeProfile?.apps_script_url || '',
        drive_folder_id: activeProfile?.google_drive_folder_id || activeProfile?.drive_root_folder_id || '',
        spreadsheet_id: activeProfile?.google_spreadsheet_id || activeProfile?.spreadsheet_id || '',
        profile_name: activeProfile?.name || 'Google Storage Profile',
        latency_ms: latency,
        message,
      },
    };
  }

  /**
   * Reset hitungan item baru setelah user melihat toast
   */
  public acknowledgeNewItems(): void {
    this.newItemsFoundLastSync = 0;
  }
}
