/**
 * ==============================================================================
 * BANK SOAL DIGITAL - ENTERPRISE GOOGLE APPS SCRIPT GATEWAY API
 * ==============================================================================
 * 
 * Arsitektur:
 * - Google Drive: File Storage Utama untuk seluruh file PDF.
 * - Google Spreadsheet: Database Metadata Utama (Single Source of Truth).
 * - Google Apps Script: Central Gateway API & Concurrency Manager (LockService).
 * 
 * Struktur Sheet Database:
 * 1. SYSTEM_CONFIG     : Konfigurasi sistem global (Bootstrap, Active Profile ID, dll.)
 * 2. STORAGE_PROFILES  : Daftar profil Google Storage (Primary, Secondary, Failover)
 * 3. BANK_SOAL         : Metadata katalog Bank Soal PDF
 * 4. USERS             : Data Pengguna (Admin, Guru, Viewer)
 * 5. CATEGORIES        : Master Kategori (Mata Pelajaran, Jenjang, Kelas, dll.)
 * 6. ACTIVITY_LOG      : Audit Trail & Riwayat Aktivitas Pengguna
 * 7. FAVORITES         : Data Bank Soal Favorit Pengguna
 * 8. SYNC_LOG          : Riwayat Sinkronisasi Dua Arah Drive ↔ Sheets
 * 9. _PROBE_LOG        : Log Diagnostik Uji Koneksi Live
 * ==============================================================================
 */

// 1. NAMA SHEET RESMI
var SHEET_NAMES = {
  SYSTEM_CONFIG: 'SYSTEM_CONFIG',
  STORAGE_PROFILES: 'STORAGE_PROFILES',
  BANK_SOAL: 'BANK_SOAL',
  USERS: 'USERS',
  CATEGORIES: 'CATEGORIES',
  ACTIVITY_LOG: 'ACTIVITY_LOG',
  FAVORITES: 'FAVORITES',
  SYNC_LOG: 'SYNC_LOG',
  PROBE_LOG: '_PROBE_LOG'
};

// 2. SKEMA KOLOM SHEET
var SYSTEM_CONFIG_COLUMNS = ['key', 'value', 'type', 'description', 'updated_at', 'updated_by'];

var STORAGE_PROFILES_COLUMNS = [
  'id', 'name', 'description', 'apps_script_url', 'drive_folder_id', 'spreadsheet_id',
  'priority', 'status', 'is_active', 'quota_status', 'health_status', 'last_connection_test',
  'last_sync', 'created_at', 'updated_at', 'created_by'
];

var BANK_SOAL_COLUMNS = [
  'id', 'judul', 'nama_file', 'file_id', 'folder_id', 'file_url', 'web_view_url', 'download_url',
  'mime_type', 'ukuran_file', 'jumlah_halaman', 'mata_pelajaran', 'jenjang', 'kelas', 'kurikulum',
  'bab', 'topik', 'subtopik', 'jenis_soal', 'tingkat_kesulitan', 'tahun', 'semester', 'sumber',
  'pembuat_pengajar', 'deskripsi', 'tags', 'uploaded_by', 'uploaded_by_name', 'uploaded_by_email',
  'created_at', 'updated_at', 'status', 'sync_status', 'version', 'file_hash', 'download_count',
  'view_count', 'storage_profile_id', 'spreadsheet_id'
];

var USERS_COLUMNS = ['id', 'name', 'email', 'role', 'status', 'school_institution', 'subject', 'avatar', 'created_at', 'updated_at'];

var CATEGORIES_COLUMNS = ['id', 'type', 'name', 'code', 'title', 'description', 'icon', 'color'];

var ACTIVITY_LOG_COLUMNS = ['id', 'timestamp', 'user_id', 'user_name', 'user_role', 'action', 'bank_soal_id', 'file_id', 'details'];

var FAVORITES_COLUMNS = ['user_id', 'bank_soal_id', 'created_at'];

var SYNC_LOG_COLUMNS = ['id', 'timestamp', 'status', 'total_scanned', 'missing_count', 'unindexed_count', 'details'];

/**
 * Helper JSON Response Standardized
 */
