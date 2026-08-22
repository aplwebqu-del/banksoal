import {
  GoogleStorageProfile,
  ConnectionTestResult,
  StorageProfileHealthStatus,
} from '../../src/types';
import { GoogleSheetsRepository } from './googleSheetsRepository';
import { GoogleAppsScriptGateway } from './googleAppsScriptGateway';

/**
 * Ekstraksi ID Folder Google Drive dari URL atau string ID langsung
 */
export function extractDriveFolderId(input?: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  return trimmed;
}

/**
 * Ekstraksi ID Google Spreadsheet dari URL atau string ID langsung
 */
export function extractSpreadsheetId(input?: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  return trimmed;
}

const DEFAULT_PRIMARY_PROFILE: GoogleStorageProfile = {
  id: 'storage-001',
  name: 'Bank Soal Utama',
  description: 'Penyimpanan Google Drive & Google Sheets primer institusi.',
  google_drive_folder_id: '',
  drive_root_folder_id: '',
  google_spreadsheet_id: '',
  spreadsheet_id: '',
  apps_script_url: '',
  status: 'ACTIVE',
  health_status: 'HEALTHY',
  connection_status: 'PENDING',
  quota_status: 'NORMAL',
  priority: 1,
  is_active: true,
  provider: 'google',
  drive_root_name: 'BANK SOAL DIGITAL',
  spreadsheet_name: 'BANK SOAL DIGITAL',
  last_connection_test: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'Admin',
};

const DEFAULT_SECONDARY_PROFILE: GoogleStorageProfile = {
  id: 'storage-002',
  name: 'Bank Soal Cadangan / Failover',
  description: 'Profil cadangan otomatis ketika penyimpanan utama penuh atau tidak dapat diakses.',
  google_drive_folder_id: '',
  drive_root_folder_id: '',
  google_spreadsheet_id: '',
  spreadsheet_id: '',
  apps_script_url: '',
  status: 'INACTIVE',
  health_status: 'HEALTHY',
  connection_status: 'PENDING',
  quota_status: 'NORMAL',
  priority: 2,
  is_active: false,
  provider: 'google',
  drive_root_name: 'BANK SOAL CADANGAN',
  spreadsheet_name: 'BANK SOAL CADANGAN',
  last_connection_test: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'Admin',
};

export class StorageProfileRepository {
  private static instance: StorageProfileRepository;
  private memoryProfiles: Map<string, GoogleStorageProfile> = new Map();

  private constructor() {
    this.memoryProfiles.set(DEFAULT_PRIMARY_PROFILE.id, { ...DEFAULT_PRIMARY_PROFILE });
    this.memoryProfiles.set(DEFAULT_SECONDARY_PROFILE.id, { ...DEFAULT_SECONDARY_PROFILE });
  }

  public static getInstance(): StorageProfileRepository {
    if (!StorageProfileRepository.instance) {
      StorageProfileRepository.instance = new StorageProfileRepository();
    }
    return StorageProfileRepository.instance;
  }

  private normalize(raw: Partial<GoogleStorageProfile>): GoogleStorageProfile {
    const driveFolderId = extractDriveFolderId(raw.google_drive_folder_id || raw.drive_root_folder_id || raw.drive_folder_id);
    const spreadsheetId = extractSpreadsheetId(raw.google_spreadsheet_id || raw.spreadsheet_id);

    return {
      id: raw.id || `storage-${Date.now()}`,
      name: raw.name || 'Penyimpanan Google',
      description: raw.description || '',
      google_drive_folder_id: driveFolderId,
      drive_root_folder_id: driveFolderId,
      drive_folder_id: driveFolderId,
      google_spreadsheet_id: spreadsheetId,
      spreadsheet_id: spreadsheetId,
      apps_script_url: (raw.apps_script_url || '').trim(),
      status: raw.status || (raw.is_active ? 'ACTIVE' : 'INACTIVE'),
      health_status: raw.health_status || 'HEALTHY',
      connection_status: raw.connection_status || 'PENDING',
      quota_status: raw.quota_status || 'NORMAL',
      quota_bytes_used: raw.quota_bytes_used || 0,
      quota_bytes_total: raw.quota_bytes_total || 0,
      priority: Number(raw.priority) || 1,
      is_active: Boolean(raw.is_active),
      provider: 'google',
      drive_root_name: raw.drive_root_name || 'BANK SOAL DIGITAL',
      spreadsheet_name: raw.spreadsheet_name || 'BANK SOAL DIGITAL',
      latency_ms: raw.latency_ms || raw.last_latency_ms || 0,
      last_latency_ms: raw.latency_ms || raw.last_latency_ms || 0,
      last_error: raw.last_error,
      last_connection_test: raw.last_connection_test || raw.last_connection_check || raw.last_check || new Date().toISOString(),
      last_connection_check: raw.last_connection_test || raw.last_connection_check || new Date().toISOString(),
      last_sync: raw.last_sync || raw.last_sync_at || new Date().toISOString(),
      last_sync_at: raw.last_sync || raw.last_sync_at || new Date().toISOString(),
      created_at: raw.created_at || new Date().toISOString(),
      updated_at: raw.updated_at || new Date().toISOString(),
      created_by: raw.created_by || 'Admin',
      drive_details: raw.drive_details,
      sheets_details: raw.sheets_details,
    };
  }

  public getAll(): GoogleStorageProfile[] {
    return Array.from(this.memoryProfiles.values()).sort((a, b) => (a.priority || 1) - (b.priority || 1));
  }

  public getById(id: string): GoogleStorageProfile | null {
    return this.memoryProfiles.get(id) || null;
  }

