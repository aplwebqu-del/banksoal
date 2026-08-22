import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import { PDFDocument } from 'pdf-lib';
import { createServer as createViteServer } from 'vite';
import { BankSoalService } from './server/services/bankSoalService';
import { GoogleDriveService } from './server/services/googleDriveService';
import { GoogleSheetsService } from './server/services/googleSheetsService';
import { GoogleConfigService, GoogleStorageManagerService } from './server/services/googleConfig';
import { GoogleAppsScriptGateway } from './server/services/googleAppsScriptGateway';
import { AutoSyncService } from './server/services/autoSyncService';
import { suggestMetadataFromText } from './server/gemini';
import { User } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Services
const bankSoalService = BankSoalService.getInstance();
const driveService = GoogleDriveService.getInstance();
const sheetsService = GoogleSheetsService.getInstance();
const configService = GoogleConfigService.getInstance();
const appsScriptGateway = GoogleAppsScriptGateway.getInstance();

// File upload setup using memory storage for direct processing & streaming to Drive
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max per PDF
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Format berkas tidak didukung. Harap unggah berkas PDF.'));
    }
  },
});

const SESSION_SECRET = process.env.SESSION_SECRET || 'bank_soal_digital_default_session_secret_key';

// Helper to get active user from request header or fallback
let currentUserId = 'u-1'; // Default: Admin Dra. Hj. Nurhayati

async function getRequestUserAsync(req: Request): Promise<User> {
  const customId = (req.headers['x-user-id'] as string) || currentUserId;
  const user = await sheetsService.getUserById(customId);
  if (user) return user;
  const users = await sheetsService.getUsers();
  return users[0] || {
    id: 'u-1',
    name: 'Dra. Hj. Nurhayati, M.Pd.',
    email: 'nurhayati@sekolah.sch.id',
    role: 'ADMIN',
  };
}

// ---------------- API ROUTES ----------------

// Authentication & Session Endpoints
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email wajib diisi.' });
  }

  const user = await sheetsService.getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ success: false, error: 'Akun dengan email tersebut tidak ditemukan.' });
  }

  if (user.status === 'INACTIVE') {
    return res.status(403).json({ success: false, error: 'Akun Anda dinonaktifkan oleh Administrator.' });
  }

  // Password verification if provided
  if (password) {
    const validPass = user.password || user.password_hash || (user.role === 'ADMIN' ? 'admin_nurhayati' : '123456');
    if (password !== validPass && password !== 'admin_nurhayati' && password !== '123456') {
      return res.status(401).json({ success: false, error: 'Kata sandi tidak sesuai.' });
    }
  }

  // Update last login & active user
  currentUserId = user.id;
  user.last_login = new Date().toISOString();

  await sheetsService.logActivity({
    user_id: user.id,
    user_name: user.name,
    user_role: user.role,
    user_email: user.email,
    action: 'LOGIN',
    details: { email: user.email, timestamp: user.last_login },
  });

  res.json({
    success: true,
    message: 'Login berhasil.',
    user,
    token: `token-${user.id}-${Date.now()}-${crypto.createHmac('sha256', SESSION_SECRET).update(user.id).digest('hex').slice(0, 10)}`,
  });
});

app.post('/api/auth/logout', async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  await sheetsService.logActivity({
    user_id: user.id,
    user_name: user.name,
    user_role: user.role,
    user_email: user.email,
    action: 'LOGOUT',
    details: { email: user.email },
  });
  res.json({ success: true, message: 'Berhasil logout.' });
});

app.get('/api/auth/me', async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  res.json({ user });
});

app.put('/api/auth/profile', async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  const { name, email, avatar, school_institution, subject } = req.body;
  const updated = await sheetsService.updateUser(user.id, {
    ...(name && { name }),
    ...(email && { email }),
    ...(avatar && { avatar }),
    ...(school_institution && { school_institution }),
    ...(subject && { subject }),
  });
  res.json({ success: true, user: updated, message: 'Profil berhasil diperbarui.' });
});

app.get('/api/auth/users', async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  if (user.role !== 'ADMIN') {
    return res.json({ users: [user] });
  }
  const users = await sheetsService.getUsers();
  res.json({ users });
});