function createJsonResponse(data, isSuccess) {
  var success = (typeof isSuccess === 'boolean') ? isSuccess : (data && data.success !== false);
  var responsePayload;

  if (success) {
    responsePayload = {
      success: true,
      data: (data && data.data !== undefined) ? data.data : data,
      error: null,
      timestamp: new Date().toISOString()
    };
  } else {
    var errorObj = (data && data.error) ? data.error : { code: 'UNKNOWN_ERROR', message: String(data) };
    if (typeof errorObj === 'string') {
      errorObj = { code: 'ERROR', message: errorObj };
    }
    responsePayload = {
      success: false,
      data: null,
      error: errorObj,
      timestamp: new Date().toISOString()
    };
  }

  return ContentService.createTextOutput(JSON.stringify(responsePayload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Resolusi Google Spreadsheet Dinamis
 */
function resolveSpreadsheet(targetSpreadsheetId) {
  if (targetSpreadsheetId && typeof targetSpreadsheetId === 'string' && targetSpreadsheetId.trim().length > 5) {
    try {
      return SpreadsheetApp.openById(targetSpreadsheetId.trim());
    } catch (e) {
      // fallback jika gagal buka ID khusus
    }
  }
  try {
    return SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    throw new Error('Spreadsheet target tidak dapat diakses. Periksa Spreadsheet ID dan izin akses.');
  }
}

/**
 * Dapatkan atau Buat Sheet
 */
function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

/**
 * Format Header Style
 */
function formatHeader(sheet, columns) {
  sheet.getRange(1, 1, 1, columns.length)
    .setBackground('#1e293b')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  sheet.setFrozenRows(1);
}

/**
 * Inisialisasi Seluruh Struktur Sheet & Header
 */
function initSpreadsheet(targetSpreadsheetId) {
  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var now = new Date().toISOString();

  // 1. SYSTEM_CONFIG
  var sheetConfig = getOrCreateSheet(ss, SHEET_NAMES.SYSTEM_CONFIG);
  if (sheetConfig.getLastRow() === 0) {
    sheetConfig.appendRow(SYSTEM_CONFIG_COLUMNS);
    formatHeader(sheetConfig, SYSTEM_CONFIG_COLUMNS);
    sheetConfig.appendRow(['ACTIVE_STORAGE_PROFILE_ID', 'storage-001', 'string', 'ID Profil Penyimpanan Aktif Global', now, 'System']);
    sheetConfig.appendRow(['BOOTSTRAP_VERSION', '3.0.0', 'string', 'Versi Bootstrap Konfigurasi Pusat', now, 'System']);
    sheetConfig.appendRow(['SYSTEM_STATUS', 'OPERATIONAL', 'string', 'Status Operasional Cloud Gateway', now, 'System']);
    sheetConfig.appendRow(['DEFAULT_SYNC_MODE', 'AUTO_15_MIN', 'string', 'Mode Sinkronisasi Default', now, 'System']);
  }

  // 2. STORAGE_PROFILES
  var sheetStorage = getOrCreateSheet(ss, SHEET_NAMES.STORAGE_PROFILES);
  if (sheetStorage.getLastRow() === 0) {
    sheetStorage.appendRow(STORAGE_PROFILES_COLUMNS);
    formatHeader(sheetStorage, STORAGE_PROFILES_COLUMNS);
    sheetStorage.appendRow([
      'storage-001',
      'Bank Soal Utama',
      'Penyimpanan Google Drive & Sheets primer institusi',
      '',
      '',
      ss.getId(),
      '1',
      'ACTIVE',
      'TRUE',
      'NORMAL',
      'HEALTHY',
      now,
      now,
      now,
      now,
      'Admin'
    ]);
  }

  // 3. BANK_SOAL
  var sheetBS = getOrCreateSheet(ss, SHEET_NAMES.BANK_SOAL);
  if (sheetBS.getLastRow() === 0) {
    sheetBS.appendRow(BANK_SOAL_COLUMNS);
    formatHeader(sheetBS, BANK_SOAL_COLUMNS);
  }

  // 4. USERS
  var sheetUsers = getOrCreateSheet(ss, SHEET_NAMES.USERS);
  if (sheetUsers.getLastRow() === 0) {
    sheetUsers.appendRow(USERS_COLUMNS);
    formatHeader(sheetUsers, USERS_COLUMNS);
    sheetUsers.appendRow(['u-1', 'Dra. Hj. Nurhayati, M.Pd.', 'nurhayati@sekolah.sch.id', 'ADMIN', 'ACTIVE', 'SMA Negeri 1 Teladan', 'Manajemen Kurikulum & Matematika', '', now, now]);
    sheetUsers.appendRow(['u-2', 'Budi Santoso, S.Pd.', 'budi.santoso@guru.smp.id', 'GURU', 'ACTIVE', 'SMP Negeri 5 Bintang', 'Matematika & IPA', '', now, now]);
  }

  // 5. CATEGORIES
  var sheetCats = getOrCreateSheet(ss, SHEET_NAMES.CATEGORIES);
  if (sheetCats.getLastRow() === 0) {
    sheetCats.appendRow(CATEGORIES_COLUMNS);
    formatHeader(sheetCats, CATEGORIES_COLUMNS);
    sheetCats.appendRow(['c-1', 'mata_pelajaran', 'Matematika', 'MTK', 'Matematika Terpadu', 'Aljabar, Geometri, Trigonometri, Statistika', 'Calculator', 'from-blue-600 to-indigo-600']);
    sheetCats.appendRow(['c-2', 'mata_pelajaran', 'Bahasa Indonesia', 'BIN', 'Bahasa Indonesia', 'Literasi, Teks Eksposisi, Sastra', 'BookOpen', 'from-rose-600 to-pink-600']);
    sheetCats.appendRow(['c-3', 'mata_pelajaran', 'Bahasa Inggris', 'BIG', 'Bahasa Inggris', 'Reading Comprehension, Grammar, AKM', 'Languages', 'from-violet-600 to-purple-600']);
    sheetCats.appendRow(['c-4', 'mata_pelajaran', 'IPA', 'IPA', 'Ilmu Pengetahuan Alam', 'Sains SMP Terpadu', 'FlaskConical', 'from-teal-600 to-emerald-600']);
    sheetCats.appendRow(['c-5', 'mata_pelajaran', 'Fisika', 'FIS', 'Fisika SMA', 'Mekanika, Termodinamika, Optik', 'Atom', 'from-cyan-600 to-blue-600']);
    sheetCats.appendRow(['c-6', 'jenjang', 'SD', 'SD', 'Sekolah Dasar', 'Kelas 1 sampai 6', 'GraduationCap', 'from-emerald-600 to-teal-600']);
    sheetCats.appendRow(['c-7', 'jenjang', 'SMP', 'SMP', 'Sekolah Menengah Pertama', 'Kelas 7 sampai 9', 'GraduationCap', 'from-blue-600 to-indigo-600']);
    sheetCats.appendRow(['c-8', 'jenjang', 'SMA', 'SMA', 'Sekolah Menengah Atas', 'Kelas 10 sampai 12', 'GraduationCap', 'from-purple-600 to-violet-600']);
    sheetCats.appendRow(['c-9', 'jenjang', 'SMK', 'SMK', 'Sekolah Menengah Kejuruan', 'Vokasi Kejuruan', 'GraduationCap', 'from-amber-600 to-orange-600']);
  }

  // 6. ACTIVITY_LOG
  var sheetLogs = getOrCreateSheet(ss, SHEET_NAMES.ACTIVITY_LOG);
  if (sheetLogs.getLastRow() === 0) {
    sheetLogs.appendRow(ACTIVITY_LOG_COLUMNS);
    formatHeader(sheetLogs, ACTIVITY_LOG_COLUMNS);
  }

  // 7. FAVORITES
  var sheetFavs = getOrCreateSheet(ss, SHEET_NAMES.FAVORITES);
  if (sheetFavs.getLastRow() === 0) {
    sheetFavs.appendRow(FAVORITES_COLUMNS);
    formatHeader(sheetFavs, FAVORITES_COLUMNS);
  }

  // 8. SYNC_LOG
  var sheetSync = getOrCreateSheet(ss, SHEET_NAMES.SYNC_LOG);
  if (sheetSync.getLastRow() === 0) {
    sheetSync.appendRow(SYNC_LOG_COLUMNS);
    formatHeader(sheetSync, SYNC_LOG_COLUMNS);
  }

  // 9. PROBE_LOG
  var sheetProbe = getOrCreateSheet(ss, SHEET_NAMES.PROBE_LOG);
  if (sheetProbe.getLastRow() === 0) {
    sheetProbe.appendRow(['timestamp', 'profile_id', 'status', 'details']);
    formatHeader(sheetProbe, ['timestamp', 'profile_id', 'status', 'details']);
  }

  return {
    success: true,
    message: 'Seluruh struktur sheet database Google Sheets berhasil diinisialisasi.',
    spreadsheet_id: ss.getId(),
    spreadsheet_title: ss.getName()
  };
}

/**
 * Generate Authoritative Bank Soal ID (BS-000001, BS-000002, ...)
 */
function generateNextId(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 'BS-000001';

  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var maxNum = 0;
  for (var i = 0; i < ids.length; i++) {
    var str = String(ids[i][0] || '');
    var match = str.match(/BS-(\d+)/i);
    if (match) {
      var num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  var next = maxNum + 1;
  var padded = ('000000' + next).slice(-6);
  return 'BS-' + padded;
}

/**
 * Resolusi Root Folder Google Drive
 */
function resolveRootFolder(rootFolderId) {
  if (rootFolderId && typeof rootFolderId === 'string' && rootFolderId.trim().length > 5) {
    try {
      return DriveApp.getFolderById(rootFolderId.trim());
    } catch (e) {}
  }
  var folders = DriveApp.getFoldersByName('BANK SOAL DIGITAL');
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder('BANK SOAL DIGITAL');
}

/**
 * Buat / Dapatkan Struktur Folder Hierarki di Google Drive:
 * [Root] / [Mata Pelajaran] / Kelas [Kelas]
 */
function getOrCreateTargetFolder(mapel, kelas, rootFolderId) {
  var rootFolder = resolveRootFolder(rootFolderId);
  var safeMapel = (mapel || 'Umum').trim();

  var mapelFolder;
  var subMapel = rootFolder.getFoldersByName(safeMapel);
  if (subMapel.hasNext()) {
    mapelFolder = subMapel.next();
  } else {
    mapelFolder = rootFolder.createFolder(safeMapel);
  }

  if (!kelas) return mapelFolder;

  var kelasName = 'Kelas ' + kelas;
  var kelasFolder;
  var subKelas = mapelFolder.getFoldersByName(kelasName);
  if (subKelas.hasNext()) {
    kelasFolder = subKelas.next();
  } else {
    kelasFolder = mapelFolder.createFolder(kelasName);
  }

  return kelasFolder;
}

/**
 * Handle HTTP GET Requests
 */
function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    var action = params.action || 'ping';
    var spreadsheetId = params.spreadsheetId || params.google_spreadsheet_id || params.spreadsheet_id;
    var driveFolderId = params.driveFolderId || params.folderId || params.rootFolderId || params.drive_root_folder_id;

    var result;
    switch (action) {
      case 'ping':
        result = {
          message: 'Google Apps Script Bank Soal Gateway is online and operational.',
          version: '3.0.0',
          gateway: 'AppsScript_SingleSourceOfTruth',
          timestamp: new Date().toISOString()
        };
        break;

      case 'health':
      case 'test_connection':
        result = runFullConnectionDiagnostics(spreadsheetId, driveFolderId, params.storageProfileId);
        break;

      case 'init':
        result = initSpreadsheet(spreadsheetId);
        break;

      case 'getConfig':
      case 'getSystemConfig':
        result = getSystemConfig(spreadsheetId);
        break;

      case 'getStorageProfiles':
        result = getStorageProfiles(spreadsheetId);
        break;

      case 'getActiveStorage':
        result = getActiveStorageProfile(spreadsheetId);
        break;

      case 'getBankSoal':
        result = getBankSoalList(params, spreadsheetId);
        break;

      case 'getBankSoalById':
        result = getBankSoalById(params.id, params.userId, spreadsheetId);
        break;

      case 'getStats':
        result = getStats(spreadsheetId);
        break;

      case 'getCategories':
        result = getCategories(spreadsheetId);
        break;

      case 'getAuditLogs':
      case 'getActivityLogs':
        result = getAuditLogs(Number(params.limit) || 100, spreadsheetId);
        break;

      case 'getUsers':
        result = getUsers(spreadsheetId);
        break;

      case 'getFavorites':
        result = getUserFavorites(params.userId, spreadsheetId);
        break;

      case 'syncDrive':
        result = syncDriveWithSheets(driveFolderId, spreadsheetId);
        break;

      case 'getFileContent':
        result = getFileContentBase64(params.fileId);
        break;

      default:
        return createJsonResponse({ error: { code: 'UNKNOWN_ACTION', message: 'Aksi GET tidak dikenali: ' + action } }, false);
    }

    return createJsonResponse(result, true);
  } catch (err) {
    return createJsonResponse({ error: { code: 'SERVER_ERROR', message: err.toString() } }, false);
  }
}

/**
 * Handle HTTP POST Requests with Concurrency Safety (LockService)
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  var lockAcquired = false;

  try {
    var requestData = {};
    if (e && e.postData && e.postData.contents) {
      try {
        requestData = JSON.parse(e.postData.contents);
      } catch (pErr) {
        requestData = {};
      }
    }

    var action = requestData.action || (e && e.parameter && e.parameter.action);
    var spreadsheetId = requestData.spreadsheetId || requestData.google_spreadsheet_id || requestData.spreadsheet_id || (e && e.parameter && e.parameter.spreadsheetId);
    var driveFolderId = requestData.driveFolderId || requestData.rootFolderId || requestData.drive_root_folder_id || requestData.google_drive_folder_id || (e && e.parameter && e.parameter.driveFolderId);
    var storageProfileId = requestData.storageProfileId || requestData.storage_profile_id || 'storage-001';

    // Aksi yang memerlukan LockService untuk mencegah race condition
    var writeActions = [
      'uploadFile', 'createBankSoal', 'updateBankSoal', 'deleteBankSoal',
      'restoreBankSoal', 'permanentDeleteBankSoal', 'emptyTrash', 'addVersion',
      'saveConfig', 'createStorageProfile', 'updateStorageProfile', 'deleteStorageProfile',
      'setActiveStorage', 'createUser', 'updateUser', 'deleteUser', 'createCategory',
      'updateCategory', 'deleteCategory', 'favoriteBankSoal', 'syncDrive'
    ];

    if (writeActions.indexOf(action) !== -1) {
      lock.waitLock(15000); // Tunggu hingga 15 detik jika ada proses lain
      lockAcquired = true;
    }

    var result;
    switch (action) {
      case 'test_connection':
      case 'health_check':
        result = runFullConnectionDiagnostics(spreadsheetId, driveFolderId, storageProfileId);
        break;

      case 'saveConfig':
      case 'setSystemConfig':
        result = saveSystemConfig(requestData.key, requestData.value, requestData.type, requestData.description, requestData.user, spreadsheetId);
        break;

      case 'createStorageProfile':
        result = createStorageProfile(requestData.profile, spreadsheetId);
        break;

      case 'updateStorageProfile':
        result = updateStorageProfile(requestData.id, requestData.profile, spreadsheetId);
        break;

      case 'deleteStorageProfile':
        result = deleteStorageProfile(requestData.id, spreadsheetId);
        break;

      case 'setActiveStorage':
        result = setActiveStorageProfile(requestData.id, spreadsheetId);
        break;

      case 'uploadFile':
        result = handleUploadFile(requestData);
        break;

      case 'createBankSoal':
        result = createBankSoalRecord(requestData.data, requestData.user, spreadsheetId, storageProfileId);
        break;

      case 'updateBankSoal':
        result = updateBankSoalRecord(requestData.id, requestData.data, requestData.user, spreadsheetId);
        break;

      case 'deleteBankSoal':
        result = softDeleteBankSoalRecord(requestData.id, requestData.user, spreadsheetId);
        break;

      case 'restoreBankSoal':
        result = restoreBankSoalRecord(requestData.id, requestData.user, spreadsheetId);
        break;

      case 'permanentDeleteBankSoal':
        result = permanentDeleteBankSoalRecord(requestData.id, requestData.user, spreadsheetId);
        break;

      case 'emptyTrash':
        result = emptyTrashRecords(requestData.user, spreadsheetId);
        break;

      case 'addVersion':
        result = handleAddVersion(requestData);
        break;

      case 'favoriteBankSoal':
        result = toggleFavorite(requestData.userId, requestData.soalId, spreadsheetId);
        break;

      case 'recordActivity':
        result = logActivity(requestData, spreadsheetId);
        break;

      case 'createUser':
        result = createUser(requestData.userData, requestData.adminUser, spreadsheetId);
        break;

      case 'updateUser':
        result = updateUser(requestData.id, requestData.userData, requestData.adminUser, spreadsheetId);
        break;

      case 'deleteUser':
        result = deleteUser(requestData.id, requestData.adminUser, spreadsheetId);
        break;

      case 'createCategory':
        result = addCategory(requestData.category, spreadsheetId);
        break;

      case 'updateCategory':
        result = updateCategory(requestData.id, requestData.category, spreadsheetId);
        break;

      case 'deleteCategory':
        result = deleteCategory(requestData.id, spreadsheetId);
        break;

      case 'syncDrive':
        result = syncDriveWithSheets(driveFolderId, spreadsheetId);
        break;

      default:
        return createJsonResponse({ error: { code: 'UNKNOWN_ACTION', message: 'Aksi POST tidak dikenali: ' + action } }, false);
    }

    if (result && result.success === false) {
      return createJsonResponse(result, false);
    }
    return createJsonResponse(result, true);

  } catch (err) {
    return createJsonResponse({ error: { code: 'POST_ERROR', message: err.toString() } }, false);
  } finally {
    if (lockAcquired) {
      try {
        lock.releaseLock();
      } catch (lErr) {}
    }
  }
}

/**
 * Uji Diagnostik Koneksi Komprehensif E2E
 */
function runFullConnectionDiagnostics(spreadsheetId, driveFolderId, storageProfileId) {
  var startTime = new Date().getTime();
  var diag = {
    connected: true,
    latency_ms: 0,
    storage_profile_id: storageProfileId || 'storage-001',
    overall_status: 'FULLY_CONNECTED',
    apps_script: {
      reachable: true,
      status: 'HEALTHY',
      version: '3.0.0',
      message: 'Google Apps Script Web App aktif dan merespons normal.'
    },
    google_drive: {
      connected: false,
      folder_id: '',
      folder_name: '',
      accessible: false,
      write_test: 'UNTESTED',
      read_test: 'UNTESTED',
      error: null
    },
    google_sheets: {
      connected: false,
      spreadsheet_id: '',
      spreadsheet_name: '',
      accessible: false,
      sheet_count: 0,
      write_test: 'UNTESTED',
      read_test: 'UNTESTED',
      error: null
    },
    quota: {
      status: 'NORMAL',
      used_bytes: 0,
      total_bytes: 0,
      usage_percent: 0
    },
    timestamp: new Date().toISOString()
  };

  // 1. Uji Google Drive
  try {
    var folder = resolveRootFolder(driveFolderId);
    diag.google_drive.connected = true;
    diag.google_drive.folder_id = folder.getId();
    diag.google_drive.folder_name = folder.getName();
    diag.google_drive.accessible = true;
    diag.google_drive.read_test = 'PASS';

    // Write Probe: buat file temporary lalu hapus
    try {
      var probeFile = folder.createFile('_probe_test_' + new Date().getTime() + '.tmp', 'PROBE_OK');
      diag.google_drive.write_test = 'PASS';
      try {
        probeFile.setTrashed(true);
      } catch (delErr) {}
    } catch (wErr) {
      diag.google_drive.write_test = 'FAIL';
      diag.google_drive.error = 'Gagal menulis berkas ke Google Drive: ' + wErr.toString();
    }
  } catch (dErr) {
    diag.google_drive.connected = false;
    diag.google_drive.accessible = false;
    diag.google_drive.read_test = 'FAIL';
    diag.google_drive.write_test = 'FAIL';
    diag.google_drive.error = dErr.toString();
    diag.connected = false;
  }

  // 2. Uji Google Sheets
  try {
    var ss = resolveSpreadsheet(spreadsheetId);
    diag.google_sheets.connected = true;
    diag.google_sheets.spreadsheet_id = ss.getId();
    diag.google_sheets.spreadsheet_name = ss.getName();
    diag.google_sheets.accessible = true;
    diag.google_sheets.sheet_count = ss.getSheets().length;
    diag.google_sheets.read_test = 'PASS';

    // Write Probe: tulis baris diagnostik lalu bersihkan
    try {
      var pSheet = getOrCreateSheet(ss, SHEET_NAMES.PROBE_LOG);
      if (pSheet.getLastRow() === 0) {
        pSheet.appendRow(['timestamp', 'profile_id', 'status', 'details']);
      }
      pSheet.appendRow([new Date().toISOString(), storageProfileId || 'test', 'OK', 'Connection probe test']);
      diag.google_sheets.write_test = 'PASS';
      if (pSheet.getLastRow() > 20) {
        pSheet.deleteRows(2, 5);
      }
    } catch (sWriteErr) {
      diag.google_sheets.write_test = 'FAIL';
      diag.google_sheets.error = 'Gagal menulis ke Google Sheets: ' + sWriteErr.toString();
    }
  } catch (sErr) {
    diag.google_sheets.connected = false;
    diag.google_sheets.accessible = false;
    diag.google_sheets.read_test = 'FAIL';
    diag.google_sheets.write_test = 'FAIL';
    diag.google_sheets.error = sErr.toString();
    diag.connected = false;
  }

  // 3. Kuota Storage Google Drive
  try {
    var storageUsed = DriveApp.getStorageUsed();
    var storageTotal = DriveApp.getStorageLimit();
    diag.quota.used_bytes = storageUsed;
    diag.quota.total_bytes = storageTotal;
    if (storageTotal > 0) {
      var pct = Math.round((storageUsed / storageTotal) * 100);
      diag.quota.usage_percent = pct;
      if (pct >= 95) diag.quota.status = 'FULL';
      else if (pct >= 80) diag.quota.status = 'WARNING';
      else diag.quota.status = 'NORMAL';
    }
  } catch (qErr) {
    diag.quota.status = 'NORMAL';
  }

  diag.latency_ms = new Date().getTime() - startTime;

  if (diag.google_drive.write_test === 'PASS' && diag.google_sheets.write_test === 'PASS') {
    diag.overall_status = 'FULLY_CONNECTED';
  } else if (diag.google_drive.connected || diag.google_sheets.connected) {
    diag.overall_status = 'PARTIAL';
  } else {
    diag.overall_status = 'FAILED';
  }

  return diag;
}

/**
 * Handle Upload File PDF ke Google Drive & Tulis Metadata ke Google Sheets
 */
function handleUploadFile(payload) {
  var base64Data = payload.base64;
  var fileName = payload.fileName || payload.originalName || 'soal.pdf';
  var metadata = payload.metadata || {};
  var user = payload.user || { id: 'u-1', name: 'Dra. Hj. Nurhayati, M.Pd.', email: 'nurhayati@sekolah.sch.id', role: 'ADMIN' };
  var rootFolderId = payload.driveFolderId || payload.rootFolderId || payload.drive_root_folder_id;
  var targetSpreadsheetId = payload.spreadsheetId || payload.spreadsheet_id;
  var storageProfileId = payload.storageProfileId || payload.storage_profile_id || 'storage-001';

  if (!base64Data) {
    return { success: false, error: { code: 'INVALID_FILE', message: 'Data base64 file PDF tidak ditemukan.' } };
  }

  // 1. Simpan Berkas PDF ke Google Drive
  var decoded = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(decoded, 'application/pdf', fileName);

  var targetFolder = getOrCreateTargetFolder(metadata.mata_pelajaran, metadata.kelas, rootFolderId);
  var driveFile = targetFolder.createFile(blob);

  // Set sharing agar dapat diakses untuk view & download
  try {
    driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {}

  var fileId = driveFile.getId();
  var folderId = targetFolder.getId();
  var webViewUrl = driveFile.getUrl();
  var downloadUrl = driveFile.getDownloadUrl();
  var fileSize = driveFile.getSize();

  // 2. Simpan Metadata ke Sheet BANK_SOAL
  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.BANK_SOAL);
  if (sheet.getLastRow() === 0) {
    initSpreadsheet(targetSpreadsheetId);
  }

  var nextId = generateNextId(sheet);
  var now = new Date().toISOString();

  var rowData = [
    nextId,
    metadata.judul || fileName.replace(/\.pdf$/i, ''),
    fileName,
    fileId,
    folderId,
    webViewUrl,
    webViewUrl,
    downloadUrl,
    'application/pdf',
    fileSize,
    Number(metadata.jumlah_halaman) || 1,
    metadata.mata_pelajaran || 'Umum',
    metadata.jenjang || 'SMA',
    String(metadata.kelas || '10'),
    metadata.kurikulum || 'Kurikulum Merdeka',
    metadata.bab || 'Umum',
    metadata.topik || 'Latihan Soal',
    metadata.subtopik || '',
    metadata.jenis_soal || 'Pilihan Ganda',
    metadata.tingkat_kesulitan || 'Sedang',
    Number(metadata.tahun) || new Date().getFullYear(),
    metadata.semester || 'Ganjil',
    metadata.sumber || '',
    metadata.pembuat_pengajar || (user ? user.name : 'Pengajar'),
    metadata.deskripsi || '',
    Array.isArray(metadata.tags) ? metadata.tags.join(',') : (metadata.tags || ''),
    user.id || 'u-1',
    user.name || 'Pengajar',
    user.email || 'pengajar@sekolah.sch.id',
    now,
    now,
    'aktif',
    'SYNCED',
    1,
    metadata.file_hash || '',
    0,
    0,
    storageProfileId,
    ss.getId()
  ];

  sheet.appendRow(rowData);

  // 3. Catat Log Aktivitas
  logActivity({
    user: user,
    action: 'UPLOAD',
    bank_soal_id: nextId,
    file_id: fileId,
    details: { judul: metadata.judul, fileName: fileName, storage_profile_id: storageProfileId }
  }, targetSpreadsheetId);

  return {
    success: true,
    id: nextId,
    bank_soal_id: nextId,
    file_id: fileId,
    drive_file_id: fileId,
    folder_id: folderId,
    drive_folder_id: folderId,
    spreadsheet_id: ss.getId(),
    storage_profile_id: storageProfileId,
    file_url: webViewUrl,
    web_view_url: webViewUrl,
    download_url: downloadUrl,
    nama_file: fileName,
    ukuran_file: fileSize,
    jumlah_halaman: Number(metadata.jumlah_halaman) || 1,
    file_hash: metadata.file_hash || '',
    sync_status: 'SYNCED'
  };
}

/**
 * Ambil Konten Berkas PDF dalam Base64 untuk Streaming/Preview
 */
function getFileContentBase64(fileId) {
  if (!fileId) return { success: false, error: { code: 'NO_FILE_ID', message: 'fileId wajib disediakan' } };
  try {
    var file = DriveApp.getFileById(fileId);
    var bytes = file.getBlob().getBytes();
    var b64 = Utilities.base64Encode(bytes);
    return {
      success: true,
      file_id: fileId,
      name: file.getName(),
      mime_type: file.getMimeType(),
      size: file.getSize(),
      base64: b64
    };
  } catch (err) {
    return { success: false, error: { code: 'DRIVE_READ_ERROR', message: err.toString() } };
  }
}

/**
 * Simpan Record Bank Soal ke Sheets
 */
function createBankSoalRecord(data, user, targetSpreadsheetId, storageProfileId) {
  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.BANK_SOAL);
  if (sheet.getLastRow() === 0) initSpreadsheet(targetSpreadsheetId);

  var nextId = data.id || generateNextId(sheet);
  var now = new Date().toISOString();

  var rowData = [
    nextId,
    data.judul || 'Bank Soal',
    data.nama_file || 'soal.pdf',
    data.file_id || '',
    data.folder_id || '',
    data.file_url || data.web_view_url || '',
    data.web_view_url || '',
    data.download_url || '',
    data.mime_type || 'application/pdf',
    Number(data.ukuran_file) || 1024,
    Number(data.jumlah_halaman) || 1,
    data.mata_pelajaran || 'Umum',
    data.jenjang || 'SMA',
    String(data.kelas || '10'),
    data.kurikulum || 'Kurikulum Merdeka',
    data.bab || 'Umum',
    data.topik || 'Latihan Soal',
    data.subtopik || '',
    data.jenis_soal || 'Pilihan Ganda',
    data.tingkat_kesulitan || 'Sedang',
    Number(data.tahun) || new Date().getFullYear(),
    data.semester || 'Ganjil',
    data.sumber || '',
    data.pembuat_pengajar || (user ? user.name : 'Pengajar'),
    data.deskripsi || '',
    Array.isArray(data.tags) ? data.tags.join(',') : (data.tags || ''),
    user ? user.id : 'u-1',
    user ? user.name : 'Pengajar',
    user ? user.email : 'pengajar@sekolah.sch.id',
    now,
    now,
    'aktif',
    data.sync_status || (data.file_id ? 'SYNCED' : 'NEEDS_SYNC'),
    Number(data.version) || 1,
    data.file_hash || '',
    0,
    0,
    storageProfileId || data.storage_profile_id || 'storage-001',
    ss.getId()
  ];

  sheet.appendRow(rowData);

  logActivity({
    user: user,
    action: 'CREATE_RECORD',
    bank_soal_id: nextId,
    file_id: data.file_id || '',
    details: { judul: data.judul, storage_profile_id: storageProfileId }
  }, targetSpreadsheetId);

  return { success: true, item: rowToObject(rowData, BANK_SOAL_COLUMNS) };
}

/**
 * Update Record Bank Soal di Sheets
 */
function updateBankSoalRecord(id, updateData, user, targetSpreadsheetId) {
  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.BANK_SOAL);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: false, error: { code: 'NOT_FOUND', message: 'Bank soal tidak ditemukan.' } };

  var data = sheet.getRange(1, 1, lastRow, BANK_SOAL_COLUMNS.length).getValues();
  var headers = data[0];
  var rowIndex = -1;

  for (var r = 1; r < data.length; r++) {
    if (data[r][0] === id) {
      rowIndex = r + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Bank soal tidak ditemukan.' } };
  }

  var now = new Date().toISOString();
  for (var key in updateData) {
    var colIdx = headers.indexOf(key);
    if (colIdx !== -1) {
      var val = updateData[key];
      if (Array.isArray(val)) val = val.join(',');
      sheet.getRange(rowIndex, colIdx + 1).setValue(val);
    }
  }

  var updatedCol = headers.indexOf('updated_at');
  if (updatedCol !== -1) sheet.getRange(rowIndex, updatedCol + 1).setValue(now);

  logActivity({
    user: user,
    action: 'EDIT',
    bank_soal_id: id,
    details: updateData
  }, targetSpreadsheetId);

  // Return updated item
  var updatedRow = sheet.getRange(rowIndex, 1, 1, BANK_SOAL_COLUMNS.length).getValues()[0];
  return { success: true, item: rowToObject(updatedRow, headers) };
}

/**
 * Soft Delete Bank Soal (Pindahkan ke Sampah)
 */
function softDeleteBankSoalRecord(id, user, targetSpreadsheetId) {
  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.BANK_SOAL);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: false, error: { code: 'NOT_FOUND', message: 'Bank soal tidak ditemukan.' } };

  var data = sheet.getRange(1, 1, lastRow, BANK_SOAL_COLUMNS.length).getValues();
  var headers = data[0];
  var statusCol = headers.indexOf('status');
  var updatedCol = headers.indexOf('updated_at');
  var rowIndex = -1;
  var judul = '';

  for (var r = 1; r < data.length; r++) {
    if (data[r][0] === id) {
      rowIndex = r + 1;
      judul = data[r][1];
      break;
    }
  }

  if (rowIndex === -1) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Bank soal tidak ditemukan.' } };
  }

  sheet.getRange(rowIndex, statusCol + 1).setValue('arsip');
  sheet.getRange(rowIndex, updatedCol + 1).setValue(new Date().toISOString());

  logActivity({
    user: user,
    action: 'DELETE_BANK_SOAL',
    bank_soal_id: id,
    details: { judul: judul, status: 'arsip (keranjang sampah)' }
  }, targetSpreadsheetId);

  return { success: true, message: 'Bank soal berhasil dipindahkan ke keranjang sampah.' };
}

