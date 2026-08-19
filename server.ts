import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy initialize Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Bank Soal PDF Backend",
    version: "2.5.0",
    geminiAvailable: !!process.env.GEMINI_API_KEY,
  });
});

// AI Suggest Metadata endpoint with robust multi-model fallback & heuristic resilience
app.post("/api/ai/suggest-metadata", async (req, res) => {
  const { fileName, fileTitle, extractedText } = req.body;

  try {
    const ai = getGeminiClient();
    if (!ai) {
      // Fallback heuristics if API key is not configured
      const fallback = generateHeuristicMetadata(fileName || fileTitle || "");
      return res.json({
        success: true,
        source: "heuristic",
        data: fallback,
      });
    }

    const prompt = `Analisis nama file soal ujian/bank soal dan teks berikut untuk menyarankan metadata yang akurat dalam Bahasa Indonesia:
Nama File: "${fileName || ""}"
Judul Dokumen: "${fileTitle || ""}"
Kutipan Teks/Isi Awal Soal: "${(extractedText || "").slice(0, 2000)}"

Berikan rekomendasi metadata dalam format JSON:
- mataPelajaran: nama mata pelajaran (contoh: "Matematika", "Bahasa Indonesia", "Bahasa Inggris", "Fisika", "Kimia", "Biologi", "Ekonomi", "Sosiologi", "Geografi", "Sejarah", "Informatika", "PPKn", "PAI", "Seni Budaya", "PJOK")
- jenjang: salah satu dari "SD", "SMP", "SMA", "SMK"
- kelas: angka kelas dalam bentuk string ("1" s/d "12")
- kurikulum: contoh "Kurikulum Merdeka", "Kurikulum 2013 (K13)", "Cambridge"
- bab: nama bab yang sesuai atau perkiraan
- topik: topik utama
- subtopik: subtopik bila ada
- jenisSoal: salah satu dari "Pilihan Ganda", "Uraian / Essay", "Campuran (PG & Essay)", "AKM (Asesmen Kompetensi)", "HOTS (Higher Order Thinking)"
- tingkatKesulitan: salah satu dari "Mudah", "Sedang", "Sulit"
- tahun: tahun ajaran contoh "2024/2025" atau tahun sekarang
- semester: "Ganjil" atau "Genap"
- tags: daftar 3-6 tag relevan (contoh: ["PTS", "Matematika", "Kelas 10", "Kurikulum Merdeka", "Aljabar", "HOTS"])
- deskripsi: ringkasan singkat isi berkas soal (1-2 kalimat)
- confidence: estimasi keyakinan 0-100 (contoh 90)`;

    const schemaConfig = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          mataPelajaran: { type: Type.STRING },
          jenjang: { type: Type.STRING },
          kelas: { type: Type.STRING },
          kurikulum: { type: Type.STRING },
          bab: { type: Type.STRING },
          topik: { type: Type.STRING },
          subtopik: { type: Type.STRING },
          jenisSoal: { type: Type.STRING },
          tingkatKesulitan: { type: Type.STRING },
          tahun: { type: Type.STRING },
          semester: { type: Type.STRING },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          deskripsi: { type: Type.STRING },
          confidence: { type: Type.INTEGER },
        },
        required: ["mataPelajaran", "jenjang", "kelas", "tingkatKesulitan", "tags"],
      },
    };

    const CANDIDATE_MODELS = ["gemini-3.7-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    let responseText: string | undefined;

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: schemaConfig,
        });
        if (response && response.text) {
          responseText = response.text;
          break;
        }
      } catch (modelErr: any) {
        // Gracefully catch 503 / 429 / UNAVAILABLE and try next candidate
        const status = modelErr?.status || modelErr?.code || "unavailable";
        console.log(`[AI Metadata Engine] Model ${modelName} returned status ${status}, trying next fallback candidate...`);
      }
    }

    if (responseText) {
      try {
        const parsedData = JSON.parse(responseText.trim());
        return res.json({
          success: true,
          source: "gemini",
          data: parsedData,
        });
      } catch (parseErr) {
        // Fallback to rule parser if JSON parsing fails
      }
    }

    // Heuristic fallback if models are experiencing demand spikes
    const fallback = generateHeuristicMetadata(fileName || fileTitle || "");
    return res.json({
      success: true,
      source: "heuristic",
      data: fallback,
    });
  } catch (error: any) {
    // Graceful fallback to rule-based parser on any error
    const fallback = generateHeuristicMetadata(fileName || fileTitle || "");
    return res.json({
      success: true,
      source: "heuristic",
      data: fallback,
    });
  }
});

