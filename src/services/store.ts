import {
  UserProfile,
  BankSoal,
  BankSoalVersion,
  StorageProfile,
  CategoryMaster,
  TagItem,
  FavoriteRecord,
  AuditLog,
  ActivityHistory,
  SyncLog,
  SystemSettings,
  UserRole,
  AuditAction,
} from "../types";

const STORAGE_KEYS = {
  CURRENT_USER: "banksoal_current_user_v2",
  IS_LOGGED_IN: "banksoal_is_logged_in_v2",
  USERS: "banksoal_users_v2",
  BANK_SOAL: "banksoal_records_v2",
  VERSIONS: "banksoal_versions_v2",
  STORAGE_PROFILES: "banksoal_storage_profiles_v2",
  CATEGORIES: "banksoal_categories_v2",
  TAGS: "banksoal_tags_v2",
  FAVORITES: "banksoal_favorites_v2",
  AUDIT_LOGS: "banksoal_audit_logs_v2",
  ACTIVITY_HISTORY: "banksoal_activity_history_v2",
  SYNC_LOGS: "banksoal_sync_logs_v2",
  SETTINGS: "banksoal_settings_v2",
};

// Initial Seed Users
const INITIAL_USERS: UserProfile[] = [
  {
    id: "usr-admin-01",
    name: "Ahmad Fauzi, M.Kom (Administrator)",
    username: "admin",
    email: "admin@banksoal.sch.id",
    password: "admin",
    role: "ADMIN",
    nip: "19850312 201001 1 008",
    phone: "081234567890",
    school: "SMA Negeri Unggulan 1",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    status: "active",
    last_login: new Date().toISOString(),
    created_at: "2024-01-10T08:00:00.000Z",
  },
  {
    id: "usr-guru-01",
    name: "Dra. Siti Rahmawati, M.Pd",
    username: "siti.rahmawati",
    email: "siti.rahmawati@guru.sch.id",
    password: "guru",
    role: "GURU",
    nip: "19890415 201402 2 003",
    phone: "081398765432",
    school: "SMA Negeri Unggulan 1",
    subject_specialty: "Matematika",
    avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    status: "active",
    last_login: new Date().toISOString(),
    created_at: "2024-01-15T09:30:00.000Z",
  },
  {
    id: "usr-guru-02",
    name: "Budi Santoso, S.Pd, M.Si",
    username: "budi.santoso",
    email: "budi.santoso@guru.sch.id",
    password: "guru",
    role: "GURU",
    nip: "19920820 201903 1 005",
    phone: "081287654321",
    school: "SMA Negeri Unggulan 1",
    subject_specialty: "Fisika & IPA",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    status: "active",
    last_login: new Date(Date.now() - 86400000).toISOString(),
    created_at: "2024-02-01T10:00:00.000Z",
  },
  {
    id: "usr-guru-03",
    name: "Nurul Hidayah, S.Pd",
    username: "nurul.hidayah",
    email: "nurul.hidayah@guru.sch.id",
    password: "guru",
    role: "GURU",
    nip: "19941105 202012 2 011",
    phone: "081312345678",
    school: "SMA Negeri Unggulan 1",
    subject_specialty: "Bahasa Indonesia",
    avatar_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    status: "active",
    last_login: new Date(Date.now() - 172800000).toISOString(),
    created_at: "2024-02-10T11:00:00.000Z",
  },
];