/**
 * Pulihkan Bank Soal dari Sampah
 */
function restoreBankSoalRecord(id, user, targetSpreadsheetId) {
  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.BANK_SOAL);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: false, error: { code: 'NOT_FOUND', message: 'Bank soal tidak ditemukan.' } };

  var data = sheet.getRange(1, 1, lastRow, BANK_SOAL_COLUMNS.length).getValues();
  var headers = data[0];
  var statusCol = headers.indexOf('status');
  var updatedCol = headers.indexOf('updated_at');
  var rowIndex = -1;
  var judul = '';

  for (var r = 1; r < data.length; r++) {
    if (data[r][0] === id) {
      rowIndex = r + 1;
      judul = data[r][1];
      break;
    }
  }

  if (rowIndex === -1) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Bank soal tidak ditemukan.' } };
  }

  sheet.getRange(rowIndex, statusCol + 1).setValue('aktif');
  sheet.getRange(rowIndex, updatedCol + 1).setValue(new Date().toISOString());

  logActivity({
    user: user,
    action: 'RESTORE_BANK_SOAL',
    bank_soal_id: id,
    details: { judul: judul }
  }, targetSpreadsheetId);

  return { success: true, message: 'Bank soal berhasil dipulihkan.' };
}

/**
 * Hapus Permanen dari Sheets & Drive
 */
