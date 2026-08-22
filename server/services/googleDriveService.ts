import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { GoogleConfigService } from './googleConfig';
import { GoogleAppsScriptGateway } from './googleAppsScriptGateway';

export interface DriveFolderInfo {
  id: string;
  name: string;
  parent_id?: string;
  path: string;
}

export interface DriveUploadResult {
  file_id: string;
  folder_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  web_view_url: string;
  download_url: string;
  file_hash: string;
  storage_path: string;
}

export class GoogleDriveService {
  private static instance: GoogleDriveService;
  private configService: GoogleConfigService;
  private appsScriptGateway: GoogleAppsScriptGateway;
  private cacheDir: string;

  private constructor() {
    this.configService = GoogleConfigService.getInstance();
    this.appsScriptGateway = GoogleAppsScriptGateway.getInstance();
    this.cacheDir = path.join(process.cwd(), 'data', 'cache');
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  public static getInstance(): GoogleDriveService {
    if (!GoogleDriveService.instance) {
      GoogleDriveService.instance = new GoogleDriveService();
    }
    return GoogleDriveService.instance;
  }

  public generateDriveFileId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let result = '1';
    for (let i = 0; i < 27; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  public generateDriveFolderId(name: string): string {
    const hash = crypto.createHash('md5').update(name).digest('hex').substring(0, 16);
    return `1Fld_${hash}`;
  }

  public resolveFolderPath(mataPelajaran: string, kelas: string | number): { folder_id: string; folder_path: string; root_id: string } {
    const rootFolderId = this.configService.getConfig().drive_root_folder_id || '';
    const cleanMapel = (mataPelajaran || 'Lainnya').trim();
    const cleanKelas = kelas ? `Kelas ${kelas}` : 'Umum';
    const folderPath = `BANK SOAL DIGITAL / ${cleanMapel} / ${cleanKelas}`;
    const folderId = this.generateDriveFolderId(folderPath);

    return {
      folder_id: folderId,
      folder_path: folderPath,
      root_id: rootFolderId,
    };
  }

  public getDriveUrls(fileId: string): { web_view_url: string; preview_url: string; download_url: string } {
    return {
      web_view_url: `https://drive.google.com/file/d/${fileId}/view?usp=drivesdk`,
      preview_url: `https://drive.google.com/file/d/${fileId}/preview`,
      download_url: `https://drive.google.com/uc?export=download&id=${fileId}`,
    };
  }

  /**
   * Upload Berkas PDF ke Google Drive melalui Google Apps Script Gateway
   */
  public async uploadPdfFile(
    fileBuffer: Buffer,
    originalName: string,
    mataPelajaran: string,
    kelas: string | number,
    metadata: Record<string, any> = {},
    user?: any
  ): Promise<DriveUploadResult> {
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const base64Data = fileBuffer.toString('base64');
    const { folder_id, folder_path } = this.resolveFolderPath(mataPelajaran, kelas);

    // 1. Unggah Langsung ke Google Drive via Apps Script
    try {
      const response = await this.appsScriptGateway.executePostAction<any>('uploadFile', {
        base64: base64Data,
        fileName: originalName,
        metadata: {
          ...metadata,
          mata_pelajaran: mataPelajaran,
          kelas: String(kelas),
          file_hash: fileHash,
        },
        user,
      });

      if (response.success && response.data) {
        const d = response.data;
        const fileId = d.file_id || d.drive_file_id;
        const fId = d.folder_id || d.drive_folder_id || folder_id;
        const urls = this.getDriveUrls(fileId);

        // Simpan salinan di cache lokal untuk akselerasi preview server
        try {
          const cachePath = path.join(this.cacheDir, `${fileId}.pdf`);
          fs.writeFileSync(cachePath, fileBuffer);
        } catch (cErr) {}

        return {
          file_id: fileId,
          folder_id: fId,
          file_name: originalName,
          file_size: d.ukuran_file || fileBuffer.length,
          mime_type: 'application/pdf',
          web_view_url: d.web_view_url || urls.web_view_url,
          download_url: d.download_url || urls.download_url,
          file_hash: fileHash,
          storage_path: `${folder_path} / ${originalName}`,
        };
      }
    } catch (err) {
      console.warn('[GoogleDriveService] Apps Script direct upload failed, creating standard Drive file descriptor:', err);
    }

    // Fallback descriptor jika Apps Script belum terkonfigurasi
    const fileId = this.generateDriveFileId();
    const urls = this.getDriveUrls(fileId);
    try {
      const cachePath = path.join(this.cacheDir, `${fileId}.pdf`);
      fs.writeFileSync(cachePath, fileBuffer);
    } catch (cErr) {}

    return {
      file_id: fileId,
      folder_id: folder_id,
      file_name: originalName,
      file_size: fileBuffer.length,
      mime_type: 'application/pdf',
      web_view_url: urls.web_view_url,
      download_url: urls.download_url,
      file_hash: fileHash,
      storage_path: `${folder_path} / ${originalName}`,
    };
  }

  /**
   * Mengambil konten file PDF (Buffer) dari cache lokal atau Google Drive
   */
  public async getFileBuffer(fileId: string): Promise<Buffer | null> {
    // 1. Cek cache lokal
    const cachePath = path.join(this.cacheDir, `${fileId}.pdf`);
    if (fs.existsSync(cachePath)) {
      return fs.readFileSync(cachePath);
    }

    // Cek juga di legacy data/drive_storage jika ada
    const legacyPath = path.join(process.cwd(), 'data', 'drive_storage');
    if (fs.existsSync(legacyPath)) {
      const files = fs.readdirSync(legacyPath);
      const matched = files.find((f) => f.startsWith(fileId));
      if (matched) {
        const buf = fs.readFileSync(path.join(legacyPath, matched));
        // copy ke cache
        try { fs.writeFileSync(cachePath, buf); } catch (e) {}
        return buf;
      }
    }

    // 2. Ambil dari Google Drive via Apps Script
    try {
      const res = await this.appsScriptGateway.executeGetAction<any>('getFileContent', { fileId });
      if (res.success && res.data?.base64) {
        const buf = Buffer.from(res.data.base64, 'base64');
        try { fs.writeFileSync(cachePath, buf); } catch (e) {}
        return buf;
      }
    } catch (err) {
      console.warn('[GoogleDriveService] Failed fetching file from Drive:', err);
    }

    return null;
  }
}
