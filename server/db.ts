import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { BankSoal, User, AuditLog, CategoryItem, StatsOverview } from '../src/types';
import { createSamplePdf } from './seedPdf';

const DATA_DIR = path.join(process.cwd(), 'data');
const STORAGE_DIR = path.join(DATA_DIR, 'storage');

const FILES = {
  bank_soal: path.join(DATA_DIR, 'bank_soal.json'),
  users: path.join(DATA_DIR, 'users.json'),
  categories: path.join(DATA_DIR, 'categories.json'),
  audit_logs: path.join(DATA_DIR, 'audit_logs.json'),
  favorites: path.join(DATA_DIR, 'favorites.json'), // Map of userId -> Set of soalIds
  history: path.join(DATA_DIR, 'history.json'),
};

export class Database {
  private static instance: Database;
  private bankSoal: BankSoal[] = [];
  private users: User[] = [];
  private categories: CategoryItem[] = [];
  private auditLogs: AuditLog[] = [];
  private favorites: Record<string, string[]> = {};
  private history: { id: string; user_id: string; soal_id: string; action: string; timestamp: string }[] = [];

  private constructor() {
    this.initDirs();
    this.loadData();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private initDirs() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }

  private loadData() {
    try {
      if (fs.existsSync(FILES.users)) {
        this.users = JSON.parse(fs.readFileSync(FILES.users, 'utf-8'));
      } else {
        this.seedUsers();
      }

      if (fs.existsSync(FILES.categories)) {
        this.categories = JSON.parse(fs.readFileSync(FILES.categories, 'utf-8'));
      } else {
        this.seedCategories();
      }

      if (fs.existsSync(FILES.favorites)) {
        this.favorites = JSON.parse(fs.readFileSync(FILES.favorites, 'utf-8'));
      } else {
        this.favorites = { 'u-1': ['soal-1', 'soal-3'], 'u-2': ['soal-2'] };
        this.saveFavorites();
      }

      if (fs.existsSync(FILES.audit_logs)) {
        this.auditLogs = JSON.parse(fs.readFileSync(FILES.audit_logs, 'utf-8'));
      } else {
        this.auditLogs = [];
      }

      if (fs.existsSync(FILES.history)) {
        this.history = JSON.parse(fs.readFileSync(FILES.history, 'utf-8'));
      } else {
        this.history = [];
      }

      if (fs.existsSync(FILES.bank_soal)) {
        this.bankSoal = JSON.parse(fs.readFileSync(FILES.bank_soal, 'utf-8'));
      } else {
        this.seedBankSoal();
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
  }

  private saveBankSoal() {
    fs.writeFileSync(FILES.bank_soal, JSON.stringify(this.bankSoal, null, 2));
  }

  private saveUsers() {
    fs.writeFileSync(FILES.users, JSON.stringify(this.users, null, 2));
  }

  private saveCategories() {
    fs.writeFileSync(FILES.categories, JSON.stringify(this.categories, null, 2));
  }

  private saveAuditLogs() {
    fs.writeFileSync(FILES.audit_logs, JSON.stringify(this.auditLogs.slice(0, 1000), null, 2));
  }

  private saveFavorites() {
    fs.writeFileSync(FILES.favorites, JSON.stringify(this.favorites, null, 2));
  }

  private saveHistory() {
    fs.writeFileSync(FILES.history, JSON.stringify(this.history.slice(0, 1000), null, 2));
  }

  private seedUsers() {
    this.users = [
      {
        id: 'u-1',
        name: 'Dra. Hj. Nurhayati, M.Pd.',
        email: 'nurhayati@sekolah.sch.id',
        role: 'ADMIN',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        institution: 'SMA Negeri 1 Teladan',
        subject: 'Manajemen Kurikulum & Matematika',
      },
      {
        id: 'u-2',
        name: 'Budi Santoso, S.Pd.',
        email: 'budi.santoso@guru.smp.id',
        role: 'GURU',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        institution: 'SMP Negeri 5 Bintang',
        subject: 'Matematika & IPA',
      },
      {
        id: 'u-3',
        name: 'Siti Rahmawati, M.Si.',
        email: 'siti.rahmawati@guru.sma.id',
        role: 'GURU',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        institution: 'SMA Unggulan Cendekia',
        subject: 'Fisika & Kimia',
      },
      {
        id: 'u-4',
        name: 'Ahmad Fauzi, M.Hum.',
        email: 'ahmad.fauzi@guru.sma.id',
        role: 'GURU',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        institution: 'SMA Nusantara Mandiri',
        subject: 'Bahasa Indonesia & Sastra',
      },
    ];
    this.saveUsers();
  }

  private seedCategories() {
    this.categories = [
      { id: 'c-1', type: 'mata_pelajaran', name: 'Matematika', code: 'MTK', icon: 'Calculator' },
      { id: 'c-2', type: 'mata_pelajaran', name: 'Bahasa Indonesia', code: 'BIN', icon: 'BookOpen' },
      { id: 'c-3', type: 'mata_pelajaran', name: 'Bahasa Inggris', code: 'BIG', icon: 'Languages' },
      { id: 'c-4', type: 'mata_pelajaran', name: 'IPA', code: 'IPA', icon: 'FlaskConical' },
      { id: 'c-5', type: 'mata_pelajaran', name: 'IPS', code: 'IPS', icon: 'Globe' },
      { id: 'c-6', type: 'mata_pelajaran', name: 'Fisika', code: 'FIS', icon: 'Atom' },
      { id: 'c-7', type: 'mata_pelajaran', name: 'Kimia', code: 'KIM', icon: 'TestTubes' },
      { id: 'c-8', type: 'mata_pelajaran', name: 'Biologi', code: 'BIO', icon: 'Dna' },
      { id: 'c-9', type: 'mata_pelajaran', name: 'Informatika', code: 'INF', icon: 'Binary' },
      { id: 'c-10', type: 'mata_pelajaran', name: 'Ekonomi', code: 'EKO', icon: 'TrendingUp' },
      { id: 'c-11', type: 'mata_pelajaran', name: 'Sejarah', code: 'SEJ', icon: 'Landmark' },
      { id: 'c-12', type: 'mata_pelajaran', name: 'Geografi', code: 'GEO', icon: 'Compass' },
      
      { id: 'c-20', type: 'jenjang', name: 'SD', description: 'Sekolah Dasar (Kelas 1-6)' },
      { id: 'c-21', type: 'jenjang', name: 'SMP', description: 'Sekolah Menengah Pertama (Kelas 7-9)' },
      { id: 'c-22', type: 'jenjang', name: 'SMA', description: 'Sekolah Menengah Atas (Kelas 10-12)' },
      { id: 'c-23', type: 'jenjang', name: 'SMK', description: 'Sekolah Menengah Kejuruan (Kelas 10-12)' },

      { id: 'c-30', type: 'jenis_soal', name: 'Pilihan Ganda' },
      { id: 'c-31', type: 'jenis_soal', name: 'Essay' },
      { id: 'c-32', type: 'jenis_soal', name: 'Campuran' },
      { id: 'c-33', type: 'jenis_soal', name: 'HOTS' },
      { id: 'c-34', type: 'jenis_soal', name: 'AKM' },
      { id: 'c-35', type: 'jenis_soal', name: 'SNBT' },
      { id: 'c-36', type: 'jenis_soal', name: 'Tryout' },
      { id: 'c-37', type: 'jenis_soal', name: 'PAS' },
      { id: 'c-38', type: 'jenis_soal', name: 'PAT' },
      { id: 'c-39', type: 'jenis_soal', name: 'PTS' },
      { id: 'c-40', type: 'jenis_soal', name: 'Ujian Sekolah' },

      { id: 'c-50', type: 'kurikulum', name: 'Kurikulum Merdeka' },
      { id: 'c-51', type: 'kurikulum', name: 'Kurikulum 2013' },
    ];
    this.saveCategories();
  }

  private async seedBankSoal() {
    const sampleItems = [
      {
        id: 'soal-1',
        judul: 'Matematika Kelas 9 — Persamaan Kuadrat & Rumus Kuadratik',
        nama_file: 'matematika_kelas_9_persamaan_kuadrat.pdf',
        mata_pelajaran: 'Matematika',
        jenjang: 'SMP' as const,
        kelas: '9',
        kurikulum: 'Kurikulum Merdeka',
        bab: 'Persamaan dan Fungsi Kuadrat',
        topik: 'Akar-Akar Persamaan Kuadrat & Diskriminan',
        subtopik: 'Metode Pemfaktoran dan Rumus ABC',
        jenis_soal: 'HOTS' as const,
        tingkat_kesulitan: 'Sulit' as const,
        tahun: 2026,
        semester: 'Ganjil' as const,
        sumber: 'Musyawarah Guru Mata Pelajaran (MGMP) Matematika',
        pembuat_pengajar: 'Budi Santoso, S.Pd.',
        deskripsi: 'Paket 15 butir soal HOTS penalaran aljabar persamaan kuadrat, pemodelan lintasan bola melambung, dan analisis titik ekstrem kurva parabola.',
        tags: ['#HOTS', '#PersamaanKuadrat', '#Kelas9', '#SMP', '#Aljabar', '#Diskriminan'],
        uploaded_by: 'u-2',
        uploaded_by_name: 'Budi Santoso, S.Pd.',
        created_at: '2026-08-10T08:30:00Z',
        updated_at: '2026-08-10T08:30:00Z',
        status: 'aktif' as const,
        download_count: 142,
        view_count: 489,
        version: 1,
        extracted_text: 'Persamaan kuadrat ax^2 + bx + c = 0 memiliki akar real berlainan jika nilai diskriminan D > 0. Tentukan himpunan penyelesaian dari 2x^2 - 7x + 3 = 0. Sebuah peluru ditembakkan vertikal dengan persamaan ketinggian h(t) = -5t^2 + 40t meter...',
        search_keywords: ['matematika', 'kelas 9', 'persamaan kuadrat', 'diskriminan', 'rumus abc', 'akar persamaan', 'hots', 'aljabar'],
        questions: [
          'Jika x1 dan x2 merupakan akar-akar dari persamaan kuadrat 2x² - 5x - 3 = 0 dengan x1 > x2, maka nilai dari 4x1 + 2x2 adalah...',
          'Persamaan kuadrat mx² + (2m - 1)x + (m - 2) = 0 mempunyai dua akar real yang berlainan. Batasan nilai m yang memenuhi adalah...',
          'Sebuah proyektil ditembakkan ke atas dengan rumus tinggi h(t) = 60t - 5t² (dalam meter dan detik). Waktu yang dibutuhkan proyektil untuk mencapai tinggi maksimum serta tinggi maksimumnya berturut-turut adalah...',
          'Jika selisih akar-akar persamaan kuadrat x² - px + 24 = 0 adalah 5, maka nilai p positif yang memenuhi persamaan tersebut adalah...',
          'Diketahui persamaan kuadrat 3x² - 12x + (2k + 1) = 0 memiliki akar kembar. Nilai k yang sesuai adalah...',
        ],
      },
      {
        id: 'soal-2',
        judul: 'Fisika SMA Kelas 11 — Gelombang Elektromagnetik & Efek Doppler',
        nama_file: 'fisika_kelas_11_gelombang_elektromagnetik.pdf',
        mata_pelajaran: 'Fisika',
        jenjang: 'SMA' as const,
        kelas: '11',
        kurikulum: 'Kurikulum Merdeka',
        bab: 'Gelombang Mekanik dan Elektromagnetik',
        topik: 'Spektrum Gelombang & Karakteristik Frekuensi',
        subtopik: 'Cahaya Tampak, Sinar X, Gelombang Radio',
        jenis_soal: 'SNBT' as const,
        tingkat_kesulitan: 'Sedang' as const,
        tahun: 2026,
        semester: 'Genap' as const,
        sumber: 'Bank Soal Olimpiade Fisika & Tryout UTBK',
        pembuat_pengajar: 'Siti Rahmawati, M.Si.',
        deskripsi: 'Paket latihan intensif persiapan SNBT Fisika mengenai spektrum gelombang elektromagnetik, energi foton Planck, dan pergeseran frekuensi Doppler.',
        tags: ['#Fisika', '#Gelombang', '#SNBT', '#Kelas11', '#SMA', '#Spektrum'],
        uploaded_by: 'u-3',
        uploaded_by_name: 'Siti Rahmawati, M.Si.',
        created_at: '2026-08-12T10:15:00Z',
        updated_at: '2026-08-12T10:15:00Z',
        status: 'aktif' as const,
        download_count: 215,
        view_count: 630,
        version: 2,
        versions: [
          {
            version_number: 1,
            file_url: '/api/bank-soal/soal-2/preview?v=1',
            storage_path: 'fisika_kelas_11_gelombang_v1.pdf',
            nama_file: 'fisika_kelas_11_gelombang_v1.pdf',
            ukuran_file: 345000,
            jumlah_halaman: 3,
            uploaded_at: '2025-08-15T09:00:00Z',
            uploaded_by_name: 'Siti Rahmawati, M.Si.',
            catatan: 'Versi awal kurikulum 2013'
          }
        ],
        extracted_text: 'Urutan spektrum gelombang elektromagnetik dari frekuensi terkecil ke terbesar: gelombang radio, gelombang mikro, inframerah, cahaya tampak, ultraviolet, sinar-X, dan sinar gamma. Energi foton dirumuskan E = hf...',
        search_keywords: ['fisika', 'kelas 11', 'gelombang elektromagnetik', 'efek doppler', 'foton', 'spektrum', 'snbt', 'sma'],
        questions: [
          'Suatu gelombang elektromagnetik memiliki panjang gelombang 600 nm merambat di ruang hampa. Frekuensi gelombang tersebut jika cepat rambat cahaya c = 3 x 10⁸ m/s adalah...',
          'Urutan gelombang elektromagnetik berikut yang memiliki energi foton dari terkecil ke terbesar adalah...',
          'Mobil pemadam kebakaran melaju dengan kecepatan 20 m/s sambil membunyikan sirene berfrekuensi 720 Hz mendekati pengamat diam. Cepat rambat bunyi di udara 340 m/s. Frekuensi sirene yang didengar adalah...',
          'Sebuah pemancar radio bekerja pada frekuensi 100 MHz. Panjang gelombang yang dipancarkan pemancar tersebut di udara adalah...',
        ],
      },
      {
        id: 'soal-3',
        judul: 'Bahasa Indonesia Kelas 10 — Teks Eksposisi dan Teks Laporan Hasil Observasi',
        nama_file: 'bahasa_indonesia_kelas_10_teks_eksposisi.pdf',
        mata_pelajaran: 'Bahasa Indonesia',
        jenjang: 'SMA' as const,
        kelas: '10',
        kurikulum: 'Kurikulum Merdeka',
        bab: 'Menyingkap Fakta Melalui Teks Hasil Observasi & Eksposisi',
        topik: 'Struktur Tesis, Argumentasi, dan Rekomendasi',
        subtopik: 'Kaidah Kebahasaan & Kalimat Definisi',
        jenis_soal: 'PAS' as const,
        tingkat_kesulitan: 'Sedang' as const,
        tahun: 2025,
        semester: 'Ganjil' as const,
        sumber: 'Naskah Penilaian Akhir Semester (PAS) Terstandar',
        pembuat_pengajar: 'Ahmad Fauzi, M.Hum.',
        deskripsi: 'Naskah soal ujian Penilaian Akhir Semester 1 materi literasi kritis, pemilahan fakta vs opini, dan konjungsi kausalitas pada teks eksposisi lingkungan hidup.',
        tags: ['#BahasaIndonesia', '#PAS', '#TeksEksposisi', '#Kelas10', '#Literasi', '#SMA'],
        uploaded_by: 'u-4',
        uploaded_by_name: 'Ahmad Fauzi, M.Hum.',
        created_at: '2025-11-20T14:00:00Z',
        updated_at: '2025-11-20T14:00:00Z',
        status: 'aktif' as const,
        download_count: 310,
        view_count: 890,
        version: 1,
        extracted_text: 'Teks eksposisi bertujuan memaparkan informasi atau pengetahuan disertai argumentasi logis. Struktur teks eksposisi terdiri dari tesis, rangkaian argumen, dan penegasan ulang...',
        search_keywords: ['bahasa indonesia', 'kelas 10', 'teks eksposisi', 'laporan hasil observasi', 'pas', 'tesis', 'argumen'],
        questions: [
          'Bagian pembuka teks eksposisi yang berisi sudut pandang penulis mengenai permasalahan yang dibahas disebut...',
          'Perhatikan kutipan teks: "Hutan bakau memiliki peranan krusial dalam mencegah abrasi di sepanjang garis pantai." Kalimat tersebut termasuk jenis...',
          'Unsur kebahasaan berupa konjungsi yang menyatakan hubungan sebab-akibat (kausalitas) tampak pada kalimat...',
          'Manakah dari kalimat berikut yang menyajikan fakta objektif dan bukan sekadar opini subjektif penulis?',
        ],
      },
      {
        id: 'soal-4',
        judul: 'Biologi SMA Kelas 12 — Struktur DNA, RNA, dan Sintesis Protein',
        nama_file: 'biologi_kelas_12_dna_sintesis_protein.pdf',
        mata_pelajaran: 'Biologi',
        jenjang: 'SMA' as const,
        kelas: '12',
        kurikulum: 'Kurikulum Merdeka',
        bab: 'Substansi Genetika & Hereditas',
        topik: 'Transkripsi, Translasi, dan Kode Genetik Kodon',
        subtopik: 'Peran mRNA, tRNA, dan Ribosom',
        jenis_soal: 'Tryout' as const,
        tingkat_kesulitan: 'Sulit' as const,
        tahun: 2026,
        semester: 'Ganjil' as const,
        sumber: 'Tryout Akbar Ujian Sekolah & UTBK Biologi',
        pembuat_pengajar: 'Siti Rahmawati, M.Si.',
        deskripsi: 'Paket komprehensif 20 butir soal diagram transkripsi translasi DNA sense-antisense, antikodon tRNA, dan pembentukan rantai polipeptida asam amino.',
        tags: ['#Biologi', '#Genetika', '#DNA', '#SintesisProtein', '#Tryout', '#Kelas12'],
        uploaded_by: 'u-3',
        uploaded_by_name: 'Siti Rahmawati, M.Si.',
        created_at: '2026-07-28T11:45:00Z',
        updated_at: '2026-07-28T11:45:00Z',
        status: 'aktif' as const,
        download_count: 180,
        view_count: 512,
        version: 1,
        extracted_text: 'Proses sintesis protein terdiri dari dua tahap utama: transkripsi pembentukan mRNA dari pita sense DNA di dalam inti sel, dan translasi penerjemahan kodon oleh tRNA pada ribosom...',
        search_keywords: ['biologi', 'kelas 12', 'dna', 'rna', 'sintesis protein', 'genetika', 'transkripsi', 'kodon'],
        questions: [
          'Rantai sense DNA memiliki urutan basa: 5\'- TAC GGC TTA CGA - 3\'. Urutan basa nitrogen pada mRNA (kodon) hasil transkripsi adalah...',
          'Perbedaan mendasar antara molekul DNA dan RNA dalam sel eukariotik meliputi hal-hal berikut, KECUALI...',
          'Kodon start yang mengawali proses translasi asam amino metionin pada ribosom adalah...',
          'Jika terjadi mutasi titik berupa substitusi basa nitrogen yang menghasilkan kodon stop prematur, peristiwa ini disebut...',
        ],
      },
      {
        id: 'soal-5',
        judul: 'Bahasa Inggris SMP Kelas 9 — Narrative Text & Report Text Comprehension',
        nama_file: 'bahasa_inggris_kelas_9_reading_comprehension.pdf',
        mata_pelajaran: 'Bahasa Inggris',
        jenjang: 'SMP' as const,
        kelas: '9',
        kurikulum: 'Kurikulum Merdeka',
        bab: 'Reading Comprehension & Critical Literacy',
        topik: 'Narrative Fables and Scientific Report Texts',
        subtopik: 'Inferential Meaning & Vocabulary in Context',
        jenis_soal: 'AKM' as const,
        tingkat_kesulitan: 'Sedang' as const,
        tahun: 2025,
        semester: 'Genap' as const,
        sumber: 'Asesmen Kompetensi Minimum (AKM) Literasi Bahasa Inggris',
        pembuat_pengajar: 'Dra. Hj. Nurhayati, M.Pd.',
        deskripsi: 'Paket model soal AKM literasi Bahasa Inggris SMP berbasis stimulus wacana autentik, moral values, dan inferensi teks saintifik flora fauna endemik Indonesia.',
        tags: ['#BahasaInggris', '#AKM', '#NarrativeText', '#ReportText', '#Kelas9', '#SMP'],
        uploaded_by: 'u-1',
        uploaded_by_name: 'Dra. Hj. Nurhayati, M.Pd.',
        created_at: '2025-10-15T09:20:00Z',
        updated_at: '2025-10-15T09:20:00Z',
        status: 'aktif' as const,
        download_count: 278,
        view_count: 740,
        version: 1,
        extracted_text: 'Read the following report text about Komodo Dragons. Komodo dragon (Varanus komodoensis) is the largest living species of lizard on Earth. They inhabit Indonesian islands...',
        search_keywords: ['bahasa inggris', 'kelas 9', 'narrative text', 'report text', 'akm', 'reading comprehension', 'smp'],
        questions: [
          'What is the primary intention of the author in presenting the descriptive report about the Komodo Dragon?',
          'Based on paragraph 2, why are Komodo Dragons classified as apex predators in their endemic ecosystem?',
          'The word "formidable" in the third line is closest in meaning to...',
          'What moral lesson can be derived from the traditional folktale "The Legend of Malin Kundang"?',
        ],
      },
      {
        id: 'soal-6',
        judul: 'Kimia SMA Kelas 10 — Tata Nama Senyawa & Hukum Dasar Stoikiometri',
        nama_file: 'kimia_kelas_10_hukum_dasar_stoikiometri.pdf',
        mata_pelajaran: 'Kimia',
        jenjang: 'SMA' as const,
        kelas: '10',
        kurikulum: 'Kurikulum Merdeka',
        bab: 'Stoikiometri dan Hukum-Hukum Kimia',
        topik: 'Hukum Lavoisier, Proust, Dalton, dan Gay-Lussac',
        subtopik: 'Perhitungan Mol dan Massa Relatif Senyawa',
        jenis_soal: 'Pilihan Ganda' as const,
        tingkat_kesulitan: 'Mudah' as const,
        tahun: 2026,
        semester: 'Ganjil' as const,
        sumber: 'MGMP Kimia Tingkat Provinsi',
        pembuat_pengajar: 'Siti Rahmawati, M.Si.',
        deskripsi: 'Paket penguasaan konsep dasar tata nama IUPAC senyawa anorganik, penyetaraan reaksi kimia sederhana, dan perhitungan konsep mol Avogadro.',
        tags: ['#Kimia', '#Stoikiometri', '#KonsepMol', '#Kelas10', '#SMA', '#Lavoisier'],
        uploaded_by: 'u-3',
        uploaded_by_name: 'Siti Rahmawati, M.Si.',
        created_at: '2026-08-01T13:10:00Z',
        updated_at: '2026-08-01T13:10:00Z',
        status: 'aktif' as const,
        download_count: 95,
        view_count: 320,
        version: 1,
        extracted_text: 'Hukum kekekalan massa Lavoisier menyatakan massa zat sebelum dan sesudah reaksi dalam ruang tertutup adalah konstan. 1 mol zat mengandung 6,02 x 10^23 partikel...',
        search_keywords: ['kimia', 'kelas 10', 'stoikiometri', 'hukum lavoisier', 'konsep mol', 'avogadro', 'sma'],
        questions: [
          'Sebanyak 5,6 gram besi (Fe, Ar=56) direaksikan dengan gas oksigen membentuk karat Fe2O3. Jumlah mol atom besi yang bereaksi adalah...',
          'Hukum yang menyatakan bahwa "perbandingan massa unsur-unsur dalam suatu senyawa adalah tertentu dan tetap" dikemukakan oleh...',
          'Rumus kimia yang tepat untuk senyawa Besi(III) Sulfat adalah...',
          'Pada kondisi STP (0°C, 1 atm), volume dari 0,5 mol gas nitrogen (N2) adalah...',
        ],
      },
      {
        id: 'soal-7',
        judul: 'Informatika SMP Kelas 8 — Berpikir Komputasional & Logika Algoritma',
        nama_file: 'informatika_kelas_8_berpikir_komputasional.pdf',
        mata_pelajaran: 'Informatika',
        jenjang: 'SMP' as const,
        kelas: '8',
        kurikulum: 'Kurikulum Merdeka',
        bab: 'Berpikir Komputasional (Computational Thinking)',
        topik: 'Dekomposisi, Pengenalan Pola, dan Abstraksi',
        subtopik: 'Representasi Data Binary & Pohon Keputusan',
        jenis_soal: 'HOTS' as const,
        tingkat_kesulitan: 'Sedang' as const,
        tahun: 2026,
        semester: 'Ganjil' as const,
        sumber: 'Tantangan Bebras Indonesia & Olimpiade Informatika SMP',
        pembuat_pengajar: 'Budi Santoso, S.Pd.',
        deskripsi: 'Paket latihan soal logika pemecahan masalah (Bebras Task) melatih 4 pilar computational thinking dengan studi kasus antrean paket data dan rute terpendek graf.',
        tags: ['#Informatika', '#BerpikirKomputasional', '#Algoritma', '#Kelas8', '#SMP', '#Bebras'],
        uploaded_by: 'u-2',
        uploaded_by_name: 'Budi Santoso, S.Pd.',
        created_at: '2026-08-05T15:30:00Z',
        updated_at: '2026-08-05T15:30:00Z',
        status: 'aktif' as const,
        download_count: 165,
        view_count: 420,
        version: 1,
        extracted_text: 'Berpikir komputasional mencakup dekomposisi memecah masalah besar, pengenalan pola mengidentifikasi kesamaan, abstraksi menyaring detail penting, dan algoritma menyusun langkah terstruktur...',
        search_keywords: ['informatika', 'kelas 8', 'berpikir komputasional', 'algoritma', 'bebras', 'smp'],
        questions: [
          'Metode pemecahan masalah dengan cara membagi masalah kompleks menjadi bagian-bagian kecil yang lebih mudah dikelola disebut...',
          'Diberikan bilangan desimal 45. Konversi bilangan tersebut ke dalam sistem bilangan biner adalah...',
          'Struktur data antrean yang menerapkan prinsip First In First Out (FIFO) sering disebut dengan istilah...',
          'Sebuah robot bergerak maju 2 langkah, belok kanan 90 derajat, lalu maju 3 langkah. Algoritma perulangan untuk membentuk lintasan persegi empat membutuhkan penyesuaian pada...',
        ],
      },
    ];

    for (const item of sampleItems) {
      const storageFile = `${item.id}_${item.nama_file}`;
      const fullPath = path.join(STORAGE_DIR, storageFile);

      try {
        const pageCount = await createSamplePdf(
          fullPath,
          item.judul,
          item.mata_pelajaran,
          `Kelas ${item.kelas}`,
          item.jenjang,
          item.questions
        );

        const stats = fs.statSync(fullPath);
        const fileHash = crypto.createHash('sha256').update(fs.readFileSync(fullPath)).digest('hex');

        this.bankSoal.push({
          id: item.id,
          judul: item.judul,
          nama_file: item.nama_file,
          file_id: item.id,
          folder_id: 'root',
          file_url: `/api/bank-soal/${item.id}/preview`,
          web_view_url: `/api/bank-soal/${item.id}/preview`,
          download_url: `/api/bank-soal/${item.id}/download`,
          storage_path: storageFile,
          file_hash: fileHash,
          sync_status: 'SYNCED',
          mata_pelajaran: item.mata_pelajaran,
          jenjang: item.jenjang,
          kelas: item.kelas,
          kurikulum: item.kurikulum,
          bab: item.bab,
          topik: item.topik,
          subtopik: item.subtopik,
          jenis_soal: item.jenis_soal,
          tingkat_kesulitan: item.tingkat_kesulitan,
          tahun: item.tahun,
          semester: item.semester,
          sumber: item.sumber,
          pembuat_pengajar: item.pembuat_pengajar,
          deskripsi: item.deskripsi,
          tags: item.tags,
          jumlah_halaman: pageCount,
          ukuran_file: stats.size,
          uploaded_by: item.uploaded_by,
          uploaded_by_name: item.uploaded_by_name,
          created_at: item.created_at,
          updated_at: item.updated_at,
          status: item.status,
          download_count: item.download_count,
          view_count: item.view_count,
          version: item.version,
          versions: item.versions || [],
          extracted_text: item.extracted_text,
          search_keywords: item.search_keywords,
        });
      } catch (err) {
        console.error(`Failed to generate seed pdf for ${item.judul}:`, err);
      }
    }

    this.saveBankSoal();
    this.logAudit({
      user_id: 'u-1',
      user_name: 'Dra. Hj. Nurhayati, M.Pd.',
      user_role: 'ADMIN',
      action: 'UPLOAD',
      details: 'Inisialisasi database master Bank Soal Terpadu',
    });
  }

  // --- Bank Soal Methods ---
  public getBankSoalList(params: any, currentUserId?: string): { items: BankSoal[]; total: number; page: number; totalPages: number } {
    let list = [...this.bankSoal];

    // Favorited filter
    if (params.is_favorite === true || params.is_favorite === 'true') {
      if (currentUserId && this.favorites[currentUserId]) {
        const favSet = new Set(this.favorites[currentUserId]);
        list = list.filter((item) => favSet.has(item.id));
      } else {
        list = [];
      }
    }

    // Search query multi-field search
    if (params.search && params.search.trim()) {
      const searchTerms = params.search.toLowerCase().trim().split(/\s+/);
      list = list.filter((item) => {
        const searchableContent = [
          item.judul,
          item.nama_file,
          item.mata_pelajaran,
          item.jenjang,
          `kelas ${item.kelas}`,
          item.kelas,
          item.kurikulum,
          item.bab,
          item.topik,
          item.subtopik || '',
          item.jenis_soal,
          item.tingkat_kesulitan,
          String(item.tahun),
          item.semester,
          item.sumber || '',
          item.pembuat_pengajar || '',
          item.uploaded_by_name,
          item.deskripsi || '',
          ...(item.tags || []),
          ...(item.search_keywords || []),
          item.extracted_text || '',
        ]
          .join(' ')
          .toLowerCase();

        return searchTerms.every((term: string) => searchableContent.includes(term));
      });
    }

    // Field filters
    if (params.mata_pelajaran && params.mata_pelajaran !== 'Semua') {
      list = list.filter((i) => i.mata_pelajaran.toLowerCase() === params.mata_pelajaran.toLowerCase());
    }
    if (params.jenjang && params.jenjang !== 'Semua') {
      list = list.filter((i) => i.jenjang.toLowerCase() === params.jenjang.toLowerCase());
    }
    if (params.kelas && params.kelas !== 'Semua') {
      list = list.filter((i) => i.kelas === params.kelas);
    }
    if (params.tahun && params.tahun !== 'Semua') {
      list = list.filter((i) => String(i.tahun) === String(params.tahun));
    }
    if (params.semester && params.semester !== 'Semua') {
      list = list.filter((i) => i.semester.toLowerCase() === params.semester.toLowerCase());
    }
    if (params.tingkat_kesulitan && params.tingkat_kesulitan !== 'Semua') {
      list = list.filter((i) => i.tingkat_kesulitan.toLowerCase() === params.tingkat_kesulitan.toLowerCase());
    }
    if (params.jenis_soal && params.jenis_soal !== 'Semua') {
      list = list.filter((i) => i.jenis_soal.toLowerCase() === params.jenis_soal.toLowerCase());
    }
    if (params.kurikulum && params.kurikulum !== 'Semua') {
      list = list.filter((i) => i.kurikulum.toLowerCase() === params.kurikulum.toLowerCase());
    }
    if (params.uploaded_by && params.uploaded_by !== 'Semua') {
      list = list.filter((i) => i.uploaded_by === params.uploaded_by);
    }
    if (params.tag && params.tag !== 'Semua') {
      const targetTag = params.tag.startsWith('#') ? params.tag : `#${params.tag}`;
      list = list.filter((i) => i.tags.some((t) => t.toLowerCase() === targetTag.toLowerCase()));
    }

    // Sorting
    const sortBy = params.sortBy || 'terbaru';
    list.sort((a, b) => {
      if (sortBy === 'terbaru') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'terlama') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'a-z') return a.judul.localeCompare(b.judul);
      if (sortBy === 'z-a') return b.judul.localeCompare(a.judul);
      if (sortBy === 'view_count') return b.view_count - a.view_count;
      if (sortBy === 'download_count') return b.download_count - a.download_count;
      return 0;
    });

    // Populate user-specific is_favorite
    const userFavs = currentUserId && this.favorites[currentUserId] ? new Set(this.favorites[currentUserId]) : new Set();
    const formattedList = list.map((item) => ({
      ...item,
      is_favorite: userFavs.has(item.id),
    }));

    const total = formattedList.length;
    const page = Math.max(1, parseInt(params.page || '1', 10));
    const limit = Math.max(1, parseInt(params.limit || '12', 10));
    const startIndex = (page - 1) * limit;
    const items = formattedList.slice(startIndex, startIndex + limit);
    const totalPages = Math.ceil(total / limit) || 1;

    return { items, total, page, totalPages };
  }