function permanentDeleteBankSoalRecord(id, user, targetSpreadsheetId) {
  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.BANK_SOAL);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: false, error: { code: 'NOT_FOUND', message: 'Bank soal tidak ditemukan.' } };

  var data = sheet.getRange(1, 1, lastRow, BANK_SOAL_COLUMNS.length).getValues();
  var fileId = '';
  var rowIndex = -1;
  var judul = '';

  for (var r = 1; r < data.length; r++) {
    if (data[r][0] === id) {
      rowIndex = r + 1;
      judul = data[r][1];
      fileId = data[r][3];
      break;
    }
  }

  if (rowIndex === -1) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Bank soal tidak ditemukan.' } };
  }

  sheet.deleteRow(rowIndex);

  if (fileId) {
    try {
      var file = DriveApp.getFileById(fileId);
      file.setTrashed(true);
    } catch (e) {}
  }

  logActivity({
    user: user,
    action: 'PERMANENT_DELETE',
    bank_soal_id: id,
    file_id: fileId,
    details: { judul: judul }
  }, targetSpreadsheetId);

  return { success: true, message: 'Bank soal dan berkas PDF berhasil dihapus secara permanen.' };
}

/**
 * Kosongkan Seluruh Keranjang Sampah
 */
function emptyTrashRecords(user, targetSpreadsheetId) {
  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.BANK_SOAL);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: true, count: 0, message: 'Keranjang sampah sudah kosong.' };

  var data = sheet.getRange(1, 1, lastRow, BANK_SOAL_COLUMNS.length).getValues();
  var statusCol = BANK_SOAL_COLUMNS.indexOf('status');
  var fileIdCol = BANK_SOAL_COLUMNS.indexOf('file_id');
  var deletedCount = 0;

  for (var r = data.length - 1; r >= 1; r--) {
    if (data[r][statusCol] === 'arsip') {
      var fId = data[r][fileIdCol];
      if (fId) {
        try {
          DriveApp.getFileById(fId).setTrashed(true);
        } catch (e) {}
      }
      sheet.deleteRow(r + 1);
      deletedCount++;
    }
  }

  logActivity({
    user: user,
    action: 'EMPTY_TRASH',
    details: { deletedCount: deletedCount }
  }, targetSpreadsheetId);

  return { success: true, count: deletedCount, message: 'Berhasil mengosongkan ' + deletedCount + ' item dari keranjang sampah.' };
}