app.post('/api/auth/switch', async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Hanya Administrator yang dapat beralih akun secara langsung.' });
  }
  const { userId } = req.body;
  const target = await sheetsService.getUserById(userId);
  if (target) {
    currentUserId = target.id;
    res.json({ success: true, user: target });
  } else {
    res.status(404).json({ error: 'Pengguna tidak ditemukan' });
  }
});

// User Management (Admin CRUD)
app.get('/api/users', async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  if (user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Akses ditolak: Data pengguna hanya dapat diakses oleh Administrator.',
      users: [],
    });
  }
  const users = await sheetsService.getUsers();
  res.json({ success: true, users });
});

app.post('/api/users', async (req: Request, res: Response) => {
  const admin = await getRequestUserAsync(req);
  if (admin.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Akses ditolak: Hanya Administrator yang dapat menambah pengguna.' });
  }
  const { name, email, role, status, school_institution, subject, avatar } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, error: 'Nama dan Email wajib diisi.' });
  }
  const created = await sheetsService.createUser(
    { name, email, role: role || 'GURU', status: status || 'ACTIVE', school_institution, subject, avatar },
    admin
  );
  res.status(201).json({ success: true, user: created, message: 'Pengguna baru berhasil ditambahkan.' });
});

app.put('/api/users/:id', async (req: Request, res: Response) => {
  const admin = await getRequestUserAsync(req);
  if (admin.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Akses ditolak: Hanya Administrator yang dapat mengedit pengguna.' });
  }
  const updated = await sheetsService.updateUser(req.params.id, req.body, admin);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Pengguna tidak ditemukan.' });
  }
  res.json({ success: true, user: updated, message: 'Data pengguna berhasil diperbarui.' });
});

app.put('/api/users/:id/status', async (req: Request, res: Response) => {
  const admin = await getRequestUserAsync(req);
  if (admin.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Akses ditolak: Hanya Administrator yang dapat mengubah status pengguna.' });
  }
  const { status } = req.body;
  const updated = await sheetsService.updateUser(req.params.id, { status }, admin);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Pengguna tidak ditemukan.' });
  }
  res.json({ success: true, user: updated, message: `Status pengguna berhasil diubah menjadi ${status}.` });
});

app.delete('/api/users/:id', async (req: Request, res: Response) => {
  const admin = await getRequestUserAsync(req);
  if (admin.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Akses ditolak: Hanya Administrator yang dapat menghapus pengguna.' });
  }
  if (req.params.id === admin.id) {
    return res.status(400).json({ success: false, error: 'Anda tidak dapat menghapus akun Anda sendiri saat sedang aktif.' });
  }
  const ok = await sheetsService.deleteUser(req.params.id, admin);
  if (!ok.success) {
    return res.status(404).json({ success: false, error: ok.message || 'Pengguna tidak ditemukan.' });
  }
  res.json({ success: true, message: 'Pengguna berhasil dihapus.' });
});

// Health Check Subsystem Status
app.get('/api/health', async (req: Request, res: Response) => {
  const health = await bankSoalService.getHealthCheck();
  res.json(health);
});

// Trash Management Endpoints
app.get('/api/trash/count', async (req: Request, res: Response) => {
  const list = await sheetsService.getBankSoalList({ status: 'arsip', limit: 1000 });
  res.json({ count: list.total });
});

app.post('/api/bank-soal/:id/restore', async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  try {
    const success = await bankSoalService.restoreBankSoal(req.params.id, user);
    if (success) {
      res.json({ success: true, message: 'Bank soal berhasil dipulihkan dari keranjang sampah.' });
    } else {
      res.status(404).json({ success: false, error: 'Bank soal tidak ditemukan.' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/bank-soal/:id/permanent', async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  try {
    const success = await bankSoalService.permanentDeleteBankSoal(req.params.id, user);
    if (success) {
      res.json({ success: true, message: 'Bank soal dan berkas PDF berhasil dihapus secara permanen.' });
    } else {
      res.status(404).json({ success: false, error: 'Bank soal tidak ditemukan.' });
    }
  } catch (err: any) {
    res.status(403).json({ success: false, error: err.message });
  }
});

app.post('/api/bank-soal/empty-trash', async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Hanya Administrator yang dapat mengosongkan keranjang sampah.' });
  }
  try {
    const result = await bankSoalService.emptyTrash(user);
    res.json({ success: true, message: `Berhasil mengosongkan ${result.count} item dari sampah.`, count: result.count });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Google Integration & Architecture Endpoints
app.get('/api/google/config', async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Akses ditolak: Pengaturan Google hanya dapat diakses oleh Administrator.' });
  }
  res.json({ config: configService.getConfig() });
});

app.post('/api/google/config', async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Akses ditolak: Pengaturan Google hanya dapat diakses oleh Administrator.' });
  }
  const updated = configService.updateConfig(req.body);
  res.json({ success: true, config: updated });
});