  public getActive(): GoogleStorageProfile {
    const all = this.getAll();
    const active = all.find((p) => p.is_active) || all[0] || DEFAULT_PRIMARY_PROFILE;
    return active;
  }

  public setActive(id: string): GoogleStorageProfile {
    const target = this.getById(id);
    if (!target) {
      throw new Error(`Profil storage dengan ID '${id}' tidak ditemukan.`);
    }

    this.memoryProfiles.forEach((p) => {
      p.is_active = (p.id === id);
      p.status = (p.id === id) ? 'ACTIVE' : 'INACTIVE';
      p.updated_at = new Date().toISOString();
    });

    // Notify repository layer
    GoogleSheetsRepository.getInstance().setActiveStorageProfile(id).catch(() => {});

    return this.getById(id)!;
  }

  public create(data: Partial<GoogleStorageProfile>): GoogleStorageProfile {
    const normalized = this.normalize(data);
    if (!data.id) {
      normalized.id = `storage-${('000' + (this.memoryProfiles.size + 1)).slice(-3)}`;
    }

    if (normalized.is_active || this.memoryProfiles.size === 0) {
      this.memoryProfiles.forEach((p) => {
        p.is_active = false;
        p.status = 'INACTIVE';
      });
      normalized.is_active = true;
      normalized.status = 'ACTIVE';
    }

    this.memoryProfiles.set(normalized.id, normalized);
    GoogleSheetsRepository.getInstance().saveStorageProfile(normalized).catch(() => {});
    return normalized;
  }

  public update(id: string, updates: Partial<GoogleStorageProfile>): GoogleStorageProfile {
    const existing = this.getById(id);
    if (!existing) {
      throw new Error(`Profil storage dengan ID '${id}' tidak ditemukan.`);
    }

    const merged = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const normalized = this.normalize(merged);
    this.memoryProfiles.set(id, normalized);

    if (updates.is_active) {
      this.setActive(id);
    }

    GoogleSheetsRepository.getInstance().saveStorageProfile(normalized).catch(() => {});
    return normalized;
  }

  public delete(id: string): { success: boolean; message: string; newActiveId?: string } {
    const existing = this.getById(id);
    if (!existing) {
      return { success: false, message: 'Profil tidak ditemukan' };
    }

    if (this.memoryProfiles.size <= 1) {
      return { success: false, message: 'Tidak dapat menghapus satu-satunya profil penyimpanan.' };
    }

    const wasActive = existing.is_active;
    this.memoryProfiles.delete(id);
    GoogleSheetsRepository.getInstance().deleteStorageProfile(id).catch(() => {});

    let newActiveId: string | undefined;
    if (wasActive) {
      const remaining = this.getAll();
      if (remaining.length > 0) {
        remaining[0].is_active = true;
        remaining[0].status = 'ACTIVE';
        newActiveId = remaining[0].id;
        GoogleSheetsRepository.getInstance().setActiveStorageProfile(newActiveId).catch(() => {});
      }
    }

    return {
      success: true,
      message: `Profil '${existing.name}' berhasil dihapus.`,
      newActiveId,
    };
  }

  public updateHealth(id: string, updates: Partial<GoogleStorageProfile>): void {
    const existing = this.getById(id);
    if (!existing) return;

    const merged = { ...existing, ...updates, updated_at: new Date().toISOString() };
    this.memoryProfiles.set(id, this.normalize(merged));
  }

  public updateConnectionResult(id: string, testResult: ConnectionTestResult): void {
    const existing = this.getById(id);
    if (!existing) return;

    const isConnected = Boolean(testResult.success);
    const healthStatus: StorageProfileHealthStatus = isConnected
      ? 'HEALTHY'
      : testResult.apps_script.reachable
      ? 'DEGRADED'
      : 'ERROR';

    const updates: Partial<GoogleStorageProfile> = {
      health_status: healthStatus,
      connection_status: isConnected ? 'CONNECTED' : 'ERROR',
      latency_ms: testResult.latency_ms,
      last_latency_ms: testResult.latency_ms,
      last_connection_test: testResult.timestamp,
      last_connection_check: testResult.timestamp,
      drive_details: {
        connected: testResult.google_drive.connected,
        folder_id: testResult.google_drive.folder_id,
        folder_name: testResult.google_drive.folder_name,
        accessible: testResult.google_drive.connected,
        write_test: testResult.google_drive.write_test,
        read_test: testResult.google_drive.read_test,
        error: testResult.google_drive.error,
      },
      sheets_details: {
        connected: testResult.google_sheets.connected,
        spreadsheet_id: testResult.google_sheets.spreadsheet_id,
        spreadsheet_name: testResult.google_sheets.spreadsheet_name,
        sheet_count: testResult.google_sheets.sheet_count,
        write_test: testResult.google_sheets.write_test,
        read_test: testResult.google_sheets.read_test,
        error: testResult.google_sheets.error,
      },
    };

    this.updateHealth(id, updates);
  }

  public async testProfile(profileOrId: string | GoogleStorageProfile): Promise<ConnectionTestResult> {
    const profile = typeof profileOrId === 'string' ? this.getById(profileOrId) : profileOrId;
    if (!profile) {
      return {
        success: false,
        latency_ms: 0,
        apps_script: { reachable: false, url: '', message: 'Profil tidak ditemukan' },
        google_drive: { connected: false, folder_id: '', folder_name: '' },
        google_sheets: { connected: false, spreadsheet_id: '', spreadsheet_name: '', sheet_count: 0 },
        timestamp: new Date().toISOString(),
      };
    }

    const testRes = await GoogleAppsScriptGateway.getInstance().testLiveConnection();
    this.updateConnectionResult(profile.id, testRes);
    return testRes;
  }
}