/**
 * Handle Penambahan Versi Baru Bank Soal
 */
function handleAddVersion(payload) {
  var id = payload.id;
  var base64Data = payload.base64;
  var fileName = payload.fileName || 'soal_v2.pdf';
  var user = payload.user || { id: 'u-1', name: 'Dra. Hj. Nurhayati, M.Pd.', email: 'nurhayati@sekolah.sch.id' };
  var catatan = payload.catatan || 'Revisi Versi Baru';
  var targetSpreadsheetId = payload.spreadsheetId || payload.spreadsheet_id;
  var rootFolderId = payload.driveFolderId || payload.rootFolderId;

  if (!base64Data) {
    return { success: false, error: { code: 'INVALID_FILE', message: 'Data base64 file PDF versi baru tidak ditemukan.' } };
  }

  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.BANK_SOAL);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: false, error: { code: 'NOT_FOUND', message: 'Bank soal tidak ditemukan.' } };

  var data = sheet.getRange(1, 1, lastRow, BANK_SOAL_COLUMNS.length).getValues();
  var headers = data[0];
  var rowIndex = -1;
  var currentObj = null;

  for (var r = 1; r < data.length; r++) {
    if (data[r][0] === id) {
      rowIndex = r + 1;
      currentObj = rowToObject(data[r], headers);
      break;
    }
  }

  if (rowIndex === -1 || !currentObj) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Bank soal tidak ditemukan.' } };
  }

  // Upload file versi baru ke Drive
  var decoded = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(decoded, 'application/pdf', fileName);
  var targetFolder = getOrCreateTargetFolder(currentObj.mata_pelajaran, currentObj.kelas, rootFolderId);
  var newDriveFile = targetFolder.createFile(blob);

  try {
    newDriveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {}

  var newFileId = newDriveFile.getId();
  var newFolderId = targetFolder.getId();
  var newWebViewUrl = newDriveFile.getUrl();
  var newDownloadUrl = newDriveFile.getDownloadUrl();
  var newSize = newDriveFile.getSize();
  var newVersion = (Number(currentObj.version) || 1) + 1;
  var now = new Date().toISOString();

  // Update row utama di sheets
  var fileIdCol = headers.indexOf('file_id');
  var folderIdCol = headers.indexOf('folder_id');
  var webViewCol = headers.indexOf('web_view_url');
  var downloadCol = headers.indexOf('download_url');
  var nameCol = headers.indexOf('nama_file');
  var sizeCol = headers.indexOf('ukuran_file');
  var verCol = headers.indexOf('version');
  var updatedCol = headers.indexOf('updated_at');

  if (fileIdCol !== -1) sheet.getRange(rowIndex, fileIdCol + 1).setValue(newFileId);
  if (folderIdCol !== -1) sheet.getRange(rowIndex, folderIdCol + 1).setValue(newFolderId);
  if (webViewCol !== -1) sheet.getRange(rowIndex, webViewCol + 1).setValue(newWebViewUrl);
  if (downloadCol !== -1) sheet.getRange(rowIndex, downloadCol + 1).setValue(newDownloadUrl);
  if (nameCol !== -1) sheet.getRange(rowIndex, nameCol + 1).setValue(fileName);
  if (sizeCol !== -1) sheet.getRange(rowIndex, sizeCol + 1).setValue(newSize);
  if (verCol !== -1) sheet.getRange(rowIndex, verCol + 1).setValue(newVersion);
  if (updatedCol !== -1) sheet.getRange(rowIndex, updatedCol + 1).setValue(now);

  logActivity({
    user: user,
    action: 'VERSION_UPDATE',
    bank_soal_id: id,
    file_id: newFileId,
    details: { version: newVersion, catatan: catatan, previous_file_id: currentObj.file_id }
  }, targetSpreadsheetId);

  var updatedRow = sheet.getRange(rowIndex, 1, 1, BANK_SOAL_COLUMNS.length).getValues()[0];
  return {
    success: true,
    item: rowToObject(updatedRow, headers)
  };
}

