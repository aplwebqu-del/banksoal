/**
 * Google Apps Script Web App Template for Bank Soal PDF & Google Drive/Spreadsheet
 * Simpan dan deploy kode ini sebagai Web App di Google Apps Script (https://script.google.com)
 * Akses: "Anyone" (Siapa saja yang memiliki link)
 */

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT GATEWAY — SISTEM BANK SOAL & ARSIP UJIAN SEKOLAH
 * Jembatan Cloud Storage (Google Drive) & Database Realtime (Google Sheets)
 * Menangani 7 Tabel Utama:
 * 1. USERS (Pengguna / Guru / Admin)
 * 2. BANK_SOAL (Naskah Bank Soal & Metadata)
 * 3. CATEGORIES (Master Kategori Mapel, Jenjang, Kelas, Ujian, Kurikulum)
 * 4. TAGS (Tag & Label Soal)
 * 5. ACTIVITY_LOG (Audit Log & Riwayat Aktivitas)
 * 6. SETTINGS (Pengaturan Sistem & Sekolah)
 * 7. SYNC_LOG (Riwayat Sinkronisasi Cloud Storage)
 * =========================================================================
 * 
 * PETUNJUK DEPLOY (Hanya 1x Setup):
 * 1. Buka https://script.google.com lalu klik "+ Proyek Baru" (New project)
 * 2. Beri nama proyek, contoh: "Gateway Bank Soal PDF"
 * 3. Hapus semua kode bawaan di Code.gs, lalu TEMPEL (PASTE) SELURUH KODE INI.
 * 4. Klik tombol "Deploy" (di kanan atas) > "Deployment baru" (New deployment).
 * 5. Klik ikon gerigi (Select type) > Pilih "Aplikasi web" (Web app).
 * 6. Atur konfigurasi:
 *    - Deskripsi: Gateway Produksi 7 Tabel Bank Soal
 *    - Jalankan sebagai (Execute as): "Saya" (email Google Anda)
 *    - Yang memiliki akses (Who has access): "Siapa saja" (Anyone) -> WAJIB!
 * 7. Klik "Deploy", lalu klik "Beri izin" (Authorize access) dan izinkan Google Drive & Sheets.
 * 8. Salin "URL Aplikasi web" (berakhiran /exec) dan masukkan ke menu Penyimpanan Google pada aplikasi.
 * =========================================================================
 */

// Menangani permintaan GET (Pemeriksaan status & Tarik data)
function doGet(e) {
  try {
    var params = e ? e.parameter : {};
    var action = (params && params.action) ? params.action : "ping";
    
    if (action === "audit_tables" && params.spreadsheetId) {
      return handleAuditTables({ spreadsheetId: params.spreadsheetId });
    }
    
    if (action === "fetch_all" && params.spreadsheetId) {
      return handleFetchAll({ spreadsheetId: params.spreadsheetId });
    }

    if (action === "fetch_all_tables" && params.spreadsheetId) {
      return handleFetchAllTables({ spreadsheetId: params.spreadsheetId });
    }
    
    return jsonResponse({
      success: true,
      status: "OK",
      service: "Bank Soal PDF - 7 Tables Google Drive & Sheets Gateway",
      timestamp: new Date().toISOString(),
      version: "4.0.0",
      supported_tables: ["USERS", "BANK_SOAL", "CATEGORIES", "TAGS", "ACTIVITY_LOG", "SETTINGS", "SYNC_LOG"]
    });
  } catch (err) {
    return jsonResponse({
      success: false,
      error: err.toString()
    });
  }
}

// Menangani permintaan POST (Upload PDF, Simpan baris, Uji koneksi, Sync massal, Inisialisasi 7 tabel)
function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        data = { action: "raw", content: e.postData.contents };
      }
    }
    
    var action = data.action || (e && e.parameter ? e.parameter.action : "ping");
    
    switch (action) {
      case "ping":
        return jsonResponse({ success: true, message: "PONG", timestamp: new Date().toISOString() });
        
      case "test_connection":
        return handleTestConnection(data);

      case "audit_tables":
        return handleAuditTables(data);

      case "init_all_tables":
      case "initialize_tables":
        return handleInitAllTables(data);

      case "fetch_all_tables":
        return handleFetchAllTables(data);

      case "sync_all_tables":
        return handleSyncAllTables(data);
        
      case "upload_file":
      case "uploadBankSoal":
        return handleUploadAndSync(data);
        
      case "save_record":
      case "sync_bank_soal":
      case "updateBankSoal":
        return handleUpdateSpreadsheetIndex(data);
        
      case "fetch_all":
      case "fetchAll":
        return handleFetchAll(data);
        
      case "bulk_sync":
      case "push_all":
        return handleBulkSync(data);
        
      case "deleteBankSoal":
        return handleDeleteFromIndex(data);
        
      default:
        return jsonResponse({
          success: false,
          error_code: "UNKNOWN_ACTION",
          message: "Aksi tidak dikenali: " + action
        });
    }
  } catch (err) {
    return jsonResponse({
      success: false,
      error_code: "SERVER_EXCEPTION",
      message: "Terjadi kesalahan internal Google Apps Script: " + err.toString()
    });
  }
}

/**
 * 1. UJI KONEKSI GOOGLE DRIVE & GOOGLE SPREADSHEET
 */
function handleTestConnection(data) {
  var driveStatus = { connected: false, message: "" };
  var sheetsStatus = { connected: false, message: "" };
  var folderName = "";
  var spreadsheetName = "";
  var tableSummary = [];
  
  // Uji Folder Google Drive
  if (data.driveFolderId && String(data.driveFolderId).trim().length > 0) {
    try {
      var folder = DriveApp.getFolderById(String(data.driveFolderId).trim());
      folderName = folder.getName();
      driveStatus.connected = true;
      driveStatus.name = folderName;
      driveStatus.message = "Folder Google Drive terhubung: \\"" + folderName + "\\"";
    } catch (e) {
      driveStatus.connected = false;
      driveStatus.message = "Folder Google Drive tidak dapat dibuka (" + e.message + "). Pastikan Folder ID valid.";
    }
  } else {
    driveStatus.message = "Folder ID Google Drive belum diisi";
  }
  
  // Uji Google Spreadsheet & pastikan 7 tabel tersedia
  if (data.spreadsheetId && String(data.spreadsheetId).trim().length > 0) {
    try {
      var ss = SpreadsheetApp.openById(String(data.spreadsheetId).trim());
      spreadsheetName = ss.getName();
      sheetsStatus.connected = true;
      sheetsStatus.name = spreadsheetName;
      sheetsStatus.message = "Google Spreadsheet terhubung: \\"" + spreadsheetName + "\\"";
      
      // Audit status tabel
      var audit = inspectAllTables(ss);
      tableSummary = audit.tables;
      sheetsStatus.tables_count = audit.existing_count;
      sheetsStatus.all_tables_ready = audit.all_ready;
    } catch (e) {
      sheetsStatus.connected = false;
      sheetsStatus.message = "Google Spreadsheet tidak dapat dibuka (" + e.message + "). Pastikan Spreadsheet ID valid.";
    }
  } else {
    sheetsStatus.message = "Spreadsheet ID belum diisi";
  }
  
  var overallSuccess = driveStatus.connected && sheetsStatus.connected;
  
  return jsonResponse({
    success: overallSuccess,
    action: "test_connection",
    drive: driveStatus,
    spreadsheet: sheetsStatus,
    tables: tableSummary,
    message: overallSuccess 
      ? "Koneksi Google Drive & Spreadsheet berhasil terverifikasi penuh!" 
      : "Koneksi belum lengkap. Silakan periksa konfigurasi ID Folder dan Spreadsheet.",
    timestamp: new Date().toISOString()
  });
}

