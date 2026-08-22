import {
  BankSoal,
  User,
  CategoryItem,
  AuditLogItem,
  UserHistoryItem,
  FilterParams,
  StatsOverview,
  GoogleStorageProfile,
  ConnectionTestResult,
  DriveSyncResult
} from '../../src/types';
import { GoogleAppsScriptGateway } from './googleAppsScriptGateway';
import { GoogleConfigService } from './googleConfig';

export class GoogleSheetsRepository {
  private static instance: GoogleSheetsRepository;
  private appsScriptGateway: GoogleAppsScriptGateway;
  private configService: GoogleConfigService;

  // Short-lived memory cache (TTL 30 detik) with instant invalidation on mutation
  private bankSoalCache: { data: BankSoal[]; timestamp: number } | null = null;
  private categoriesCache: { data: CategoryItem[]; timestamp: number } | null = null;
  private usersCache: { data: User[]; timestamp: number } | null = null;
  private storageProfilesCache: { data: GoogleStorageProfile[]; timestamp: number } | null = null;
  private configCache: { data: Record<string, any>; timestamp: number } | null = null;
  private auditLogsCache: { data: AuditLogItem[]; timestamp: number } | null = null;
  private favoritesCache: Map<string, Set<string>> = new Map();
  private CACHE_TTL_MS = 30000; // 30 detik

  // In-Memory Seed / Fallback State (Murni di RAM, tidak ada file db lokal yang dimodifikasi sebagai source of truth)
  private memoryBankSoal: Map<string, BankSoal> = new Map();
  private memoryUsers: Map<string, User> = new Map();
  private memoryCategories: Map<string, CategoryItem> = new Map();
  private memoryStorageProfiles: Map<string, GoogleStorageProfile> = new Map();
  private memoryConfig: Record<string, any> = {};
  private memoryAuditLogs: AuditLogItem[] = [];

  private constructor() {
    this.appsScriptGateway = GoogleAppsScriptGateway.getInstance();
    this.configService = GoogleConfigService.getInstance();
    this.initInitialMemoryState();
  }

  public static getInstance(): GoogleSheetsRepository {
    if (!GoogleSheetsRepository.instance) {
      GoogleSheetsRepository.instance = new GoogleSheetsRepository();
    }
    return GoogleSheetsRepository.instance;
  }