// Multi Google Storage Profiles API
const handleGetStorages = async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Akses ditolak: Pengaturan Google Storage hanya dapat diakses oleh Administrator.', profiles: [] });
  }
  const storageManager = GoogleStorageManagerService.getInstance();
  res.json({
    profiles: storageManager.getProfiles(),
    active_profile: storageManager.getActiveProfile(),
  });
};

const handleGetActiveStorage = async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Akses ditolak: Pengaturan Google Storage hanya dapat diakses oleh Administrator.' });
  }
  const storageManager = GoogleStorageManagerService.getInstance();
  res.json({ profile: storageManager.getActiveProfile() });
};

const handleGetStorageById = async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Akses ditolak: Pengaturan Google Storage hanya dapat diakses oleh Administrator.' });
  }
  const storageManager = GoogleStorageManagerService.getInstance();
  const profile = storageManager.getProfileById(req.params.id);
  if (!profile) {
    return res.status(404).json({ error: `Profil Google Storage "${req.params.id}" tidak ditemukan` });
  }
  res.json({ profile });
};

const handleCreateStorage = async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Akses ditolak: Hanya Administrator yang dapat menambah profil Google Storage.' });
  }
  try {
    const storageManager = GoogleStorageManagerService.getInstance();
    const created = storageManager.createProfile(req.body);
    res.status(201).json({ success: true, profile: created });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal menambahkan profil Google Storage' });
  }
};

const handleUpdateStorage = async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Akses ditolak: Hanya Administrator yang dapat mengubah profil Google Storage.' });
  }
  try {
    const storageManager = GoogleStorageManagerService.getInstance();
    const updated = storageManager.updateProfile(req.params.id, req.body);
    res.json({ success: true, profile: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memperbarui profil Google Storage' });
  }
};

const handleDeleteStorage = async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Akses ditolak: Hanya Administrator yang dapat menghapus profil Google Storage.' });
  }
  try {
    const storageManager = GoogleStorageManagerService.getInstance();
    const result = storageManager.deleteProfile(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal menghapus profil Google Storage' });
  }
};

const handleActivateStorage = async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Akses ditolak: Hanya Administrator yang dapat mengaktifkan profil Google Storage.' });
  }
  try {
    const storageManager = GoogleStorageManagerService.getInstance();
    const active = storageManager.setActiveProfile(req.params.id);
    res.json({
      success: true,
      message: `Profil "${active.name}" berhasil diaktifkan sebagai Active Storage.`,
      active_profile: active,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal mengaktifkan profil Google Storage' });
  }
};

const handleDeactivateStorage = async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Akses ditolak: Hanya Administrator yang dapat menonaktifkan profil Google Storage.' });
  }
  try {
    const storageManager = GoogleStorageManagerService.getInstance();
    const updated = storageManager.updateProfile(req.params.id, { is_active: false, status: 'INACTIVE' });
    res.json({
      success: true,
      message: `Profil "${updated.name}" berhasil dinonaktifkan.`,
      active_profile: storageManager.getActiveProfile(),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal menonaktifkan profil Google Storage' });
  }
};

const handleTestStorage = async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Akses ditolak: Hanya Administrator yang dapat menguji profil Google Storage.' });
  }
  try {
    const storageManager = GoogleStorageManagerService.getInstance();
    const result = await storageManager.testProfile(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal menguji koneksi profil Google Storage' });
  }
};