/**
 * 2. AUDIT SEMUA TABEL DI GOOGLE SPREADSHEET
 */
function handleAuditTables(data) {
  if (!data.spreadsheetId) {
    return jsonResponse({ success: false, message: "Spreadsheet ID wajib diisi" });
  }

  try {
    var ss = SpreadsheetApp.openById(String(data.spreadsheetId).trim());
    var audit = inspectAllTables(ss);
    
    return jsonResponse({
      success: true,
      spreadsheet_name: ss.getName(),
      spreadsheet_id: ss.getId(),
      total_tables_required: audit.total_required,
      existing_tables_count: audit.existing_count,
      missing_tables_count: audit.missing_count,
      all_tables_ready: audit.all_ready,
      tables: audit.tables,
      message: audit.all_ready
        ? "Semua 7 tabel (" + audit.existing_count + "/7) tersedia dan siap digunakan!"
        : "Terdapat " + audit.missing_count + " tabel yang belum dibuat di Spreadsheet.",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return jsonResponse({
      success: false,
      message: "Gagal mengaudit Spreadsheet: " + err.toString()
    });
  }
}

/**
 * 3. INISIALISASI & BUAT OTOMATIS SEMUA 7 TABEL BESERTA DATA AWAL
 */
function handleInitAllTables(data) {
  if (!data.spreadsheetId) {
    return jsonResponse({ success: false, message: "Spreadsheet ID wajib diisi" });
  }

  try {
    var ss = SpreadsheetApp.openById(String(data.spreadsheetId).trim());
    var customSeed = data.seedData || {};
    var createdSheets = [];
    var updatedSheets = [];

    // Inisialisasi 1: USERS
    var resUsers = initSheetUsers(ss, customSeed.users);
    if (resUsers.created) createdSheets.push("USERS"); else updatedSheets.push("USERS");

    // Inisialisasi 2: BANK_SOAL
    var resBankSoal = initSheetBankSoal(ss, customSeed.bank_soal);
    if (resBankSoal.created) createdSheets.push("BANK_SOAL"); else updatedSheets.push("BANK_SOAL");

    // Inisialisasi 3: CATEGORIES
    var resCategories = initSheetCategories(ss, customSeed.categories);
    if (resCategories.created) createdSheets.push("CATEGORIES"); else updatedSheets.push("CATEGORIES");

    // Inisialisasi 4: TAGS
    var resTags = initSheetTags(ss, customSeed.tags);
    if (resTags.created) createdSheets.push("TAGS"); else updatedSheets.push("TAGS");

    // Inisialisasi 5: ACTIVITY_LOG
    var resActivity = initSheetActivityLog(ss, customSeed.audit_logs);
    if (resActivity.created) createdSheets.push("ACTIVITY_LOG"); else updatedSheets.push("ACTIVITY_LOG");

    // Inisialisasi 6: SETTINGS
    var resSettings = initSheetSettings(ss, customSeed.settings);
    if (resSettings.created) createdSheets.push("SETTINGS"); else updatedSheets.push("SETTINGS");

    // Inisialisasi 7: SYNC_LOG
    var resSyncLog = initSheetSyncLog(ss, customSeed.sync_logs);
    if (resSyncLog.created) createdSheets.push("SYNC_LOG"); else updatedSheets.push("SYNC_LOG");

    // Catat log audit inisialisasi di sheet ACTIVITY_LOG & SYNC_LOG
    logSystemActivity(ss, "INIT_TABLES", "Berhasil menginisialisasi 7 tabel database pada spreadsheet: " + ss.getName());

    var auditAfter = inspectAllTables(ss);

    return jsonResponse({
      success: true,
      message: "Berhasil menginisialisasi 7 tabel lengkap dengan format header dan data awal!",
      created_sheets: createdSheets,
      updated_sheets: updatedSheets,
      tables: auditAfter.tables,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return jsonResponse({
      success: false,
      message: "Gagal menginisialisasi tabel: " + err.toString()
    });
  }
}

/**
 * 4. TARIK SEMUA DATA DARI 7 TABEL SPREADSHEET KE APLIKASI
 */
function handleFetchAllTables(data) {
  if (!data.spreadsheetId) {
    return jsonResponse({ success: false, message: "Spreadsheet ID wajib diisi" });
  }

  try {
    var ss = SpreadsheetApp.openById(String(data.spreadsheetId).trim());
    
    var users = fetchUsersData(ss);
    var bankSoal = fetchBankSoalData(ss);
    var categories = fetchCategoriesData(ss);
    var tags = fetchTagsData(ss);
    var activityLogs = fetchActivityLogData(ss);
    var settings = fetchSettingsData(ss);
    var syncLogs = fetchSyncLogData(ss);

    return jsonResponse({
      success: true,
      spreadsheet_name: ss.getName(),
      tables: {
        users: users,
        bank_soal: bankSoal,
        categories: categories,
        tags: tags,
        activity_logs: activityLogs,
        settings: settings,
        sync_logs: syncLogs
      },
      counts: {
        users: users.length,
        bank_soal: bankSoal.length,
        categories: categories.length,
        tags: tags.length,
        activity_logs: activityLogs.length,
        settings: Object.keys(settings).length,
        sync_logs: syncLogs.length
      },
      message: "Semua data 7 tabel berhasil ditarik langsung dari Google Spreadsheet!",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return jsonResponse({
      success: false,
      message: "Gagal membaca seluruh tabel dari Spreadsheet: " + err.toString()
    });
  }
}

/**
 * 5. SINKRONISASI MASSAL SEMUA DATA DARI APLIKASI KE SPREADSHEET (7 TABEL)
 */
function handleSyncAllTables(data) {
  if (!data.spreadsheetId) {
    return jsonResponse({ success: false, message: "Spreadsheet ID wajib diisi" });
  }

  try {
    var ss = SpreadsheetApp.openById(String(data.spreadsheetId).trim());
    var tables = data.tables || {};

    if (tables.users) syncUsersData(ss, tables.users);
    if (tables.bank_soal) syncBankSoalData(ss, tables.bank_soal);
    if (tables.categories) syncCategoriesData(ss, tables.categories);
    if (tables.tags) syncTagsData(ss, tables.tags);
    if (tables.activity_logs || tables.audit_logs) syncActivityLogData(ss, tables.activity_logs || tables.audit_logs);
    if (tables.settings) syncSettingsData(ss, tables.settings);
    if (tables.sync_logs) syncSyncLogData(ss, tables.sync_logs);

    logSystemActivity(ss, "SYNC_ALL_TABLES", "Sinkronisasi massal seluruh data aplikasi ke 7 tabel Spreadsheet");

    var auditAfter = inspectAllTables(ss);

    return jsonResponse({
      success: true,
      message: "Seluruh data 7 tabel berhasil disinkronkan ke Google Spreadsheet!",
      tables: auditAfter.tables,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return jsonResponse({
      success: false,
      message: "Gagal sinkronisasi seluruh tabel: " + err.toString()
    });
  }
}

/**
 * 6. UNGGAH PDF KE GOOGLE DRIVE & SIMPAN BARIS KE SPREADSHEET
 */
function handleUploadAndSync(data) {
  var payload = data.payload || data.bankSoalItem || data;
  var driveFileId = "";
  var webViewUrl = "";
  var downloadUrl = "";
  var driveSuccess = false;
  var driveError = "";
  
  // Simpan berkas PDF ke Folder Google Drive
  if (payload.file_base64 && data.driveFolderId) {
    try {
      var folder = DriveApp.getFolderById(String(data.driveFolderId).trim());
      var fileName = payload.file_name || (payload.title ? payload.title + ".pdf" : "Naskah_Soal.pdf");
      if (!fileName.toLowerCase().endsWith(".pdf")) {
        fileName += ".pdf";
      }
      
      var decodedBytes = Utilities.base64Decode(payload.file_base64);
      var blob = Utilities.newBlob(decodedBytes, "application/pdf", fileName);
      var createdFile = folder.createFile(blob);
      
      try {
        createdFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (shareErr) {}
      
      driveFileId = createdFile.getId();
      webViewUrl = createdFile.getUrl();
      downloadUrl = createdFile.getDownloadUrl() || ("https://drive.google.com/uc?export=download&id=" + driveFileId);
      driveSuccess = true;
    } catch (err) {
      driveSuccess = false;
      driveError = err.toString();
      return jsonResponse({
        success: false,
        error_code: "DRIVE_UPLOAD_FAILED",
        message: "Gagal menyimpan file ke Google Drive: " + driveError
      });
    }
  } else if (!data.driveFolderId) {
    return jsonResponse({
      success: false,
      error_code: "MISSING_DRIVE_FOLDER_ID",
      message: "Folder ID Google Drive tidak ditemukan pada permintaan upload."
    });
  }
  
  // Sinkronisasi Baris ke Google Spreadsheet (Sheet BANK_SOAL)
  var sheetSynced = false;
  var sheetError = "";
  if (data.spreadsheetId) {
    try {
      var ss = SpreadsheetApp.openById(String(data.spreadsheetId).trim());
      var sheet = getOrCreateSheet(ss, "BANK_SOAL", [
        "ID_BISNIS", "JUDUL_SOAL", "MATA_PELAJARAN", "JENJANG", "KELAS", 
        "KURIKULUM", "BAB_TOPIK", "JENIS_SOAL", "KESULITAN", "TAHUN_AJARAN", 
        "SEMESTER", "TAGS", "NAMA_FILE", "DRIVE_FILE_ID", "DRIVE_LINK", 
        "UKURAN_FILE", "PENGUNGGAH", "STATUS", "JUMLAH_DOWNLOAD", "JUMLAH_VIEW", 
        "TANGGAL_UPLOAD", "TIMESTAMP_SYNC"
      ], "#0F172A");
      
      var tagsString = Array.isArray(payload.tags) ? payload.tags.join(", ") : (payload.tags || "");
      var businessId = payload.business_id || ("BS-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss"));
      var finalDriveId = driveFileId || payload.drive_file_id || "-";
      var finalViewUrl = webViewUrl || payload.web_view_url || (finalDriveId !== "-" ? "https://drive.google.com/file/d/" + finalDriveId + "/view" : "-");
      
      sheet.appendRow([
        businessId,
        payload.title || "Naskah Soal",
        payload.mata_pelajaran || "-",
        payload.jenjang || "-",
        payload.kelas || "-",
        payload.kurikulum || "-",
        (payload.bab || "-") + " / " + (payload.topik || "-"),
        payload.jenis_soal || "-",
        payload.tingkat_kesulitan || "-",
        payload.tahun_ajaran || "-",
        payload.semester || "-",
        tagsString,
        payload.file_name || "-",
        finalDriveId,
        finalViewUrl,
        payload.file_size_formatted || "-",
        payload.created_by_name || "-",
        "AKTIF",
        0,
        0,
        payload.created_at || new Date().toISOString(),
        new Date().toISOString()
      ]);

      // Catat ke tabel ACTIVITY_LOG & SYNC_LOG
      logUserActivity(ss, payload.created_by_id || "usr-guru", payload.created_by_name || "Guru", "UPLOAD", "BankSoal", businessId, payload.title || "Naskah Soal", "Upload PDF ke Drive dan sinkronkan metadata ke Spreadsheet");
      logSyncEntry(ss, payload.storage_profile_id || "strg-primary-01", payload.storage_profile_name || "Google Storage Utama", businessId, payload.title || "Naskah Soal", "UPLOAD_DRIVE", "SUCCESS", 0, "");

      sheetSynced = true;
    } catch (e) {
      sheetSynced = false;
      sheetError = e.toString();
    }
  }
  
  return jsonResponse({
    success: true,
    file_id: driveFileId,
    web_view_url: webViewUrl,
    download_url: downloadUrl,
    sheet_synced: sheetSynced,
    sheet_error: sheetError ? sheetError : undefined,
    message: "Berkas PDF berhasil diunggah ke Google Drive dan diindeks ke Google Spreadsheet!",
    timestamp: new Date().toISOString()
  });
}

/**
 * 7. UPDATE ATAU TAMBAHKAN BARIS SPREADSHEET BANK_SOAL
 */
function handleUpdateSpreadsheetIndex(data) {
  var payload = data.payload || data.bankSoalItem || {};
  if (!data.spreadsheetId) {
    return jsonResponse({ success: false, message: "Spreadsheet ID tidak ditentukan" });
  }
  
  try {
    var ss = SpreadsheetApp.openById(String(data.spreadsheetId).trim());
    var sheet = getOrCreateSheet(ss, "BANK_SOAL", [
      "ID_BISNIS", "JUDUL_SOAL", "MATA_PELAJARAN", "JENJANG", "KELAS", 
      "KURIKULUM", "BAB_TOPIK", "JENIS_SOAL", "KESULITAN", "TAHUN_AJARAN", 
      "SEMESTER", "TAGS", "NAMA_FILE", "DRIVE_FILE_ID", "DRIVE_LINK", 
      "UKURAN_FILE", "PENGUNGGAH", "STATUS", "JUMLAH_DOWNLOAD", "JUMLAH_VIEW", 
      "TANGGAL_UPLOAD", "TIMESTAMP_SYNC"
    ], "#0F172A");

    var values = sheet.getDataRange().getValues();
    var targetId = payload.business_id;
    var rowFound = -1;
    
    if (targetId) {
      for (var i = 1; i < values.length; i++) {
        if (String(values[i][0]).trim() === String(targetId).trim()) {
          rowFound = i + 1;
          break;
        }
      }
    }
    
    var tagsString = Array.isArray(payload.tags) ? payload.tags.join(", ") : (payload.tags || "");
    var finalDriveId = payload.drive_file_id || "-";
    var finalViewUrl = payload.web_view_url || (finalDriveId !== "-" ? "https://drive.google.com/file/d/" + finalDriveId + "/view" : "-");
    
    var rowData = [
      payload.business_id || ("BS-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss")),
      payload.title || "Naskah Soal",
      payload.mata_pelajaran || "-",
      payload.jenjang || "-",
      payload.kelas || "-",
      payload.kurikulum || "-",
      (payload.bab || "-") + " / " + (payload.topik || "-"),
      payload.jenis_soal || "-",
      payload.tingkat_kesulitan || "-",
      payload.tahun_ajaran || "-",
      payload.semester || "-",
      tagsString,
      payload.file_name || "-",
      finalDriveId,
      finalViewUrl,
      payload.file_size_formatted || "-",
      payload.created_by_name || "-",
      payload.status === "trash" ? "TRASH" : "AKTIF",
      payload.download_count || 0,
      payload.view_count || 0,
      payload.created_at || new Date().toISOString(),
      new Date().toISOString()
    ];
    
    if (rowFound > 0) {
      sheet.getRange(rowFound, 1, 1, 22).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }
    
    return jsonResponse({
      success: true,
      action: rowFound > 0 ? "updated" : "inserted",
      business_id: payload.business_id,
      message: "Data naskah soal berhasil disimpan ke Google Spreadsheet!"
    });
  } catch (err) {
    return jsonResponse({
      success: false,
      message: "Gagal menyimpan baris: " + err.toString()
    });
  }
}

/**
 * 8. TARIK DATA DARI SHEET BANK_SOAL
 */
function handleFetchAll(data) {
  if (!data.spreadsheetId) {
    return jsonResponse({ success: false, items: [], message: "Spreadsheet ID tidak ditentukan" });
  }
  
  try {
    var ss = SpreadsheetApp.openById(String(data.spreadsheetId).trim());
    var items = fetchBankSoalData(ss);
    
    return jsonResponse({
      success: true,
      items: items,
      count: items.length,
      message: "Berhasil memuat " + items.length + " naskah soal langsung dari Google Spreadsheet!"
    });
  } catch (err) {
    return jsonResponse({
      success: false,
      items: [],
      message: "Gagal membaca Google Spreadsheet: " + err.toString()
    });
  }
}

/**
 * 9. SINKRONISASI MASSAL SHEET BANK_SOAL
 */
function handleBulkSync(data) {
  var items = data.items || data.bankSoalList || [];
  if (!data.spreadsheetId) {
    return jsonResponse({ success: false, message: "Spreadsheet ID tidak ditentukan" });
  }
  
  try {
    var ss = SpreadsheetApp.openById(String(data.spreadsheetId).trim());
    syncBankSoalData(ss, items);
    
    return jsonResponse({
      success: true,
      synced_count: items.length,
      message: "Berhasil mengekspor dan menyinkronkan " + items.length + " naskah soal ke Google Spreadsheet!"
    });
  } catch (err) {
    return jsonResponse({
      success: false,
      message: "Gagal ekspor massal ke Spreadsheet: " + err.toString()
    });
  }
}

/**
 * 10. HAPUS DARI INDEKS
 */
function handleDeleteFromIndex(data) {
  return handleUpdateSpreadsheetIndex(data);
}

// =========================================================================
// TABEL BUILDERS, AUDITORS & HELPERS (7 TABEL)
// =========================================================================

var REQUIRED_TABLES = [
  { name: "USERS", label: "Tabel Pengguna & Guru", color: "#1E293B" },
  { name: "BANK_SOAL", label: "Tabel Naskah Bank Soal", color: "#0F172A" },
  { name: "CATEGORIES", label: "Tabel Master Kategori", color: "#1E3A8A" },
  { name: "TAGS", label: "Tabel Tag & Label Soal", color: "#065F46" },
  { name: "ACTIVITY_LOG", label: "Tabel Log Audit & Aktivitas", color: "#701A75" },
  { name: "SETTINGS", label: "Tabel Pengaturan Sistem", color: "#78350F" },
  { name: "SYNC_LOG", label: "Tabel Riwayat Sinkronisasi", color: "#134E4A" }
];

function inspectAllTables(ss) {
  var sheets = ss.getSheets();
  var sheetMap = {};
  for (var i = 0; i < sheets.length; i++) {
    sheetMap[sheets[i].getName()] = sheets[i];
  }

  var tables = [];
  var existingCount = 0;

  for (var j = 0; j < REQUIRED_TABLES.length; j++) {
    var req = REQUIRED_TABLES[j];
    var sheet = sheetMap[req.name] || (req.name === "BANK_SOAL" ? (sheetMap["Index_BankSoal"] || sheetMap["BankSoal"]) : null);
    
    if (sheet) {
      existingCount++;
      var lastRow = sheet.getLastRow();
      var dataCount = Math.max(0, lastRow - 1);
      var lastCol = sheet.getLastColumn();
      
      tables.push({
        id: req.name,
        name: sheet.getName(),
        label: req.label,
        exists: true,
        status: dataCount > 0 ? "POPULATED" : "EMPTY_HEADER_READY",
        row_count: dataCount,
        column_count: lastCol,
        color: req.color,
        description: "Sheet aktif di Google Spreadsheet"
      });
    } else {
      tables.push({
        id: req.name,
        name: req.name,
        label: req.label,
        exists: false,
        status: "NOT_CREATED",
        row_count: 0,
        column_count: 0,
        color: req.color,
        description: "Belum dibuat di Spreadsheet"
      });
    }
  }

  return {
    total_required: REQUIRED_TABLES.length,
    existing_count: existingCount,
    missing_count: REQUIRED_TABLES.length - existingCount,
    all_ready: existingCount === REQUIRED_TABLES.length,
    tables: tables
  };
}

function getOrCreateSheet(ss, name, headers, headerColor) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    if (name === "BANK_SOAL") {
      sheet = ss.getSheetByName("Index_BankSoal");
    }
  }
  
  var created = false;
  if (!sheet) {
    sheet = ss.insertSheet(name);
    created = true;
  }

  if (sheet.getLastRow() === 0 && headers && headers.length > 0) {
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold")
               .setBackground(headerColor || "#0F172A")
               .setFontColor("#FFFFFF")
               .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }

  return sheet;
}

// 1. Inisialisasi Sheet USERS
function initSheetUsers(ss, customData) {
  var headers = ["USER_ID", "NAMA_LENGKAP", "EMAIL", "ROLE", "NIP", "SEKOLAH", "SPESIALISASI_MAPEL", "STATUS", "TERAKHIR_LOGIN", "TANGGAL_DIBUAT"];
  var sheet = ss.getSheetByName("USERS");
  var created = false;
  if (!sheet) {
    sheet = ss.insertSheet("USERS");
    created = true;
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
         .setFontWeight("bold")
         .setBackground("#1E293B")
         .setFontColor("#FFFFFF")
         .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);

    var rows = [];
    if (customData && customData.length > 0) {
      for (var i = 0; i < customData.length; i++) {
        var u = customData[i];
        rows.push([u.id, u.name, u.email, u.role, u.nip || "-", u.school || "SMA Negeri Unggulan 1", u.subject_specialty || "-", u.status || "ACTIVE", u.last_login || new Date().toISOString(), u.created_at || new Date().toISOString()]);
      }
    } else {
      rows = [
        ["usr-admin-01", "Ahmad Fauzi, M.Kom (Administrator)", "admin@banksoal.sch.id", "ADMIN", "19850312 201001 1 008", "SMA Negeri Unggulan 1", "Teknologi & Informatika", "ACTIVE", new Date().toISOString(), "2024-01-10T08:00:00.000Z"],
        ["usr-guru-01", "Dra. Siti Rahmawati, M.Pd", "siti.rahmawati@guru.sch.id", "GURU", "19890415 201402 2 003", "SMA Negeri Unggulan 1", "Matematika", "ACTIVE", new Date().toISOString(), "2024-01-15T09:30:00.000Z"],
        ["usr-guru-02", "Budi Santoso, S.Pd, M.Si", "budi.santoso@guru.sch.id", "GURU", "19920820 201903 1 005", "SMA Negeri Unggulan 1", "Fisika & IPA", "ACTIVE", new Date().toISOString(), "2024-02-01T10:00:00.000Z"],
        ["usr-guru-03", "Nurul Hidayah, S.Pd", "nurul.hidayah@guru.sch.id", "GURU", "19941105 202012 2 011", "SMA Negeri Unggulan 1", "Bahasa Indonesia", "ACTIVE", new Date().toISOString(), "2024-02-10T11:00:00.000Z"]
      ];
    }
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  return { sheet: sheet, created: created };
}

// 2. Inisialisasi Sheet BANK_SOAL
function initSheetBankSoal(ss, customData) {
  var headers = [
    "ID_BISNIS", "JUDUL_SOAL", "MATA_PELAJARAN", "JENJANG", "KELAS", 
    "KURIKULUM", "BAB_TOPIK", "JENIS_SOAL", "KESULITAN", "TAHUN_AJARAN", 
    "SEMESTER", "TAGS", "NAMA_FILE", "DRIVE_FILE_ID", "DRIVE_LINK", 
    "UKURAN_FILE", "PENGUNGGAH", "STATUS", "JUMLAH_DOWNLOAD", "JUMLAH_VIEW", 
    "TANGGAL_UPLOAD", "TIMESTAMP_SYNC"
  ];
  
  var sheet = ss.getSheetByName("BANK_SOAL");
  if (!sheet) sheet = ss.getSheetByName("Index_BankSoal");
  var created = false;
  if (!sheet) {
    sheet = ss.insertSheet("BANK_SOAL");
    created = true;
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
         .setFontWeight("bold")
         .setBackground("#0F172A")
         .setFontColor("#FFFFFF")
         .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);

    if (customData && customData.length > 0) {
      syncBankSoalData(ss, customData);
    }
  }
  return { sheet: sheet, created: created };
}

// 3. Inisialisasi Sheet CATEGORIES
function initSheetCategories(ss, customData) {
  var headers = ["ID_KATEGORI", "TIPE", "KODE", "NAMA_KATEGORI", "DESKRIPSI", "WARNA", "URUTAN", "TANGGAL_DIBUAT"];
  var sheet = ss.getSheetByName("CATEGORIES");
  var created = false;
  if (!sheet) {
    sheet = ss.insertSheet("CATEGORIES");
    created = true;
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
         .setFontWeight("bold")
         .setBackground("#1E3A8A")
         .setFontColor("#FFFFFF")
         .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);

    var rows = [];
    if (customData && customData.length > 0) {
      for (var i = 0; i < customData.length; i++) {
        var c = customData[i];
        rows.push([c.id, c.type, c.code, c.name, c.description || "-", c.color || "#3B82F6", c.order || (i + 1), c.created_at || new Date().toISOString()]);
      }
    } else {
      rows = [
        ["cat-mp-01", "MATA_PELAJARAN", "MAT", "Matematika", "Mata pelajaran Matematika wajib & peminatan", "#3B82F6", 1, new Date().toISOString()],
        ["cat-mp-02", "MATA_PELAJARAN", "BIND", "Bahasa Indonesia", "Mata pelajaran Bahasa Indonesia", "#10B981", 2, new Date().toISOString()],
        ["cat-mp-03", "MATA_PELAJARAN", "BING", "Bahasa Inggris", "Mata pelajaran Bahasa Inggris", "#8B5CF6", 3, new Date().toISOString()],
        ["cat-mp-04", "MATA_PELAJARAN", "FIS", "Fisika", "Mata pelajaran Fisika SMA/MA", "#F59E0B", 4, new Date().toISOString()],
        ["cat-mp-05", "MATA_PELAJARAN", "KIM", "Kimia", "Mata pelajaran Kimia SMA/MA", "#EC4899", 5, new Date().toISOString()],
        ["cat-mp-06", "MATA_PELAJARAN", "BIO", "Biologi", "Mata pelajaran Biologi SMA/MA", "#14B8A6", 6, new Date().toISOString()],
        ["cat-mp-07", "MATA_PELAJARAN", "EKO", "Ekonomi", "Mata pelajaran Ekonomi & Akuntansi", "#6366F1", 7, new Date().toISOString()],
        ["cat-mp-08", "MATA_PELAJARAN", "SOS", "Sosiologi", "Mata pelajaran Sosiologi SMA", "#F97316", 8, new Date().toISOString()],
        ["cat-mp-09", "MATA_PELAJARAN", "GEO", "Geografi", "Mata pelajaran Geografi SMA", "#84CC16", 9, new Date().toISOString()],
        ["cat-mp-10", "MATA_PELAJARAN", "SEJ", "Sejarah", "Mata pelajaran Sejarah Indonesia", "#A855F7", 10, new Date().toISOString()],
        ["cat-mp-11", "MATA_PELAJARAN", "INF", "Informatika", "Mata pelajaran Informatika & TIK", "#06B6D4", 11, new Date().toISOString()],
        ["cat-mp-12", "MATA_PELAJARAN", "PPKN", "Pendidikan Pancasila (PPKn)", "Pendidikan Kewarganegaraan", "#EF4444", 12, new Date().toISOString()],
        ["cat-mp-13", "MATA_PELAJARAN", "PAI", "Pendidikan Agama Islam", "Pendidikan Agama & Budi Pekerti", "#059669", 13, new Date().toISOString()],
        ["cat-jj-01", "JENJANG", "SD", "SD / MI", "Sekolah Dasar / Madrasah Ibtidaiyah", "#EF4444", 14, new Date().toISOString()],
        ["cat-jj-02", "JENJANG", "SMP", "SMP / MTs", "Sekolah Menengah Pertama", "#3B82F6", 15, new Date().toISOString()],
        ["cat-jj-03", "JENJANG", "SMA", "SMA / MA", "Sekolah Menengah Atas", "#64748B", 16, new Date().toISOString()],
        ["cat-jj-04", "JENJANG", "SMK", "SMK", "Sekolah Menengah Kejuruan", "#F59E0B", 17, new Date().toISOString()],
        ["cat-kur-01", "KURIKULUM", "MERDEKA", "Kurikulum Merdeka", "Kurikulum Merdeka Belajar", "#10B981", 18, new Date().toISOString()],
        ["cat-kur-02", "KURIKULUM", "K13", "Kurikulum 2013 (K13)", "Kurikulum 2013 Revisi", "#3B82F6", 19, new Date().toISOString()]
      ];
    }
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  return { sheet: sheet, created: created };
}

// 4. Inisialisasi Sheet TAGS
function initSheetTags(ss, customData) {
  var headers = ["ID_TAG", "NAMA_TAG", "WARNA", "JUMLAH_PENGGUNAAN", "TANGGAL_DIBUAT"];
  var sheet = ss.getSheetByName("TAGS");
  var created = false;
  if (!sheet) {
    sheet = ss.insertSheet("TAGS");
    created = true;
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
         .setFontWeight("bold")
         .setBackground("#065F46")
         .setFontColor("#FFFFFF")
         .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);

    var rows = [];
    if (customData && customData.length > 0) {
      for (var i = 0; i < customData.length; i++) {
        var t = customData[i];
        rows.push([t.id, t.name, t.color || "#3B82F6", t.usage_count || 0, t.created_at || new Date().toISOString()]);
      }
    } else {
      rows = [
        ["tag-01", "SNBT", "#3B82F6", 14, new Date().toISOString()],
        ["tag-02", "UTBK", "#8B5CF6", 12, new Date().toISOString()],
        ["tag-03", "HOTS", "#EF4444", 28, new Date().toISOString()],
        ["tag-04", "PTS", "#10B981", 22, new Date().toISOString()],
        ["tag-05", "PAS", "#F59E0B", 19, new Date().toISOString()],
        ["tag-06", "Literasi", "#06B6D4", 15, new Date().toISOString()],
        ["tag-07", "Numerasi", "#EC4899", 18, new Date().toISOString()],
        ["tag-08", "Fase E", "#64748B", 10, new Date().toISOString()],
        ["tag-09", "Fase F", "#6366F1", 11, new Date().toISOString()],
        ["tag-10", "Tryout", "#F97316", 16, new Date().toISOString()],
        ["tag-11", "Aljabar", "#14B8A6", 8, new Date().toISOString()],
        ["tag-12", "Trigonometri", "#A855F7", 7, new Date().toISOString()]
      ];
    }
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  return { sheet: sheet, created: created };
}

// 5. Inisialisasi Sheet ACTIVITY_LOG
function initSheetActivityLog(ss, customData) {
  var headers = ["LOG_ID", "USER_ID", "NAMA_USER", "ROLE", "AKSI", "TIPE_TARGET", "TARGET_ID", "TARGET_TITLE", "RINCIAN_DETAIL", "TIMESTAMP"];
  var sheet = ss.getSheetByName("ACTIVITY_LOG");
  var created = false;
  if (!sheet) {
    sheet = ss.insertSheet("ACTIVITY_LOG");
    created = true;
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
         .setFontWeight("bold")
         .setBackground("#701A75")
         .setFontColor("#FFFFFF")
         .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);

    var rows = [];
    if (customData && customData.length > 0) {
      for (var i = 0; i < customData.length; i++) {
        var l = customData[i];
        rows.push([l.id, l.user_id, l.user_name, l.role, l.action, l.target_type, l.target_id || "-", l.target_title || "-", l.details || "-", l.timestamp || new Date().toISOString()]);
      }
    } else {
      rows = [
        ["aud-001", "usr-admin-01", "Ahmad Fauzi, M.Kom (Administrator)", "ADMIN", "STORAGE_ACTIVATE", "StorageProfile", "strg-primary-01", "Google Storage Utama", "Mengaktifkan profil storage utama untuk sinkronisasi Google Drive & Spreadsheet", new Date(Date.now() - 86400000 * 3).toISOString()],
        ["aud-002", "usr-guru-01", "Dra. Siti Rahmawati, M.Pd", "GURU", "UPLOAD", "BankSoal", "BS-000001", "PTS Matematika Tingkat Lanjut", "Upload berkas PDF soal Matematika ke Google Drive", new Date(Date.now() - 86400000 * 2).toISOString()],
        ["aud-003", "usr-admin-01", "Ahmad Fauzi, M.Kom", "ADMIN", "STORAGE_TEST", "System", "-", "Database Audit", "Inisialisasi & Verifikasi 7 Tabel Spreadsheet Berhasil", new Date().toISOString()]
      ];
    }
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  return { sheet: sheet, created: created };
}

// 6. Inisialisasi Sheet SETTINGS
function initSheetSettings(ss, customData) {
  var headers = ["SETTING_KEY", "SETTING_VALUE", "KETERANGAN", "TIPE_DATA", "TERAKHIR_DIUBAH"];
  var sheet = ss.getSheetByName("SETTINGS");
  var created = false;
  if (!sheet) {
    sheet = ss.insertSheet("SETTINGS");
    created = true;
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
         .setFontWeight("bold")
         .setBackground("#78350F")
         .setFontColor("#FFFFFF")
         .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);

    var rows = [
      ["site_title", "Bank Soal PDF & Arsip Ujian", "Judul aplikasi web repositori", "STRING", new Date().toISOString()],
      ["school_name", "SMA Negeri Unggulan 1", "Nama resmi sekolah atau institusi", "STRING", new Date().toISOString()],
      ["organization_name", "SMA Negeri Unggulan 1", "Nama organisasi pengelola", "STRING", new Date().toISOString()],
      ["current_academic_year", "2024/2025", "Tahun ajaran aktif saat ini", "STRING", new Date().toISOString()],
      ["current_semester", "Ganjil", "Semester aktif (Ganjil / Genap)", "STRING", new Date().toISOString()],
      ["default_curriculum", "Kurikulum Merdeka", "Kurikulum standar dokumen", "STRING", new Date().toISOString()],
      ["allow_teacher_upload", "true", "Izinkan pengajar mengunggah naskah mandiri", "BOOLEAN", new Date().toISOString()],
      ["auto_sync_sheets", "true", "Otomatis sinkronisasi baris ke Google Sheets", "BOOLEAN", new Date().toISOString()],
      ["auto_failover", "true", "Alihkan otomatis ke storage cadangan jika error", "BOOLEAN", new Date().toISOString()],
      ["enable_ai_suggest", "true", "Aktifkan AI Metadata Suggestions (Gemini)", "BOOLEAN", new Date().toISOString()],
      ["max_upload_size_mb", "50", "Batas maksimal ukuran file PDF (MB)", "NUMBER", new Date().toISOString()],
      ["duplicate_check_strict", "true", "Cek duplikasi ketat berbasis hash SHA-256", "BOOLEAN", new Date().toISOString()],
      ["maintenance_mode", "false", "Status mode pemeliharaan server", "BOOLEAN", new Date().toISOString()]
    ];

    if (customData && typeof customData === "object") {
      var keys = Object.keys(customData);
      if (keys.length > 0) {
        rows = [];
        for (var k = 0; k < keys.length; k++) {
          var key = keys[k];
          var val = customData[key];
          var typeStr = typeof val === "boolean" ? "BOOLEAN" : (typeof val === "number" ? "NUMBER" : "STRING");
          rows.push([key, String(val), "Konfigurasi sistem: " + key, typeStr, new Date().toISOString()]);
        }
      }
    }
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  return { sheet: sheet, created: created };
}

// 7. Inisialisasi Sheet SYNC_LOG
function initSheetSyncLog(ss, customData) {
  var headers = ["SYNC_ID", "STORAGE_PROFILE_ID", "NAMA_STORAGE", "BANK_SOAL_ID", "JUDUL_SOAL", "AKSI_SYNC", "STATUS", "JUMLAH_RETRY", "PESAN_ERROR", "TIMESTAMP"];
  var sheet = ss.getSheetByName("SYNC_LOG");
  var created = false;
  if (!sheet) {
    sheet = ss.insertSheet("SYNC_LOG");
    created = true;
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
         .setFontWeight("bold")
         .setBackground("#134E4A")
         .setFontColor("#FFFFFF")
         .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);

    var rows = [
      ["sync-001", "strg-primary-01", "Google Storage Utama", "SYSTEM_INIT", "Inisialisasi 7 Tabel Database", "BULK_SYNC", "SUCCESS", 0, "-", new Date().toISOString()]
    ];

    if (customData && customData.length > 0) {
      rows = [];
      for (var i = 0; i < customData.length; i++) {
        var s = customData[i];
        rows.push([s.id, s.storage_profile_id, s.storage_profile_name, s.bank_soal_id, s.bank_soal_title, s.action, s.status, s.retry_count || 0, s.error_message || "-", s.timestamp || new Date().toISOString()]);
      }
    }
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  return { sheet: sheet, created: created };
}

// Data Fetchers
function fetchUsersData(ss) {
  var sheet = ss.getSheetByName("USERS");
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var values = sheet.getDataRange().getValues();
  var list = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[0]) continue;
    list.push({
      id: String(row[0]),
      name: String(row[1] || ""),
      email: String(row[2] || ""),
      role: String(row[3] || "GURU"),
      nip: String(row[4] || ""),
      school: String(row[5] || ""),
      subject_specialty: String(row[6] || ""),
      status: String(row[7] || "active").toLowerCase() === "active" ? "active" : "inactive",
      last_login: String(row[8] || new Date().toISOString()),
      created_at: String(row[9] || new Date().toISOString())
    });
  }
  return list;
}

function fetchBankSoalData(ss) {
  var sheet = ss.getSheetByName("BANK_SOAL") || ss.getSheetByName("Index_BankSoal");
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var values = sheet.getDataRange().getValues();
  var list = [];
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    if (!r[0] && !r[1]) continue;
    
    var tags = [];
    if (r[11]) {
      var rawTags = String(r[11]).split(",");
      for (var t = 0; t < rawTags.length; t++) {
        var trimmed = rawTags[t].trim();
        if (trimmed) tags.push(trimmed);
      }
    }
    
    var babTopik = String(r[6] || "").split("/");
    var bab = babTopik[0] ? babTopik[0].trim() : "Bab 1";
    var topik = babTopik[1] ? babTopik[1].trim() : "Materi Pokok";

    list.push({
      id: "bs-cloud-" + (i),
      business_id: String(r[0] || ("BS-" + String(i).padStart(6, "0"))),
      title: String(r[1] || "Naskah Soal"),
      mata_pelajaran: String(r[2] || "Umum"),
      jenjang: String(r[3] || "SMA"),
      kelas: String(r[4] || "10"),
      kurikulum: String(r[5] || "Kurikulum Merdeka"),
      bab: bab,
      topik: topik,
      subtopik: "",
      jenis_soal: String(r[7] || "Pilihan Ganda"),
      tingkat_kesulitan: String(r[8] || "Sedang"),
      tahun_ajaran: String(r[9] || "2024/2025"),
      semester: String(r[10] || "Ganjil"),
      tags: tags,
      file_name: String(r[12] || "Naskah.pdf"),
      file_hash: "",
      file_size: 1024 * 1024,
      file_size_formatted: String(r[15] || "1.0 MB"),
      page_count: 5,
      storage_profile_id: "strg-primary-01",
      storage_profile_name: "Google Storage Utama",
      drive_file_id: String(r[13] || ""),
      web_view_url: String(r[14] || ""),
      file_url: String(r[14] || ""),
      download_count: parseInt(r[18]) || 0,
      view_count: parseInt(r[19]) || 0,
      version_count: 1,
      current_version_number: 1,
      status: String(r[17] || "").toUpperCase() === "TRASH" ? "trash" : "active",
      sync_status: "SYNCED",
      created_by_id: "usr-guru-cloud",
      created_by_name: String(r[16] || "Guru Pengajar"),
      sumber: String(r[16] || "Guru Pengajar"),
      deskripsi: "Naskah Bank Soal " + String(r[2] || "") + " " + String(r[4] || ""),
      created_at: String(r[20] || new Date().toISOString()),
      updated_at: String(r[21] || new Date().toISOString())
    });
  }
  return list;
}

function fetchCategoriesData(ss) {
  var sheet = ss.getSheetByName("CATEGORIES");
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var values = sheet.getDataRange().getValues();
  var list = [];
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    if (!r[0]) continue;
    list.push({
      id: String(r[0]),
      type: String(r[1] || "MATA_PELAJARAN"),
      code: String(r[2] || ""),
      name: String(r[3] || ""),
      description: String(r[4] || ""),
      color: String(r[5] || "#3B82F6"),
      order: parseInt(r[6]) || i,
      created_at: String(r[7] || new Date().toISOString())
    });
  }
  return list;
}