  public getBankSoalById(id: string, currentUserId?: string): BankSoal | null {
    const item = this.bankSoal.find((s) => s.id === id);
    if (!item) return null;
    const userFavs = currentUserId && this.favorites[currentUserId] ? new Set(this.favorites[currentUserId]) : new Set();
    return {
      ...item,
      is_favorite: userFavs.has(item.id),
    };
  }

  public checkDuplicates(hash?: string, title?: string, filename?: string): { isDuplicate: boolean; matchType?: 'hash' | 'title' | 'filename'; existingItem?: BankSoal } {
    if (hash) {
      const match = this.bankSoal.find((i) => i.file_hash === hash);
      if (match) return { isDuplicate: true, matchType: 'hash', existingItem: match };
    }
    if (title) {
      const cleanT = title.trim().toLowerCase();
      const match = this.bankSoal.find((i) => i.judul.trim().toLowerCase() === cleanT);
      if (match) return { isDuplicate: true, matchType: 'title', existingItem: match };
    }
    if (filename) {
      const cleanF = filename.trim().toLowerCase();
      const match = this.bankSoal.find((i) => i.nama_file.trim().toLowerCase() === cleanF);
      if (match) return { isDuplicate: true, matchType: 'filename', existingItem: match };
    }
    return { isDuplicate: false };
  }