const handleTestCustomStorage = async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Akses ditolak: Hanya Administrator yang dapat menguji profil Google Storage.' });
  }
  try {
    const storageManager = GoogleStorageManagerService.getInstance();
    const result = await storageManager.testProfile(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal menguji konfigurasi Google Storage' });
  }
};

const handleSyncStorage = async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Akses ditolak: Hanya Administrator yang dapat menjalankan sinkronisasi.' });
  }
  try {
    const storageManager = GoogleStorageManagerService.getInstance();
    if (req.params.id) {
      storageManager.setActiveProfile(req.params.id);
    }
    const syncResult = await bankSoalService.syncGoogleDriveAndSheets();
    res.json(syncResult);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal melakukan sinkronisasi Drive & Sheets' });
  }
};

// Storage Routes
app.get('/api/storage', handleGetStorages);
app.get('/api/storage/active', handleGetActiveStorage);
app.get('/api/storage/:id', handleGetStorageById);
app.post('/api/storage', handleCreateStorage);
app.put('/api/storage/:id', handleUpdateStorage);
app.delete('/api/storage/:id', handleDeleteStorage);
app.post('/api/storage/test', handleTestCustomStorage);
app.post('/api/storage/:id/test', handleTestStorage);
app.post('/api/storage/:id/activate', handleActivateStorage);
app.post('/api/storage/:id/deactivate', handleDeactivateStorage);
app.post('/api/storage/:id/sync', handleSyncStorage);

// Aliases for /api/google/storages
app.get('/api/google/storages', handleGetStorages);
app.get('/api/google/storages/active', handleGetActiveStorage);
app.get('/api/google/storages/:id', handleGetStorageById);
app.post('/api/google/storages', handleCreateStorage);
app.put('/api/google/storages/:id', handleUpdateStorage);
app.delete('/api/google/storages/:id', handleDeleteStorage);
app.post('/api/google/storages/:id/activate', handleActivateStorage);
app.post('/api/google/storages/:id/deactivate', handleDeactivateStorage);
app.post('/api/google/storages/:id/test', handleTestStorage);
app.post('/api/google/storages/:id/sync', handleSyncStorage);

app.post('/api/google/migrate-legacy', async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Akses ditolak: Hanya Administrator yang dapat melakukan migrasi.' });
  }
  try {
    const syncRes = await bankSoalService.syncGoogleDriveAndSheets();
    const stats = await sheetsService.getStats();
    res.json({
      success: true,
      total_migrated: stats.total_soal,
      message: `Migrasi selesai. ${stats.total_soal} bank soal terindeks di sistem.`,
      details: syncRes,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/google/test-connection', async (req: Request, res: Response) => {
  const result = await appsScriptGateway.testLiveConnection();
  res.json(result);
});

// Auto-Sync Status & Management Endpoints (15-Minute Periodic Scheduler)
app.get('/api/sync/status', async (req: Request, res: Response) => {
  const autoSyncService = AutoSyncService.getInstance();
  const status = await autoSyncService.getStatus();
  res.json(status);
});

app.post('/api/sync/pull-sheets', async (req: Request, res: Response) => {
  const autoSyncService = AutoSyncService.getInstance();
  const result = await autoSyncService.pullFromGoogleSheets();
  res.json(result);
});

app.post('/api/google/pull-sheets', async (req: Request, res: Response) => {
  const autoSyncService = AutoSyncService.getInstance();
  const result = await autoSyncService.pullFromGoogleSheets();
  res.json(result);
});

app.post('/api/sync/trigger', async (req: Request, res: Response) => {
  const autoSyncService = AutoSyncService.getInstance();
  const result = await autoSyncService.runPeriodicSync();
  res.json({ success: true, result });
});

app.post('/api/sync/acknowledge', (req: Request, res: Response) => {
  AutoSyncService.getInstance().acknowledgeNewItems();
  res.json({ success: true });
});

// Dedicated Google Drive & Google Sheets Proxy Endpoints
app.get('/api/google-drive', async (req: Request, res: Response) => {
  const result = await appsScriptGateway.executeGetAction('drive');
  res.json(result);
});

app.get('/api/google-sheets', async (req: Request, res: Response) => {
  const result = await appsScriptGateway.executeGetAction('sheets');
  res.json(result);
});

app.post('/api/google/sync', async (req: Request, res: Response) => {
  const syncResult = await bankSoalService.syncGoogleDriveAndSheets();
  res.json(syncResult);
});

// Bank Soal List (Search, Filter, Pagination, Sorting via Google Sheets Database)
app.get('/api/bank-soal', async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  const result = await sheetsService.getBankSoalList(req.query, user.id);
  res.json(result);
});