function fetchTagsData(ss) {
  var sheet = ss.getSheetByName("TAGS");
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var values = sheet.getDataRange().getValues();
  var list = [];
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    if (!r[0]) continue;
    list.push({
      id: String(r[0]),
      name: String(r[1] || ""),
      color: String(r[2] || "#3B82F6"),
      usage_count: parseInt(r[3]) || 0,
      created_at: String(r[4] || new Date().toISOString())
    });
  }
  return list;
}

function fetchActivityLogData(ss) {
  var sheet = ss.getSheetByName("ACTIVITY_LOG");
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var values = sheet.getDataRange().getValues();
  var list = [];
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    if (!r[0]) continue;
    list.push({
      id: String(r[0]),
      user_id: String(r[1] || ""),
      user_name: String(r[2] || ""),
      role: String(r[3] || "GURU"),
      action: String(r[4] || "VIEW"),
      target_type: String(r[5] || "BankSoal"),
      target_id: String(r[6] || ""),
      target_title: String(r[7] || ""),
      details: String(r[8] || ""),
      timestamp: String(r[9] || new Date().toISOString())
    });
  }
  return list;
}

function fetchSettingsData(ss) {
  var sheet = ss.getSheetByName("SETTINGS");
  if (!sheet || sheet.getLastRow() <= 1) return {};
  var values = sheet.getDataRange().getValues();
  var settings = {};
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    var key = String(r[0] || "").trim();
    if (!key) continue;
    var val = r[1];
    var type = String(r[3] || "STRING").toUpperCase();
    if (type === "BOOLEAN") {
      settings[key] = String(val).toLowerCase() === "true";
    } else if (type === "NUMBER") {
      settings[key] = parseFloat(val) || 0;
    } else {
      settings[key] = String(val);
    }
  }
  return settings;
}

