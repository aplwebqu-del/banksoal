export type UserRole = 'ADMIN' | 'EDITOR' | 'VIEWER' | 'GURU';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  password_hash?: string;
  status?: UserStatus;
  avatar?: string;
  institution?: string;
  school_institution?: string;
  subject?: string;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
}

export type TingkatKesulitan = 'Mudah' | 'Sedang' | 'Sulit';
export type Jenjang = 'SD' | 'SMP' | 'SMA' | 'SMK';
export type Semester = 'Ganjil' | 'Genap' | 'Semua';
export type JenisSoal = 
  | 'Pilihan Ganda'
  | 'Essay'
  | 'Campuran'
  | 'HOTS'
  | 'AKM'
  | 'SNBT'
  | 'Ujian Sekolah'
  | 'Tryout'
  | 'PAS'
  | 'PAT'
  | 'PTS';

export type SyncStatus = 'SYNCED' | 'NEEDS_SYNC' | 'MISSING' | 'UNINDEXED';

export interface BankSoalVersion {
  version_number: number;
  file_id?: string;
  folder_id?: string;
  file_url: string;
  web_view_url?: string;
  download_url?: string;
  storage_path: string;
  nama_file: string;
  ukuran_file: number;
  jumlah_halaman: number;
  file_hash?: string;
  uploaded_at: string;
  uploaded_by_name: string;
  uploaded_by_email?: string;
  catatan?: string;
}

export interface BankSoal {
  id: string; // Format: BS-000001
  judul: string;
  nama_file: string;
  file_id: string; // Primary Google Drive File ID
  folder_id: string; // Google Drive Folder ID
  drive_file_id?: string; // Alias for file_id
  drive_folder_id?: string; // Alias for folder_id
  storage_profile_id?: string; // Google Storage Profile ID (e.g. storage-001)
  spreadsheet_id?: string; // Target Google Spreadsheet ID
  file_url: string;
  web_view_url: string; // Google Drive Web Preview URL
  download_url: string; // Google Drive Direct Download URL
  mime_type?: string;
  storage_path: string;
  file_hash?: string;
  mata_pelajaran: string;
  jenjang: Jenjang;
  kelas: string;
  kurikulum: string;
  bab: string;
  topik: string;
  subtopik?: string;
  jenis_soal: JenisSoal;
  tingkat_kesulitan: TingkatKesulitan;
  tahun: number;
  semester: Semester;
  sumber?: string;
  pembuat_pengajar?: string;
  deskripsi?: string;
  tags: string[];
  jumlah_halaman: number;
  ukuran_file: number;
  uploaded_by: string;
  uploaded_by_name: string;
  uploaded_by_email?: string;
  created_at: string;
  updated_at: string;
  status: 'aktif' | 'arsip' | 'draft';
  sync_status: SyncStatus;
  is_favorite?: boolean;
  download_count: number;
  view_count: number;
  version: number;
  versions?: BankSoalVersion[];
  extracted_text?: string;
  search_keywords?: string[];
}

export interface FilterParams {
  search?: string;
  mata_pelajaran?: string;
  jenjang?: string;
  kelas?: string;
  bab?: string;
  topik?: string;
  tahun?: string;
  semester?: string;
  tingkat_kesulitan?: string;
  jenis_soal?: string;
  kurikulum?: string;
  uploaded_by?: string;
  status?: 'aktif' | 'arsip' | 'draft' | 'trash' | 'all' | string;
  tag?: string;
  sync_status?: string;
  is_favorite?: boolean;
  sortBy?: 'terbaru' | 'terlama' | 'a-z' | 'z-a' | 'view_count' | 'download_count';
  page?: number;
  limit?: number;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  user_email?: string;
  action: 'UPLOAD' | 'VIEW' | 'DOWNLOAD' | 'EDIT' | 'DELETE' | 'FAVORITE' | 'UNFAVORITE' | 'VERSION_UPDATE' | 'SYNC' | 'MIGRATION' | string;
  bank_soal_id?: string;
  soal_judul?: string;
  file_id?: string;
  target_type?: string;
  details?: any;
  ip_address?: string;
}

export type AuditLog = AuditLogItem;

export interface UserHistoryItem {
  id: string;
  user_id: string;
  user_name: string;
  bank_soal_id: string;
  bank_soal_judul: string;
  file_id?: string;
  action: 'PREVIEW' | 'DOWNLOAD' | 'UPLOAD' | 'EDIT' | 'FAVORITE' | string;
  timestamp: string;
}

export type ActivityHistoryItem = UserHistoryItem;

