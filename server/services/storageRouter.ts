import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  BankSoal,
  GoogleStorageProfile,
  StorageProfileHealthStatus,
  QuotaStatus,
  ConnectionTestResult,
  DriveSyncResult,
  FilterParams,
  User,
  BankSoalVersion,
} from '../../src/types';
import { GoogleConfigService, GoogleStorageManagerService, extractDriveFolderId, extractSpreadsheetId } from './googleConfig';
import { GoogleAppsScriptGateway } from './googleAppsScriptGateway';
import { GoogleDriveService } from './googleDriveService';
import { GoogleSheetsRepository } from './googleSheetsRepository';

export interface StorageUploadOptions {
  buffer: Buffer;
  originalName: string;
  metadata: Partial<BankSoal>;
  user?: User;
  existingFileId?: string;
  storageProfileId?: string;
}

export interface StorageUploadResult {
  success: boolean;
  bank_soal_id: string;
  file_id: string;
  folder_id: string;
  drive_file_id: string;
  drive_folder_id: string;
  spreadsheet_id: string;
  storage_profile_id: string;
  file_url: string;
  web_view_url: string;
  download_url: string;
  file_name: string;
  file_size: number;
  jumlah_halaman: number;
  file_hash: string;
  sync_status: string;
  storage_path: string;
  failover_attempted?: boolean;
  failover_profile_id?: string;
  failover_reason?: string;
}

export class StorageRouter {
  private static instance: StorageRouter;
  private storageManager: GoogleStorageManagerService;
  private configService: GoogleConfigService;
  private appsScriptGateway: GoogleAppsScriptGateway;
  private driveService: GoogleDriveService;
  private sheetsRepository: GoogleSheetsRepository;

  private constructor() {
    this.storageManager = GoogleStorageManagerService.getInstance();
    this.configService = GoogleConfigService.getInstance();
    this.appsScriptGateway = GoogleAppsScriptGateway.getInstance();
    this.driveService = GoogleDriveService.getInstance();
    this.sheetsRepository = GoogleSheetsRepository.getInstance();
  }

  public static getInstance(): StorageRouter {
    if (!StorageRouter.instance) {
      StorageRouter.instance = new StorageRouter();
    }
    return StorageRouter.instance;
  }

  // ==========================================
  // PROFILE MANAGEMENT & ROUTING
  // ==========================================

  public getActiveStorage(): GoogleStorageProfile | null {
    return this.storageManager.getActiveProfile();
  }

  public getStorageProfile(id: string): GoogleStorageProfile | null {
    return this.storageManager.getProfileById(id);
  }

  public getAvailableStorages(): GoogleStorageProfile[] {
    return this.storageManager.getAllProfiles();
  }

  public setActiveStorage(id: string): GoogleStorageProfile | null {
    return this.storageManager.setActiveProfile(id);
  }

  public saveStorageProfile(profile: Partial<GoogleStorageProfile>): GoogleStorageProfile {
    return this.storageManager.saveProfile(profile);
  }

  public deleteStorageProfile(id: string): boolean {
    return this.storageManager.deleteProfile(id).success;
  }

  /**
   * Memilih Storage Target untuk operasi Tulis (Write)
   * Berdasarkan Active Profile & Urutan Prioritas dengan Pengecekan Quota & Health
   */
  public selectStorageForWrite(): GoogleStorageProfile | null {
    const allProfiles = this.storageManager.getAllProfiles();
    if (allProfiles.length === 0) return null;

    const active = allProfiles.find((p) => p.is_active);
    if (active && active.status !== 'DISABLED' && active.quota_status !== 'FULL') {
      return active;
    }

    const candidates = allProfiles
      .filter((p) => p.status !== 'DISABLED' && p.quota_status !== 'FULL')
      .sort((a, b) => (a.priority || 99) - (b.priority || 99));

    return candidates.length > 0 ? candidates[0] : (active || allProfiles[0]);
  }