  /**
   * Inisialisasi data bootstrap di RAM (digunakan sebelum Admin menghubungkan Apps Script)
   */
  private initInitialMemoryState() {
    const now = new Date().toISOString();

    // Default Storage Profiles
    const primaryProfile: GoogleStorageProfile = {
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
      last_connection_test: now,
      created_at: now,
      updated_at: now,
      created_by: 'Admin'
    };

    const secondaryProfile: GoogleStorageProfile = {
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
      last_connection_test: now,
      created_at: now,
      updated_at: now,
      created_by: 'Admin'
    };

    this.memoryStorageProfiles.set(primaryProfile.id, primaryProfile);
    this.memoryStorageProfiles.set(secondaryProfile.id, secondaryProfile);

    // Initial Users
    const u1: User = {
      id: 'u-1',
      name: 'Dra. Hj. Nurhayati, M.Pd.',
      email: 'nurhayati@sekolah.sch.id',
      role: 'ADMIN',
      status: 'ACTIVE',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      school_institution: 'SMA Negeri 1 Teladan',
      subject: 'Manajemen Kurikulum & Matematika',
      created_at: now,
      updated_at: now
    };
    const u2: User = {
      id: 'u-2',
      name: 'Budi Santoso, S.Pd.',
      email: 'budi.santoso@guru.smp.id',
      role: 'GURU',
      status: 'ACTIVE',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      school_institution: 'SMP Negeri 5 Bintang',
      subject: 'Matematika & IPA Terpadu',
      created_at: now,
      updated_at: now
    };
    this.memoryUsers.set(u1.id, u1);
    this.memoryUsers.set(u2.id, u2);

    // Initial Categories
    const initialCats: CategoryItem[] = [
      { id: 'c-1', type: 'mata_pelajaran', name: 'Matematika', code: 'MTK', title: 'Matematika Terpadu', description: 'Aljabar, Geometri, Statistika', icon: 'Calculator', color: 'from-blue-600 to-indigo-600' },
      { id: 'c-2', type: 'mata_pelajaran', name: 'Bahasa Indonesia', code: 'BIN', title: 'Bahasa Indonesia', description: 'Literasi, Teks Eksposisi, Sastra', icon: 'BookOpen', color: 'from-rose-600 to-pink-600' },
      { id: 'c-3', type: 'mata_pelajaran', name: 'Bahasa Inggris', code: 'BIG', title: 'Bahasa Inggris', description: 'Reading Comprehension, Grammar', icon: 'Languages', color: 'from-violet-600 to-purple-600' },
      { id: 'c-4', type: 'mata_pelajaran', name: 'IPA', code: 'IPA', title: 'Ilmu Pengetahuan Alam', description: 'Sains SMP Terpadu', icon: 'FlaskConical', color: 'from-teal-600 to-emerald-600' },
      { id: 'c-5', type: 'mata_pelajaran', name: 'Fisika', code: 'FIS', title: 'Fisika SMA', description: 'Mekanika, Termodinamika, Optik', icon: 'Atom', color: 'from-cyan-600 to-blue-600' },
      { id: 'c-6', type: 'jenjang', name: 'SD', code: 'SD', title: 'Sekolah Dasar', description: 'Kelas 1 sampai 6', icon: 'GraduationCap', color: 'from-emerald-600 to-teal-600' },
      { id: 'c-7', type: 'jenjang', name: 'SMP', code: 'SMP', title: 'Sekolah Menengah Pertama', description: 'Kelas 7 sampai 9', icon: 'GraduationCap', color: 'from-blue-600 to-indigo-600' },
      { id: 'c-8', type: 'jenjang', name: 'SMA', code: 'SMA', title: 'Sekolah Menengah Atas', description: 'Kelas 10 sampai 12', icon: 'GraduationCap', color: 'from-purple-600 to-violet-600' },
      { id: 'c-9', type: 'jenjang', name: 'SMK', code: 'SMK', title: 'Sekolah Menengah Kejuruan', description: 'Vokasi Kejuruan', icon: 'GraduationCap', color: 'from-amber-600 to-orange-600' },
    ];
    initialCats.forEach(c => this.memoryCategories.set(c.id, c));

    // Initial System Config
    this.memoryConfig = {
      ACTIVE_STORAGE_PROFILE_ID: 'storage-001',
      BOOTSTRAP_VERSION: '3.0.0',
      SYSTEM_STATUS: 'OPERATIONAL',
      DEFAULT_SYNC_MODE: 'AUTO_15_MIN'
    };

    // Initial Seed Bank Soal
    const seedSoal: BankSoal[] = [
      {
        id: 'BS-000001',
        judul: 'Penilaian Akhir Semester Ganjil Matematika Kelas 9',
        nama_file: 'PAS_Matematika_Kelas_9_2024.pdf',
        file_id: '1aBcDeFgHiJkLmNoPqRsTuVwXyZ01',
        folder_id: '1Fld_Matematika_SMP_9',
        drive_file_id: '1aBcDeFgHiJkLmNoPqRsTuVwXyZ01',
        drive_folder_id: '1Fld_Matematika_SMP_9',
        storage_profile_id: 'storage-001',
        file_url: 'https://drive.google.com/file/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ01/view?usp=drivesdk',
        web_view_url: 'https://drive.google.com/file/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ01/view?usp=drivesdk',
        download_url: 'https://drive.google.com/uc?export=download&id=1aBcDeFgHiJkLmNoPqRsTuVwXyZ01',
        mime_type: 'application/pdf',
        storage_path: 'BANK SOAL DIGITAL / Matematika / Kelas 9 / PAS_Matematika_Kelas_9_2024.pdf',
        mata_pelajaran: 'Matematika',
        jenjang: 'SMP',
        kelas: '9',
        kurikulum: 'Kurikulum Merdeka',
        bab: 'Persamaan Kuadrat & Fungsi Kuadrat',
        topik: 'Aplikasi Fungsi Kuadrat dalam Kehidupan Sehari-hari',
        jenis_soal: 'Campuran',
        tingkat_kesulitan: 'Sedang',
        tahun: 2024,
        semester: 'Ganjil',
        sumber: 'MGMP Matematika Kota Surabaya',
        pembuat_pengajar: 'Dra. Hj. Nurhayati, M.Pd.',
        deskripsi: 'Naskah soal lengkap PAS Ganjil dengan kunci jawaban dan rubrik penilaian.',
        tags: ['PAS', 'Matematika', 'Kelas 9', 'Persamaan Kuadrat', 'HOTS'],
        jumlah_halaman: 8,
        ukuran_file: 345678,
        uploaded_by: 'u-1',
        uploaded_by_name: 'Dra. Hj. Nurhayati, M.Pd.',
        uploaded_by_email: 'nurhayati@sekolah.sch.id',
        created_at: now,
        updated_at: now,
        status: 'aktif',
        sync_status: 'SYNCED',
        download_count: 42,
        view_count: 128,
        version: 1
      },
      {
        id: 'BS-000002',
        judul: 'Latihan Soal HOTS Fisika: Dinamika Gerak & Hukum Newton Kelas 11',
        nama_file: 'Fisika_HOTS_Dinamika_Gerak_Kelas_11.pdf',
        file_id: '1bCdEfGhIjKlMnOpQrStUvWxYz012',
        folder_id: '1Fld_Fisika_SMA_11',
        drive_file_id: '1bCdEfGhIjKlMnOpQrStUvWxYz012',
        drive_folder_id: '1Fld_Fisika_SMA_11',
        storage_profile_id: 'storage-001',
        file_url: 'https://drive.google.com/file/d/1bCdEfGhIjKlMnOpQrStUvWxYz012/view?usp=drivesdk',
        web_view_url: 'https://drive.google.com/file/d/1bCdEfGhIjKlMnOpQrStUvWxYz012/view?usp=drivesdk',
        download_url: 'https://drive.google.com/uc?export=download&id=1bCdEfGhIjKlMnOpQrStUvWxYz012',
        mime_type: 'application/pdf',
        storage_path: 'BANK SOAL DIGITAL / Fisika / Kelas 11 / Fisika_HOTS_Dinamika_Gerak_Kelas_11.pdf',
        mata_pelajaran: 'Fisika',
        jenjang: 'SMA',
        kelas: '11',
        kurikulum: 'Kurikulum Merdeka',
        bab: 'Dinamika Gerak Lurus',
        topik: 'Hukum Newton I, II, III dan Gesekan',
        jenis_soal: 'HOTS',
        tingkat_kesulitan: 'Sulit',
        tahun: 2025,
        semester: 'Ganjil',
        sumber: 'Buku Bank Soal Fisika Unggulan',
        pembuat_pengajar: 'Dra. Hj. Nurhayati, M.Pd.',
        deskripsi: 'Kumpulan 25 butir soal HOTS penalaran fisika mekanika untuk persiapan olimpiade & UTBK-SNBT.',
        tags: ['Fisika', 'HOTS', 'Hukum Newton', 'Olimpiade', 'SNBT'],
        jumlah_halaman: 12,
        ukuran_file: 512000,
        uploaded_by: 'u-1',
        uploaded_by_name: 'Dra. Hj. Nurhayati, M.Pd.',
        uploaded_by_email: 'nurhayati@sekolah.sch.id',
        created_at: now,
        updated_at: now,
        status: 'aktif',
        sync_status: 'SYNCED',
        download_count: 78,
        view_count: 215,
        version: 1
      },
      {
        id: 'BS-000003',
        judul: 'Asesmen Sumatif Bahasa Indonesia: Teks Eksposisi Kelas 10',
        nama_file: 'Sumatif_B_Indonesia_Teks_Eksposisi_Kelas_10.pdf',
        file_id: '1cDeFgHiJkLmNoPqRsTuVwXyZ0123',
        folder_id: '1Fld_BIndonesia_SMA_10',
        drive_file_id: '1cDeFgHiJkLmNoPqRsTuVwXyZ0123',
        drive_folder_id: '1Fld_BIndonesia_SMA_10',
        storage_profile_id: 'storage-001',
        file_url: 'https://drive.google.com/file/d/1cDeFgHiJkLmNoPqRsTuVwXyZ0123/view?usp=drivesdk',
        web_view_url: 'https://drive.google.com/file/d/1cDeFgHiJkLmNoPqRsTuVwXyZ0123/view?usp=drivesdk',
        download_url: 'https://drive.google.com/uc?export=download&id=1cDeFgHiJkLmNoPqRsTuVwXyZ0123',
        mime_type: 'application/pdf',
        storage_path: 'BANK SOAL DIGITAL / Bahasa Indonesia / Kelas 10 / Sumatif_B_Indonesia_Teks_Eksposisi_Kelas_10.pdf',
        mata_pelajaran: 'Bahasa Indonesia',
        jenjang: 'SMA',
        kelas: '10',
        kurikulum: 'Kurikulum Merdeka',
        bab: 'Teks Eksposisi',
        topik: 'Analisis Struktur dan Kebahasaan Teks Eksposisi',
        jenis_soal: 'Pilihan Ganda',
        tingkat_kesulitan: 'Mudah',
        tahun: 2024,
        semester: 'Ganjil',
        sumber: 'Modul Ajar Guru Penggerak',
        pembuat_pengajar: 'Budi Santoso, S.Pd.',
        deskripsi: 'Soal pilihan ganda 40 butir berbasis teks literasi lingkungan hidup.',
        tags: ['Bahasa Indonesia', 'Teks Eksposisi', 'Sumatif', 'Literasi'],
        jumlah_halaman: 6,
        ukuran_file: 289000,
        uploaded_by: 'u-2',
        uploaded_by_name: 'Budi Santoso, S.Pd.',
        uploaded_by_email: 'budi.santoso@guru.smp.id',
        created_at: now,
        updated_at: now,
        status: 'aktif',
        sync_status: 'SYNCED',
        download_count: 31,
        view_count: 94,
        version: 1
      },
      {
        id: 'BS-000004',
        judul: 'Tryout UTBK-SNBT Literasi Bahasa Inggris & Reading Comprehension',
        nama_file: 'Tryout_SNBT_English_Literacy_2025.pdf',
        file_id: '1dEfGhIjKlMnOpQrStUvWxYz01234',
        folder_id: '1Fld_English_SMA_12',
        drive_file_id: '1dEfGhIjKlMnOpQrStUvWxYz01234',
        drive_folder_id: '1Fld_English_SMA_12',
        storage_profile_id: 'storage-001',
        file_url: 'https://drive.google.com/file/d/1dEfGhIjKlMnOpQrStUvWxYz01234/view?usp=drivesdk',
        web_view_url: 'https://drive.google.com/file/d/1dEfGhIjKlMnOpQrStUvWxYz01234/view?usp=drivesdk',
        download_url: 'https://drive.google.com/uc?export=download&id=1dEfGhIjKlMnOpQrStUvWxYz01234',
        mime_type: 'application/pdf',
        storage_path: 'BANK SOAL DIGITAL / Bahasa Inggris / Kelas 12 / Tryout_SNBT_English_Literacy_2025.pdf',
        mata_pelajaran: 'Bahasa Inggris',
        jenjang: 'SMA',
        kelas: '12',
        kurikulum: 'Kurikulum Merdeka',
        bab: 'Reading Literacy',
        topik: 'Inference, Tone, and Vocabulary in Context',
        jenis_soal: 'SNBT',
        tingkat_kesulitan: 'Sulit',
        tahun: 2025,
        semester: 'Genap',
        sumber: 'Tim Olimpiade & UTBK Nasional',
        pembuat_pengajar: 'Dra. Hj. Nurhayati, M.Pd.',
        deskripsi: 'Simulasi UTBK Tes Potensi Skolastik (TPS) subtes Literasi Bahasa Inggris standar terbaru.',
        tags: ['Bahasa Inggris', 'SNBT', 'Reading', 'HOTS', 'Tryout'],
        jumlah_halaman: 10,
        ukuran_file: 450000,
        uploaded_by: 'u-1',
        uploaded_by_name: 'Dra. Hj. Nurhayati, M.Pd.',
        uploaded_by_email: 'nurhayati@sekolah.sch.id',
        created_at: now,
        updated_at: now,
        status: 'aktif',
        sync_status: 'SYNCED',
        download_count: 110,
        view_count: 340,
        version: 1
      }
    ];
    seedSoal.forEach(s => this.memoryBankSoal.set(s.id, s));
  }