export interface StatsOverview {
  total_soal: number;
  total_pdf: number;
  total_storage_bytes: number;
  soal_bulan_ini: number;
  soal_favorit: number;
  total_mata_pelajaran: number;
  total_kelas: number;
  total_download: number;
  total_views: number;
  total_pengajar: number;
  synced_count?: number;
  needs_sync_count?: number;
  missing_count?: number;
  by_mapel: { name: string; count: number }[];
  by_tahun: { year: string; count: number }[];
  by_kesulitan: { level: string; count: number }[];
  by_jenjang: { name: string; count: number }[];
  top_downloaded: BankSoal[];
  recent_uploads: BankSoal[];
  storage_growth: { month: string; bytes: number; count: number }[];
}

export interface CategoryItem {
  id: string;
  type: 'mata_pelajaran' | 'jenjang' | 'kelas' | 'jenis_soal' | 'kurikulum' | string;
  name: string;
  code?: string;
  title?: string;
  description?: string;
  icon?: string;
  color?: string;
  count?: number;
}

export type StorageProfileHealthStatus = 
  | 'HEALTHY' 
  | 'DEGRADED' 
  | 'QUOTA_WARNING' 
  | 'QUOTA_FULL' 
  | 'ERROR' 
  | 'NOT_CONFIGURED' 
  | 'CHECKING' 
  | 'DISABLED';

export type QuotaStatus = 'NORMAL' | 'WARNING' | 'FULL';

export type ConnectionStatusType = 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'PENDING';

export interface GoogleStorageProfile {
  id: string;
  name: string;
  description?: string;
  google_drive_folder_id?: string;
  drive_root_folder_id?: string;
  drive_folder_id?: string; // alias
  google_spreadsheet_id?: string;
  spreadsheet_id?: string;
  apps_script_url: string;
  status: 'ACTIVE' | 'INACTIVE' | StorageProfileHealthStatus | string;
  health_status?: StorageProfileHealthStatus;
  connection_status?: ConnectionStatusType | string;
  quota_status?: QuotaStatus;
  quota_bytes_used?: number;
  quota_bytes_total?: number;
  priority: number; // 1, 2, 3...
  is_active: boolean;
  provider?: 'google' | string;
  drive_root_name?: string;
  spreadsheet_name?: string;
  latency_ms?: number;
  last_latency_ms?: number; // alias
  last_error?: string;
  last_health_check?: string;
  last_connection_check?: string;
  last_connection_test?: string; // alias
  last_check?: string; // alias
  last_write_test?: string;
  last_sync?: string;
  last_sync_at?: string; // alias
  created_at: string;
  updated_at: string;
  created_by?: string;
  drive_details?: {
    connected: boolean;
    folder_id: string;
    folder_name: string;
    accessible: boolean;
    write_test?: 'PASS' | 'FAIL' | 'UNTESTED';
    read_test?: 'PASS' | 'FAIL' | 'UNTESTED';
    error?: string;
  };
  sheets_details?: {
    connected: boolean;
    spreadsheet_id: string;
    spreadsheet_name: string;
    accessible: boolean;
    sheet_count?: number;
    write_test?: 'PASS' | 'FAIL' | 'UNTESTED';
    read_test?: 'PASS' | 'FAIL' | 'UNTESTED';
    error?: string;
  };
  apps_script_details?: {
    reachable: boolean;
    status: string;
    latency_ms: number;
    last_checked: string;
    version?: string;
    error?: string;
  };
}

export interface GoogleIntegrationConfig {
  spreadsheet_id: string;
  drive_root_folder_id: string;
  apps_script_url: string;
  is_connected: boolean;
  connection_mode: 'APPS_SCRIPT_GATEWAY' | 'DIRECT_API' | 'LOCAL_HYBRID';
  last_synced_at?: string;
  drive_root_name?: string;
  spreadsheet_name?: string;
  active_profile_id?: string;
}

export interface DriveSyncResult {
  sync_id: string;
  timestamp: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  total_scanned: number;
  synced_count: number;
  missing_count: number;
  unindexed_count: number;
  details: string;
  missing_items?: { id: string; judul: string; file_id: string; reason: string }[];
  unindexed_items?: { name: string; file_id: string; size: number }[];
}

export interface MigrationReport {
  timestamp: string;
  total_records_processed: number;
  success_count: number;
  failed_count: number;
  drive_files_migrated: number;
  sheets_rows_inserted: number;
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED';
  errors?: { id: string; error: string }[];
}

export interface ConnectionTestResult {
  success: boolean;
  connected?: boolean;
  message?: string;
  details?: {
    folder_name?: string;
    spreadsheet_title?: string;
    apps_script_url?: string;
    [key: string]: any;
  };
  latency_ms: number;
  apps_script?: {
    reachable: boolean;
    url: string;
    message?: string;
  };
  google_drive?: {
    connected: boolean;
    folder_id: string;
    folder_name?: string;
  };
  google_sheets?: {
    connected: boolean;
    spreadsheet_id: string;
    spreadsheet_name?: string;
    sheet_count?: number;
  };
  timestamp: string;
}

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