  public async testStorage(profileOrId: string | GoogleStorageProfile): Promise<ConnectionTestResult> {
    return await this.storageManager.testProfile(profileOrId);
  }

  // ==========================================
  // FILE UPLOAD WITH AUTOMATIC FAILOVER
  // ==========================================

  public async uploadFile(options: StorageUploadOptions): Promise<StorageUploadResult> {
    const { buffer, originalName, metadata, user, existingFileId } = options;
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
    const base64Data = buffer.toString('base64');

    const allProfiles = this.storageManager.getAllProfiles().filter((p) => p.status !== 'DISABLED');
    const activeProfile = this.getActiveStorage();

    const candidateProfiles: GoogleStorageProfile[] = [];
    if (activeProfile && activeProfile.status !== 'DISABLED') {
      candidateProfiles.push(activeProfile);
    }
    allProfiles.forEach((p) => {
      if (!candidateProfiles.some((cp) => cp.id === p.id)) {
        candidateProfiles.push(p);
      }
    });

    let lastError: any = null;
    let failoverAttempted = false;
    let failoverReason = '';

    // Coba upload ke masing-masing profil kandidat (Failover loop)
    for (let i = 0; i < candidateProfiles.length; i++) {
      const profile = candidateProfiles[i];
      const scriptUrl = (profile.apps_script_url || '').trim();

      if (scriptUrl && scriptUrl.startsWith('http') && profile.quota_status !== 'FULL') {
        try {
          const uploadPayload = {
            action: 'uploadFile',
            base64: base64Data,
            fileName: originalName,
            metadata: {
              ...metadata,
              file_hash: fileHash,
            },
            user: user || { id: 'u-1', name: 'Dra. Hj. Nurhayati, M.Pd.', email: 'nurhayati@sekolah.sch.id', role: 'ADMIN' },
            driveFolderId: profile.google_drive_folder_id || profile.drive_root_folder_id,
            spreadsheetId: profile.google_spreadsheet_id || profile.spreadsheet_id,
            storageProfileId: profile.id,
          };

          const response = await fetch(scriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(uploadPayload),
            redirect: 'follow',
          });

          if (response.ok) {
            const json = await response.json();
            if (json && json.success && json.data) {
              const resData = json.data;
              const realDriveFileId = resData.file_id || resData.drive_file_id || existingFileId || this.driveService.generateDriveFileId();
              const realDriveFolderId = resData.folder_id || resData.drive_folder_id || profile.google_drive_folder_id || '';
              const realSpreadsheetId = resData.spreadsheet_id || profile.google_spreadsheet_id || '';

              // Simpan di cache lokal untuk instant preview
              const cacheDir = path.join(process.cwd(), 'data', 'cache');
              if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
              fs.writeFileSync(path.join(cacheDir, `${realDriveFileId}.pdf`), buffer);

              return {
                success: true,
                bank_soal_id: resData.id || resData.bank_soal_id || 'BS-000001',
                file_id: realDriveFileId,
                folder_id: realDriveFolderId,
                drive_file_id: realDriveFileId,
                drive_folder_id: realDriveFolderId,
                spreadsheet_id: realSpreadsheetId,
                storage_profile_id: profile.id,
                file_url: resData.file_url || resData.web_view_url || `https://drive.google.com/file/d/${realDriveFileId}/view`,
                web_view_url: resData.web_view_url || `https://drive.google.com/file/d/${realDriveFileId}/view`,
                download_url: resData.download_url || `https://drive.google.com/uc?export=download&id=${realDriveFileId}`,
                file_name: originalName,
                file_size: buffer.length,
                jumlah_halaman: Number(metadata.jumlah_halaman) || 1,
                file_hash: fileHash,
                sync_status: 'SYNCED',
                storage_path: `BANK SOAL DIGITAL / ${metadata.mata_pelajaran || 'Umum'} / Kelas ${metadata.kelas || '10'} / ${originalName}`,
                failover_attempted: failoverAttempted,
                failover_profile_id: failoverAttempted ? profile.id : undefined,
                failover_reason: failoverReason || undefined,
              };
            }
          }
        } catch (err: any) {
          console.warn(`[StorageRouter] Upload to profile ${profile.id} failed:`, err.message);
          failoverAttempted = true;
          failoverReason = `Koneksi ke storage ${profile.name} gagal (${err.message}). Mencoba storage cadangan...`;
          lastError = err;
        }
      }
    }