function fetchSyncLogData(ss) {
  var sheet = ss.getSheetByName("SYNC_LOG");
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var values = sheet.getDataRange().getValues();
  var list = [];
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    if (!r[0]) continue;
    list.push({
      id: String(r[0]),
      storage_profile_id: String(r[1] || ""),
      storage_profile_name: String(r[2] || ""),
      bank_soal_id: String(r[3] || ""),
      bank_soal_title: String(r[4] || ""),
      action: String(r[5] || "BULK_SYNC"),
      status: String(r[6] || "SUCCESS"),
      retry_count: parseInt(r[7]) || 0,
      error_message: String(r[8] || ""),
      timestamp: String(r[9] || new Date().toISOString())
    });
  }
  return list;
}

// Data Syncers (App to Sheet)
function syncUsersData(ss, users) {
  var sheet = getOrCreateSheet(ss, "USERS", ["USER_ID", "NAMA_LENGKAP", "EMAIL", "ROLE", "NIP", "SEKOLAH", "SPESIALISASI_MAPEL", "STATUS", "TERAKHIR_LOGIN", "TANGGAL_DIBUAT"], "#1E293B");
  var rows = [];
  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    rows.push([u.id, u.name, u.email, u.role, u.nip || "-", u.school || "-", u.subject_specialty || "-", u.status || "ACTIVE", u.last_login || new Date().toISOString(), u.created_at || new Date().toISOString()]);
  }
  if (rows.length > 0) {
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 10).clearContent();
    sheet.getRange(2, 1, rows.length, 10).setValues(rows);
  }
}

