export type UserRole = "ADMIN" | "GURU";

export interface UserProfile {
  id: string;
  name: string;
  username?: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  avatar_url?: string;
  nip?: string;
  phone?: string;
  school?: string;
  subject_specialty?: string;
  status: "ACTIVE" | "INACTIVE" | "active" | "inactive";
  last_login: string;
  created_at: string;
}

export type SyncStatus = "SYNCED" | "PENDING" | "NEEDS_SYNC" | "FAILED" | "PARTIAL";
export type RecordStatus = "active" | "trash";
export type ExamType =
  | "Pilihan Ganda"
  | "Uraian / Essay"
  | "Campuran (PG & Essay)"
  | "AKM (Asesmen Kompetensi)"
  | "HOTS (Higher Order Thinking)";
export type DifficultyLevel = "Mudah" | "Sedang" | "Sulit";
export type JenjangType = "SD" | "SMP" | "SMA" | "SMK";

export interface BankSoal {
  id: string;
  business_id: string; // e.g. "BS-000001"
  title: string;
  file_name: string;
  file_hash: string; // SHA-256 hash
  file_size: number; // in bytes
  file_size_formatted: string;
  page_count: number;
  file_url?: string;
  pdf_data_url?: string;
  drive_file_id?: string;
  drive_folder_id?: string;
  web_view_url?: string;
  download_url?: string;
  storage_profile_id: string;
  storage_profile_name: string;

  // Educational Metadata
  mata_pelajaran: string;
  jenjang: JenjangType;
  kelas: string;
  kurikulum: string;
  bab: string;
  topik: string;
  subtopik?: string;
  jenis_soal: ExamType;
  tingkat_kesulitan: DifficultyLevel;
  tahun_ajaran: string;
  semester: "Ganjil" | "Genap";
  sumber?: string;
  deskripsi: string;
  tags: string[];

  // Metrics & State
  sync_status: SyncStatus;
  sync_attempts?: number;
  last_sync_error?: string;
  download_count: number;
  view_count: number;
  status: RecordStatus;

  // Versions
  version_count: number;
  current_version_number: number;

  // Ownership
  created_by_id: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface BankSoalVersion {
  id: string;
  bank_soal_id: string;
  version_number: number;
  file_name: string;
  file_hash: string;
  file_size: number;
  file_size_formatted: string;
  file_url?: string;
  pdf_data_url?: string;
  drive_file_id?: string;
  change_note: string;
  created_by_id: string;
  created_by_name: string;
  created_at: string;
}

export type StorageHealthStatus =
  | "HEALTHY"
  | "DEGRADED"
  | "ERROR"
  | "NOT_CONFIGURED"
  | "QUOTA_WARNING"
  | "QUOTA_FULL";

export interface StorageProfile {
  id: string;
  name: string;
  description: string;
  apps_script_url: string;
  drive_folder_id: string;
  spreadsheet_id: string;
  priority: number; // 1 = highest / primary, 2 = backup, 3 = archive
  is_active: boolean;
  status: "ACTIVE" | "INACTIVE";
  health_status: StorageHealthStatus;
  connection_status: "CONNECTED" | "DISCONNECTED" | "UNTESTED";
  connection_mode?: "AUTO" | "PROXY" | "DIRECT_GAS";
  quota_status: "NORMAL" | "WARNING" | "FULL";
  latency_ms?: number;
  last_connection_check?: string;
  last_sync?: string;
  last_error?: string;
  drive_connected?: boolean;
  spreadsheet_connected?: boolean;
  apps_script_connected?: boolean;
  file_count?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type MasterCategoryType =
  | "MATA_PELAJARAN"
  | "JENJANG"
  | "TINGKAT_KELAS"
  | "JENIS_UJIAN"
  | "TAHUN_AJARAN"
  | "KURIKULUM";

export interface CategoryMaster {
  id: string;
  type: MasterCategoryType;
  code: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  order: number;
  item_count?: number;
  created_at: string;
}

export interface TagItem {
  id: string;
  name: string;
  category?: string;
  color: string;
  usage_count: number;
  created_at: string;
}

export interface FavoriteRecord {
  id: string;
  user_id: string;
  bank_soal_id: string;
  created_at: string;
}

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "UPLOAD"
  | "VIEW"
  | "DOWNLOAD"
  | "EDIT"
  | "DELETE"
  | "RESTORE"
  | "PERMANENT_DELETE"
  | "FAVORITE"
  | "UNFAVORITE"
  | "SYNC"
  | "STORAGE_CREATE"
  | "STORAGE_UPDATE"
  | "STORAGE_DELETE"
  | "STORAGE_ACTIVATE"
  | "STORAGE_TEST"
  | "USER_CREATE"
  | "USER_UPDATE"
  | "USER_DELETE"
  | "SYSTEM_ALERT"
  | "SETTINGS_UPDATE";

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  role: UserRole;
  action: AuditAction;
  target_type: "BankSoal" | "StorageProfile" | "User" | "Category" | "System" | "Auth";
  target_id?: string;
  target_title?: string;
  details: string;
  timestamp: string;
  ip_address?: string;
}

export interface ActivityHistory {
  id: string;
  user_id: string;
  user_name: string;
  action_type: "UPLOAD" | "VIEW" | "DOWNLOAD" | "FAVORITE" | "SEARCH" | "EDIT" | "RESTORE" | "LOGIN" | "LOGOUT";
  item_id: string;
  item_title: string;
  details: string;
  timestamp: string;
}

export interface SyncLog {
  id: string;
  storage_profile_id: string;
  storage_profile_name: string;
  bank_soal_id: string;
  bank_soal_title: string;
  action: "UPLOAD_DRIVE" | "UPDATE_SHEET" | "BULK_SYNC" | "RETRY_SYNC";
  status: "SUCCESS" | "FAILED" | "PARTIAL";
  retry_count: number;
  error_message?: string;
  timestamp: string;
}

export interface SystemSettings {
  site_title: string;
  school_name: string;
  current_academic_year: string;
  current_semester: "Ganjil" | "Genap";
  allow_teacher_upload: boolean;
  auto_sync_sheets: boolean;
  auto_failover: boolean;
  enable_ai_suggest: boolean;
  connection_mode?: "AUTO" | "PROXY" | "DIRECT_GAS";
  max_upload_size_mb: number;
  organization_name?: string;
  app_subtitle?: string;
  default_curriculum?: string;
  active_academic_year?: string;
  maintenance_mode?: boolean;
  maintenance_message?: string;
  duplicate_check_strict?: boolean;
  setup_completed?: boolean;
  logo_url?: string;
  institution_logo_url?: string;
  institution_tagline?: string;
}

export interface AiMetadataSuggestion {
  mataPelajaran: string;
  jenjang: JenjangType;
  kelas: string;
  kurikulum: string;
  bab: string;
  topik: string;
  subtopik?: string;
  jenisSoal: ExamType;
  tingkatKesulitan: DifficultyLevel;
  tahun: string;
  semester: "Ganjil" | "Genap";
  tags: string[];
  deskripsi: string;
  confidence: number;
}