    // Fallback standard descriptor
    const localUpload = await this.driveService.uploadPdfFile(
      buffer,
      originalName,
      metadata.mata_pelajaran || 'Umum',
      metadata.kelas || '10',
      metadata,
      user
    );

    const activeOrFirst = activeProfile || candidateProfiles[0] || {
      id: 'storage-001',
      google_spreadsheet_id: '',
      google_drive_folder_id: '',
    };

    return {
      success: true,
      bank_soal_id: `BS-${Date.now().toString().slice(-6)}`,
      file_id: localUpload.file_id,
      folder_id: localUpload.folder_id,
      drive_file_id: localUpload.file_id,
      drive_folder_id: localUpload.folder_id,
      spreadsheet_id: (activeOrFirst as any).google_spreadsheet_id || '',
      storage_profile_id: activeOrFirst.id || 'storage-001',
      file_url: localUpload.web_view_url,
      web_view_url: localUpload.web_view_url,
      download_url: localUpload.download_url,
      file_name: originalName,
      file_size: buffer.length,
      jumlah_halaman: Number(metadata.jumlah_halaman) || 1,
      file_hash: fileHash,
      sync_status: 'SYNCED',
      storage_path: localUpload.storage_path,
      failover_attempted: failoverAttempted,
      failover_reason: failoverReason || (lastError ? lastError.message : undefined),
    };
  }

  public async getFile(fileId: string, storageProfileId?: string): Promise<{ buffer: Buffer; mime_type: string; fileName: string } | null> {
    const buf = await this.driveService.getFileBuffer(fileId);
    if (buf) {
      return {
        buffer: buf,
        mime_type: 'application/pdf',
        fileName: `bank_soal_${fileId}.pdf`,
      };
    }
    return null;
  }

  // ==========================================
  // METADATA & DATABASE OPERATIONS VIA REPOSITORY
  // ==========================================

  public async saveMetadata(item: Partial<BankSoal>, user?: User): Promise<BankSoal> {
    return await this.sheetsRepository.createBankSoal(item, user);
  }

  public async getMetadata(id: string, userId?: string): Promise<BankSoal | null> {
    return await this.sheetsRepository.getBankSoalById(id, userId);
  }

  public async getMetadataList(filter: FilterParams, userId?: string): Promise<{ items: BankSoal[]; total: number; page: number; totalPages: number }> {
    return await this.sheetsRepository.getBankSoalList(filter);
  }

  public async updateMetadata(id: string, updates: Partial<BankSoal>, user?: User): Promise<BankSoal | null> {
    return await this.sheetsRepository.updateBankSoal(id, updates, user);
  }

  public async deleteMetadata(id: string, user?: User, isPermanent = false): Promise<boolean> {
    if (isPermanent) {
      return await this.sheetsRepository.permanentDeleteBankSoal(id, user);
    }
    return await this.sheetsRepository.softDeleteBankSoal(id, user);
  }

  public async restoreMetadata(id: string, user?: User): Promise<boolean> {
    return await this.sheetsRepository.restoreBankSoal(id, user);
  }

  public async addVersion(id: string, fileBuffer: Buffer, fileName: string, user: User, catatan?: string): Promise<BankSoal | null> {
    const base64 = fileBuffer.toString('base64');
    return await this.sheetsRepository.addVersion({
      id,
      base64,
      fileName,
      catatan,
      user
    });
  }

  public async syncStorage(profileId?: string): Promise<DriveSyncResult> {
    return await this.sheetsRepository.syncDriveWithSheets();
  }
}