function syncBankSoalData(ss, items) {
  var sheet = getOrCreateSheet(ss, "BANK_SOAL", [
    "ID_BISNIS", "JUDUL_SOAL", "MATA_PELAJARAN", "JENJANG", "KELAS", 
    "KURIKULUM", "BAB_TOPIK", "JENIS_SOAL", "KESULITAN", "TAHUN_AJARAN", 
    "SEMESTER", "TAGS", "NAMA_FILE", "DRIVE_FILE_ID", "DRIVE_LINK", 
    "UKURAN_FILE", "PENGUNGGAH", "STATUS", "JUMLAH_DOWNLOAD", "JUMLAH_VIEW", 
    "TANGGAL_UPLOAD", "TIMESTAMP_SYNC"
  ], "#0F172A");

  var rows = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var tagsString = Array.isArray(item.tags) ? item.tags.join(", ") : (item.tags || "");
    var finalDriveId = item.drive_file_id || "-";
    var finalViewUrl = item.web_view_url || (finalDriveId !== "-" ? "https://drive.google.com/file/d/" + finalDriveId + "/view" : "-");

    rows.push([
      item.business_id || ("BS-" + String(i + 1).padStart(6, "0")),
      item.title || "-",
      item.mata_pelajaran || "-",
      item.jenjang || "-",
      item.kelas || "-",
      item.kurikulum || "-",
      (item.bab || "") + " / " + (item.topik || ""),
      item.jenis_soal || "-",
      item.tingkat_kesulitan || "-",
      item.tahun_ajaran || "-",
      item.semester || "-",
      tagsString,
      item.file_name || "-",
      finalDriveId,
      finalViewUrl,
      item.file_size_formatted || "-",
      item.created_by_name || "-",
      item.status === "trash" ? "TRASH" : "AKTIF",
      item.download_count || 0,
      item.view_count || 0,
      item.created_at || new Date().toISOString(),
      new Date().toISOString()
    ]);
  }

  if (rows.length > 0) {
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 22).clearContent();
    sheet.getRange(2, 1, rows.length, 22).setValues(rows);
  }
}