// Initial Storage Profiles (Unconfigured state waiting for real Google credentials)
const INITIAL_STORAGE_PROFILES: StorageProfile[] = [
  {
    id: "strg-primary-01",
    name: "Google Storage Utama (Produksi)",
    description: "Penyimpanan Google Drive & sinkronisasi Google Spreadsheet untuk Bank Soal Resmi Sekolah",
    apps_script_url: "",
    drive_folder_id: "",
    spreadsheet_id: "",
    priority: 1,
    is_active: true,
    status: "ACTIVE",
    health_status: "NOT_CONFIGURED",
    connection_status: "DISCONNECTED",
    quota_status: "NORMAL",
    latency_ms: 0,
    last_connection_check: undefined,
    last_sync: undefined,
    drive_connected: false,
    spreadsheet_connected: false,
    apps_script_connected: false,
    file_count: 0,
    created_by: "Administrator",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Initial Categories
const INITIAL_CATEGORIES: CategoryMaster[] = [
  // Mata Pelajaran
  { id: "cat-mp-01", type: "MATA_PELAJARAN", code: "MAT", name: "Matematika", color: "#3B82F6", order: 1, created_at: new Date().toISOString() },
  { id: "cat-mp-02", type: "MATA_PELAJARAN", code: "BIND", name: "Bahasa Indonesia", color: "#10B981", order: 2, created_at: new Date().toISOString() },
  { id: "cat-mp-03", type: "MATA_PELAJARAN", code: "BING", name: "Bahasa Inggris", color: "#8B5CF6", order: 3, created_at: new Date().toISOString() },
  { id: "cat-mp-04", type: "MATA_PELAJARAN", code: "FIS", name: "Fisika", color: "#F59E0B", order: 4, created_at: new Date().toISOString() },
  { id: "cat-mp-05", type: "MATA_PELAJARAN", code: "KIM", name: "Kimia", color: "#EC4899", order: 5, created_at: new Date().toISOString() },
  { id: "cat-mp-06", type: "MATA_PELAJARAN", code: "BIO", name: "Biologi", color: "#14B8A6", order: 6, created_at: new Date().toISOString() },
  { id: "cat-mp-07", type: "MATA_PELAJARAN", code: "EKO", name: "Ekonomi", color: "#6366F1", order: 7, created_at: new Date().toISOString() },
  { id: "cat-mp-08", type: "MATA_PELAJARAN", code: "SOS", name: "Sosiologi", color: "#F97316", order: 8, created_at: new Date().toISOString() },
  { id: "cat-mp-09", type: "MATA_PELAJARAN", code: "GEO", name: "Geografi", color: "#84CC16", order: 9, created_at: new Date().toISOString() },
  { id: "cat-mp-10", type: "MATA_PELAJARAN", code: "SEJ", name: "Sejarah", color: "#A855F7", order: 10, created_at: new Date().toISOString() },
  { id: "cat-mp-11", type: "MATA_PELAJARAN", code: "INF", name: "Informatika", color: "#06B6D4", order: 11, created_at: new Date().toISOString() },
  { id: "cat-mp-12", type: "MATA_PELAJARAN", code: "PPKN", name: "Pendidikan Pancasila (PPKn)", color: "#EF4444", order: 12, created_at: new Date().toISOString() },
  { id: "cat-mp-13", type: "MATA_PELAJARAN", code: "PAI", name: "Pendidikan Agama Islam", color: "#059669", order: 13, created_at: new Date().toISOString() },
  
  // Jenjang
  { id: "cat-jj-01", type: "JENJANG", code: "SD", name: "SD / MI", color: "#EF4444", order: 1, created_at: new Date().toISOString() },
  { id: "cat-jj-02", type: "JENJANG", code: "SMP", name: "SMP / MTs", color: "#3B82F6", order: 2, created_at: new Date().toISOString() },
  { id: "cat-jj-03", type: "JENJANG", code: "SMA", name: "SMA / MA", color: "#64748B", order: 3, created_at: new Date().toISOString() },
  { id: "cat-jj-04", type: "JENJANG", code: "SMK", name: "SMK", color: "#F59E0B", order: 4, created_at: new Date().toISOString() },

  // Tingkat Kelas
  { id: "cat-kls-01", type: "TINGKAT_KELAS", code: "K10", name: "Kelas 10 (Fase E)", order: 1, created_at: new Date().toISOString() },
  { id: "cat-kls-02", type: "TINGKAT_KELAS", code: "K11", name: "Kelas 11 (Fase F)", order: 2, created_at: new Date().toISOString() },
  { id: "cat-kls-03", type: "TINGKAT_KELAS", code: "K12", name: "Kelas 12 (Fase F)", order: 3, created_at: new Date().toISOString() },
  { id: "cat-kls-04", type: "TINGKAT_KELAS", code: "K7", name: "Kelas 7 (Fase D)", order: 4, created_at: new Date().toISOString() },
  { id: "cat-kls-05", type: "TINGKAT_KELAS", code: "K8", name: "Kelas 8 (Fase D)", order: 5, created_at: new Date().toISOString() },
  { id: "cat-kls-06", type: "TINGKAT_KELAS", code: "K9", name: "Kelas 9 (Fase D)", order: 6, created_at: new Date().toISOString() },

  // Jenis Ujian
  { id: "cat-ju-01", type: "JENIS_UJIAN", code: "PTS", name: "Penilaian Tengah Semester (PTS / STS)", order: 1, created_at: new Date().toISOString() },
  { id: "cat-ju-02", type: "JENIS_UJIAN", code: "PAS", name: "Penilaian Akhir Semester (PAS / SAS)", order: 2, created_at: new Date().toISOString() },
  { id: "cat-ju-03", type: "JENIS_UJIAN", code: "PAT", name: "Penilaian Akhir Tahun (PAT / SAT)", order: 3, created_at: new Date().toISOString() },
  { id: "cat-ju-04", type: "JENIS_UJIAN", code: "SNBT", name: "Simulasi SNBT / UTBK", order: 4, created_at: new Date().toISOString() },
  { id: "cat-ju-05", type: "JENIS_UJIAN", code: "AKM", name: "Asesmen Nasional / AKM", order: 5, created_at: new Date().toISOString() },
  { id: "cat-ju-06", type: "JENIS_UJIAN", code: "UH", name: "Ulangan Harian / Formatif", order: 6, created_at: new Date().toISOString() },

  // Kurikulum
  { id: "cat-kur-01", type: "KURIKULUM", code: "MERDEKA", name: "Kurikulum Merdeka", order: 1, created_at: new Date().toISOString() },
  { id: "cat-kur-02", type: "KURIKULUM", code: "K13", name: "Kurikulum 2013 (K13 Revisi)", order: 2, created_at: new Date().toISOString() },
  { id: "cat-kur-03", type: "KURIKULUM", code: "CAMBRIDGE", name: "Cambridge International", order: 3, created_at: new Date().toISOString() },

  // Tahun Ajaran
  { id: "cat-ta-01", type: "TAHUN_AJARAN", code: "2024_2025", name: "2024/2025", order: 1, created_at: new Date().toISOString() },
  { id: "cat-ta-02", type: "TAHUN_AJARAN", code: "2023_2024", name: "2023/2024", order: 2, created_at: new Date().toISOString() },
  { id: "cat-ta-03", type: "TAHUN_AJARAN", code: "2025_2026", name: "2025/2026", order: 3, created_at: new Date().toISOString() },
];

// Initial Tags
const INITIAL_TAGS: TagItem[] = [
  { id: "tag-01", name: "SNBT", color: "#3B82F6", usage_count: 14, created_at: new Date().toISOString() },
  { id: "tag-02", name: "UTBK", color: "#8B5CF6", usage_count: 12, created_at: new Date().toISOString() },
  { id: "tag-03", name: "HOTS", color: "#EF4444", usage_count: 28, created_at: new Date().toISOString() },
  { id: "tag-04", name: "PTS", color: "#10B981", usage_count: 22, created_at: new Date().toISOString() },
  { id: "tag-05", name: "PAS", color: "#F59E0B", usage_count: 19, created_at: new Date().toISOString() },
  { id: "tag-06", name: "Literasi", color: "#06B6D4", usage_count: 15, created_at: new Date().toISOString() },
  { id: "tag-07", name: "Numerasi", color: "#EC4899", usage_count: 18, created_at: new Date().toISOString() },
  { id: "tag-08", name: "Fase E", color: "#64748B", usage_count: 10, created_at: new Date().toISOString() },
  { id: "tag-09", name: "Fase F", color: "#6366F1", usage_count: 11, created_at: new Date().toISOString() },
  { id: "tag-10", name: "Tryout", color: "#F97316", usage_count: 16, created_at: new Date().toISOString() },
  { id: "tag-11", name: "Aljabar", color: "#14B8A6", usage_count: 8, created_at: new Date().toISOString() },
  { id: "tag-12", name: "Trigonometri", color: "#A855F7", usage_count: 7, created_at: new Date().toISOString() },
];

// Initial Bank Soal Items
const INITIAL_BANK_SOAL: BankSoal[] = [
  {
    id: "bs-rec-001",
    business_id: "BS-000001",
    title: "Naskah Soal PTS Matematika Tingkat Lanjut Kelas 11 SMA Semester Ganjil",
    file_name: "PTS_Matematika_Tingkat_Lanjut_Kls11_Ganjil_2024.pdf",
    file_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    file_size: 2457600,
    file_size_formatted: "2.4 MB",
    page_count: 8,
    storage_profile_id: "strg-primary-01",
    storage_profile_name: "Google Storage Utama (Produksi)",
    drive_file_id: "1DrvFileMatematikaKls11PTS2024",
    drive_folder_id: "1A2B3C4D5E6F7G8H9I0J-BankSoalMainFolder",
    web_view_url: "https://drive.google.com/file/d/1DrvFileMatematikaKls11PTS2024/view",
    download_url: "https://drive.google.com/uc?export=download&id=1DrvFileMatematikaKls11PTS2024",
    mata_pelajaran: "Matematika",
    jenjang: "SMA",
    kelas: "11",
    kurikulum: "Kurikulum Merdeka",
    bab: "Bab 2: Polinomial dan Fungsi Rasional",
    topik: "Teorema Sisa dan Pembagian Polinomial",
    subtopik: "Akar-akar Persamaan Suku Banyak",
    jenis_soal: "Campuran (PG & Essay)",
    tingkat_kesulitan: "Sulit",
    tahun_ajaran: "2024/2025",
    semester: "Ganjil",
    sumber: "MGMP Matematika Provinsi",
    deskripsi: "Naskah soal standar asesmen sumatif tengah semester matematika tingkat lanjut kurikulum merdeka dengan komposisi 25 PG + 5 Uraian HOTS terstruktur.",
    tags: ["PTS", "Matematika", "Kelas 11", "HOTS", "Fase F", "Kurikulum Merdeka"],
    sync_status: "SYNCED",
    sync_attempts: 1,
    download_count: 48,
    view_count: 142,
    status: "active",
    version_count: 2,
    current_version_number: 2,
    created_by_id: "usr-guru-01",
    created_by_name: "Dra. Siti Rahmawati, M.Pd",
    created_at: "2024-09-12T10:15:00.000Z",
    updated_at: "2024-09-15T14:30:00.000Z",
  },
  {
    id: "bs-rec-002",
    business_id: "BS-000002",
    title: "Bank Soal Fisika HOTS: Dinamika Gerak & Hukum Newton Kelas 10",
    file_name: "Soal_Fisika_HOTS_Dinamika_Gerak_Kelas10.pdf",
    file_hash: "a4587c698fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852c9911",
    file_size: 1887436,
    file_size_formatted: "1.8 MB",
    page_count: 6,
    storage_profile_id: "strg-primary-01",
    storage_profile_name: "Google Storage Utama (Produksi)",
    drive_file_id: "1DrvFileFisikaKls10HOTS2024",
    drive_folder_id: "1A2B3C4D5E6F7G8H9I0J-BankSoalMainFolder",
    web_view_url: "https://drive.google.com/file/d/1DrvFileFisikaKls10HOTS2024/view",
    mata_pelajaran: "Fisika",
    jenjang: "SMA",
    kelas: "10",
    kurikulum: "Kurikulum Merdeka",
    bab: "Bab 3: Vektor dan Hukum Gerak Newton",
    topik: "Gaya Gesek dan Gerak Melingkar Beraturan",
    subtopik: "Analisis Diagram Benda Bebas",
    jenis_soal: "HOTS (Higher Order Thinking)",
    tingkat_kesulitan: "Sulit",
    tahun_ajaran: "2024/2025",
    semester: "Ganjil",
    sumber: "Penyusunan Mandiri Laboratorium Fisika",
    deskripsi: "Paket latihan soal penalaran tinggi (C4-C6) dilengkapi dengan diagram gaya dan pemecahan masalah realistik fisika dasar.",
    tags: ["Fisika", "HOTS", "Kelas 10", "Fase E", "Kurikulum Merdeka"],
    sync_status: "SYNCED",
    sync_attempts: 1,
    download_count: 62,
    view_count: 189,
    status: "active",
    version_count: 1,
    current_version_number: 1,
    created_by_id: "usr-guru-02",
    created_by_name: "Budi Santoso, S.Pd, M.Si",
    created_at: "2024-09-18T08:45:00.000Z",
    updated_at: "2024-09-18T08:45:00.000Z",
  },
  {
    id: "bs-rec-003",
    business_id: "BS-000003",
    title: "Modul Asesmen Literasi Bahasa Indonesia: Teks Argumentasi & Editorial Kelas 12",
    file_name: "AKM_Literasi_B_Indonesia_Teks_Editorial_Kls12.pdf",
    file_hash: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    file_size: 3145728,
    file_size_formatted: "3.1 MB",
    page_count: 12,
    storage_profile_id: "strg-primary-01",
    storage_profile_name: "Google Storage Utama (Produksi)",
    drive_file_id: "1DrvFileBIndoKls12AKM2024",
    drive_folder_id: "1A2B3C4D5E6F7G8H9I0J-BankSoalMainFolder",
    web_view_url: "https://drive.google.com/file/d/1DrvFileBIndoKls12AKM2024/view",
    mata_pelajaran: "Bahasa Indonesia",
    jenjang: "SMA",
    kelas: "12",
    kurikulum: "Kurikulum 2013 (K13 Revisi)",
    bab: "Bab 4: Membedah Opini dalam Tajuk Rencana & Editorial",
    topik: "Struktur dan Kaidah Kebahasaan Teks Editorial",
    subtopik: "Penalaran Fakta vs Opini",
    jenis_soal: "AKM (Asesmen Kompetensi)",
    tingkat_kesulitan: "Sedang",
    tahun_ajaran: "2024/2025",
    semester: "Ganjil",
    sumber: "Tim Pengembang Soal Sekolah",
    deskripsi: "Soal stimulasi literasi membaca dengan infografis aktual dan wacana kritis sesuai format Asesmen Nasional.",
    tags: ["AKM", "Literasi", "Bahasa Indonesia", "Kelas 12", "PAS"],
    sync_status: "SYNCED",
    sync_attempts: 1,
    download_count: 35,
    view_count: 98,
    status: "active",
    version_count: 1,
    current_version_number: 1,
    created_by_id: "usr-guru-03",
    created_by_name: "Nurul Hidayah, S.Pd",
    created_at: "2024-09-25T11:20:00.000Z",
    updated_at: "2024-09-25T11:20:00.000Z",
  },
  {
    id: "bs-rec-004",
    business_id: "BS-000004",
    title: "Simulasi Ujian SNBT / UTBK 2025: Tes Potensi Skolastik (TPS) & Literasi",
    file_name: "Simulasi_SNBT_UTBK_TPS_Penalaran_Umum_2025.pdf",
    file_hash: "2c624232cdd221771294dfbb310aca000a0df6ec9b5feb9bbd011cf2b4b1727b",
    file_size: 4718592,
    file_size_formatted: "4.5 MB",
    page_count: 20,
    storage_profile_id: "strg-primary-01",
    storage_profile_name: "Google Storage Utama (Produksi)",
    drive_file_id: "1DrvFileSNBTTPS2025",
    drive_folder_id: "1A2B3C4D5E6F7G8H9I0J-BankSoalMainFolder",
    web_view_url: "https://drive.google.com/file/d/1DrvFileSNBTTPS2025/view",
    mata_pelajaran: "Matematika",
    jenjang: "SMA",
    kelas: "12",
    kurikulum: "Kurikulum Merdeka",
    bab: "Penalaran Matematika & Kuantitatif",
    topik: "Penalaran Induktif & Deduktif Kuantitatif",
    subtopik: "Analisis Data dan Pola Bilangan",
    jenis_soal: "Pilihan Ganda",
    tingkat_kesulitan: "Sulit",
    tahun_ajaran: "2024/2025",
    semester: "Genap",
    sumber: "Kerja Sama Bimbingan Belajar & MGMP",
    deskripsi: "Paket komprehensif simulasi SNBT 2025 mencakup Penalaran Umum, Pengetahuan Kuantitatif, dan Pemahaman Bacaan.",
    tags: ["SNBT", "UTBK", "Tryout", "HOTS", "Kelas 12", "Numerasi"],
    sync_status: "SYNCED",
    sync_attempts: 1,
    download_count: 112,
    view_count: 310,
    status: "active",
    version_count: 1,
    current_version_number: 1,
    created_by_id: "usr-admin-01",
    created_by_name: "Ahmad Fauzi, M.Kom (Administrator)",
    created_at: "2024-10-02T13:00:00.000Z",
    updated_at: "2024-10-02T13:00:00.000Z",
  },
  {
    id: "bs-rec-005",
    business_id: "BS-000005",
    title: "Naskah Soal Kimia: Stoikiometri dan Larutan Asam Basa Kelas 11",
    file_name: "PAS_Kimia_Stoikiometri_Larutan_Kls11.pdf",
    file_hash: "19581e27de7ced00ff1ce50b2047e7a567c76b1cbaebabe5ef03f7c3017bb5b7",
    file_size: 1572864,
    file_size_formatted: "1.5 MB",
    page_count: 5,
    storage_profile_id: "strg-primary-01",
    storage_profile_name: "Google Storage Utama (Produksi)",
    drive_file_id: "1DrvFileKimiaKls11PAS2024",
    drive_folder_id: "1A2B3C4D5E6F7G8H9I0J-BankSoalMainFolder",
    web_view_url: "https://drive.google.com/file/d/1DrvFileKimiaKls11PAS2024/view",
    mata_pelajaran: "Kimia",
    jenjang: "SMA",
    kelas: "11",
    kurikulum: "Kurikulum Merdeka",
    bab: "Bab 4: Kesetimbangan Kimia dan pH Larutan",
    topik: "Titrasi Asam Basa dan Larutan Penyangga",
    subtopik: "Perhitungan Kurva Titrasi",
    jenis_soal: "Campuran (PG & Essay)",
    tingkat_kesulitan: "Sedang",
    tahun_ajaran: "2024/2025",
    semester: "Ganjil",
    sumber: "Arsip Guru Kimia",
    deskripsi: "Paket penilaian akhir semester gasal dilengkapi kunci jawaban terpisah dan rubrik penilaian uraian.",
    tags: ["PAS", "Kimia", "Kelas 11", "Fase F"],
    sync_status: "SYNCED",
    sync_attempts: 1,
    download_count: 29,
    view_count: 87,
    status: "active",
    version_count: 1,
    current_version_number: 1,
    created_by_id: "usr-guru-02",
    created_by_name: "Budi Santoso, S.Pd, M.Si",
    created_at: "2024-10-15T09:10:00.000Z",
    updated_at: "2024-10-15T09:10:00.000Z",
  },
  {
    id: "bs-rec-006",
    business_id: "BS-000006",
    title: "Bank Soal Biologi: Genetika & Pola-Pola Hereditas Kelas 12",
    file_name: "Arsip_Soal_Biologi_Genetika_Kls12_2024.pdf",
    file_hash: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
    file_size: 2097152,
    file_size_formatted: "2.0 MB",
    page_count: 7,
    storage_profile_id: "strg-primary-01",
    storage_profile_name: "Google Storage Utama (Produksi)",
    drive_file_id: "1DrvFileBioKls12Hereditas",
    drive_folder_id: "1A2B3C4D5E6F7G8H9I0J-BankSoalMainFolder",
    web_view_url: "https://drive.google.com/file/d/1DrvFileBioKls12Hereditas/view",
    mata_pelajaran: "Biologi",
    jenjang: "SMA",
    kelas: "12",
    kurikulum: "Kurikulum Merdeka",
    bab: "Bab 2: Pola Pewarisan Sifat pada Makhluk Hidup",
    topik: "Hukum Mendel I & II dan Tautan Kelamin",
    subtopik: "Pedigree Chart / Peta Silsilah",
    jenis_soal: "Pilihan Ganda",
    tingkat_kesulitan: "Sedang",
    tahun_ajaran: "2024/2025",
    semester: "Ganjil",
    sumber: "Arsip Soal MGMP Biologi",
    deskripsi: "Kumpulan soal teruji hereditas manusia, uji silang genetik, dan penyakit menurun terpaut kromosom.",
    tags: ["Biologi", "Kelas 12", "HOTS", "PAS"],
    sync_status: "SYNCED",
    sync_attempts: 1,
    download_count: 41,
    view_count: 119,
    status: "active",
    version_count: 1,
    current_version_number: 1,
    created_by_id: "usr-guru-01",
    created_by_name: "Dra. Siti Rahmawati, M.Pd",
    created_at: "2024-10-20T14:40:00.000Z",
    updated_at: "2024-10-20T14:40:00.000Z",
  },
];

// Initial Versions
const INITIAL_VERSIONS: BankSoalVersion[] = [
  {
    id: "ver-001-v1",
    bank_soal_id: "bs-rec-001",
    version_number: 1,
    file_name: "PTS_Matematika_Tingkat_Lanjut_Kls11_Draft_v1.pdf",
    file_hash: "1110c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b111",
    file_size: 2200000,
    file_size_formatted: "2.1 MB",
    drive_file_id: "1DrvFileMatematikaKls11PTS2024_v1",
    change_note: "Versi draf awal 20 butir pilihan ganda diserahkan ke kurikulum",
    created_by_id: "usr-guru-01",
    created_by_name: "Dra. Siti Rahmawati, M.Pd",
    created_at: "2024-09-12T10:15:00.000Z",
  },
  {
    id: "ver-001-v2",
    bank_soal_id: "bs-rec-001",
    version_number: 2,
    file_name: "PTS_Matematika_Tingkat_Lanjut_Kls11_Ganjil_2024.pdf",
    file_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    file_size: 2457600,
    file_size_formatted: "2.4 MB",
    drive_file_id: "1DrvFileMatematikaKls11PTS2024",
    change_note: "Revisi penambahan 5 butir soal uraian HOTS dan perbaikan stimulus nomor 14",
    created_by_id: "usr-guru-01",
    created_by_name: "Dra. Siti Rahmawati, M.Pd",
    created_at: "2024-09-15T14:30:00.000Z",
  },
];

// Initial Settings
const INITIAL_SETTINGS: SystemSettings = {
  site_title: "Bank Soal PDF",
  school_name: "SMA Negeri Unggulan 1",
  current_academic_year: "2024/2025",
  current_semester: "Ganjil",
  allow_teacher_upload: true,
  auto_sync_sheets: true,
  auto_failover: true,
  enable_ai_suggest: true,
  max_upload_size_mb: 50,
  organization_name: "SMA Negeri Unggulan 1",
  app_subtitle: "Repositori & Arsip Soal Pengajar Terpadu",
  default_curriculum: "Kurikulum Merdeka",
  active_academic_year: "2024/2025",
  maintenance_mode: false,
  maintenance_message: "Sistem Bank Soal sedang dalam proses sinkronisasi dan pemeliharaan server berkala.",
  duplicate_check_strict: true,
  setup_completed: true,
  logo_url: "",
  institution_logo_url: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=120&auto=format&fit=crop&q=80",
  institution_tagline: "Unggul, Berkarakter & Berprestasi",
};

// Initial Audit Logs
const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: "aud-001",
    user_id: "usr-admin-01",
    user_name: "Ahmad Fauzi, M.Kom (Administrator)",
    role: "ADMIN",
    action: "STORAGE_ACTIVATE",
    target_type: "StorageProfile",
    target_id: "strg-primary-01",
    target_title: "Google Storage Utama (Produksi)",
    details: "Mengaktifkan profil storage utama untuk sinkronisasi Google Drive & Spreadsheet",
    timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "aud-002",
    user_id: "usr-guru-01",
    user_name: "Dra. Siti Rahmawati, M.Pd",
    role: "GURU",
    action: "UPLOAD",
    target_type: "BankSoal",
    target_id: "bs-rec-001",
    target_title: "Naskah Soal PTS Matematika Tingkat Lanjut Kelas 11 SMA",
    details: "Upload PDF baru (2.4 MB) dengan SHA-256 terverifikasi dan sinkronisasi ke Google Drive",
    timestamp: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: "aud-003",
    user_id: "usr-guru-02",
    user_name: "Budi Santoso, S.Pd, M.Si",
    role: "GURU",
    action: "UPLOAD",
    target_type: "BankSoal",
    target_id: "bs-rec-002",
    target_title: "Bank Soal Fisika HOTS: Dinamika Gerak & Hukum Newton Kelas 10",
    details: "Upload PDF soal HOTS Fisika dengan AI Metadata suggestion",
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "aud-004",
    user_id: "usr-admin-01",
    user_name: "Ahmad Fauzi, M.Kom (Administrator)",
    role: "ADMIN",
    action: "STORAGE_TEST",
    target_type: "StorageProfile",
    target_id: "strg-primary-01",
    target_title: "Google Storage Utama (Produksi)",
    details: "Uji koneksi Google Apps Script, Google Drive Folder, dan Google Spreadsheet: STATUS HEALTHY (145ms)",
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "aud-005",
    user_id: "usr-guru-03",
    user_name: "Nurul Hidayah, S.Pd",
    role: "GURU",
    action: "DOWNLOAD",
    target_type: "BankSoal",
    target_id: "bs-rec-001",
    target_title: "PTS Matematika Tingkat Lanjut Kls11",
    details: "Mengunduh berkas PDF untuk bahan koordinasi MGMP",
    timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

// Initial Activity History
const INITIAL_ACTIVITIES: ActivityHistory[] = [
  {
    id: "act-001",
    user_id: "usr-guru-01",
    user_name: "Dra. Siti Rahmawati, M.Pd",
    action_type: "UPLOAD",
    item_id: "bs-rec-001",
    item_title: "PTS Matematika Tingkat Lanjut Kelas 11 SMA",
    details: "Mengunggah berkas PDF naskah PTS Matematika Semester Ganjil",
    timestamp: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: "act-002",
    user_id: "usr-admin-01",
    user_name: "Ahmad Fauzi, M.Kom (Administrator)",
    action_type: "UPLOAD",
    item_id: "bs-rec-004",
    item_title: "Simulasi Ujian SNBT / UTBK 2025: TPS",
    details: "Mengunggah modul simulasi SNBT 2025",
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "act-003",
    user_id: "usr-guru-01",
    user_name: "Dra. Siti Rahmawati, M.Pd",
    action_type: "FAVORITE",
    item_id: "bs-rec-004",
    item_title: "Simulasi Ujian SNBT / UTBK 2025: TPS",
    details: "Menambahkan soal ke koleksi favorit",
    timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

// Initial Favorites
const INITIAL_FAVORITES: FavoriteRecord[] = [
  {
    id: "fav-001",
    user_id: "usr-guru-01",
    bank_soal_id: "bs-rec-004",
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "fav-002",
    user_id: "usr-guru-01",
    bank_soal_id: "bs-rec-002",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "fav-003",
    user_id: "usr-admin-01",
    bank_soal_id: "bs-rec-001",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

// Helpers for localStorage state
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item);
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving to storage key ${key}:`, err);
  }
}

// SHA-256 Hashing helper
export async function computeFileHash(file: File | Blob): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

// Format file size
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// Subscribers listener for global store events
type StoreListener = () => void;
const listeners = new Set<StoreListener>();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

export function subscribeStore(listener: StoreListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Store Class Interface
export class AppStore {
  // Authentication & Session
  static isLoggedIn(): boolean {
    const status = loadFromStorage<boolean | null>(STORAGE_KEYS.IS_LOGGED_IN, null);
    if (status === null) {
      // Default to true on initial arrival for smooth preview, user can logout
      return true;
    }
    return Boolean(status);
  }

  static login(user: UserProfile) {
    saveToStorage(STORAGE_KEYS.IS_LOGGED_IN, true);
    saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
    this.recordAuditLog({
      action: "LOGIN",
      target_type: "Auth",
      target_id: user.id,
      target_title: user.name,
      details: `Pengguna berhasil login: ${user.name} (${user.role})`,
    });
    this.recordActivity({
      action_type: "LOGIN",
      item_id: user.id,
      item_title: "Masuk ke Sistem",
      details: `Login sebagai ${user.name}`,
    });
    notifyListeners();
  }

  static logout() {
    saveToStorage(STORAGE_KEYS.IS_LOGGED_IN, false);
    const currentUser = this.getCurrentUser();
    this.recordAuditLog({
      action: "LOGOUT",
      target_type: "Auth",
      target_id: currentUser.id,
      target_title: currentUser.name,
      details: `Pengguna logout: ${currentUser.name}`,
    });
    notifyListeners();
  }

  // Realtime Automatic Cloud Synchronization
  static triggerAutoRealtimeSync() {
    try {
      const active = this.getActiveStorageProfile();
      if (active && active.apps_script_url && active.apps_script_url.trim().startsWith("http")) {
        fetch("/api/storage/push-all", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storageProfile: active,
            allTables: {
              USERS: this.getUsers(),
              BANK_SOAL: this.getBankSoalList(),
              CATEGORIES: this.getCategories(),
              TAGS: this.getTags(),
              ACTIVITY_LOG: this.getActivities(),
              SETTINGS: this.getSettings(),
              SYNC_LOG: this.getSyncLogs(),
            },
          }),
        }).catch(() => {
          // Non-blocking background sync notice
        });
      }
    } catch {
      // Non-blocking
    }
  }

  // Current User
  static getCurrentUser(): UserProfile {
    const users = this.getUsers();
    const saved = loadFromStorage<UserProfile | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (saved && users.some((u) => u.id === saved.id)) {
      const found = users.find((u) => u.id === saved.id)!;
      return found;
    }
    return users[0] || INITIAL_USERS[0];
  }

  static setCurrentUser(user: UserProfile) {
    saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
    this.recordAuditLog({
      action: "LOGIN",
      target_type: "Auth",
      details: `User beralih login ke: ${user.name} (${user.role})`,
    });
    notifyListeners();
  }

  static authenticate(
    identifier: string,
    password?: string
  ): { success: boolean; user?: UserProfile; message?: string } {
    const users = this.getUsers();
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = (password || "").trim();

    const user = users.find((u) => {
      const matchEmail = (u.email || "").toLowerCase() === cleanId;
      const matchUsername = (u.username || "").toLowerCase() === cleanId;
      const matchNip = (u.nip || "").replace(/\s+/g, "") === cleanId.replace(/\s+/g, "");
      return matchEmail || matchUsername || matchNip;
    });

    if (!user) {
      return {
        success: false,
        message: "Username / Email / NIP tidak ditemukan dalam database pengajar.",
      };
    }

    if (user.status === "INACTIVE" || user.status === "inactive") {
      return {
        success: false,
        message: "Akun ini telah dinonaktifkan oleh Administrator. Silakan hubungi admin sekolah.",
      };
    }

    const expectedPassword = user.password || (user.role === "ADMIN" ? "admin" : "guru");
    if (cleanPass !== expectedPassword) {
      return {
        success: false,
        message: `Kata sandi salah untuk akun ${user.username || user.email}. Coba kata sandi default (${expectedPassword}) atau hubungi admin.`,
      };
    }

    this.login(user);
    return { success: true, user };
  }

  // Users
  static getUsers(): UserProfile[] {
    const raw = loadFromStorage<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    // Ensure all users have credentials and avatars populated
    return raw.map((u) => {
      const initMatch = INITIAL_USERS.find((init) => init.id === u.id || init.email === u.email);
      return {
        ...u,
        username: u.username || initMatch?.username || u.email.split("@")[0],
        password: u.password || initMatch?.password || (u.role === "ADMIN" ? "admin" : "guru"),
        avatar_url: u.avatar_url || initMatch?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      };
    });
  }

  static saveUser(user: UserProfile) {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user };
    } else {
      users.push(user);
    }
    saveToStorage(STORAGE_KEYS.USERS, users);
    notifyListeners();
  }

  static toggleUserStatus(userId: string): boolean {
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return false;
    user.status = user.status === "active" ? "inactive" : "active";
    saveToStorage(STORAGE_KEYS.USERS, users);
    this.recordAuditLog({
      action: "USER_UPDATE",
      target_type: "User",
      target_id: user.id,
      target_title: user.name,
      details: `Status akun diubah menjadi: ${user.status}`,
    });
    notifyListeners();
    return true;
  }

  // Bank Soal
  static getBankSoalList(): BankSoal[] {
    return loadFromStorage<BankSoal[]>(STORAGE_KEYS.BANK_SOAL, INITIAL_BANK_SOAL);
  }

  static getActiveBankSoal(): BankSoal[] {
    return this.getBankSoalList().filter((b) => b.status === "active");
  }

  static getTrashBankSoal(): BankSoal[] {
    return this.getBankSoalList().filter((b) => b.status === "trash");
  }

  static getBankSoalById(id: string): BankSoal | undefined {
    return this.getBankSoalList().find((b) => b.id === id);
  }

  static checkDuplicate(hash: string): BankSoal | null {
    if (!hash) return null;
    const list = this.getActiveBankSoal();
    return list.find((b) => b.file_hash === hash) || null;
  }

  static getNextBusinessId(): string {
    const list = this.getBankSoalList();
    const maxNum = list.reduce((acc, curr) => {
      const match = curr.business_id.match(/BS-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > acc ? num : acc;
      }
      return acc;
    }, 0);
    return `BS-${String(maxNum + 1).padStart(6, "0")}`;
  }

  static createBankSoal(data: Omit<BankSoal, "id" | "business_id" | "status" | "version_count" | "current_version_number" | "download_count" | "view_count" | "created_at" | "updated_at" | "created_by_id" | "created_by_name"> & { created_by_id?: string; created_by_name?: string }): BankSoal {
    const list = this.getBankSoalList();
    const currentUser = this.getCurrentUser();
    const activeStorage = this.getActiveStorageProfile();

    const newId = `bs-rec-${Date.now()}`;
    const businessId = this.getNextBusinessId();
    const now = new Date().toISOString();

    const newItem: BankSoal = {
      ...data,
      id: newId,
      business_id: businessId,
      storage_profile_id: data.storage_profile_id || activeStorage?.id || "strg-primary-01",
      storage_profile_name: data.storage_profile_name || activeStorage?.name || "Google Storage Utama",
      status: "active",
      version_count: 1,
      current_version_number: 1,
      download_count: 0,
      view_count: 0,
      sync_status: data.sync_status || "SYNCED",
      sync_attempts: 1,
      created_by_id: data.created_by_id || currentUser.id,
      created_by_name: data.created_by_name || currentUser.name,
      created_at: now,
      updated_at: now,
    };

    list.unshift(newItem);
    saveToStorage(STORAGE_KEYS.BANK_SOAL, list);

    // Create Initial Version
    const initialVersion: BankSoalVersion = {
      id: `ver-${newItem.id}-v1`,
      bank_soal_id: newItem.id,
      version_number: 1,
      file_name: newItem.file_name,
      file_hash: newItem.file_hash,
      file_size: newItem.file_size,
      file_size_formatted: newItem.file_size_formatted,
      file_url: newItem.file_url,
      drive_file_id: newItem.drive_file_id,
      change_note: "Upload versi perdana berkas Bank Soal",
      created_by_id: currentUser.id,
      created_by_name: currentUser.name,
      created_at: now,
    };

    const versions = this.getVersions();
    versions.unshift(initialVersion);
    saveToStorage(STORAGE_KEYS.VERSIONS, versions);

    // Audit and Activity
    this.recordAuditLog({
      action: "UPLOAD",
      target_type: "BankSoal",
      target_id: newItem.id,
      target_title: newItem.title,
      details: `Upload ${newItem.file_name} (${newItem.file_size_formatted}) [${newItem.business_id}] ke ${newItem.storage_profile_name}`,
    });

    this.recordActivity({
      action_type: "UPLOAD",
      item_id: newItem.id,
      item_title: newItem.title,
      details: `Mengunggah berkas ${newItem.file_name}`,
    });

    notifyListeners();
    this.triggerAutoRealtimeSync();
    return newItem;
  }

  static updateBankSoal(id: string, updates: Partial<BankSoal>): BankSoal | null {
    const list = this.getBankSoalList();
    const idx = list.findIndex((b) => b.id === id);
    if (idx === -1) return null;

    const current = list[idx];
    const updated: BankSoal = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    list[idx] = updated;
    saveToStorage(STORAGE_KEYS.BANK_SOAL, list);

    this.recordAuditLog({
      action: "EDIT",
      target_type: "BankSoal",
      target_id: updated.id,
      target_title: updated.title,
      details: `Memperbarui metadata Bank Soal ${updated.business_id}`,
    });

    this.recordActivity({
      action_type: "EDIT",
      item_id: updated.id,
      item_title: updated.title,
      details: `Memperbarui rincian soal ${updated.title}`,
    });

    notifyListeners();
    this.triggerAutoRealtimeSync();
    return updated;
  }

  static createNewVersion(bankSoalId: string, newFileData: { file_name: string; file_hash: string; file_size: number; file_size_formatted: string; file_url?: string; pdf_data_url?: string; change_note: string }): BankSoalVersion | null {
    const list = this.getBankSoalList();
    const idx = list.findIndex((b) => b.id === bankSoalId);
    if (idx === -1) return null;

    const currentUser = this.getCurrentUser();
    const currentItem = list[idx];
    const nextVersionNum = currentItem.version_count + 1;
    const now = new Date().toISOString();

    const versionItem: BankSoalVersion = {
      id: `ver-${bankSoalId}-v${nextVersionNum}`,
      bank_soal_id: bankSoalId,
      version_number: nextVersionNum,
      file_name: newFileData.file_name,
      file_hash: newFileData.file_hash,
      file_size: newFileData.file_size,
      file_size_formatted: newFileData.file_size_formatted,
      file_url: newFileData.file_url,
      pdf_data_url: newFileData.pdf_data_url,
      change_note: newFileData.change_note || `Pembaruan naskah revisi versi ${nextVersionNum}`,
      created_by_id: currentUser.id,
      created_by_name: currentUser.name,
      created_at: now,
    };

    const versions = this.getVersions();
    versions.unshift(versionItem);
    saveToStorage(STORAGE_KEYS.VERSIONS, versions);

    // Update parent Bank Soal with new file hash & version
    list[idx] = {
      ...currentItem,
      file_name: newFileData.file_name,
      file_hash: newFileData.file_hash,
      file_size: newFileData.file_size,
      file_size_formatted: newFileData.file_size_formatted,
      file_url: newFileData.file_url || currentItem.file_url,
      pdf_data_url: newFileData.pdf_data_url || currentItem.pdf_data_url,
      version_count: nextVersionNum,
      current_version_number: nextVersionNum,
      updated_at: now,
    };
    saveToStorage(STORAGE_KEYS.BANK_SOAL, list);

    this.recordAuditLog({
      action: "EDIT",
      target_type: "BankSoal",
      target_id: currentItem.id,
      target_title: currentItem.title,
      details: `Merilis Versi ${nextVersionNum} untuk ${currentItem.business_id}: "${versionItem.change_note}"`,
    });

    notifyListeners();
    return versionItem;
  }

  static getVersions(bankSoalId?: string): BankSoalVersion[] {
    const list = loadFromStorage<BankSoalVersion[]>(STORAGE_KEYS.VERSIONS, INITIAL_VERSIONS);
    if (bankSoalId) {
      return list
        .filter((v) => v.bank_soal_id === bankSoalId)
        .sort((a, b) => b.version_number - a.version_number);
    }
    return list;
  }

  static getVersionsForBankSoal(bankSoalId: string): BankSoalVersion[] {
    return this.getVersions(bankSoalId);
  }

  // Trash & Recovery
  static moveToTrash(id: string): boolean {
    const list = this.getBankSoalList();
    const item = list.find((b) => b.id === id);
    if (!item) return false;

    item.status = "trash";
    item.updated_at = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.BANK_SOAL, list);

    this.recordAuditLog({
      action: "DELETE",
      target_type: "BankSoal",
      target_id: item.id,
      target_title: item.title,
      details: `Memindahkan ${item.business_id} ke Keranjang Sampah`,
    });

    notifyListeners();
    this.triggerAutoRealtimeSync();
    return true;
  }

  static restoreFromTrash(id: string): boolean {
    const list = this.getBankSoalList();
    const item = list.find((b) => b.id === id);
    if (!item) return false;

    item.status = "active";
    item.updated_at = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.BANK_SOAL, list);

    this.recordAuditLog({
      action: "RESTORE",
      target_type: "BankSoal",
      target_id: item.id,
      target_title: item.title,
      details: `Memulihkan ${item.business_id} dari Keranjang Sampah`,
    });

    this.recordActivity({
      action_type: "RESTORE",
      item_id: item.id,
      item_title: item.title,
      details: `Memulihkan berkas soal ${item.title}`,
    });

    notifyListeners();
    this.triggerAutoRealtimeSync();
    return true;
  }

  static permanentDelete(id: string): boolean {
    let list = this.getBankSoalList();
    const item = list.find((b) => b.id === id);
    if (!item) return false;

    list = list.filter((b) => b.id !== id);
    saveToStorage(STORAGE_KEYS.BANK_SOAL, list);

    // Remove favorites & versions associated
    let favorites = this.getFavorites();
    favorites = favorites.filter((f) => f.bank_soal_id !== id);
    saveToStorage(STORAGE_KEYS.FAVORITES, favorites);

    let versions = this.getVersions();
    versions = versions.filter((v) => v.bank_soal_id !== id);
    saveToStorage(STORAGE_KEYS.VERSIONS, versions);

    this.recordAuditLog({
      action: "PERMANENT_DELETE",
      target_type: "BankSoal",
      target_id: id,
      target_title: item.title,
      details: `Hapus permanen Bank Soal ${item.business_id} beserta riwayat versinya`,
    });

    notifyListeners();
    this.triggerAutoRealtimeSync();
    return true;
  }

  static emptyTrash(): number {
    const trashItems = this.getTrashBankSoal();
    const count = trashItems.length;
    if (count === 0) return 0;

    let list = this.getBankSoalList();
    const trashIds = new Set(trashItems.map((t) => t.id));
    list = list.filter((b) => !trashIds.has(b.id));
    saveToStorage(STORAGE_KEYS.BANK_SOAL, list);

    this.recordAuditLog({
      action: "PERMANENT_DELETE",
      target_type: "BankSoal",
      details: `Mengosongkan keranjang sampah (${count} dokumen dihapus permanen)`,
    });

    notifyListeners();
    this.triggerAutoRealtimeSync();
    return count;
  }

  // Favorites (Per-User)
  static getFavorites(): FavoriteRecord[] {
    return loadFromStorage<FavoriteRecord[]>(STORAGE_KEYS.FAVORITES, INITIAL_FAVORITES);
  }

  static isFavorite(bankSoalId: string, userId?: string): boolean {
    const uId = userId || this.getCurrentUser().id;
    const favorites = this.getFavorites();
    return favorites.some((f) => f.user_id === uId && f.bank_soal_id === bankSoalId);
  }

  static toggleFavorite(bankSoalId: string): boolean {
    const currentUser = this.getCurrentUser();
    let favorites = this.getFavorites();
    const existingIdx = favorites.findIndex(
      (f) => f.user_id === currentUser.id && f.bank_soal_id === bankSoalId
    );

    const bankSoal = this.getBankSoalById(bankSoalId);
    let isNowFav = false;

    if (existingIdx >= 0) {
      favorites.splice(existingIdx, 1);
      isNowFav = false;
      this.recordAuditLog({
        action: "UNFAVORITE",
        target_type: "BankSoal",
        target_id: bankSoalId,
        target_title: bankSoal?.title,
        details: `Menghapus dari daftar favorit pribadi`,
      });
    } else {
      favorites.push({
        id: `fav-${Date.now()}`,
        user_id: currentUser.id,
        bank_soal_id: bankSoalId,
        created_at: new Date().toISOString(),
      });
      isNowFav = true;
      this.recordAuditLog({
        action: "FAVORITE",
        target_type: "BankSoal",
        target_id: bankSoalId,
        target_title: bankSoal?.title,
        details: `Menandai sebagai favorit pribadi`,
      });
      if (bankSoal) {
        this.recordActivity({
          action_type: "FAVORITE",
          item_id: bankSoal.id,
          item_title: bankSoal.title,
          details: `Menambahkan ke favorit`,
        });
      }
    }

    saveToStorage(STORAGE_KEYS.FAVORITES, favorites);
    notifyListeners();
    return isNowFav;
  }

  static getUserFavoriteBankSoal(userId?: string): BankSoal[] {
    const uId = userId || this.getCurrentUser().id;
    const favorites = this.getFavorites().filter((f) => f.user_id === uId);
    const activeBankSoal = this.getActiveBankSoal();
    const favSet = new Set(favorites.map((f) => f.bank_soal_id));
    return activeBankSoal.filter((b) => favSet.has(b.id));
  }

  // Views & Downloads counters
  static recordView(bankSoalId: string) {
    const list = this.getBankSoalList();
    const item = list.find((b) => b.id === bankSoalId);
    if (!item) return;

    item.view_count = (item.view_count || 0) + 1;
    saveToStorage(STORAGE_KEYS.BANK_SOAL, list);

    this.recordActivity({
      action_type: "VIEW",
      item_id: item.id,
      item_title: item.title,
      details: `Membuka pratinjau dokumen soal`,
    });

    notifyListeners();
  }

  static recordDownload(bankSoalId: string) {
    const list = this.getBankSoalList();
    const item = list.find((b) => b.id === bankSoalId);
    if (!item) return;

    item.download_count = (item.download_count || 0) + 1;
    saveToStorage(STORAGE_KEYS.BANK_SOAL, list);

    this.recordAuditLog({
      action: "DOWNLOAD",
      target_type: "BankSoal",
      target_id: item.id,
      target_title: item.title,
      details: `Mengunduh berkas PDF ${item.file_name} (${item.business_id})`,
    });

    this.recordActivity({
      action_type: "DOWNLOAD",
      item_id: item.id,
      item_title: item.title,
      details: `Mengunduh berkas ${item.file_name}`,
    });

    notifyListeners();
  }

  // Storage Profiles
  static getStorageProfiles(): StorageProfile[] {
    const raw = loadFromStorage<StorageProfile[]>(STORAGE_KEYS.STORAGE_PROFILES, INITIAL_STORAGE_PROFILES);
    // Sanitize any stale fake placeholder URLs from earlier sessions
    const sanitized = raw.map((p) => {
      if (p.apps_script_url && p.apps_script_url.includes("AKfycbzExampleMasterAppScript")) {
        return {
          ...p,
          apps_script_url: "",
          drive_folder_id: "",
          spreadsheet_id: "",
          health_status: "NOT_CONFIGURED" as const,
          connection_status: "DISCONNECTED" as const,
          drive_connected: false,
          spreadsheet_connected: false,
          apps_script_connected: false,
        };
      }
      return p;
    });
    return sanitized;
  }

  static getActiveStorageProfile(): StorageProfile | undefined {
    const profiles = this.getStorageProfiles();
    return profiles.find((p) => p.is_active) || profiles[0];
  }

  static saveStorageProfile(profile: StorageProfile) {
    const profiles = this.getStorageProfiles();
    const idx = profiles.findIndex((p) => p.id === profile.id);

    if (profile.is_active) {
      profiles.forEach((p) => {
        p.is_active = false;
        p.status = "INACTIVE";
      });
    }

    if (idx >= 0) {
      profiles[idx] = { ...profiles[idx], ...profile, updated_at: new Date().toISOString() };
      this.recordAuditLog({
        action: "STORAGE_UPDATE",
        target_type: "StorageProfile",
        target_id: profile.id,
        target_title: profile.name,
        details: `Memperbarui konfigurasi Storage Profile: ${profile.name}`,
      });
    } else {
      profiles.push({
        ...profile,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      this.recordAuditLog({
        action: "STORAGE_CREATE",
        target_type: "StorageProfile",
        target_id: profile.id,
        target_title: profile.name,
        details: `Menambahkan Google Storage Profile baru: ${profile.name}`,
      });
    }

    saveToStorage(STORAGE_KEYS.STORAGE_PROFILES, profiles);
    notifyListeners();
  }

  static setActiveStorage(id: string) {
    const profiles = this.getStorageProfiles();
    let activatedName = "";

    profiles.forEach((p) => {
      if (p.id === id) {
        p.is_active = true;
        p.status = "ACTIVE";
        activatedName = p.name;
      } else {
        p.is_active = false;
        p.status = "INACTIVE";
      }
    });

    saveToStorage(STORAGE_KEYS.STORAGE_PROFILES, profiles);

    this.recordAuditLog({
      action: "STORAGE_ACTIVATE",
      target_type: "StorageProfile",
      target_id: id,
      target_title: activatedName,
      details: `Menetapkan "${activatedName}" sebagai Active Storage`,
    });

    notifyListeners();
  }

  static deleteStorageProfile(id: string): boolean {
    let profiles = this.getStorageProfiles();
    const target = profiles.find((p) => p.id === id);
    if (!target) return false;

    if (target.is_active && profiles.length > 1) {
      const nextActive = profiles.find((p) => p.id !== id);
      if (nextActive) {
        nextActive.is_active = true;
        nextActive.status = "ACTIVE";
      }
    }

    profiles = profiles.filter((p) => p.id !== id);
    saveToStorage(STORAGE_KEYS.STORAGE_PROFILES, profiles);

    this.recordAuditLog({
      action: "STORAGE_DELETE",
      target_type: "StorageProfile",
      target_id: id,
      target_title: target.name,
      details: `Menghapus profil Google Storage: ${target.name}`,
    });

    notifyListeners();
    return true;
  }

  static updateStorageHealth(
    id: string,
    health: {
      health_status: StorageProfile["health_status"];
      connection_status: StorageProfile["connection_status"];
      latency_ms: number;
      drive_connected: boolean;
      spreadsheet_connected: boolean;
      apps_script_connected: boolean;
      last_error?: string;
    }
  ) {
    const profiles = this.getStorageProfiles();
    const p = profiles.find((item) => item.id === id);
    if (!p) return;

    p.health_status = health.health_status;
    p.connection_status = health.connection_status;
    p.latency_ms = health.latency_ms;
    p.drive_connected = health.drive_connected;
    p.spreadsheet_connected = health.spreadsheet_connected;
    p.apps_script_connected = health.apps_script_connected;
    p.last_connection_check = new Date().toISOString();
    if (health.last_error) p.last_error = health.last_error;

    saveToStorage(STORAGE_KEYS.STORAGE_PROFILES, profiles);

    this.recordAuditLog({
      action: "STORAGE_TEST",
      target_type: "StorageProfile",
      target_id: id,
      target_title: p.name,
      details: `Uji koneksi: Apps Script (${health.apps_script_connected ? "OK" : "FAIL"}), Drive (${health.drive_connected ? "OK" : "FAIL"}), Sheets (${health.spreadsheet_connected ? "OK" : "FAIL"}) - Latency: ${health.latency_ms}ms`,
    });

    notifyListeners();
  }

  // Categories & Master Organisasi
  static getCategories(): CategoryMaster[] {
    return loadFromStorage<CategoryMaster[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  }

  static getCategoriesByType(type: CategoryMaster["type"]): CategoryMaster[] {
    return this.getCategories()
      .filter((c) => c.type === type)
      .sort((a, b) => a.order - b.order);
  }

  static saveCategory(category: CategoryMaster) {
    const list = this.getCategories();
    const idx = list.findIndex((c) => c.id === category.id);
    if (idx >= 0) {
      list[idx] = category;
    } else {
      list.push(category);
    }
    saveToStorage(STORAGE_KEYS.CATEGORIES, list);
    notifyListeners();
  }

  static deleteCategory(id: string): boolean {
    let list = this.getCategories();
    list = list.filter((c) => c.id !== id);
    saveToStorage(STORAGE_KEYS.CATEGORIES, list);
    notifyListeners();
    return true;
  }

  // Tags
  static getTags(): TagItem[] {
    return loadFromStorage<TagItem[]>(STORAGE_KEYS.TAGS, INITIAL_TAGS);
  }

  static saveTag(tag: TagItem) {
    const list = this.getTags();
    const idx = list.findIndex((t) => t.id === tag.id);
    if (idx >= 0) {
      list[idx] = tag;
    } else {
      list.push(tag);
    }
    saveToStorage(STORAGE_KEYS.TAGS, list);
    notifyListeners();
  }

  static deleteTag(id: string): boolean {
    let list = this.getTags();
    list = list.filter((t) => t.id !== id);
    saveToStorage(STORAGE_KEYS.TAGS, list);
    notifyListeners();
    return true;
  }

  // Audit Logs
  static getAuditLogs(): AuditLog[] {
    return loadFromStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }

  static recordAuditLog(log: {
    action: AuditAction;
    target_type: AuditLog["target_type"];
    target_id?: string;
    target_title?: string;
    details: string;
  }) {
    const currentUser = this.getCurrentUser();
    const list = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: currentUser.id,
      user_name: currentUser.name,
      role: currentUser.role,
      action: log.action,
      target_type: log.target_type,
      target_id: log.target_id,
      target_title: log.target_title,
      details: log.details,
      timestamp: new Date().toISOString(),
    };
    list.unshift(newLog);
    // Keep max 500 logs
    if (list.length > 500) list.pop();
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, list);
  }

  // Activity History (Per User)
  static getActivityHistory(userId?: string): ActivityHistory[] {
    const uId = userId || this.getCurrentUser().id;
    const all = loadFromStorage<ActivityHistory[]>(STORAGE_KEYS.ACTIVITY_HISTORY, INITIAL_ACTIVITIES);
    return all.filter((a) => a.user_id === uId);
  }

  static recordActivity(act: {
    action_type: ActivityHistory["action_type"];
    item_id: string;
    item_title: string;
    details: string;
  }) {
    const currentUser = this.getCurrentUser();
    const list = loadFromStorage<ActivityHistory[]>(STORAGE_KEYS.ACTIVITY_HISTORY, INITIAL_ACTIVITIES);
    const newAct: ActivityHistory = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: currentUser.id,
      user_name: currentUser.name,
      action_type: act.action_type,
      item_id: act.item_id,
      item_title: act.item_title,
      details: act.details,
      timestamp: new Date().toISOString(),
    };
    list.unshift(newAct);
    if (list.length > 300) list.pop();
    saveToStorage(STORAGE_KEYS.ACTIVITY_HISTORY, list);
  }

  // Sync Logs
  static getSyncLogs(): SyncLog[] {
    return loadFromStorage<SyncLog[]>(STORAGE_KEYS.SYNC_LOGS, []);
  }

  static recordSyncLog(log: Omit<SyncLog, "id" | "timestamp">) {
    const list = this.getSyncLogs();
    const newLog: SyncLog = {
      ...log,
      id: `sync-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    list.unshift(newLog);
    if (list.length > 200) list.pop();
    saveToStorage(STORAGE_KEYS.SYNC_LOGS, list);
  }

  // System Settings
  static getSettings(): SystemSettings {
    return loadFromStorage<SystemSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }

  static saveSettings(settings: Partial<SystemSettings>) {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    saveToStorage(STORAGE_KEYS.SETTINGS, updated);

    this.recordAuditLog({
      action: "SETTINGS_UPDATE",
      target_type: "System",
      details: `Memperbarui konfigurasi sistem Bank Soal`,
    });

    notifyListeners();
  }

  static updateSettings(settings: Partial<SystemSettings>) {
    this.saveSettings(settings);
  }

  static subscribe(listener: StoreListener) {
    return subscribeStore(listener);
  }

  static getActivities(): ActivityHistory[] {
    return loadFromStorage<ActivityHistory[]>(STORAGE_KEYS.ACTIVITY_HISTORY, INITIAL_ACTIVITIES);
  }

  static addUser(data: Partial<UserProfile>): UserProfile {
    const users = this.getUsers();
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name: data.name || "Guru Pengajar",
      username: data.username || (data.email ? data.email.split("@")[0] : `user${Date.now().toString().slice(-4)}`),
      email: data.email || "",
      password: data.password || "guru",
      role: data.role || "GURU",
      nip: data.nip || "",
      phone: data.phone || "",
      school: data.school || "SMA Negeri Unggulan 1",
      subject_specialty: data.subject_specialty || "",
      avatar_url: data.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      status: data.status || "ACTIVE",
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    users.push(newUser);
    saveToStorage(STORAGE_KEYS.USERS, users);
    this.recordAuditLog({
      action: "USER_CREATE",
      target_type: "User",
      target_id: newUser.id,
      target_title: newUser.name,
      details: `Menambahkan akun pengajar baru: ${newUser.name} (${newUser.role})`,
    });
    notifyListeners();
    return newUser;
  }

  static updateUser(id: string, updates: Partial<UserProfile>): UserProfile | null {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...updates };
    saveToStorage(STORAGE_KEYS.USERS, users);
    this.recordAuditLog({
      action: "USER_UPDATE",
      target_type: "User",
      target_id: id,
      target_title: users[idx].name,
      details: `Memperbarui profil pengguna: ${users[idx].name}`,
    });
    notifyListeners();
    return users[idx];
  }

  static deleteUser(id: string): boolean {
    const users = this.getUsers();
    const target = users.find((u) => u.id === id);
    if (!target) return false;
    const filtered = users.filter((u) => u.id !== id);
    saveToStorage(STORAGE_KEYS.USERS, filtered);
    this.recordAuditLog({
      action: "USER_DELETE",
      target_type: "User",
      target_id: id,
      target_title: target.name,
      details: `Menghapus akun pengguna: ${target.name} (${target.email})`,
    });
    notifyListeners();
    return true;
  }

  static getBankSoal(): BankSoal[] {
    return this.getActiveBankSoal();
  }

  /**
   * Purges all initial mock/sample data so only real Google Drive & Sheets records exist
   */
  static purgeSampleData() {
    saveToStorage(STORAGE_KEYS.BANK_SOAL, []);
    saveToStorage(STORAGE_KEYS.FAVORITES, []);
    this.recordAuditLog({
      action: "SETTINGS_UPDATE",
      target_type: "System",
      details: "Mengosongkan data contoh dummy. Mengaktifkan repositori bersih untuk Google Drive & Sheets database.",
    });
    notifyListeners();
  }

  /**
   * Returns true if active Google Storage is properly configured and connected
   */
  static isCloudDatabaseActive(): boolean {
    const active = this.getActiveStorageProfile();
    return Boolean(
      active &&
      active.apps_script_url &&
      active.drive_folder_id &&
      active.spreadsheet_id &&
      (active.connection_status === "CONNECTED" || active.health_status === "HEALTHY")
    );
  }

  /**
   * Syncs and updates the store with live rows from Google Spreadsheet
   */
  static async syncWithGoogleSpreadsheet(): Promise<{ success: boolean; count: number; message: string }> {
    const active = this.getActiveStorageProfile();
    if (!active || !active.apps_script_url || !active.apps_script_url.trim().startsWith("http")) {
      return { success: false, count: 0, message: "Storage Google Drive/Spreadsheet belum dikonfigurasi. Masukkan URL Apps Script dan ID Spreadsheet." };
    }

    try {
      const response = await fetch("/api/storage/fetch-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storageProfile: active }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) {
        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          saveToStorage(STORAGE_KEYS.BANK_SOAL, data.items);
          notifyListeners();
          return {
            success: true,
            count: data.items.length,
            message: `Berhasil memuat ${data.items.length} berkas soal langsung dari Google Spreadsheet!`,
          };
        } else {
          return {
            success: true,
            count: 0,
            message: "Google Spreadsheet terhubung dan siap menerima berkas baru (sheet masih kosong).",
          };
        }
      } else {
        return {
          success: false,
          count: 0,
          message: data.message || "Gagal memuat data dari Google Spreadsheet.",
        };
      }
    } catch (err: any) {
      return { success: false, count: 0, message: `Gagal membaca Spreadsheet: ${err.message}` };
    }
  }

  static addStorageProfile(data: Partial<StorageProfile>): StorageProfile {
    const newProfile: StorageProfile = {
      id: `strg-${Date.now()}`,
      name: data.name || "Google Storage Baru",
      description: data.description || "",
      apps_script_url: data.apps_script_url || "",
      drive_folder_id: data.drive_folder_id || "",
      spreadsheet_id: data.spreadsheet_id || "",
      priority: data.priority || 2,
      is_active: Boolean(data.is_active),
      status: data.is_active ? "ACTIVE" : "INACTIVE",
      health_status: "NOT_CONFIGURED",
      connection_status: "UNTESTED",
      quota_status: "NORMAL",
      created_by: this.getCurrentUser().name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.saveStorageProfile(newProfile);
    return newProfile;
  }

  static updateStorageProfile(id: string, updates: Partial<StorageProfile>): StorageProfile | null {
    const profiles = this.getStorageProfiles();
    const idx = profiles.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const updated = { ...profiles[idx], ...updates, id };
    this.saveStorageProfile(updated);
    return updated;
  }

  static setActiveStorageProfile(id: string) {
    this.setActiveStorage(id);
  }

  static addCategory(data: Partial<CategoryMaster>): CategoryMaster {
    const newCat: CategoryMaster = {
      id: `cat-${Date.now()}`,
      type: data.type || "MATA_PELAJARAN",
      code: data.code || "",
      name: data.name || "",
      description: data.description || "",
      color: data.color || "#3B82F6",
      order: data.order || 99,
      created_at: new Date().toISOString(),
    };
    this.saveCategory(newCat);
    return newCat;
  }

  static updateCategory(id: string, updates: Partial<CategoryMaster>): CategoryMaster | null {
    const list = this.getCategories();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const updated = { ...list[idx], ...updates, id };
    this.saveCategory(updated);
    return updated;
  }

  static addTag(data: Partial<TagItem>): TagItem {
    const newTag: TagItem = {
      id: `tag-${Date.now()}`,
      name: data.name || "",
      color: data.color || "#3B82F6",
      usage_count: 0,
      created_at: new Date().toISOString(),
    };
    this.saveTag(newTag);
    return newTag;
  }

  static updateTag(id: string, updates: Partial<TagItem>): TagItem | null {
    const list = this.getTags();
    const idx = list.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    const updated = { ...list[idx], ...updates, id };
    this.saveTag(updated);
    return updated;
  }

  // Hydration helpers for syncing from Google Spreadsheet
  static hydrateUsers(users: UserProfile[]) {
    if (Array.isArray(users) && users.length > 0) {
      saveToStorage(STORAGE_KEYS.USERS, users);
      notifyListeners();
    }
  }

  static hydrateBankSoal(bankSoalList: BankSoal[]) {
    if (Array.isArray(bankSoalList) && bankSoalList.length > 0) {
      saveToStorage(STORAGE_KEYS.BANK_SOAL, bankSoalList);
      notifyListeners();
    }
  }

  static hydrateCategories(categories: CategoryMaster[]) {
    if (Array.isArray(categories) && categories.length > 0) {
      saveToStorage(STORAGE_KEYS.CATEGORIES, categories);
      notifyListeners();
    }
  }

  static hydrateTags(tags: TagItem[]) {
    if (Array.isArray(tags) && tags.length > 0) {
      saveToStorage(STORAGE_KEYS.TAGS, tags);
      notifyListeners();
    }
  }
}