// Google Apps Script Proxy & Connection Tester
app.post("/api/storage/test", async (req, res) => {
  const { appsScriptUrl, driveFolderId, spreadsheetId } = req.body;

  if (!appsScriptUrl || !appsScriptUrl.trim().startsWith("http")) {
    return res.status(400).json({
      success: false,
      message: "Google Apps Script Web App URL wajib diisi dengan URL valid (diawali https://)",
      drive: { connected: false, message: "URL Apps Script belum diisi" },
      spreadsheet: { connected: false, message: "URL Apps Script belum diisi" },
    });
  }

  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(appsScriptUrl.trim(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "test_connection",
        driveFolderId: (driveFolderId || "").trim(),
        spreadsheetId: (spreadsheetId || "").trim(),
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeoutId);

    const latency = Date.now() - startTime;
    const rawText = await response.text();

    let result: any = null;
    try {
      result = JSON.parse(rawText);
    } catch (parseErr) {
      return res.status(502).json({
        success: false,
        latency,
        message: "Google Apps Script tidak mengembalikan respons JSON. Pastikan Web App di-deploy dengan akses 'Anyone'.",
        rawResponse: rawText.slice(0, 300),
        drive: { connected: false, message: "Apps Script respons bukan JSON" },
        spreadsheet: { connected: false, message: "Apps Script respons bukan JSON" },
      });
    }

    if (result && result.success) {
      return res.json({
        success: true,
        latency,
        appsScript: { connected: true, status: 200, message: "Google Apps Script Gateway terhubung (OK)" },
        drive: result.drive || {
          connected: Boolean(driveFolderId),
          folderId: driveFolderId,
          message: result.drive?.message || "Folder Google Drive terverifikasi",
        },
        spreadsheet: result.spreadsheet || {
          connected: Boolean(spreadsheetId),
          spreadsheetId,
          message: result.spreadsheet?.message || "Google Spreadsheet terverifikasi",
        },
        message: result.message || "Koneksi Google Drive & Spreadsheet berhasil!",
      });
    } else {
      return res.status(400).json({
        success: false,
        latency,
        message: result?.message || "Uji koneksi Google Apps Script gagal",
        drive: result?.drive || { connected: false, message: "Gagal terhubung" },
        spreadsheet: result?.spreadsheet || { connected: false, message: "Gagal terhubung" },
      });
    }
  } catch (err: any) {
    const latency = Date.now() - startTime;
    const isTimeout = err.name === "AbortError";
    const errorMessage = isTimeout
      ? "Koneksi timeout (Google Apps Script tidak merespons dalam 12 detik). Pastikan Web App aktif."
      : `Gagal menghubungi Google Apps Script: ${err.message}`;

    return res.status(500).json({
      success: false,
      latency,
      message: errorMessage,
      drive: { connected: false, message: errorMessage },
      spreadsheet: { connected: false, message: errorMessage },
    });
  }
});