function syncCategoriesData(ss, categories) {
  var sheet = getOrCreateSheet(ss, "CATEGORIES", ["ID_KATEGORI", "TIPE", "KODE", "NAMA_KATEGORI", "DESKRIPSI", "WARNA", "URUTAN", "TANGGAL_DIBUAT"], "#1E3A8A");
  var rows = [];
  for (var i = 0; i < categories.length; i++) {
    var c = categories[i];
    rows.push([c.id, c.type, c.code, c.name, c.description || "-", c.color || "#3B82F6", c.order || (i + 1), c.created_at || new Date().toISOString()]);
  }
  if (rows.length > 0) {
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 8).clearContent();
    sheet.getRange(2, 1, rows.length, 8).setValues(rows);
  }
}

function syncTagsData(ss, tags) {
  var sheet = getOrCreateSheet(ss, "TAGS", ["ID_TAG", "NAMA_TAG", "WARNA", "JUMLAH_PENGGUNAAN", "TANGGAL_DIBUAT"], "#065F46");
  var rows = [];
  for (var i = 0; i < tags.length; i++) {
    var t = tags[i];
    rows.push([t.id, t.name, t.color || "#3B82F6", t.usage_count || 0, t.created_at || new Date().toISOString()]);
  }
  if (rows.length > 0) {
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 5).clearContent();
    sheet.getRange(2, 1, rows.length, 5).setValues(rows);
  }
}