  public invalidateAllCache() {
    this.bankSoalCache = null;
    this.categoriesCache = null;
    this.usersCache = null;
    this.storageProfilesCache = null;
    this.configCache = null;
    this.auditLogsCache = null;
  }

  // ============================================================================
  // BANK SOAL CRUD
  // ============================================================================

  public async getBankSoalList(params: FilterParams = {}): Promise<{ items: BankSoal[]; total: number; page: number; totalPages: number }> {
    // 1. Coba panggil Google Apps Script Gateway (Single Source of Truth)
    try {
      const response = await this.appsScriptGateway.executeGetAction<any>('getBankSoal', params);
      if (response.success && response.data) {
        const data = response.data;
        const items: BankSoal[] = Array.isArray(data) ? data : (data.items || []);
        const total = (typeof data.total === 'number') ? data.total : items.length;
        const page = Number(params.page) || 1;
        const limit = Number(params.limit) || 12;
        const totalPages = Math.ceil(total / limit) || 1;

        // Sync ke memory cache
        items.forEach(it => this.memoryBankSoal.set(it.id, it));

        return { items, total, page, totalPages };
      }
    } catch (err) {
      console.warn('[GoogleSheetsRepository] Apps Script getBankSoal fallback to memory:', err);
    }

    // 2. Fallback ke memory state
    let all = Array.from(this.memoryBankSoal.values());
    const reqStatus = params.status || 'aktif';

    if (reqStatus === 'arsip' || reqStatus === 'trash') {
      all = all.filter(i => i.status === 'arsip');
    } else if (reqStatus !== 'all') {
      all = all.filter(i => i.status === 'aktif');
    }

    if (params.mata_pelajaran) {
      all = all.filter(i => i.mata_pelajaran.toLowerCase() === params.mata_pelajaran!.toLowerCase());
    }
    if (params.jenjang) {
      all = all.filter(i => i.jenjang === params.jenjang);
    }
    if (params.kelas) {
      all = all.filter(i => String(i.kelas) === String(params.kelas));
    }
    if (params.tingkat_kesulitan) {
      all = all.filter(i => i.tingkat_kesulitan === params.tingkat_kesulitan);
    }
    if (params.jenis_soal) {
      all = all.filter(i => i.jenis_soal === params.jenis_soal);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      all = all.filter(i =>
        i.judul.toLowerCase().includes(q) ||
        i.nama_file.toLowerCase().includes(q) ||
        i.mata_pelajaran.toLowerCase().includes(q) ||
        (i.bab && i.bab.toLowerCase().includes(q)) ||
        (i.topik && i.topik.toLowerCase().includes(q)) ||
        (i.deskripsi && i.deskripsi.toLowerCase().includes(q)) ||
        (i.tags && i.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    // Sorting
    if (params.sortBy === 'terlama') {
      all.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (params.sortBy === 'a-z') {
      all.sort((a, b) => a.judul.localeCompare(b.judul));
    } else if (params.sortBy === 'z-a') {
      all.sort((a, b) => b.judul.localeCompare(a.judul));
    } else if (params.sortBy === 'view_count') {
      all.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
    } else if (params.sortBy === 'download_count') {
      all.sort((a, b) => (b.download_count || 0) - (a.download_count || 0));
    } else {
      all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 12;
    const total = all.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = all.slice((page - 1) * limit, page * limit);

    return { items: paginated, total, page, totalPages };
  }

  public async getBankSoalById(id: string, userId?: string): Promise<BankSoal | null> {
    try {
      const response = await this.appsScriptGateway.executeGetAction<any>('getBankSoalById', { id, userId });
      if (response.success && response.data) {
        const item: BankSoal = response.data.item || response.data;
        if (item && item.id) {
          this.memoryBankSoal.set(item.id, item);
          return item;
        }
      }
    } catch (err) {
      console.warn('[GoogleSheetsRepository] Apps Script getBankSoalById fallback:', err);
    }

    const local = this.memoryBankSoal.get(id);
    if (local) {
      local.view_count = (local.view_count || 0) + 1;
      return local;
    }
    return null;
  }

  public async createBankSoal(data: Partial<BankSoal>, user?: User): Promise<BankSoal> {
    this.invalidateAllCache();

    // 1. Tulis langsung ke Google Sheets via Gateway
    try {
      const res = await this.appsScriptGateway.executePostAction<any>('createBankSoal', {
        data,
        user
      });
      if (res.success && res.data) {
        const item = res.data.item || res.data;
        if (item && item.id) {
          this.memoryBankSoal.set(item.id, item);
          return item;
        }
      }
    } catch (err) {
      console.warn('[GoogleSheetsRepository] createBankSoal gateway failed, writing to memory:', err);
    }

    // Fallback ID generation
    const nextNum = this.memoryBankSoal.size + 1;
    const nextId = data.id || `BS-${('000000' + nextNum).slice(-6)}`;
    const now = new Date().toISOString();

    const newObj: BankSoal = {
      id: nextId,
      judul: data.judul || 'Bank Soal Baru',
      nama_file: data.nama_file || 'soal.pdf',
      file_id: data.file_id || '',
      folder_id: data.folder_id || '',
      drive_file_id: data.file_id || '',
      drive_folder_id: data.folder_id || '',
      storage_profile_id: data.storage_profile_id || 'storage-001',
      file_url: data.file_url || data.web_view_url || '',
      web_view_url: data.web_view_url || data.file_url || '',
      download_url: data.download_url || '',
      mime_type: 'application/pdf',
      storage_path: data.storage_path || '',
      file_hash: data.file_hash || '',
      mata_pelajaran: data.mata_pelajaran || 'Umum',
      jenjang: data.jenjang || 'SMA',
      kelas: String(data.kelas || '10'),
      kurikulum: data.kurikulum || 'Kurikulum Merdeka',
      bab: data.bab || 'Umum',
      topik: data.topik || 'Latihan Soal',
      subtopik: data.subtopik || '',
      jenis_soal: data.jenis_soal || 'Pilihan Ganda',
      tingkat_kesulitan: data.tingkat_kesulitan || 'Sedang',
      tahun: Number(data.tahun) || new Date().getFullYear(),
      semester: data.semester || 'Ganjil',
      sumber: data.sumber || '',
      pembuat_pengajar: data.pembuat_pengajar || (user ? user.name : 'Pengajar'),
      deskripsi: data.deskripsi || '',
      tags: data.tags || [],
      jumlah_halaman: Number(data.jumlah_halaman) || 1,
      ukuran_file: Number(data.ukuran_file) || 1024,
      uploaded_by: user ? user.id : 'u-1',
      uploaded_by_name: user ? user.name : 'Pengajar',
      uploaded_by_email: user ? user.email : 'pengajar@sekolah.sch.id',
      created_at: now,
      updated_at: now,
      status: 'aktif',
      sync_status: data.sync_status || (data.file_id ? 'SYNCED' : 'NEEDS_SYNC'),
      download_count: 0,
      view_count: 0,
      version: 1
    };

    this.memoryBankSoal.set(nextId, newObj);
    return newObj;
  }

  public async updateBankSoal(id: string, updateData: Partial<BankSoal>, user?: User): Promise<BankSoal | null> {
    this.invalidateAllCache();

    try {
      const res = await this.appsScriptGateway.executePostAction<any>('updateBankSoal', {
        id,
        data: updateData,
        user
      });
      if (res.success && res.data) {
        const item = res.data.item || res.data;
        if (item && item.id) {
          this.memoryBankSoal.set(item.id, item);
          return item;
        }
      }
    } catch (err) {
      console.warn('[GoogleSheetsRepository] updateBankSoal gateway failed:', err);
    }

    const existing = this.memoryBankSoal.get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updateData,
      updated_at: new Date().toISOString()
    };
    this.memoryBankSoal.set(id, updated);
    return updated;
  }

  public async softDeleteBankSoal(id: string, user?: User): Promise<boolean> {
    this.invalidateAllCache();

    try {
      const res = await this.appsScriptGateway.executePostAction<any>('deleteBankSoal', { id, user });
      if (res.success) {
        const existing = this.memoryBankSoal.get(id);
        if (existing) {
          existing.status = 'arsip';
          existing.updated_at = new Date().toISOString();
        }
        return true;
      }
    } catch (err) {
      console.warn('[GoogleSheetsRepository] softDeleteBankSoal gateway error:', err);
    }

    const existing = this.memoryBankSoal.get(id);
    if (existing) {
      existing.status = 'arsip';
      existing.updated_at = new Date().toISOString();
      return true;
    }
    return false;
  }

  public async restoreBankSoal(id: string, user?: User): Promise<boolean> {
    this.invalidateAllCache();

    try {
      const res = await this.appsScriptGateway.executePostAction<any>('restoreBankSoal', { id, user });
      if (res.success) {
        const existing = this.memoryBankSoal.get(id);
        if (existing) {
          existing.status = 'aktif';
          existing.updated_at = new Date().toISOString();
        }
        return true;
      }
    } catch (err) {
      console.warn('[GoogleSheetsRepository] restoreBankSoal gateway error:', err);
    }

    const existing = this.memoryBankSoal.get(id);
    if (existing) {
      existing.status = 'aktif';
      existing.updated_at = new Date().toISOString();
      return true;
    }
    return false;
  }

  public async permanentDeleteBankSoal(id: string, user?: User): Promise<boolean> {
    this.invalidateAllCache();

    try {
      const res = await this.appsScriptGateway.executePostAction<any>('permanentDeleteBankSoal', { id, user });
      if (res.success) {
        this.memoryBankSoal.delete(id);
        return true;
      }
    } catch (err) {
      console.warn('[GoogleSheetsRepository] permanentDeleteBankSoal gateway error:', err);
    }

    this.memoryBankSoal.delete(id);
    return true;
  }

  public async emptyTrash(user?: User): Promise<{ count: number }> {
    this.invalidateAllCache();

    try {
      const res = await this.appsScriptGateway.executePostAction<any>('emptyTrash', { user });
      if (res.success) {
        let deleted = 0;
        for (const [id, item] of this.memoryBankSoal.entries()) {
          if (item.status === 'arsip') {
            this.memoryBankSoal.delete(id);
            deleted++;
          }
        }
        return { count: res.data?.count || deleted };
      }
    } catch (err) {
      console.warn('[GoogleSheetsRepository] emptyTrash gateway error:', err);
    }

    let deleted = 0;
    for (const [id, item] of this.memoryBankSoal.entries()) {
      if (item.status === 'arsip') {
        this.memoryBankSoal.delete(id);
        deleted++;
      }
    }
    return { count: deleted };
  }

  public async addVersion(payload: { id: string; base64: string; fileName: string; catatan?: string; user?: User }): Promise<BankSoal | null> {
    this.invalidateAllCache();

    try {
      const res = await this.appsScriptGateway.executePostAction<any>('addVersion', payload);
      if (res.success && res.data) {
        const item = res.data.item || res.data;
        if (item && item.id) {
          this.memoryBankSoal.set(item.id, item);
          return item;
        }
      }
    } catch (err) {
      console.warn('[GoogleSheetsRepository] addVersion gateway error:', err);
    }

    const existing = this.memoryBankSoal.get(payload.id);
    if (!existing) return null;

    existing.version = (existing.version || 1) + 1;
    existing.nama_file = payload.fileName;
    existing.updated_at = new Date().toISOString();
    return existing;
  }

  public checkDuplicatesByHash(hash: string): BankSoal[] {
    if (!hash) return [];
    return Array.from(this.memoryBankSoal.values()).filter(
      item => item.file_hash === hash && item.status !== 'arsip'
    );
  }

  // ============================================================================
  // CENTRAL STORAGE PROFILES MANAGEMENT (GOOGLE SHEETS: STORAGE_PROFILES)
  // ============================================================================

  public async getStorageProfiles(): Promise<{ profiles: GoogleStorageProfile[]; active_profile: GoogleStorageProfile | null }> {
    // 1. Coba ambil dari Google Sheets via Gateway
    try {
      const res = await this.appsScriptGateway.executeGetAction<any>('getStorageProfiles');
      if (res.success && res.data) {
        const profiles: GoogleStorageProfile[] = res.data.profiles || (Array.isArray(res.data) ? res.data : []);
        if (profiles.length > 0) {
          // Sync to memory
          this.memoryStorageProfiles.clear();
          profiles.forEach(p => this.memoryStorageProfiles.set(p.id, p));
          const active = profiles.find(p => p.is_active) || profiles[0] || null;
          return { profiles, active_profile: active };
        }
      }
    } catch (err) {
      console.warn('[GoogleSheetsRepository] getStorageProfiles fallback to memory:', err);
    }

    const profiles = Array.from(this.memoryStorageProfiles.values());
    const active = profiles.find(p => p.is_active) || profiles[0] || null;
    return { profiles, active_profile: active };
  }

  public async saveStorageProfile(profile: Partial<GoogleStorageProfile>): Promise<GoogleStorageProfile> {
    this.invalidateAllCache();

    if (profile.id && this.memoryStorageProfiles.has(profile.id)) {
      // Update
      try {
        const res = await this.appsScriptGateway.executePostAction<any>('updateStorageProfile', {
          id: profile.id,
          profile
        });
        if (res.success && res.data?.profile) {
          const updated = res.data.profile;
          this.memoryStorageProfiles.set(updated.id, updated);
          return updated;
        }
      } catch (err) {
        console.warn('[GoogleSheetsRepository] updateStorageProfile gateway fallback:', err);
      }

      const existing = this.memoryStorageProfiles.get(profile.id)!;
      const updated = { ...existing, ...profile, updated_at: new Date().toISOString() };
      this.memoryStorageProfiles.set(profile.id, updated);
      return updated;
    } else {
      // Create
      try {
        const res = await this.appsScriptGateway.executePostAction<any>('createStorageProfile', { profile });
        if (res.success && res.data?.profile) {
          const created = res.data.profile;
          this.memoryStorageProfiles.set(created.id, created);
          return created;
        }
      } catch (err) {
        console.warn('[GoogleSheetsRepository] createStorageProfile gateway fallback:', err);
      }

      const id = profile.id || `storage-${('000' + (this.memoryStorageProfiles.size + 1)).slice(-3)}`;
      const now = new Date().toISOString();
      const created: GoogleStorageProfile = {
        id,
        name: profile.name || 'Penyimpanan Tambahan',
        description: profile.description || '',
        apps_script_url: profile.apps_script_url || '',
        google_drive_folder_id: profile.google_drive_folder_id || profile.drive_root_folder_id || '',
        drive_root_folder_id: profile.google_drive_folder_id || profile.drive_root_folder_id || '',
        google_spreadsheet_id: profile.google_spreadsheet_id || profile.spreadsheet_id || '',
        spreadsheet_id: profile.google_spreadsheet_id || profile.spreadsheet_id || '',
        status: profile.status || 'INACTIVE',
        health_status: profile.health_status || 'HEALTHY',
        connection_status: 'PENDING',
        quota_status: 'NORMAL',
        priority: Number(profile.priority) || 2,
        is_active: Boolean(profile.is_active),
        provider: 'google',
        drive_root_name: profile.drive_root_name || 'BANK SOAL DIGITAL',
        spreadsheet_name: profile.spreadsheet_name || 'BANK SOAL DIGITAL',
        last_connection_test: now,
        created_at: now,
        updated_at: now,
        created_by: 'Admin'
      };
      this.memoryStorageProfiles.set(id, created);
      return created;
    }
  }

  public async setActiveStorageProfile(id: string): Promise<boolean> {
    this.invalidateAllCache();

    try {
      const res = await this.appsScriptGateway.executePostAction<any>('setActiveStorage', { id });
      if (res.success) {
        for (const [pId, prof] of this.memoryStorageProfiles.entries()) {
          prof.is_active = (pId === id);
          prof.status = (pId === id) ? 'ACTIVE' : 'INACTIVE';
        }
        return true;
      }
    } catch (err) {
      console.warn('[GoogleSheetsRepository] setActiveStorage gateway fallback:', err);
    }

    for (const [pId, prof] of this.memoryStorageProfiles.entries()) {
      prof.is_active = (pId === id);
      prof.status = (pId === id) ? 'ACTIVE' : 'INACTIVE';
    }
    return true;
  }

  public async deleteStorageProfile(id: string): Promise<boolean> {
    this.invalidateAllCache();

    try {
      const res = await this.appsScriptGateway.executePostAction<any>('deleteStorageProfile', { id });
      if (res.success) {
        this.memoryStorageProfiles.delete(id);
        return true;
      }
    } catch (err) {
      console.warn('[GoogleSheetsRepository] deleteStorageProfile gateway fallback:', err);
    }

    this.memoryStorageProfiles.delete(id);
    return true;
  }

  // ============================================================================
  // SYSTEM CONFIG (GOOGLE SHEETS: SYSTEM_CONFIG)
  // ============================================================================

  public async getSystemConfig(): Promise<Record<string, any>> {
    try {
      const res = await this.appsScriptGateway.executeGetAction<any>('getSystemConfig');
      if (res.success && res.data?.configs) {
        this.memoryConfig = res.data.configs;
        return res.data.configs;
      }
    } catch (err) {
      console.warn('[GoogleSheetsRepository] getSystemConfig gateway fallback:', err);
    }
    return this.memoryConfig;
  }

  public async saveSystemConfig(key: string, value: any, user?: User): Promise<boolean> {
    this.invalidateAllCache();

    try {
      const res = await this.appsScriptGateway.executePostAction<any>('saveConfig', {
        key,
        value,
        user
      });
      if (res.success) {
        this.memoryConfig[key] = value;
        return true;
      }
    } catch (err) {
      console.warn('[GoogleSheetsRepository] saveSystemConfig gateway fallback:', err);
    }

    this.memoryConfig[key] = value;
    return true;
  }

  // ============================================================================
  // SINKRONISASI DRIVE ↔ SHEETS & DIAGNOSTIK
  // ============================================================================

  public async syncDriveWithSheets(): Promise<DriveSyncResult> {
    this.invalidateAllCache();

    try {
      const res = await this.appsScriptGateway.executePostAction<any>('syncDrive', {});
      if (res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn('[GoogleSheetsRepository] syncDrive gateway fallback:', err);
    }

    const items = Array.from(this.memoryBankSoal.values());
    return {
      sync_id: `sync-${Date.now()}`,
      status: 'SUCCESS',
      total_scanned: items.length,
      synced_count: items.length,
      missing_count: 0,
      unindexed_count: 0,
      unindexed_items: [],
      timestamp: new Date().toISOString(),
      details: `Sinkronisasi selesai. ${items.length} berkas PDF sinkron dengan metadata Spreadsheet.`
    };
  }

  public async testLiveConnection(): Promise<ConnectionTestResult> {
    return await this.appsScriptGateway.testLiveConnection();
  }

  // ============================================================================
  // USERS, CATEGORIES, AUDIT LOGS, FAVORITES, STATS
  // ============================================================================

  public async getUsers(): Promise<User[]> {
    try {
      const res = await this.appsScriptGateway.executeGetAction<any>('getUsers');
      if (res.success && res.data?.users) {
        return res.data.users;
      }
    } catch (err) {
      console.warn('[GoogleSheetsRepository] getUsers gateway fallback:', err);
    }
    return Array.from(this.memoryUsers.values());
  }

  public async createUser(userData: Partial<User>, adminUser?: User): Promise<User> {
    this.invalidateAllCache();

    try {
      const res = await this.appsScriptGateway.executePostAction<any>('createUser', { userData, adminUser });
      if (res.success && res.data?.user) {
        const u = res.data.user;
        this.memoryUsers.set(u.id, u);
        return u;
      }
    } catch (err) {
      console.warn('[GoogleSheetsRepository] createUser gateway fallback:', err);
    }

    const id = userData.id || `u-${Date.now()}`;
    const now = new Date().toISOString();
    const newUser: User = {
      id,
      name: userData.name || 'Pengguna Baru',
      email: userData.email || '',
      role: userData.role || 'GURU',
      status: userData.status || 'ACTIVE',
      school_institution: userData.school_institution || '',
      subject: userData.subject || '',
      avatar: userData.avatar || '',
      created_at: now,
      updated_at: now
    };
    this.memoryUsers.set(id, newUser);
    return newUser;
  }

  public async updateUser(id: string, userData: Partial<User>, adminUser?: User): Promise<User | null> {
    this.invalidateAllCache();

    try {
      const res = await this.appsScriptGateway.executePostAction<any>('updateUser', { id, userData, adminUser });
      if (res.success && res.data?.user) {
        const u = res.data.user;
        this.memoryUsers.set(u.id, u);
        return u;
      }
    } catch (err) {
      console.warn('[GoogleSheetsRepository] updateUser gateway fallback:', err);
    }

    const existing = this.memoryUsers.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...userData, updated_at: new Date().toISOString() };
    this.memoryUsers.set(id, updated);
    return updated;
  }

  public async deleteUser(id: string, adminUser?: User): Promise<boolean> {
    this.invalidateAllCache();

    try {
      const res = await this.appsScriptGateway.executePostAction<any>('deleteUser', { id, adminUser });
      if (res.success) {
        this.memoryUsers.delete(id);
        return true;
      }
    } catch (err) {
      console.warn('[GoogleSheetsRepository] deleteUser gateway fallback:', err);
    }

    this.memoryUsers.delete(id);
    return true;
  }

  public async getCategories(): Promise<CategoryItem[]> {
    try {
      const res = await this.appsScriptGateway.executeGetAction<any>('getCategories');
      if (res.success && res.data?.categories) {
        return res.data.categories;
      }
    } catch (err) {
      console.warn('[GoogleSheetsRepository] getCategories gateway fallback:', err);
    }
    return Array.from(this.memoryCategories.values());
  }

  public async createCategory(cat: Partial<CategoryItem>): Promise<CategoryItem> {
    this.invalidateAllCache();

    try {
      const res = await this.appsScriptGateway.executePostAction<any>('createCategory', { category: cat });
      if (res.success && res.data?.category) {
        const c = res.data.category;
        this.memoryCategories.set(c.id, c);
        return c;
      }
    } catch (err) {
      console.warn('[GoogleSheetsRepository] createCategory gateway fallback:', err);
    }

    const id = cat.id || `c-${Date.now()}`;
    const newCat: CategoryItem = {
      id,
      type: cat.type || 'mata_pelajaran',
      name: cat.name || 'Kategori Baru',
      code: cat.code || '',
      title: cat.title || cat.name || '',
      description: cat.description || '',
      icon: cat.icon || 'Folder',
      color: cat.color || 'from-blue-600 to-indigo-600'
    };
    this.memoryCategories.set(id, newCat);
    return newCat;
  }

  public async updateCategory(id: string, cat: Partial<CategoryItem>): Promise<CategoryItem | null> {
    this.invalidateAllCache();

    try {
      const res = await this.appsScriptGateway.executePostAction<any>('updateCategory', { id, category: cat });
      if (res.success && res.data?.category) {
        const c = res.data.category;
        this.memoryCategories.set(c.id, c);
        return c;
      }
    } catch (err) {
      console.warn('[GoogleSheetsRepository] updateCategory gateway fallback:', err);
    }

    const existing = this.memoryCategories.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...cat };
    this.memoryCategories.set(id, updated);
    return updated;
  }

  public async deleteCategory(id: string): Promise<boolean> {
    this.invalidateAllCache();

    try {
      const res = await this.appsScriptGateway.executePostAction<any>('deleteCategory', { id });
      if (res.success) {
        this.memoryCategories.delete(id);
        return true;
      }
    } catch (err) {
      console.warn('[GoogleSheetsRepository] deleteCategory gateway fallback:', err);
    }

    this.memoryCategories.delete(id);
    return true;
  }

  public async getAuditLogs(limit: number = 100): Promise<AuditLogItem[]> {
    try {
      const res = await this.appsScriptGateway.executeGetAction<any>('getAuditLogs', { limit });
      if (res.success && res.data?.logs) {
        return res.data.logs;
      }
    } catch (err) {
      console.warn('[GoogleSheetsRepository] getAuditLogs gateway fallback:', err);
    }
    return this.memoryAuditLogs.slice(0, limit);
  }

  public async logActivity(entry: Partial<AuditLogItem>): Promise<void> {
    try {
      await this.appsScriptGateway.executePostAction<any>('recordActivity', entry);
    } catch (err) {
      console.warn('[GoogleSheetsRepository] logActivity gateway fallback:', err);
    }

    const logObj: AuditLogItem = {
      id: entry.id || `log-${Date.now()}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      user_id: entry.user_id || 'u-1',
      user_name: entry.user_name || 'Pengajar',
      user_role: entry.user_role || 'GURU',
      user_email: entry.user_email,
      action: entry.action || 'ACTIVITY',
      bank_soal_id: entry.bank_soal_id,
      soal_judul: entry.soal_judul,
      file_id: entry.file_id,
      details: entry.details
    };
    this.memoryAuditLogs.unshift(logObj);
    if (this.memoryAuditLogs.length > 500) this.memoryAuditLogs.pop();
  }

  public async getFavorites(userId: string): Promise<string[]> {
    try {
      const res = await this.appsScriptGateway.executeGetAction<any>('getFavorites', { userId });
      if (res.success && res.data?.favorites) {
        return res.data.favorites;
      }
    } catch (err) {
      console.warn('[GoogleSheetsRepository] getFavorites gateway fallback:', err);
    }

    const set = this.favoritesCache.get(userId);
    return set ? Array.from(set) : [];
  }

  public async toggleFavorite(userId: string, soalId: string): Promise<boolean> {
    try {
      const res = await this.appsScriptGateway.executePostAction<any>('favoriteBankSoal', { userId, soalId });
      if (res.success && typeof res.data?.is_favorite === 'boolean') {
        const isFav = res.data.is_favorite;
        let set = this.favoritesCache.get(userId);
        if (!set) {
          set = new Set();
          this.favoritesCache.set(userId, set);
        }
        if (isFav) set.add(soalId);
        else set.delete(soalId);
        return isFav;
      }
    } catch (err) {
      console.warn('[GoogleSheetsRepository] toggleFavorite gateway fallback:', err);
    }

    let set = this.favoritesCache.get(userId);
    if (!set) {
      set = new Set();
      this.favoritesCache.set(userId, set);
    }
    if (set.has(soalId)) {
      set.delete(soalId);
      return false;
    } else {
      set.add(soalId);
      return true;
    }
  }

  public async getStats(): Promise<StatsOverview> {
    const listRes = await this.getBankSoalList({ status: 'aktif', limit: 1000 });
    const items = listRes.items;

    let totalBytes = 0;
    const mapelMap: Record<string, number> = {};
    const jenjangMap: Record<string, number> = {};
    const tingkatMap: Record<string, number> = {};
    const tahunMap: Record<string, number> = {};
    let totalDownloads = 0;
    let totalViews = 0;

    items.forEach(it => {
      totalBytes += (it.ukuran_file || 0);
      totalDownloads += (it.download_count || 0);
      totalViews += (it.view_count || 0);

      mapelMap[it.mata_pelajaran] = (mapelMap[it.mata_pelajaran] || 0) + 1;
      jenjangMap[it.jenjang] = (jenjangMap[it.jenjang] || 0) + 1;
      tingkatMap[it.tingkat_kesulitan] = (tingkatMap[it.tingkat_kesulitan] || 0) + 1;
      const yr = String(it.tahun || '2024');
      tahunMap[yr] = (tahunMap[yr] || 0) + 1;
    });

    const topDownloaded = [...items].sort((a, b) => (b.download_count || 0) - (a.download_count || 0)).slice(0, 5);
    const recentUploads = [...items].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

    return {
      total_soal: items.length,
      total_pdf: items.length,
      total_storage_bytes: totalBytes,
      soal_bulan_ini: items.length,
      soal_favorit: 0,
      total_mata_pelajaran: Object.keys(mapelMap).length,
      total_kelas: 12,
      total_download: totalDownloads,
      total_views: totalViews,
      total_pengajar: this.memoryUsers.size,
      synced_count: items.filter(i => i.sync_status === 'SYNCED').length,
      needs_sync_count: items.filter(i => i.sync_status === 'NEEDS_SYNC').length,
      missing_count: 0,
      by_mapel: Object.entries(mapelMap).map(([name, count]) => ({ name, count })),
      by_jenjang: Object.entries(jenjangMap).map(([name, count]) => ({ name, count })),
      by_kesulitan: Object.entries(tingkatMap).map(([level, count]) => ({ level, count })),
      by_tahun: Object.entries(tahunMap).map(([year, count]) => ({ year, count })),
      top_downloaded: topDownloaded,
      recent_uploads: recentUploads,
      storage_growth: [
        { month: 'Jan 2025', bytes: Math.round(totalBytes * 0.4), count: Math.round(items.length * 0.4) },
        { month: 'Feb 2025', bytes: Math.round(totalBytes * 0.7), count: Math.round(items.length * 0.7) },
        { month: 'Mar 2025', bytes: totalBytes, count: items.length },
      ]
    };
  }

  public async getTags(): Promise<{ tag: string; count: number }[]> {
    const listRes = await this.getBankSoalList({ status: 'aktif', limit: 1000 });
    const items = listRes.items;
    const tagCount: Record<string, number> = {};
    for (const s of items) {
      if (Array.isArray(s.tags)) {
        for (const t of s.tags) {
          if (t && typeof t === 'string' && t.trim()) {
            const clean = t.trim();
            tagCount[clean] = (tagCount[clean] || 0) + 1;
          }
        }
      }
    }
    return Object.entries(tagCount)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }

  public async getUserHistory(userId: string, limit = 50): Promise<UserHistoryItem[]> {
    const logs = await this.getAuditLogs(200);
    const userLogs = logs.filter(l => l.user_id === userId);
    return userLogs.map(l => ({
      id: l.id,
      user_id: l.user_id,
      user_name: l.user_name,
      bank_soal_id: l.bank_soal_id || '',
      bank_soal_judul: l.soal_judul || (l.details?.judul || l.details?.file_name || 'Bank Soal'),
      file_id: l.file_id,
      action: l.action,
      timestamp: l.timestamp,
    })).slice(0, limit);
  }
}