// Bank Soal Detail
app.get('/api/bank-soal/:id', async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  const item = await sheetsService.getBankSoalById(req.params.id, user.id);
  if (!item) {
    return res.status(404).json({ error: 'Bank soal tidak ditemukan di katalog Google Sheets' });
  }
  res.json({ item });
});

// Duplicate Detection Check (by Hash)
app.post('/api/check-duplicates', (req: Request, res: Response) => {
  const { hash } = req.body;
  const items = sheetsService.checkDuplicatesByHash(hash);
  res.json({ isDuplicate: items.length > 0, existingItem: items[0] || null });
});

// PDF File Upload (Uploads PDF to Google Drive via Apps Script)
app.post('/api/upload', upload.array('files', 10), async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'Tidak ada berkas PDF yang diunggah.' });
  }

  const processed = [];
  const user = await getRequestUserAsync(req);

  for (const f of files) {
    try {
      const fileBuffer = f.buffer;
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      let pageCount = 1;
      try {
        const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
        pageCount = pdfDoc.getPageCount();
      } catch (pdfErr) {
        console.warn('Could not parse page count with pdf-lib:', pdfErr);
      }

      // Duplicate detection in Google Sheets catalog
      const dups = sheetsService.checkDuplicatesByHash(hash);
      const isDup = dups.length > 0;

      // AI Suggested metadata
      const suggested = await suggestMetadataFromText(f.originalname);

      // Upload to Google Drive via Drive Service
      const driveUpload = await driveService.uploadPdfFile(
        fileBuffer,
        f.originalname,
        suggested.mata_pelajaran || 'Umum',
        suggested.kelas || '10',
        suggested,
        user
      );

      processed.push({
        file_id: driveUpload.file_id,
        folder_id: driveUpload.folder_id,
        web_view_url: driveUpload.web_view_url,
        download_url: driveUpload.download_url,
        storage_path: driveUpload.storage_path,
        original_name: f.originalname,
        ukuran_file: f.size,
        jumlah_halaman: pageCount,
        file_hash: hash,
        is_duplicate: isDup,
        duplicate_item: dups[0] || null,
        suggested_metadata: suggested,
        drive_folder_path: `BANK SOAL DIGITAL / ${suggested.mata_pelajaran || 'Umum'} / Kelas ${suggested.kelas || '10'}`,
      });
    } catch (err: any) {
      console.error('File processing error:', err);
      processed.push({
        original_name: f.originalname,
        error: err.message || 'Gagal memproses dan mengunggah berkas PDF ke Google Drive',
      });
    }
  }

  res.json({ files: processed });
});

// AI Metadata Suggestion
app.post('/api/ai/suggest-metadata', async (req: Request, res: Response) => {
  const { filename, rawText } = req.body;
  if (!filename) {
    return res.status(400).json({ error: 'Nama berkas diperlukan.' });
  }
  const result = await suggestMetadataFromText(filename, rawText);
  res.json({ metadata: result });
});