function syncActivityLogData(ss, logs) {
  var sheet = getOrCreateSheet(ss, "ACTIVITY_LOG", ["LOG_ID", "USER_ID", "NAMA_USER", "ROLE", "AKSI", "TIPE_TARGET", "TARGET_ID", "TARGET_TITLE", "RINCIAN_DETAIL", "TIMESTAMP"], "#701A75");
  var rows = [];
  for (var i = 0; i < Math.min(logs.length, 500); i++) {
    var l = logs[i];
    rows.push([l.id, l.user_id, l.user_name, l.role, l.action, l.target_type, l.target_id || "-", l.target_title || "-", l.details || "-", l.timestamp || new Date().toISOString()]);
  }
  if (rows.length > 0) {
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 10).clearContent();
    sheet.getRange(2, 1, rows.length, 10).setValues(rows);
  }
}

function syncSettingsData(ss, settings) {
  var sheet = getOrCreateSheet(ss, "SETTINGS", ["SETTING_KEY", "SETTING_VALUE", "KETERANGAN", "TIPE_DATA", "TERAKHIR_DIUBAH"], "#78350F");
  var keys = Object.keys(settings);
  var rows = [];
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    var val = settings[k];
    var typeStr = typeof val === "boolean" ? "BOOLEAN" : (typeof val === "number" ? "NUMBER" : "STRING");
    rows.push([k, String(val), "Pengaturan: " + k, typeStr, new Date().toISOString()]);
  }
  if (rows.length > 0) {
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 5).clearContent();
    sheet.getRange(2, 1, rows.length, 5).setValues(rows);
  }
}

