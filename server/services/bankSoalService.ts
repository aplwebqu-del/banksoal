import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { BankSoal, User, FilterParams, StatsOverview, CategoryItem, DriveSyncResult, MigrationReport } from '../../src/types';
import { StorageRouter } from './storageRouter';
import { GoogleDriveService } from './googleDriveService';
import { GoogleSheetsService } from './googleSheetsService';
import { GoogleAppsScriptGateway } from './googleAppsScriptGateway';
import { GoogleConfigService } from './googleConfig';

export class BankSoalService {
  private static instance: BankSoalService;
  private storageRouter: StorageRouter;
  private driveService: GoogleDriveService;
  private sheetsService: GoogleSheetsService;
  private appsScriptGateway: GoogleAppsScriptGateway;
  private configService: GoogleConfigService;

  private constructor() {
    this.storageRouter = StorageRouter.getInstance();
    this.driveService = GoogleDriveService.getInstance();
    this.sheetsService = GoogleSheetsService.getInstance();
    this.appsScriptGateway = GoogleAppsScriptGateway.getInstance();
    this.configService = GoogleConfigService.getInstance();
  }

  public static getInstance(): BankSoalService {
    if (!BankSoalService.instance) {
      BankSoalService.instance = new BankSoalService();
    }
    return BankSoalService.instance;
  }

  /**
   * Upload Berkas PDF Baru ke Storage melalui StorageRouter
   */
  public async uploadPdfAndRecord(
    fileBuffer: Buffer,
    originalName: string,
    metadata: {
      judul: string;
      mata_pelajaran: string;
      jenjang: any;
      kelas: string | number;
      kurikulum?: string;
      bab?: string;
      topik?: string;
      subtopik?: string;
      jenis_soal?: any;
      tingkat_kesulitan?: any;
      tahun?: number;
      semester?: any;
      sumber?: string;
      pembuat_pengajar?: string;
      deskripsi?: string;
      tags?: string[];
      jumlah_halaman?: number;
    },
    user: User
  ): Promise<BankSoal> {
    let pageCount = Number(metadata.jumlah_halaman) || 1;
    try {
      const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
      pageCount = pdfDoc.getPageCount();
    } catch {}

    // Delegasikan upload dan penulisan storage ke StorageRouter
    const uploadResult = await this.storageRouter.uploadFile({
      buffer: fileBuffer,
      originalName: originalName,
      metadata: {
        ...metadata,
        jumlah_halaman: pageCount,
      } as any,
      user: user,
    });

    const record: BankSoal = {
      id: uploadResult.bank_soal_id,
      judul: metadata.judul,
      nama_file: originalName,
      file_id: uploadResult.file_id,
      folder_id: uploadResult.folder_id,
      drive_file_id: uploadResult.drive_file_id,
      drive_folder_id: uploadResult.drive_folder_id,
      storage_profile_id: uploadResult.storage_profile_id,
      spreadsheet_id: uploadResult.spreadsheet_id,
      file_url: uploadResult.file_url,
      web_view_url: uploadResult.web_view_url,
      download_url: uploadResult.download_url,
      mime_type: 'application/pdf',
      storage_path: uploadResult.storage_path,
      file_hash: uploadResult.file_hash,
      mata_pelajaran: metadata.mata_pelajaran,
      jenjang: metadata.jenjang,
      kelas: String(metadata.kelas),
      kurikulum: metadata.kurikulum || 'Kurikulum Merdeka',
      bab: metadata.bab || 'Umum',
      topik: metadata.topik || 'Latihan Soal',
      subtopik: metadata.subtopik || '',
      jenis_soal: metadata.jenis_soal || 'Pilihan Ganda',
      tingkat_kesulitan: metadata.tingkat_kesulitan || 'Sedang',
      tahun: Number(metadata.tahun) || new Date().getFullYear(),
      semester: metadata.semester || 'Ganjil',
      sumber: metadata.sumber || '',
      pembuat_pengajar: metadata.pembuat_pengajar || user.name,
      deskripsi: metadata.deskripsi || '',
      tags: Array.isArray(metadata.tags) ? metadata.tags : [],
      jumlah_halaman: pageCount,
      ukuran_file: uploadResult.file_size,
      uploaded_by: user.id,
      uploaded_by_name: user.name,
      uploaded_by_email: user.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'aktif',
      sync_status: uploadResult.sync_status as any,
      version: 1,
      download_count: 0,
      view_count: 0,
    };

    return await this.sheetsService.createBankSoal(record, user);
  }

  /**
   * Upload Versi Baru PDF melalui StorageRouter
   */
  public async addVersionToBankSoal(
    id: string,
    fileBuffer: Buffer,
    originalName: string,
    catatan: string,
    user: User
  ): Promise<BankSoal | null> {
    return await this.storageRouter.addVersion(id, fileBuffer, originalName, user, catatan);
  }

  /**
   * Pulihkan Bank Soal dari Sampah (Restore)
   */
  public async restoreBankSoal(id: string, user: User): Promise<boolean> {
    return await this.storageRouter.restoreMetadata(id, user);
  }

  /**
   * Hapus Permanen Bank Soal dari Storage
   */
  public async permanentDeleteBankSoal(id: string, user: User): Promise<boolean> {
    return await this.storageRouter.deleteMetadata(id, user, true);
  }

  /**
   * Kosongkan Seluruh Keranjang Sampah
   */
  public async emptyTrash(user: User): Promise<{ count: number }> {
    const res = await this.sheetsService.emptyTrash(user);
    return { count: res.count };
  }

  /**
   * Health Check Terpadu Seluruh Sub-Sistem
   */
  public async getHealthCheck(): Promise<{
    status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
    server: { status: string; uptime_seconds: number };
    database: { status: string; total_records: number; sheets: string[] };
    google_drive: { status: string; root_folder_id: string };
    google_apps_script: { status: string; configured: boolean; latency_ms?: number; url?: string };
    timestamp: string;
  }> {
    const stats = await this.sheetsService.getStats();
    const active = this.storageRouter.getActiveStorage();
    const hasAppsScript = Boolean(active?.apps_script_url);

    let gasStatus = hasAppsScript ? 'CONFIGURED' : 'NOT_CONFIGURED';
    let gasLatency: number | undefined = undefined;

    if (hasAppsScript && active) {
      const start = Date.now();
      const testRes = await this.storageRouter.testStorage(active);
      gasLatency = Date.now() - start;
      gasStatus = testRes.success ? 'ONLINE' : 'UNREACHABLE';
    }

    return {
      status: 'HEALTHY',
      server: {
        status: 'ONLINE',
        uptime_seconds: Math.floor(process.uptime()),
      },
      database: {
        status: 'ONLINE',
        total_records: stats.total_soal,
        sheets: ['SYSTEM_CONFIG', 'STORAGE_PROFILES', 'BANK_SOAL', 'USERS', 'CATEGORIES', 'ACTIVITY_LOG', 'SYNC_LOG'],
      },
      google_drive: {
        status: 'ONLINE',
        root_folder_id: active?.drive_root_folder_id || 'root',
      },
      google_apps_script: {
        status: gasStatus,
        configured: hasAppsScript,
        latency_ms: gasLatency,
        url: active?.apps_script_url,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Sinkronisasi Lengkap Google Drive ↔ Google Sheets
   */
  public async syncGoogleDriveAndSheets(): Promise<DriveSyncResult> {
    return await this.storageRouter.syncStorage();
  }
}