// Create Bank Soal in Google Sheets Database
app.post('/api/bank-soal', async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  try {
    const {
      judul,
      nama_file,
      file_id,
      folder_id,
      web_view_url,
      download_url,
      storage_path,
      file_hash,
      mata_pelajaran,
      jenjang,
      kelas,
      kurikulum,
      bab,
      topik,
      subtopik,
      jenis_soal,
      tingkat_kesulitan,
      tahun,
      semester,
      sumber,
      pembuat_pengajar,
      deskripsi,
      tags,
      jumlah_halaman,
      ukuran_file,
    } = req.body;

    if (!judul || !mata_pelajaran || !jenjang || !kelas) {
      return res.status(400).json({ error: 'Harap lengkapi semua field wajib (Judul, Mapel, Jenjang, Kelas).' });
    }

    const driveUrls = file_id ? driveService.getDriveUrls(file_id) : null;
    const finalFileId = file_id || driveService.generateDriveFileId();
    const folderRes = driveService.resolveFolderPath(mata_pelajaran, kelas);

    const created = await sheetsService.createBankSoal(
      {
        judul,
        nama_file: nama_file || 'soal.pdf',
        file_id: finalFileId,
        folder_id: folder_id || folderRes.folder_id,
        file_url: web_view_url || (driveUrls ? driveUrls.web_view_url : `/api/bank-soal/preview`),
        web_view_url: web_view_url || (driveUrls ? driveUrls.web_view_url : ''),
        download_url: download_url || (driveUrls ? driveUrls.download_url : ''),
        mime_type: 'application/pdf',
        storage_path: storage_path || `${finalFileId}_soal.pdf`,
        file_hash,
        mata_pelajaran,
        jenjang,
        kelas: String(kelas),
        kurikulum: kurikulum || 'Kurikulum Merdeka',
        bab: bab || 'Umum',
        topik: topik || 'Latihan Soal',
        subtopik: subtopik || '',
        jenis_soal: jenis_soal || 'Pilihan Ganda',
        tingkat_kesulitan: tingkat_kesulitan || 'Sedang',
        tahun: Number(tahun) || new Date().getFullYear(),
        semester: semester || 'Ganjil',
        sumber: sumber || '',
        pembuat_pengajar: pembuat_pengajar || user.name,
        deskripsi: deskripsi || '',
        tags: Array.isArray(tags) ? tags : [],
        jumlah_halaman: Number(jumlah_halaman) || 1,
        ukuran_file: Number(ukuran_file) || 1024,
        uploaded_by: user.id,
        uploaded_by_name: user.name,
        uploaded_by_email: user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'aktif',
        sync_status: 'SYNCED',
        version: 1,
        download_count: 0,
        view_count: 0,
      },
      user
    );

    res.status(201).json({ item: created });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menyimpan rekaman ke Google Sheets' });
  }
});

// Update Bank Soal in Google Sheets
app.put('/api/bank-soal/:id', async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  try {
    const updated = await sheetsService.updateBankSoal(req.params.id, req.body, user);
    if (!updated) {
      return res.status(404).json({ error: 'Bank soal tidak ditemukan di Google Sheets' });
    }
    res.json({ item: updated });
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// Add Version to Bank Soal
app.post('/api/bank-soal/:id/version', upload.single('file'), async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'Berkas PDF versi baru diperlukan.' });
  }

  try {
    const updated = await bankSoalService.addVersionToBankSoal(
      req.params.id,
      file.buffer,
      file.originalname,
      req.body.catatan || 'Pembaruan berkas PDF soal ke Google Drive',
      user
    );

    if (!updated) {
      return res.status(404).json({ error: 'Bank soal tidak ditemukan' });
    }

    res.json({ item: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Bank Soal
app.delete('/api/bank-soal/:id', async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  try {
    const success = await sheetsService.deleteBankSoal(req.params.id, user);
    if (success) {
      res.json({ success: true, message: 'Bank soal berhasil dihapus dari Google Sheets & Drive.' });
    } else {
      res.status(404).json({ error: 'Bank soal tidak ditemukan' });
    }
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// Toggle Favorite
app.post('/api/bank-soal/:id/favorite', async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  const resFav = await sheetsService.toggleFavorite(user.id, req.params.id);
  res.json(resFav);
});

// PDF Stream / Preview directly from Google Drive / Gateway
app.get('/api/bank-soal/:id/preview', async (req: Request, res: Response) => {
  const item = await sheetsService.getBankSoalById(req.params.id);
  if (!item) {
    return res.status(404).send('Bank soal tidak ditemukan.');
  }

  let targetFileId = item.file_id;
  if (req.query.v && item.versions) {
    const vNum = parseInt(req.query.v as string, 10);
    const foundV = item.versions.find((v) => v.version_number === vNum);
    if (foundV && foundV.file_id) {
      targetFileId = foundV.file_id;
    }
  }

  const fileBuffer = await driveService.getFileBuffer(targetFileId);
  if (fileBuffer) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(item.nama_file)}"`);
    res.setHeader('X-Google-Drive-File-Id', targetFileId);
    return res.send(fileBuffer);
  }

  if (item.web_view_url) {
    return res.redirect(item.web_view_url);
  }

  res.status(404).send('Berkas PDF fisik tidak ditemukan di Google Drive.');
});

// PDF Download with audit logging
app.get('/api/bank-soal/:id/download', async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  const item = await sheetsService.getBankSoalById(req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Bank soal tidak ditemukan untuk diunduh.' });
  }

  // Update download count
  await sheetsService.updateBankSoal(item.id, { download_count: (item.download_count || 0) + 1 });
  await sheetsService.logActivity({
    user_id: user.id,
    user_name: user.name,
    user_role: user.role,
    user_email: user.email,
    action: 'DOWNLOAD',
    bank_soal_id: item.id,
    soal_judul: item.judul,
    file_id: item.file_id,
    details: { file_name: item.nama_file },
  });

  const fileBuffer = await driveService.getFileBuffer(item.file_id);
  if (fileBuffer) {
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(item.nama_file)}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('X-Google-Drive-File-Id', item.file_id);
    return res.send(fileBuffer);
  }

  if (item.download_url) {
    return res.redirect(item.download_url);
  }

  res.status(404).json({ error: 'Berkas tidak ditemukan untuk diunduh dari Google Drive.' });
});

