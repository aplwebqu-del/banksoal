import {
  GoogleIntegrationConfig,
  GoogleStorageProfile,
  ConnectionTestResult,
} from '../../src/types';
import {
  StorageProfileRepository,
  extractDriveFolderId,
  extractSpreadsheetId,
} from './storageProfileRepository';

export { extractDriveFolderId, extractSpreadsheetId };

/**
 * GoogleStorageManagerService
 * Layanan manajemen Google Storage Profile yang menggunakan database persistent
 * (StorageProfileRepository) sehingga aman dan persisten untuk deployment production.
 */
export class GoogleStorageManagerService {
  private static instance: GoogleStorageManagerService;
  protected repository: StorageProfileRepository;

  protected constructor() {
    this.repository = StorageProfileRepository.getInstance();
  }

  public static getInstance(): GoogleStorageManagerService {
    if (!GoogleStorageManagerService.instance) {
      GoogleStorageManagerService.instance = new GoogleStorageManagerService();
    }
    return GoogleStorageManagerService.instance;
  }

  /**
   * Dapatkan seluruh profil Google Storage
   */
  public getProfiles(): GoogleStorageProfile[] {
    return this.repository.getAll();
  }

  public getAllProfiles(): GoogleStorageProfile[] {
    return this.repository.getAll();
  }

  /**
   * Dapatkan satu profil berdasarkan ID
   */
  public getProfileById(id: string): GoogleStorageProfile | null {
    return this.repository.getById(id);
  }

  /**
   * Dapatkan profil yang sedang aktif (Active Storage)
   */
  public getActiveProfile(): GoogleStorageProfile {
    return this.repository.getActive();
  }

  /**
   * Jadikan profil tertentu sebagai Active Storage
   */
  public setActiveProfile(id: string): GoogleStorageProfile {
    return this.repository.setActive(id);
  }

  /**
   * Simpan atau perbarui profil (Upsert)
   */
  public saveProfile(profile: Partial<GoogleStorageProfile>): GoogleStorageProfile {
    if (profile.id && this.getProfileById(profile.id)) {
      return this.updateProfile(profile.id, profile);
    } else {
      return this.createProfile(profile);
    }
  }

  /**
   * Tambah profil Google Storage baru
   */
  public createProfile(data: Partial<GoogleStorageProfile>): GoogleStorageProfile {
    return this.repository.create(data);
  }

  /**
   * Perbarui konfigurasi profil Google Storage
   */
  public updateProfile(id: string, updates: Partial<GoogleStorageProfile>): GoogleStorageProfile {
    return this.repository.update(id, updates);
  }

  /**
   * Hapus profil Google Storage
   */
  public deleteProfile(id: string): { success: boolean; message: string; newActiveId?: string } {
    return this.repository.delete(id);
  }

  /**
   * Update status kesehatan & kuota profil
   */
  public updateProfileHealth(id: string, updates: Partial<GoogleStorageProfile>): void {
    this.repository.updateHealth(id, updates);
  }

  /**
   * Update timestamps dan status profil
   */
  public updateProfileConnectionResult(id: string, testResult: ConnectionTestResult): void {
    this.repository.updateConnectionResult(id, testResult);
  }

  /**
   * Uji Koneksi Live Aktual ke Google Apps Script, Drive, dan Sheets
   */
  public async testProfile(profileOrId: string | GoogleStorageProfile): Promise<ConnectionTestResult> {
    return this.repository.testProfile(profileOrId);
  }

  // ==========================================================================
  // Backward compatibility methods for GoogleConfigService
  // ==========================================================================
  public getConfig(): GoogleIntegrationConfig {
    const active = this.getActiveProfile();
    return {
      spreadsheet_id: active.spreadsheet_id || active.google_spreadsheet_id || '',
      drive_root_folder_id: active.drive_root_folder_id || active.google_drive_folder_id || '',
      apps_script_url: active.apps_script_url,
      is_connected: active.connection_status === 'CONNECTED' || active.status === 'ACTIVE',
      connection_mode: active.apps_script_url ? 'APPS_SCRIPT_GATEWAY' : 'LOCAL_HYBRID',
      drive_root_name: active.drive_root_name || 'BANK SOAL DIGITAL',
      spreadsheet_name: active.spreadsheet_name || 'BANK SOAL DIGITAL',
      last_synced_at: active.last_sync || active.last_sync_at,
      active_profile_id: active.id,
    };
  }

  public updateConfig(updates: Partial<GoogleIntegrationConfig>): GoogleIntegrationConfig {
    const active = this.getActiveProfile();
    this.updateProfile(active.id, {
      spreadsheet_id: updates.spreadsheet_id !== undefined ? updates.spreadsheet_id : active.spreadsheet_id,
      drive_root_folder_id: updates.drive_root_folder_id !== undefined ? updates.drive_root_folder_id : active.drive_root_folder_id,
      apps_script_url: updates.apps_script_url !== undefined ? updates.apps_script_url : active.apps_script_url,
      drive_root_name: updates.drive_root_name || active.drive_root_name,
      spreadsheet_name: updates.spreadsheet_name || active.spreadsheet_name,
      last_sync: updates.last_synced_at || active.last_sync,
      last_sync_at: updates.last_synced_at || active.last_sync,
    });

    return this.getConfig();
  }
}

// Export class and compatibility alias
export class GoogleConfigService extends GoogleStorageManagerService {}