/**
 * Daftar Bank Soal dengan Search, Filter & Pagination
 */
function getBankSoalList(params, targetSpreadsheetId) {
  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.BANK_SOAL);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return { items: [], total: 0, page: 1, totalPages: 1 };
  }

  var data = sheet.getRange(1, 1, lastRow, BANK_SOAL_COLUMNS.length).getValues();
  var headers = data[0];
  var rows = data.slice(1);

  var items = [];
  var search = (params.search || '').toLowerCase();
  var mapel = params.mata_pelajaran;
  var jenjang = params.jenjang;
  var kelas = params.kelas;
  var reqStatus = params.status || 'aktif';

  for (var i = 0; i < rows.length; i++) {
    var obj = rowToObject(rows[i], headers);
    if (reqStatus === 'arsip' || reqStatus === 'trash') {
      if (obj.status !== 'arsip') continue;
    } else if (reqStatus !== 'all') {
      if (obj.status === 'arsip') continue;
    }

    if (mapel && obj.mata_pelajaran !== mapel) continue;
    if (jenjang && obj.jenjang !== jenjang) continue;
    if (kelas && String(obj.kelas) !== String(kelas)) continue;

    if (search) {
      var haystack = (obj.judul + ' ' + obj.nama_file + ' ' + obj.mata_pelajaran + ' ' + obj.bab + ' ' + obj.topik + ' ' + obj.deskripsi).toLowerCase();
      if (haystack.indexOf(search) === -1) continue;
    }

    items.push(obj);
  }

  var page = Number(params.page) || 1;
  var limit = Number(params.limit) || 12;
  var total = items.length;
  var totalPages = Math.ceil(total / limit) || 1;
  var paginated = items.slice((page - 1) * limit, page * limit);

  return {
    items: paginated,
    total: total,
    page: page,
    totalPages: totalPages
  };
}

/**
 * Dapatkan Bank Soal Berdasarkan ID
 */
function getBankSoalById(id, userId, targetSpreadsheetId) {
  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.BANK_SOAL);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: false, error: { code: 'NOT_FOUND', message: 'Bank soal tidak ditemukan.' } };

  var data = sheet.getRange(1, 1, lastRow, BANK_SOAL_COLUMNS.length).getValues();
  var headers = data[0];

  for (var r = 1; r < data.length; r++) {
    if (data[r][0] === id) {
      var obj = rowToObject(data[r], headers);
      var viewCol = headers.indexOf('view_count');
      if (viewCol !== -1) {
        var views = (Number(data[r][viewCol]) || 0) + 1;
        sheet.getRange(r + 1, viewCol + 1).setValue(views);
        obj.view_count = views;
      }
      return { success: true, item: obj };
    }
  }

  return { success: false, error: { code: 'NOT_FOUND', message: 'Bank soal tidak ditemukan.' } };
}

/**
 * ==============================================================================
 * CENTRAL CONFIGURATION & STORAGE PROFILES MANAGEMENT
 * ==============================================================================
 */

/**
 * Dapatkan System Config
 */
function getSystemConfig(targetSpreadsheetId) {
  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.SYSTEM_CONFIG);
  if (sheet.getLastRow() === 0) initSpreadsheet(targetSpreadsheetId);

  var lastRow = sheet.getLastRow();
  var configs = {};
  if (lastRow > 1) {
    var data = sheet.getRange(2, 1, lastRow - 1, SYSTEM_CONFIG_COLUMNS.length).getValues();
    for (var i = 0; i < data.length; i++) {
      var key = String(data[i][0]);
      var val = data[i][1];
      configs[key] = val;
    }
  }
  return { configs: configs };
}

/**
 * Simpan / Update System Config
 */
function saveSystemConfig(key, value, type, description, user, targetSpreadsheetId) {
  if (!key) return { success: false, error: { code: 'INVALID_KEY', message: 'Key config wajib diisi' } };
  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.SYSTEM_CONFIG);
  if (sheet.getLastRow() === 0) initSpreadsheet(targetSpreadsheetId);

  var lastRow = sheet.getLastRow();
  var now = new Date().toISOString();
  var updatedBy = (user && user.name) ? user.name : 'Admin';

  if (lastRow > 1) {
    var data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][0]) === key) {
        sheet.getRange(i + 2, 2).setValue(value);
        if (type) sheet.getRange(i + 2, 3).setValue(type);
        if (description) sheet.getRange(i + 2, 4).setValue(description);
        sheet.getRange(i + 2, 5).setValue(now);
        sheet.getRange(i + 2, 6).setValue(updatedBy);
        return { success: true, key: key, value: value, message: 'Konfigurasi sistem berhasil diperbarui.' };
      }
    }
  }

  sheet.appendRow([key, value, type || 'string', description || '', now, updatedBy]);
  return { success: true, key: key, value: value, message: 'Konfigurasi sistem berhasil disimpan.' };
}

/**
 * Dapatkan Semua Storage Profiles dari Sheets
 */
function getStorageProfiles(targetSpreadsheetId) {
  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.STORAGE_PROFILES);
  if (sheet.getLastRow() === 0) initSpreadsheet(targetSpreadsheetId);

  var lastRow = sheet.getLastRow();
  var profiles = [];
  if (lastRow > 1) {
    var data = sheet.getRange(1, 1, lastRow, STORAGE_PROFILES_COLUMNS.length).getValues();
    var headers = data[0];
    for (var r = 1; r < data.length; r++) {
      var prof = rowToObject(data[r], headers);
      prof.is_active = (prof.is_active === true || prof.is_active === 'TRUE' || prof.is_active === 'true' || prof.is_active === 1);
      prof.priority = Number(prof.priority) || 1;
      profiles.push(prof);
    }
  }

  // Cari active profile
  var activeProfile = profiles.find(function(p) { return p.is_active; }) || profiles[0] || null;

  return {
    profiles: profiles,
    active_profile: activeProfile
  };
}

/**
 * Dapatkan Active Storage Profile
 */
function getActiveStorageProfile(targetSpreadsheetId) {
  var all = getStorageProfiles(targetSpreadsheetId);
  return { profile: all.active_profile };
}

/**
 * Tambah Storage Profile Baru
 */