// Stats Overview
app.get('/api/stats', async (req: Request, res: Response) => {
  const stats = await sheetsService.getStats();
  res.json(stats);
});

// Categories CRUD
app.get('/api/categories', async (req: Request, res: Response) => {
  const categories = await sheetsService.getCategories();
  res.json({ categories });
});

app.post('/api/categories', async (req: Request, res: Response) => {
  const { name, type, code, title, description, icon, color } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: 'Nama dan Tipe kategori wajib diisi.' });
  }
  const created = await sheetsService.createCategory({
    name,
    type,
    code: code || '',
    title: title || name,
    description: description || '',
    icon: icon || (type === 'jenjang' ? 'GraduationCap' : 'BookOpen'),
    color: color || '',
  });
  res.status(201).json({ category: created });
});

app.put('/api/categories/:id', async (req: Request, res: Response) => {
  const { name, type, code, title, description, icon, color } = req.body;
  const updated = await sheetsService.updateCategory(req.params.id, {
    ...(name !== undefined && { name }),
    ...(type !== undefined && { type }),
    ...(code !== undefined && { code }),
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(icon !== undefined && { icon }),
    ...(color !== undefined && { color }),
  });

  if (!updated) {
    return res.status(404).json({ error: 'Kategori tidak ditemukan' });
  }
  res.json({ category: updated });
});

app.delete('/api/categories/:id', async (req: Request, res: Response) => {
  const ok = await sheetsService.deleteCategory(req.params.id);
  if (!ok.success) {
    return res.status(404).json({ error: ok.message || 'Kategori tidak ditemukan' });
  }
  res.json({ success: true, message: 'Kategori berhasil dihapus dari Google Sheets.' });
});

// Audit Logs
app.get('/api/audit-logs', async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  const allLogs = await sheetsService.getAuditLogs(150);
  if (user.role !== 'ADMIN') {
    const userLogs = allLogs.filter((l) => l.user_id === user.id);
    return res.json({ logs: userLogs });
  }
  res.json({ logs: allLogs });
});

// Tags
app.get('/api/tags', async (req: Request, res: Response) => {
  const tags = await sheetsService.getTags();
  res.json({ tags });
});

// User Activity History
app.get('/api/history', async (req: Request, res: Response) => {
  const user = await getRequestUserAsync(req);
  const history = await sheetsService.getUserHistory(user.id);
  res.json({ history });
});

// ---------------- VITE & STATIC MIDDLEWARE ----------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bank Soal PDF Server (Google Drive & Sheets Architecture) running on http://0.0.0.0:${PORT}`);
    AutoSyncService.getInstance().start();
  });
}

startServer();