  public createBankSoal(data: Omit<BankSoal, 'id' | 'created_at' | 'updated_at' | 'download_count' | 'view_count' | 'version'>, user: User): BankSoal {
    const id = `soal-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const newItem: BankSoal = {
      ...data,
      id,
      uploaded_by: user.id,
      uploaded_by_name: user.name,
      created_at: now,
      updated_at: now,
      download_count: 0,
      view_count: 0,
      version: 1,
      versions: [],
      status: 'aktif',
    };

    this.bankSoal.unshift(newItem);
    this.saveBankSoal();

    this.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action: 'UPLOAD',
      bank_soal_id: id,
      soal_judul: newItem.judul,
      details: `Upload bank soal baru: ${newItem.judul} (${newItem.mata_pelajaran} Kelas ${newItem.kelas})`,
    });

    this.addHistory(user.id, id, 'UPLOAD');

    return newItem;
  }

  public updateBankSoal(id: string, updates: Partial<BankSoal>, user: User): BankSoal | null {
    const index = this.bankSoal.findIndex((s) => s.id === id);
    if (index === -1) return null;

    const existing = this.bankSoal[index];
    // Check permissions
    if (user.role !== 'ADMIN' && existing.uploaded_by !== user.id) {
      throw new Error('Anda tidak memiliki hak akses untuk mengedit bank soal ini.');
    }

    const updated: BankSoal = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.bankSoal[index] = updated;
    this.saveBankSoal();

    this.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action: 'EDIT',
      bank_soal_id: id,
      soal_judul: updated.judul,
      details: `Update metadata bank soal: ${updated.judul}`,
    });

    this.addHistory(user.id, id, 'EDIT');

    return updated;
  }

  public addVersion(
    id: string,
    versionData: {
      storage_path: string;
      nama_file: string;
      ukuran_file: number;
      jumlah_halaman: number;
      catatan?: string;
      file_hash?: string;
    },
    user: User
  ): BankSoal | null {
    const item = this.bankSoal.find((s) => s.id === id);
    if (!item) return null;

    const currentVersionNum = item.version || 1;
    const oldVersionSnapshot = {
      version_number: currentVersionNum,
      file_url: item.file_url,
      storage_path: item.storage_path,
      nama_file: item.nama_file,
      ukuran_file: item.ukuran_file,
      jumlah_halaman: item.jumlah_halaman,
      uploaded_at: item.updated_at || item.created_at,
      uploaded_by_name: item.uploaded_by_name,
      catatan: `Versi ${currentVersionNum}`,
    };

    const newVersionNum = currentVersionNum + 1;
    item.versions = [...(item.versions || []), oldVersionSnapshot];
    item.version = newVersionNum;
    item.storage_path = versionData.storage_path;
    item.nama_file = versionData.nama_file;
    item.ukuran_file = versionData.ukuran_file;
    item.jumlah_halaman = versionData.jumlah_halaman;
    if (versionData.file_hash) item.file_hash = versionData.file_hash;
    item.updated_at = new Date().toISOString();

    this.saveBankSoal();

    this.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action: 'VERSION_UPDATE',
      bank_soal_id: id,
      soal_judul: item.judul,
      details: `Memperbarui dokumen ke Versi ${newVersionNum}: ${versionData.catatan || ''}`,
    });

    return item;
  }

  public deleteBankSoal(id: string, user: User): boolean {
    const index = this.bankSoal.findIndex((s) => s.id === id);
    if (index === -1) return false;

    const item = this.bankSoal[index];
    if (user.role !== 'ADMIN' && item.uploaded_by !== user.id) {
      throw new Error('Hanya pemilik soal atau Admin yang dapat menghapus bank soal ini.');
    }

    // Try deleting physical file
    try {
      const fullPath = path.join(STORAGE_DIR, item.storage_path);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (e) {
      console.warn('Could not delete physical file:', e);
    }

    this.bankSoal.splice(index, 1);
    this.saveBankSoal();

    this.logAudit({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action: 'DELETE',
      bank_soal_id: id,
      soal_judul: item.judul,
      details: `Menghapus bank soal: ${item.judul}`,
    });

    return true;
  }

  public incrementView(id: string, user?: User) {
    const item = this.bankSoal.find((s) => s.id === id);
    if (item) {
      item.view_count = (item.view_count || 0) + 1;
      this.saveBankSoal();
      if (user) {
        this.addHistory(user.id, id, 'VIEW');
        this.logAudit({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          action: 'VIEW',
          bank_soal_id: id,
          soal_judul: item.judul,
        });
      }
    }
  }

  public incrementDownload(id: string, user?: User): { filePath: string; filename: string } | null {
    const item = this.bankSoal.find((s) => s.id === id);
    if (!item) return null;

    item.download_count = (item.download_count || 0) + 1;
    this.saveBankSoal();

    if (user) {
      this.addHistory(user.id, id, 'DOWNLOAD');
      this.logAudit({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        action: 'DOWNLOAD',
        bank_soal_id: id,
        soal_judul: item.judul,
        details: `Download file ${item.nama_file}`,
      });
    }

    const filePath = path.join(STORAGE_DIR, item.storage_path);
    return { filePath, filename: item.nama_file };
  }

  public toggleFavorite(userId: string, soalId: string): boolean {
    if (!this.favorites[userId]) {
      this.favorites[userId] = [];
    }
    const set = new Set(this.favorites[userId]);
    const isFav = set.has(soalId);

    if (isFav) {
      set.delete(soalId);
      this.favorites[userId] = Array.from(set);
      this.saveFavorites();
      this.addHistory(userId, soalId, 'UNFAVORITE');
      return false;
    } else {
      set.add(soalId);
      this.favorites[userId] = Array.from(set);
      this.saveFavorites();
      this.addHistory(userId, soalId, 'FAVORITE');
      return true;
    }
  }

  // --- Stats, Categories, Users, Logs ---
  public getStats(): StatsOverview {
    const totalSoal = this.bankSoal.length;
    const totalPdf = totalSoal;
    const totalStorageBytes = this.bankSoal.reduce((acc, curr) => acc + (curr.ukuran_file || 0), 0);
    
    const now = new Date();
    const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const soalBulanIni = this.bankSoal.filter((s) => (s.created_at || '').startsWith(thisMonthStr)).length;
    
    // Count favorites across all users
    let totalFavCount = 0;
    Object.values(this.favorites).forEach((arr) => {
      totalFavCount += arr.length;
    });

    const mapelCountMap: Record<string, number> = {};
    const tahunCountMap: Record<string, number> = {};
    const kesulitanCountMap: Record<string, number> = {};
    const jenjangCountMap: Record<string, number> = {};
    const kelasSet = new Set<string>();

    let totalDownload = 0;
    let totalViews = 0;

    for (const item of this.bankSoal) {
      mapelCountMap[item.mata_pelajaran] = (mapelCountMap[item.mata_pelajaran] || 0) + 1;
      tahunCountMap[String(item.tahun)] = (tahunCountMap[String(item.tahun)] || 0) + 1;
      kesulitanCountMap[item.tingkat_kesulitan] = (kesulitanCountMap[item.tingkat_kesulitan] || 0) + 1;
      jenjangCountMap[item.jenjang] = (jenjangCountMap[item.jenjang] || 0) + 1;
      if (item.kelas) kelasSet.add(item.kelas);
      totalDownload += item.download_count || 0;
      totalViews += item.view_count || 0;
    }

    const by_mapel = Object.entries(mapelCountMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    const by_tahun = Object.entries(tahunCountMap).map(([year, count]) => ({ year, count })).sort((a, b) => b.year.localeCompare(a.year));
    const by_kesulitan = Object.entries(kesulitanCountMap).map(([level, count]) => ({ level, count }));
    const by_jenjang = Object.entries(jenjangCountMap).map(([name, count]) => ({ name, count }));

    const top_downloaded = [...this.bankSoal].sort((a, b) => (b.download_count || 0) - (a.download_count || 0)).slice(0, 5);
    const recent_uploads = [...this.bankSoal].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

    const storage_growth = [
      { month: 'Mei', bytes: totalStorageBytes * 0.45, count: Math.floor(totalSoal * 0.4) },
      { month: 'Jun', bytes: totalStorageBytes * 0.65, count: Math.floor(totalSoal * 0.6) },
      { month: 'Jul', bytes: totalStorageBytes * 0.85, count: Math.floor(totalSoal * 0.8) },
      { month: 'Agu', bytes: totalStorageBytes, count: totalSoal },
    ];

    return {
      total_soal: totalSoal,
      total_pdf: totalPdf,
      total_storage_bytes: totalStorageBytes,
      soal_bulan_ini: soalBulanIni || Math.min(totalSoal, 6),
      soal_favorit: totalFavCount,
      total_mata_pelajaran: Object.keys(mapelCountMap).length,
      total_kelas: kelasSet.size || 12,
      total_download: totalDownload,
      total_views: totalViews,
      total_pengajar: this.users.length,
      by_mapel,
      by_tahun,
      by_kesulitan,
      by_jenjang,
      top_downloaded,
      recent_uploads,
      storage_growth,
    };
  }

  public getUsers(): User[] {
    return this.users;
  }

  public getUserById(id: string): User | null {
    return this.users.find((u) => u.id === id) || null;
  }

  public getCategories(): CategoryItem[] {
    return this.categories;
  }

  public addCategory(cat: Omit<CategoryItem, 'id'>): CategoryItem {
    const newItem = {
      ...cat,
      id: `c-${Date.now()}`,
    };
    this.categories.push(newItem);
    this.saveCategories();
    return newItem;
  }

  public updateCategory(id: string, updates: Partial<CategoryItem>): CategoryItem | null {
    const idx = this.categories.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.categories[idx] = {
      ...this.categories[idx],
      ...updates,
    };
    this.saveCategories();
    return this.categories[idx];
  }

  public deleteCategory(id: string): boolean {
    const idx = this.categories.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.categories.splice(idx, 1);
    this.saveCategories();
    return true;
  }

  public getAllTags(): { tag: string; count: number }[] {
    const tagCount: Record<string, number> = {};
    for (const s of this.bankSoal) {
      if (Array.isArray(s.tags)) {
        for (const t of s.tags) {
          tagCount[t] = (tagCount[t] || 0) + 1;
        }
      }
    }
    return Object.entries(tagCount)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }

  public getAuditLogs(limit = 100): AuditLog[] {
    return this.auditLogs.slice(0, limit);
  }

  public getUserHistory(userId: string, limit = 50) {
    const userActions = this.history.filter((h) => h.user_id === userId).slice(0, limit);
    return userActions.map((h) => {
      const soal = this.bankSoal.find((s) => s.id === h.soal_id);
      return {
        id: h.id,
        soal_id: h.soal_id,
        soal: soal || null,
        action: h.action,
        timestamp: h.timestamp,
      };
    }).filter(item => item.soal !== null);
  }

  private logAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
    const log: AuditLog = {
      ...entry,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    this.saveAuditLogs();
  }

  private addHistory(userId: string, soalId: string, action: string) {
    this.history.unshift({
      id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: userId,
      soal_id: soalId,
      action,
      timestamp: new Date().toISOString(),
    });
    this.saveHistory();
  }
}