function createStorageProfile(profile, targetSpreadsheetId) {
  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.STORAGE_PROFILES);
  if (sheet.getLastRow() === 0) initSpreadsheet(targetSpreadsheetId);

  var id = profile.id || ('storage-' + ('000' + (sheet.getLastRow())).slice(-3));
  var now = new Date().toISOString();

  var row = [
    id,
    profile.name || 'Penyimpanan Tambahan',
    profile.description || '',
    profile.apps_script_url || '',
    profile.drive_folder_id || profile.google_drive_folder_id || '',
    profile.spreadsheet_id || profile.google_spreadsheet_id || '',
    Number(profile.priority) || 2,
    profile.status || 'INACTIVE',
    profile.is_active ? 'TRUE' : 'FALSE',
    profile.quota_status || 'NORMAL',
    profile.health_status || 'HEALTHY',
    now,
    now,
    now,
    now,
    profile.created_by || 'Admin'
  ];

  sheet.appendRow(row);
  return { success: true, profile: rowToObject(row, STORAGE_PROFILES_COLUMNS) };
}

/**
 * Update Storage Profile
 */
function updateStorageProfile(id, profile, targetSpreadsheetId) {
  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.STORAGE_PROFILES);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: false, error: { code: 'NOT_FOUND', message: 'Profil tidak ditemukan' } };

  var data = sheet.getRange(1, 1, lastRow, STORAGE_PROFILES_COLUMNS.length).getValues();
  var headers = data[0];
  var rowIndex = -1;

  for (var r = 1; r < data.length; r++) {
    if (data[r][0] === id) {
      rowIndex = r + 1;
      break;
    }
  }

  if (rowIndex === -1) return { success: false, error: { code: 'NOT_FOUND', message: 'Profil tidak ditemukan' } };

  var now = new Date().toISOString();
  for (var key in profile) {
    var colIdx = headers.indexOf(key);
    if (colIdx !== -1) {
      var val = profile[key];
      if (key === 'is_active') val = val ? 'TRUE' : 'FALSE';
      sheet.getRange(rowIndex, colIdx + 1).setValue(val);
    }
  }

  var updatedCol = headers.indexOf('updated_at');
  if (updatedCol !== -1) sheet.getRange(rowIndex, updatedCol + 1).setValue(now);

  var updatedRow = sheet.getRange(rowIndex, 1, 1, STORAGE_PROFILES_COLUMNS.length).getValues()[0];
  return { success: true, profile: rowToObject(updatedRow, headers) };
}

/**
 * Hapus Storage Profile
 */
function deleteStorageProfile(id, targetSpreadsheetId) {
  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.STORAGE_PROFILES);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: false, error: { code: 'NOT_FOUND', message: 'Profil tidak ditemukan' } };

  var data = sheet.getRange(1, 1, lastRow, 1).getValues();
  var rowIndex = -1;

  for (var r = 1; r < data.length; r++) {
    if (data[r][0] === id) {
      rowIndex = r + 1;
      break;
    }
  }

  if (rowIndex === -1) return { success: false, error: { code: 'NOT_FOUND', message: 'Profil tidak ditemukan' } };

  sheet.deleteRow(rowIndex);
  return { success: true, message: 'Profil storage berhasil dihapus dari Google Sheets.' };
}

/**
 * Set Profil sebagai Active Storage Global
 */
function setActiveStorageProfile(id, targetSpreadsheetId) {
  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.STORAGE_PROFILES);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: false, error: { code: 'NOT_FOUND', message: 'Profil tidak ditemukan' } };

  var data = sheet.getRange(1, 1, lastRow, STORAGE_PROFILES_COLUMNS.length).getValues();
  var headers = data[0];
  var isActCol = headers.indexOf('is_active');
  var statusCol = headers.indexOf('status');
  var activeObj = null;

  for (var r = 1; r < data.length; r++) {
    var match = (data[r][0] === id);
    sheet.getRange(r + 1, isActCol + 1).setValue(match ? 'TRUE' : 'FALSE');
    if (match) {
      sheet.getRange(r + 1, statusCol + 1).setValue('ACTIVE');
      activeObj = rowToObject(data[r], headers);
      activeObj.is_active = true;
      activeObj.status = 'ACTIVE';
    }
  }

  // Update SYSTEM_CONFIG
  saveSystemConfig('ACTIVE_STORAGE_PROFILE_ID', id, 'string', 'ID Profil Penyimpanan Aktif Global', null, targetSpreadsheetId);

  return { success: true, active_profile: activeObj, message: 'Profil ' + id + ' telah diaktifkan secara global.' };
}

/**
 * Sinkronisasi Komparatif Dua Arah Drive ↔ Sheets
 */
function syncDriveWithSheets(driveFolderId, targetSpreadsheetId) {
  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.BANK_SOAL);
  var rootFolder = resolveRootFolder(driveFolderId);

  var lastRow = sheet.getLastRow();
  var sheetData = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, BANK_SOAL_COLUMNS.length).getValues() : [];

  var indexedFileIds = {};
  for (var i = 0; i < sheetData.length; i++) {
    var fId = sheetData[i][3];
    if (fId) indexedFileIds[fId] = true;
  }

  var missingCount = 0;
  var syncedCount = 0;
  var unindexedItems = [];

  function scanFolder(folder) {
    var files = folder.getFiles();
    while (files.hasNext()) {
      var file = files.next();
      var id = file.getId();
      if (file.getMimeType() === 'application/pdf') {
        if (indexedFileIds[id]) {
          syncedCount++;
        } else {
          unindexedItems.push({
            name: file.getName(),
            file_id: id,
            size: file.getSize()
          });
        }
      }
    }
    var subFolders = folder.getFolders();
    while (subFolders.hasNext()) {
      scanFolder(subFolders.next());
    }
  }

  scanFolder(rootFolder);

  var syncId = 'sync-' + new Date().getTime();
  var syncLogSheet = getOrCreateSheet(ss, SHEET_NAMES.SYNC_LOG);
  if (syncLogSheet.getLastRow() === 0) {
    syncLogSheet.appendRow(SYNC_LOG_COLUMNS);
    formatHeader(syncLogSheet, SYNC_LOG_COLUMNS);
  }
  syncLogSheet.appendRow([
    syncId,
    new Date().toISOString(),
    'SUCCESS',
    syncedCount + unindexedItems.length,
    missingCount,
    unindexedItems.length,
    'Sinkronisasi folder Drive ' + rootFolder.getName() + ' selesai.'
  ]);

  return {
    sync_id: syncId,
    status: 'SUCCESS',
    total_scanned: syncedCount + unindexedItems.length,
    synced_count: syncedCount,
    missing_count: missingCount,
    unindexed_count: unindexedItems.length,
    unindexed_items: unindexedItems,
    details: 'Sinkronisasi berhasil: ' + syncedCount + ' file PDF sinkron, ' + unindexedItems.length + ' file baru di Drive terdeteksi.'
  };
}

/**
 * ==============================================================================
 * USERS, CATEGORIES, LOGS, STATS
 * ==============================================================================
 */

function getUsers(targetSpreadsheetId) {
  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.USERS);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { users: [] };
  var data = sheet.getRange(1, 1, lastRow, USERS_COLUMNS.length).getValues();
  var headers = data[0];
  var users = [];
  for (var r = 1; r < data.length; r++) {
    users.push(rowToObject(data[r], headers));
  }
  return { users: users };
}

function createUser(userData, adminUser, targetSpreadsheetId) {
  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.USERS);
  var id = userData.id || ('u-' + new Date().getTime());
  var now = new Date().toISOString();
  var row = [
    id,
    userData.name || 'Pengguna Baru',
    userData.email || '',
    userData.role || 'GURU',
    userData.status || 'ACTIVE',
    userData.school_institution || '',
    userData.subject || '',
    userData.avatar || '',
    now,
    now
  ];
  sheet.appendRow(row);
  return { success: true, user: rowToObject(row, USERS_COLUMNS) };
}

function updateUser(id, userData, adminUser, targetSpreadsheetId) {
  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.USERS);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: false, error: { code: 'NOT_FOUND', message: 'User tidak ditemukan' } };
  var data = sheet.getRange(1, 1, lastRow, USERS_COLUMNS.length).getValues();
  var headers = data[0];
  var rowIndex = -1;

  for (var r = 1; r < data.length; r++) {
    if (data[r][0] === id) {
      rowIndex = r + 1;
      break;
    }
  }

  if (rowIndex === -1) return { success: false, error: { code: 'NOT_FOUND', message: 'User tidak ditemukan' } };

  for (var key in userData) {
    var colIdx = headers.indexOf(key);
    if (colIdx !== -1) {
      sheet.getRange(rowIndex, colIdx + 1).setValue(userData[key]);
    }
  }

  var updatedCol = headers.indexOf('updated_at');
  if (updatedCol !== -1) sheet.getRange(rowIndex, updatedCol + 1).setValue(new Date().toISOString());

  var updatedRow = sheet.getRange(rowIndex, 1, 1, USERS_COLUMNS.length).getValues()[0];
  return { success: true, user: rowToObject(updatedRow, headers) };
}