function syncSyncLogData(ss, syncLogs) {
  var sheet = getOrCreateSheet(ss, "SYNC_LOG", ["SYNC_ID", "STORAGE_PROFILE_ID", "NAMA_STORAGE", "BANK_SOAL_ID", "JUDUL_SOAL", "AKSI_SYNC", "STATUS", "JUMLAH_RETRY", "PESAN_ERROR", "TIMESTAMP"], "#134E4A");
  var rows = [];
  for (var i = 0; i < Math.min(syncLogs.length, 300); i++) {
    var s = syncLogs[i];
    rows.push([s.id, s.storage_profile_id, s.storage_profile_name, s.bank_soal_id, s.bank_soal_title, s.action, s.status, s.retry_count || 0, s.error_message || "-", s.timestamp || new Date().toISOString()]);
  }
  if (rows.length > 0) {
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 10).clearContent();
    sheet.getRange(2, 1, rows.length, 10).setValues(rows);
  }
}

function logSystemActivity(ss, action, details) {
  try {
    var sheet = ss.getSheetByName("ACTIVITY_LOG");
    if (sheet) {
      sheet.appendRow([
        "aud-" + Date.now(),
        "usr-system",
        "System Administrator",
        "ADMIN",
        action,
        "System",
        "-",
        "Audit & Sinkronisasi",
        details,
        new Date().toISOString()
      ]);
    }
  } catch (e) {}
}

function logUserActivity(ss, userId, userName, action, targetType, targetId, targetTitle, details) {
  try {
    var sheet = ss.getSheetByName("ACTIVITY_LOG");
    if (sheet) {
      sheet.appendRow([
        "aud-" + Date.now(),
        userId,
        userName,
        "GURU",
        action,
        targetType,
        targetId,
        targetTitle,
        details,
        new Date().toISOString()
      ]);
    }
  } catch (e) {}
}

function logSyncEntry(ss, profileId, profileName, bankSoalId, title, action, status, retryCount, errorMsg) {
  try {
    var sheet = ss.getSheetByName("SYNC_LOG");
    if (sheet) {
      sheet.appendRow([
        "sync-" + Date.now(),
        profileId,
        profileName,
        bankSoalId,
        title,
        action,
        status,
        retryCount || 0,
        errorMsg || "-",
        new Date().toISOString()
      ]);
    }
  } catch (e) {}
}

/**
 * HELPER: Format Output JSON
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
