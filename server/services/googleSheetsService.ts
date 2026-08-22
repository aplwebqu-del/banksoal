import { BankSoal, User, CategoryItem, AuditLogItem, UserHistoryItem, FilterParams, StatsOverview } from '../../src/types';
import { GoogleConfigService } from './googleConfig';
import { GoogleSheetsRepository } from './googleSheetsRepository';

export const BANK_SOAL_COLUMNS = [
  'id', 'judul', 'nama_file', 'file_id', 'folder_id', 'file_url', 'web_view_url', 'download_url',
  'mime_type', 'ukuran_file', 'jumlah_halaman', 'mata_pelajaran', 'jenjang', 'kelas', 'kurikulum',
  'bab', 'topik', 'subtopik', 'jenis_soal', 'tingkat_kesulitan', 'tahun', 'semester', 'sumber',
  'deskripsi', 'tags', 'uploaded_by', 'uploaded_by_name', 'uploaded_by_email', 'created_at',
  'updated_at', 'status', 'sync_status', 'version', 'file_hash', 'download_count', 'view_count'
];

export class GoogleSheetsService {
  private static instance: GoogleSheetsService;
  private repository: GoogleSheetsRepository;
  private configService: GoogleConfigService;

  private constructor() {
    this.repository = GoogleSheetsRepository.getInstance();
    this.configService = GoogleConfigService.getInstance();
  }

  public static getInstance(): GoogleSheetsService {
    if (!GoogleSheetsService.instance) {
      GoogleSheetsService.instance = new GoogleSheetsService();
    }
    return GoogleSheetsService.instance;
  }

  public async getBankSoalList(params: FilterParams = {}, userId?: string): Promise<{ items: BankSoal[]; total: number; page: number; totalPages: number }> {
    return await this.repository.getBankSoalList(params);
  }

  public async getBankSoalById(id: string, userId?: string): Promise<BankSoal | null> {
    return await this.repository.getBankSoalById(id, userId);
  }

  public async createBankSoal(data: Partial<BankSoal>, user?: User): Promise<BankSoal> {
    return await this.repository.createBankSoal(data, user);
  }

  public async updateBankSoal(id: string, updateData: Partial<BankSoal>, user?: User): Promise<BankSoal | null> {
    return await this.repository.updateBankSoal(id, updateData, user);
  }

  public async deleteBankSoal(id: string, user?: User): Promise<boolean> {
    return await this.repository.softDeleteBankSoal(id, user);
  }

  public async restoreBankSoal(id: string, user?: User): Promise<boolean> {
    return await this.repository.restoreBankSoal(id, user);
  }

  public async permanentDeleteBankSoal(id: string, user?: User): Promise<{ success: boolean; message: string }> {
    const ok = await this.repository.permanentDeleteBankSoal(id, user);
    return { success: ok, message: ok ? 'Soal berhasil dihapus permanen dari sistem.' : 'Gagal menghapus soal.' };
  }

  public async emptyTrash(user?: User): Promise<{ success: boolean; count: number; message: string }> {
    const res = await this.repository.emptyTrash(user);
    return { success: true, count: res.count, message: `${res.count} naskah di tong sampah berhasil dikosongkan.` };
  }

  public getAllBankSoalRaw(): BankSoal[] {
    // Dipanggil untuk keperluan synchronous inspection jika ada
    return [];
  }

  public checkDuplicatesByHash(hash: string): BankSoal[] {
    return this.repository.checkDuplicatesByHash(hash);
  }

  // Users
  public async getUsers(): Promise<User[]> {
    return await this.repository.getUsers();
  }

  public async getUserById(id: string): Promise<User | null> {
    const users = await this.repository.getUsers();
    return users.find(u => u.id === id) || null;
  }

  public async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.repository.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  public async createUser(userData: Partial<User>, adminUser?: User): Promise<User> {
    return await this.repository.createUser(userData, adminUser);
  }

  public async updateUser(id: string, userData: Partial<User>, adminUser?: User): Promise<User | null> {
    return await this.repository.updateUser(id, userData, adminUser);
  }

  public async deleteUser(id: string, adminUser?: User): Promise<{ success: boolean; message: string }> {
    const ok = await this.repository.deleteUser(id, adminUser);
    return { success: ok, message: ok ? 'User berhasil dihapus.' : 'Gagal menghapus user.' };
  }

  // Categories
  public async getCategories(): Promise<CategoryItem[]> {
    return await this.repository.getCategories();
  }

  public async createCategory(cat: Partial<CategoryItem>): Promise<CategoryItem> {
    return await this.repository.createCategory(cat);
  }

  public async updateCategory(id: string, cat: Partial<CategoryItem>): Promise<CategoryItem | null> {
    return await this.repository.updateCategory(id, cat);
  }

  public async deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
    const ok = await this.repository.deleteCategory(id);
    return { success: ok, message: ok ? 'Kategori berhasil dihapus.' : 'Gagal menghapus kategori.' };
  }

  // Audit Logs
  public async getAuditLogs(limit: number = 100): Promise<AuditLogItem[]> {
    return await this.repository.getAuditLogs(limit);
  }

  public async logActivity(entry: Partial<AuditLogItem>): Promise<void> {
    await this.repository.logActivity(entry);
  }

  // Favorites
  public async getFavorites(userId: string): Promise<string[]> {
    return await this.repository.getFavorites(userId);
  }

  public async toggleFavorite(userId: string, soalId: string): Promise<{ is_favorite: boolean; message: string }> {
    const isFav = await this.repository.toggleFavorite(userId, soalId);
    return {
      is_favorite: isFav,
      message: isFav ? 'Ditambahkan ke favorit' : 'Dihapus dari favorit'
    };
  }

  // Statistics
  public async getStats(): Promise<StatsOverview> {
    return await this.repository.getStats();
  }

  // Tags
  public async getTags(): Promise<{ tag: string; count: number }[]> {
    return await this.repository.getTags();
  }

  // User History
  public async getUserHistory(userId: string, limit = 50): Promise<UserHistoryItem[]> {
    return await this.repository.getUserHistory(userId, limit);
  }
}