function deleteUser(id, adminUser, targetSpreadsheetId) {
  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.USERS);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: false, error: { code: 'NOT_FOUND', message: 'User tidak ditemukan' } };
  var data = sheet.getRange(1, 1, lastRow, 1).getValues();
  var rowIndex = -1;

  for (var r = 1; r < data.length; r++) {
    if (data[r][0] === id) {
      rowIndex = r + 1;
      break;
    }
  }

  if (rowIndex === -1) return { success: false, error: { code: 'NOT_FOUND', message: 'User tidak ditemukan' } };
  sheet.deleteRow(rowIndex);
  return { success: true, message: 'User berhasil dihapus.' };
}

function getCategories(targetSpreadsheetId) {
  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.CATEGORIES);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { categories: [] };
  var data = sheet.getRange(1, 1, lastRow, CATEGORIES_COLUMNS.length).getValues();
  var headers = data[0];
  var list = [];
  for (var r = 1; r < data.length; r++) {
    list.push(rowToObject(data[r], headers));
  }
  return { categories: list };
}

function addCategory(cat, targetSpreadsheetId) {
  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.CATEGORIES);
  var id = cat.id || 'c-' + new Date().getTime();
  var row = [
    id,
    cat.type || 'mata_pelajaran',
    cat.name,
    cat.code || '',
    cat.title || cat.name,
    cat.description || '',
    cat.icon || 'Folder',
    cat.color || 'from-blue-600 to-indigo-600'
  ];
  sheet.appendRow(row);
  return { success: true, category: rowToObject(row, CATEGORIES_COLUMNS) };
}

function updateCategory(id, cat, targetSpreadsheetId) {
  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.CATEGORIES);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: false, error: { code: 'NOT_FOUND', message: 'Kategori tidak ditemukan' } };
  var data = sheet.getRange(1, 1, lastRow, CATEGORIES_COLUMNS.length).getValues();
  var headers = data[0];
  var rowIndex = -1;

  for (var r = 1; r < data.length; r++) {
    if (data[r][0] === id) {
      rowIndex = r + 1;
      break;
    }
  }

  if (rowIndex === -1) return { success: false, error: { code: 'NOT_FOUND', message: 'Kategori tidak ditemukan' } };

  for (var key in cat) {
    var colIdx = headers.indexOf(key);
    if (colIdx !== -1) {
      sheet.getRange(rowIndex, colIdx + 1).setValue(cat[key]);
    }
  }

  var updatedRow = sheet.getRange(rowIndex, 1, 1, CATEGORIES_COLUMNS.length).getValues()[0];
  return { success: true, category: rowToObject(updatedRow, headers) };
}

function deleteCategory(id, targetSpreadsheetId) {
  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.CATEGORIES);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: false, error: { code: 'NOT_FOUND', message: 'Kategori tidak ditemukan' } };
  var data = sheet.getRange(1, 1, lastRow, 1).getValues();
  var rowIndex = -1;

  for (var r = 1; r < data.length; r++) {
    if (data[r][0] === id) {
      rowIndex = r + 1;
      break;
    }
  }

  if (rowIndex === -1) return { success: false, error: { code: 'NOT_FOUND', message: 'Kategori tidak ditemukan' } };
  sheet.deleteRow(rowIndex);
  return { success: true, message: 'Kategori berhasil dihapus.' };
}

function getAuditLogs(limit, targetSpreadsheetId) {
  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.ACTIVITY_LOG);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { logs: [] };
  var maxRows = Math.min(limit || 100, lastRow - 1);
  var startRow = Math.max(2, lastRow - maxRows + 1);
  var data = sheet.getRange(startRow, 1, maxRows, ACTIVITY_LOG_COLUMNS.length).getValues();
  var headers = ACTIVITY_LOG_COLUMNS;
  var logs = [];
  for (var r = data.length - 1; r >= 0; r--) {
    logs.push(rowToObject(data[r], headers));
  }
  return { logs: logs };
}

function logActivity(entry, targetSpreadsheetId) {
  try {
    var ss = resolveSpreadsheet(targetSpreadsheetId);
    var sheet = getOrCreateSheet(ss, SHEET_NAMES.ACTIVITY_LOG);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(ACTIVITY_LOG_COLUMNS);
      formatHeader(sheet, ACTIVITY_LOG_COLUMNS);
    }
    var user = entry.user || {};
    var logId = 'log-' + new Date().getTime();
    sheet.appendRow([
      logId,
      new Date().toISOString(),
      user.id || 'u-1',
      user.name || 'Pengajar',
      user.role || 'GURU',
      entry.action || 'ACTIVITY',
      entry.bank_soal_id || '',
      entry.file_id || '',
      typeof entry.details === 'object' ? JSON.stringify(entry.details) : String(entry.details || '')
    ]);
    return { success: true, log_id: logId };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function getUserFavorites(userId, targetSpreadsheetId) {
  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.FAVORITES);
  var lastRow = sheet.getLastRow();
  var list = [];
  if (lastRow > 1) {
    var data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
    for (var i = 0; i < data.length; i++) {
      if (data[i][0] === userId) {
        list.push(String(data[i][1]));
      }
    }
  }
  return { favorites: list };
}

function toggleFavorite(userId, soalId, targetSpreadsheetId) {
  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.FAVORITES);
  var lastRow = sheet.getLastRow();

  if (lastRow > 1) {
    var data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    for (var i = 0; i < data.length; i++) {
      if (data[i][0] === userId && data[i][1] === soalId) {
        sheet.deleteRow(i + 2);
        return { success: true, is_favorite: false };
      }
    }
  }

  sheet.appendRow([userId, soalId, new Date().toISOString()]);
  return { success: true, is_favorite: true };
}

function getStats(targetSpreadsheetId) {
  var ss = resolveSpreadsheet(targetSpreadsheetId);
  var sheet = getOrCreateSheet(ss, SHEET_NAMES.BANK_SOAL);
  var lastRow = sheet.getLastRow();
  var totalSoal = Math.max(0, lastRow - 1);
  var totalBytes = 0;
  var mapelCounts = {};
  var jenjangCounts = {};

  if (totalSoal > 0) {
    var data = sheet.getRange(2, 1, totalSoal, BANK_SOAL_COLUMNS.length).getValues();
    var headers = BANK_SOAL_COLUMNS;
    var sizeCol = headers.indexOf('ukuran_file');
    var mapelCol = headers.indexOf('mata_pelajaran');
    var jenjangCol = headers.indexOf('jenjang');
    var statusCol = headers.indexOf('status');

    for (var i = 0; i < data.length; i++) {
      if (data[i][statusCol] === 'arsip') continue;
      totalBytes += Number(data[i][sizeCol]) || 0;
      var m = data[i][mapelCol] || 'Lainnya';
      mapelCounts[m] = (mapelCounts[m] || 0) + 1;
      var j = data[i][jenjangCol] || 'SMA';
      jenjangCounts[j] = (jenjangCounts[j] || 0) + 1;
    }
  }

  return {
    total_soal: totalSoal,
    total_pdf: totalSoal,
    total_storage_bytes: totalBytes,
    by_mapel: Object.keys(mapelCounts).map(function(k) { return { name: k, count: mapelCounts[k] }; }),
    by_jenjang: Object.keys(jenjangCounts).map(function(k) { return { name: k, count: jenjangCounts[k] }; })
  };
}

/**
 * Helper Konversi Row Array ke Object
 */
function rowToObject(row, headers) {
  var obj = {};
  for (var i = 0; i < headers.length; i++) {
    var key = headers[i];
    var val = row[i];
    if (key === 'tags' && typeof val === 'string') {
      obj[key] = val ? val.split(',').map(function(s) { return s.trim(); }) : [];
    } else if ((key === 'ukuran_file' || key === 'jumlah_halaman' || key === 'tahun' || key === 'download_count' || key === 'view_count' || key === 'version' || key === 'priority') && val !== '') {
      obj[key] = Number(val);
    } else if (key === 'is_active') {
      obj[key] = (val === true || val === 'TRUE' || val === 'true' || val === 1);
    } else {
      obj[key] = val;
    }
  }
  return obj;
}