// Proxy endpoint for uploading file & syncing Bank Soal record to Google Apps Script
app.post("/api/storage/sync", async (req, res) => {
  const { storageProfile, bankSoalItem, action } = req.body;

  if (!storageProfile?.apps_script_url || !storageProfile.apps_script_url.trim().startsWith("http")) {
    return res.status(400).json({
      success: false,
      message: "Profil penyimpanan belum memiliki URL Google Apps Script yang valid.",
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for PDF uploads

    const response = await fetch(storageProfile.apps_script_url.trim(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: action || "upload_file",
        driveFolderId: (storageProfile.drive_folder_id || "").trim(),
        spreadsheetId: (storageProfile.spreadsheet_id || "").trim(),
        payload: bankSoalItem,
        bankSoalItem: bankSoalItem,
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeoutId);

    const rawText = await response.text();
    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      return res.status(502).json({
        success: false,
        message: "Google Apps Script mengembalikan respons non-JSON: " + rawText.slice(0, 200),
      });
    }

    if (data && data.success) {
      return res.json({
        success: true,
        ...data,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: data?.message || "Google Apps Script gagal memproses unggahan.",
        error_code: data?.error_code,
      });
    }
  } catch (err: any) {
    const isTimeout = err.name === "AbortError";
    return res.status(500).json({
      success: false,
      message: isTimeout
        ? "Waktu unggah ke Google Drive habis (timeout). Coba kurangi ukuran file atau periksa jaringan."
        : `Gagal mengirim data ke Google Apps Script: ${err.message}`,
    });
  }
});

// Proxy endpoint for fetching all live database records from Google Spreadsheet
app.post("/api/storage/fetch-all", async (req, res) => {
  const { storageProfile } = req.body;

  if (!storageProfile?.apps_script_url || !storageProfile.apps_script_url.trim().startsWith("http")) {
    return res.status(400).json({
      success: false,
      items: [],
      message: "Profil penyimpanan belum memiliki URL Google Apps Script.",
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(storageProfile.apps_script_url.trim(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "fetch_all",
        driveFolderId: (storageProfile.drive_folder_id || "").trim(),
        spreadsheetId: (storageProfile.spreadsheet_id || "").trim(),
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeoutId);

    const rawText = await response.text();
    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      return res.status(502).json({
        success: false,
        items: [],
        message: "Respons Google Apps Script tidak valid (Bukan JSON).",
      });
    }

    if (data && data.success) {
      return res.json({
        success: true,
        source: "google_sheets",
        items: data.items || [],
        count: data.items ? data.items.length : 0,
        message: data.message || "Data berhasil dimuat dari Google Spreadsheet",
      });
    } else {
      return res.status(400).json({
        success: false,
        items: [],
        message: data?.message || "Gagal memuat data dari Spreadsheet",
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      items: [],
      message: `Gagal membaca Google Spreadsheet: ${err.message}`,
    });
  }
});

// Proxy endpoint for pushing all local/state records to Google Spreadsheet
app.post("/api/storage/push-all", async (req, res) => {
  const { storageProfile, items } = req.body;

  if (!storageProfile?.apps_script_url || !storageProfile.apps_script_url.trim().startsWith("http")) {
    return res.status(400).json({
      success: false,
      message: "Profil penyimpanan belum memiliki URL Google Apps Script.",
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(storageProfile.apps_script_url.trim(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "bulk_sync",
        driveFolderId: (storageProfile.drive_folder_id || "").trim(),
        spreadsheetId: (storageProfile.spreadsheet_id || "").trim(),
        items: items || [],
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeoutId);

    const rawText = await response.text();
    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      return res.status(502).json({
        success: false,
        message: "Respons Google Apps Script tidak valid.",
      });
    }

    if (data && data.success) {
      return res.json({
        success: true,
        synced_count: data.synced_count || (items ? items.length : 0),
        message: data.message || "Berhasil mengekspor semua data ke Google Spreadsheet!",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: data?.message || "Gagal menyimpan ke Google Spreadsheet",
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: `Gagal mengirim data ke Spreadsheet: ${err.message}`,
    });
  }
});

// Proxy endpoint for AUDITING all 7 tables in Google Spreadsheet
app.post("/api/storage/audit-tables", async (req, res) => {
  const { storageProfile } = req.body;

  if (!storageProfile?.apps_script_url || !storageProfile.apps_script_url.trim().startsWith("http")) {
    return res.status(400).json({
      success: false,
      message: "Profil penyimpanan belum memiliki URL Google Apps Script yang valid.",
    });
  }

  if (!storageProfile?.spreadsheet_id) {
    return res.status(400).json({
      success: false,
      message: "Spreadsheet ID belum diisi pada profil penyimpanan.",
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(storageProfile.apps_script_url.trim(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "audit_tables",
        spreadsheetId: storageProfile.spreadsheet_id.trim(),
        driveFolderId: (storageProfile.drive_folder_id || "").trim(),
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeoutId);

    const rawText = await response.text();
    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      return res.status(502).json({
        success: false,
        message: "Google Apps Script mengembalikan respons non-JSON saat audit tabel.",
      });
    }

    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: `Gagal mengaudit tabel Google Spreadsheet: ${err.message}`,
    });
  }
});

// Proxy endpoint for INITIALIZING all 7 tables with headers and seed data
app.post("/api/storage/init-tables", async (req, res) => {
  const { storageProfile, seedData } = req.body;

  if (!storageProfile?.apps_script_url || !storageProfile.apps_script_url.trim().startsWith("http")) {
    return res.status(400).json({
      success: false,
      message: "Profil penyimpanan belum memiliki URL Google Apps Script.",
    });
  }

  if (!storageProfile?.spreadsheet_id) {
    return res.status(400).json({
      success: false,
      message: "Spreadsheet ID belum diisi.",
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(storageProfile.apps_script_url.trim(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "init_all_tables",
        spreadsheetId: storageProfile.spreadsheet_id.trim(),
        driveFolderId: (storageProfile.drive_folder_id || "").trim(),
        seedData: seedData || {},
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeoutId);

    const rawText = await response.text();
    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      return res.status(502).json({
        success: false,
        message: "Google Apps Script mengembalikan respons non-JSON saat inisialisasi tabel.",
      });
    }

    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: `Gagal inisialisasi tabel Google Spreadsheet: ${err.message}`,
    });
  }
});

// Proxy endpoint for FETCHING all 7 tables data from Google Spreadsheet
app.post("/api/storage/fetch-all-tables", async (req, res) => {
  const { storageProfile } = req.body;

  if (!storageProfile?.apps_script_url || !storageProfile.apps_script_url.trim().startsWith("http")) {
    return res.status(400).json({
      success: false,
      message: "Profil penyimpanan belum memiliki URL Google Apps Script.",
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const response = await fetch(storageProfile.apps_script_url.trim(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "fetch_all_tables",
        spreadsheetId: (storageProfile.spreadsheet_id || "").trim(),
        driveFolderId: (storageProfile.drive_folder_id || "").trim(),
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeoutId);

    const rawText = await response.text();
    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      return res.status(502).json({
        success: false,
        message: "Respons Google Apps Script tidak valid.",
      });
    }

    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: `Gagal memuat seluruh tabel dari Spreadsheet: ${err.message}`,
    });
  }
});

// Proxy endpoint for SYNCING all 7 tables from application to Google Spreadsheet
app.post("/api/storage/sync-all-tables", async (req, res) => {
  const { storageProfile, tables } = req.body;

  if (!storageProfile?.apps_script_url || !storageProfile.apps_script_url.trim().startsWith("http")) {
    return res.status(400).json({
      success: false,
      message: "Profil penyimpanan belum memiliki URL Google Apps Script.",
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    const response = await fetch(storageProfile.apps_script_url.trim(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sync_all_tables",
        spreadsheetId: (storageProfile.spreadsheet_id || "").trim(),
        driveFolderId: (storageProfile.drive_folder_id || "").trim(),
        tables: tables || {},
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeoutId);

    const rawText = await response.text();
    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      return res.status(502).json({
        success: false,
        message: "Respons Google Apps Script tidak valid.",
      });
    }

    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: `Gagal sinkronisasi seluruh tabel ke Spreadsheet: ${err.message}`,
    });
  }
});

// Rule-based heuristic metadata helper
function generateHeuristicMetadata(text: string) {
  const lower = text.toLowerCase();

  let mataPelajaran = "Matematika";
  if (lower.includes("indo") || lower.includes("bahasa indonesia")) mataPelajaran = "Bahasa Indonesia";
  else if (lower.includes("inggris") || lower.includes("english")) mataPelajaran = "Bahasa Inggris";
  else if (lower.includes("fisika") || lower.includes("physics")) mataPelajaran = "Fisika";
  else if (lower.includes("kimia") || lower.includes("chem")) mataPelajaran = "Kimia";
  else if (lower.includes("biologi") || lower.includes("bio")) mataPelajaran = "Biologi";
  else if (lower.includes("ekonomi") || lower.includes("econ")) mataPelajaran = "Ekonomi";
  else if (lower.includes("sosiologi")) mataPelajaran = "Sosiologi";
  else if (lower.includes("geografi")) mataPelajaran = "Geografi";
  else if (lower.includes("sejarah")) mataPelajaran = "Sejarah";
  else if (lower.includes("pai") || lower.includes("agama") || lower.includes("islam")) mataPelajaran = "PAI";
  else if (lower.includes("ppkn") || lower.includes("pancasila") || lower.includes("pkn")) mataPelajaran = "PPKn";
  else if (lower.includes("informatika") || lower.includes("komputer") || lower.includes("tik")) mataPelajaran = "Informatika";
  else if (lower.includes("seni") || lower.includes("budaya") || lower.includes("rupa")) mataPelajaran = "Seni Budaya";
  else if (lower.includes("pjok") || lower.includes("penjas") || lower.includes("olahraga")) mataPelajaran = "PJOK";
  else if (lower.includes("ipa")) mataPelajaran = "IPA";
  else if (lower.includes("ips")) mataPelajaran = "IPS";

  let jenjang = "SMA";
  let kelas = "10";
  if (lower.includes("sd") || lower.includes("kelas 1") || lower.includes("kelas 2") || lower.includes("kelas 3") || lower.includes("kelas 4") || lower.includes("kelas 5") || lower.includes("kelas 6")) {
    jenjang = "SD";
    if (lower.includes("6") || lower.includes("vi")) kelas = "6";
    else if (lower.includes("5") || lower.includes("v")) kelas = "5";
    else if (lower.includes("4") || lower.includes("iv")) kelas = "4";
    else if (lower.includes("3") || lower.includes("iii")) kelas = "3";
    else if (lower.includes("2") || lower.includes("ii")) kelas = "2";
    else kelas = "1";
  } else if (lower.includes("smp") || lower.includes("kelas 7") || lower.includes("kelas 8") || lower.includes("kelas 9") || lower.includes("vii") || lower.includes("viii") || lower.includes("ix")) {
    jenjang = "SMP";
    if (lower.includes("9") || lower.includes("ix")) kelas = "9";
    else if (lower.includes("8") || lower.includes("viii")) kelas = "8";
    else kelas = "7";
  } else if (lower.includes("smk")) {
    jenjang = "SMK";
    if (lower.includes("12") || lower.includes("xii")) kelas = "12";
    else if (lower.includes("11") || lower.includes("xi")) kelas = "11";
    else kelas = "10";
  } else if (lower.includes("12") || lower.includes("xii")) {
    jenjang = "SMA";
    kelas = "12";
  } else if (lower.includes("11") || lower.includes("xi")) {
    jenjang = "SMA";
    kelas = "11";
  } else {
    jenjang = "SMA";
    kelas = "10";
  }

  let jenisSoal = "Pilihan Ganda";
  if (lower.includes("hots")) jenisSoal = "HOTS (Higher Order Thinking)";
  else if (lower.includes("akm") || lower.includes("literasi") || lower.includes("numerasi")) jenisSoal = "AKM (Asesmen Kompetensi)";
  else if (lower.includes("uraian") || lower.includes("essay")) jenisSoal = "Uraian / Essay";
  else if (lower.includes("pts") || lower.includes("pas") || lower.includes("pat") || lower.includes("asesmen")) jenisSoal = "Campuran (PG & Essay)";

  let kurikulum = "Kurikulum Merdeka";
  if (lower.includes("k13") || lower.includes("2013")) kurikulum = "Kurikulum 2013 (K13)";

  let semester = "Ganjil";
  if (lower.includes("genap") || lower.includes("pat") || lower.includes("semester 2") || lower.includes("sem 2")) {
    semester = "Genap";
  }

  let tahun = "2024/2025";
  const yearMatch = text.match(/202[0-9]\/202[0-9]/);
  if (yearMatch) {
    tahun = yearMatch[0];
  }

  const tags = [mataPelajaran, `Kelas ${kelas}`, jenjang, kurikulum];
  if (lower.includes("pts") || lower.includes("tengah")) tags.push("PTS");
  if (lower.includes("pas") || lower.includes("akhir")) tags.push("PAS");
  if (lower.includes("pat") || lower.includes("kenaikan")) tags.push("PAT");
  if (lower.includes("utbk") || lower.includes("snbt")) tags.push("SNBT/UTBK");
  if (lower.includes("hots")) tags.push("HOTS");
  if (lower.includes("akm")) tags.push("AKM");

  return {
    mataPelajaran,
    jenjang,
    kelas,
    kurikulum,
    bab: "Bab 1: Pengantar & Konsep Inti",
    topik: "Pemahaman Konsep dan Latihan",
    subtopik: "Analisis Soal",
    jenisSoal,
    tingkatKesulitan: "Sedang",
    tahun,
    semester,
    tags: Array.from(new Set(tags)),
    deskripsi: `Kumpulan soal arsip pengajar untuk ${mataPelajaran} jenjang ${jenjang} Kelas ${kelas} kurikulum ${kurikulum}.`,
    confidence: 85,
  };
}

// Start Server & mount Vite
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Bank Soal PDF Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
