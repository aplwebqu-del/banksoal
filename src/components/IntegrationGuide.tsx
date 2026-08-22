import React, { useState } from 'react';
import {
  Cloud,
  FileSpreadsheet,
  FolderOpen,
  Code,
  CheckCircle2,
  Copy,
  ExternalLink,
  Layers,
  ArrowRight,
  Database,
  Shield,
  Zap,
  HelpCircle,
  Sparkles,
  Server,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import { useToast } from './Toast';

export const IntegrationGuide: React.FC = () => {
  const { showToast } = useToast();
  const [activeStep, setActiveStep] = useState<number>(1);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    showToast(`Berhasil menyalin ${label} ke papan klip!`, 'success');
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const appsScriptCode = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT GATEWAY — BANK SOAL DIGITAL ARCHITECTURE v2.5
 * =========================================================================
 * Gateway REST API Dinamis untuk Google Drive & Google Spreadsheet.
 * Mendukung multi-storage, auto-failover, diagnosa kesehatan, dan CRUD.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (err) {
    return createJsonResponse({
      success: false,
      error: { code: 'LOCK_TIMEOUT', message: 'Sistem sedang sibuk, silakan coba beberapa saat lagi.' }
    });
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({
        success: false,
        error: { code: 'INVALID_PAYLOAD', message: 'Payload data POST kosong.' }
      });
    }

    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;

    switch (action) {
      case 'test_connection':
      case 'diagnostics':
        return createJsonResponse(runFullConnectionDiagnostics(payload));

      case 'uploadFile':
        return createJsonResponse(handleUploadFile(payload));

      case 'createBankSoal':
        return createJsonResponse(handleCreateBankSoal(payload));

      case 'updateBankSoal':
        return createJsonResponse(handleUpdateBankSoal(payload));

      case 'deleteBankSoal':
        return createJsonResponse(handleDeleteBankSoal(payload, false));

      case 'permanentDeleteBankSoal':
        return createJsonResponse(handleDeleteBankSoal(payload, true));

      case 'restoreBankSoal':
        return createJsonResponse(handleRestoreBankSoal(payload));

      case 'syncDrive':
        return createJsonResponse(handleSyncDrive(payload));

      default:
        return createJsonResponse({
          success: false,
          error: { code: 'UNKNOWN_ACTION', message: 'Action tidak dikenal: ' + action }
        });
    }
  } catch (error) {
    return createJsonResponse({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.toString() }
    });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'health';
  
  if (action === 'health' || action === 'ping') {
    return createJsonResponse({
      status: 'ONLINE',
      success: true,
      service: 'Google Apps Script Gateway API',
      version: '2.5.0',
      timestamp: new Date().toISOString()
    });
  }
  
  return createJsonResponse({ status: 'READY', action: action });
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. GAMBARAN UMUM SISTEM & ARSITEKTUR */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Arsitektur Sistem Terpadu</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Gambaran Sistem Web Bank Soal Digital
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Aplikasi ini dibangun menggunakan arsitektur hybrid tanpa dependensi server statis mahal. Seluruh berkas PDF disimpan secara aman di <strong>Google Drive</strong>, indeks metadata dan audit log dikelola di <strong>Google Spreadsheet</strong>, dan komunikasi dijalankan melalui <strong>Google Apps Script Gateway</strong> dengan perutean pintar <strong>Storage Router</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Multi-Storage & Auto Failover
              </span>
            </div>
          </div>

          {/* Visual Architecture Flow Diagram */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Alur Komunikasi Data End-to-End:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-bold text-[10px]">1. KLIEN</span>
                  <Layers className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h5 className="font-bold text-white">React + Vite UI</h5>
                  <p className="text-[11px] text-slate-400 mt-1">Portal web responsif guru & admin, PDF viewer & search cepat.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold text-[10px]">2. BACKEND</span>
                  <Server className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h5 className="font-bold text-white">Express API Server</h5>
                  <p className="text-[11px] text-slate-400 mt-1">Validasi payload, autentikasi sesi RBAC, kompresi & stream cache.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 flex flex-col justify-between space-y-2 bg-gradient-to-b from-slate-900 to-amber-950/10">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[10px]">3. ROUTER</span>
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h5 className="font-bold text-amber-300">Storage Router</h5>
                  <p className="text-[11px] text-slate-400 mt-1">Memilih profil aktif, cek kuota, dan otomatis failover ke storage backup.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-purple-500/30 flex flex-col justify-between space-y-2 bg-gradient-to-b from-slate-900 to-purple-950/10">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold text-[10px]">4. GATEWAY</span>
                  <Code className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h5 className="font-bold text-purple-300">Apps Script Gateway</h5>
                  <p className="text-[11px] text-slate-400 mt-1">Web App REST yang mengeksekusi operasi Google Drive & Sheets via Cloud.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 flex flex-col justify-between space-y-2 bg-gradient-to-b from-slate-900 to-emerald-950/10">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">5. STORAGE</span>
                  <Database className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h5 className="font-bold text-emerald-300">Drive & Sheets</h5>
                  <p className="text-[11px] text-slate-400 mt-1">PDF disimpan di Drive Folder, metadata & user di Spreadsheet 5 Tabs.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TAB STEP-BY-STEP NAVIGATION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-400" />
            <span>Panduan Langkah Demi Langkah Integrasi Google</span>
          </h4>
          <span className="text-xs text-slate-400">Pilih langkah di bawah ini untuk melihat tutorial:</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => setActiveStep(1)}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              activeStep === 1
                ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold">Langkah 1</span>
              <FolderOpen className={`w-4 h-4 ${activeStep === 1 ? 'text-blue-400' : 'text-slate-500'}`} />
            </div>
            <span className="text-xs font-black mt-2 text-white">1. Google Drive</span>
          </button>

          <button
            onClick={() => setActiveStep(2)}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              activeStep === 2
                ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold">Langkah 2</span>
              <FileSpreadsheet className={`w-4 h-4 ${activeStep === 2 ? 'text-emerald-400' : 'text-slate-500'}`} />
            </div>
            <span className="text-xs font-black mt-2 text-white">2. Google Sheets</span>
          </button>

          <button
            onClick={() => setActiveStep(3)}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              activeStep === 3
                ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-600/20'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold">Langkah 3</span>
              <Code className={`w-4 h-4 ${activeStep === 3 ? 'text-purple-400' : 'text-slate-500'}`} />
            </div>
            <span className="text-xs font-black mt-2 text-white">3. Apps Script</span>
          </button>

          <button
            onClick={() => setActiveStep(4)}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              activeStep === 4
                ? 'bg-amber-600/20 border-amber-500 text-white shadow-lg shadow-amber-600/20'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold">Langkah 4</span>
              <Terminal className={`w-4 h-4 ${activeStep === 4 ? 'text-amber-400' : 'text-slate-500'}`} />
            </div>
            <span className="text-xs font-black mt-2 text-white">4. API & Query</span>
          </button>
        </div>
      </div>

      {/* 3. DETAIL KONTEN LANGKAH TERPILIH */}
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
        {/* LANGKAH 1: GOOGLE DRIVE */}
        {activeStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                <FolderOpen className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white">Langkah 1: Setup Google Drive untuk Berkas PDF</h4>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Google Drive berfungsi sebagai wadah penyimpanan fisik berkas soal dalam format PDF. Sistem akan membuat subfolder otomatis per mata pelajaran dan jenjang secara otomatis.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</span>
                  Buat Folder Induk di Google Drive
                </span>
                <p className="text-slate-300 ml-7">
                  Buka <a href="https://drive.google.com" target="_blank" rel="noreferrer" className="text-blue-400 underline inline-flex items-center gap-0.5">Google Drive <ExternalLink className="w-3 h-3" /></a>, lalu klik tombol <strong>+ Baru &gt; Folder Baru</strong>. Beri nama misalnya: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">BANK SOAL DIGITAL</code>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">2</span>
                  Atur Hak Akses / Izin Berbagi (Share Permissions)
                </span>
                <p className="text-slate-300 ml-7 leading-relaxed">
                  Klik kanan pada folder yang baru dibuat &gt; pilih <strong>Bagikan (Share)</strong> &gt; ubah Akses Umum menjadi: <strong className="text-emerald-400">Siapa saja yang memiliki tautan (Anyone with the link)</strong> dengan peran <strong className="text-emerald-400">Editor</strong> atau <strong>Pelihat (Viewer)</strong> agar file dapat diunduh dan dipratinjau langsung di dalam aplikasi.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">3</span>
                  Salin ID Folder Google Drive
                </span>
                <p className="text-slate-300 ml-7 leading-relaxed">
                  Buka folder tersebut di browser Anda. Periksa bilah alamat (URL browser):
                </p>
                <div className="ml-7 p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 break-all flex items-center justify-between">
                  <span>https://drive.google.com/drive/folders/<strong className="text-amber-300 font-black">1cYgXdF66T1GKMw3Dkd26J55E5HZPIRBG</strong></span>
                  <button
                    onClick={() => copyToClipboard('1cYgXdF66T1GKMw3Dkd26J55E5HZPIRBG', 'Contoh ID Drive')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors ml-2 shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 ml-7">
                  Salin teks acak setelah <code>/folders/</code> dan tempelkan ke kolom <strong>Google Drive Folder ID</strong> pada form pengaturan storage.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* LANGKAH 2: GOOGLE SPREADSHEET */}
        {activeStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white">Langkah 2: Setup Google Spreadsheet sebagai Database</h4>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Google Spreadsheet bertindak sebagai tabel relasional metadata soal, manajemen akun pengguna, kategori/taksonomi, riwayat revisi berkas, dan log audit keamanan.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">1</span>
                  Buat Spreadsheet Baru & 5 Tab Lembar Kerja Wajib
                </span>
                <p className="text-slate-300 ml-7 leading-relaxed">
                  Buka <a href="https://sheets.google.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline inline-flex items-center gap-0.5">Google Sheets <ExternalLink className="w-3 h-3" /></a>, buat spreadsheet kosong dengan nama <code className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-300 font-mono">DATABASE BANK SOAL DIGITAL</code>.
                </p>
                <div className="ml-7 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="font-bold text-emerald-400 font-mono">1. Tab BANK_SOAL</span>
                    <p className="text-slate-400 text-[11px] mt-1">Indeks katalog soal, mata pelajaran, tingkat kesulitan, tags, file ID & hash.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="font-bold text-emerald-400 font-mono">2. Tab USERS</span>
                    <p className="text-slate-400 text-[11px] mt-1">Akun pengajar & admin institusi dengan kontrol hak akses (RBAC).</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="font-bold text-emerald-400 font-mono">3. Tab CATEGORIES</span>
                    <p className="text-slate-400 text-[11px] mt-1">Daftar mata pelajaran, jenjang (SD/SMP/SMA/SMK), dan kelas.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="font-bold text-emerald-400 font-mono">4. Tab ACTIVITY_LOG</span>
                    <p className="text-slate-400 text-[11px] mt-1">Catatan audit log aktivitas upload, edit, download, dan hapus berkas.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 sm:col-span-2">
                    <span className="font-bold text-emerald-400 font-mono">5. Tab SYNC_LOG</span>
                    <p className="text-slate-400 text-[11px] mt-1">Laporan sinkronisasi otomatis antara Google Drive dan Google Sheets.</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">2</span>
                  Salin ID Google Spreadsheet
                </span>
                <p className="text-slate-300 ml-7 leading-relaxed">
                  Periksa bilah alamat browser saat membuka spreadsheet tersebut:
                </p>
                <div className="ml-7 p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 break-all flex items-center justify-between">
                  <span>https://docs.google.com/spreadsheets/d/<strong className="text-emerald-300 font-black">1xWK5VMJatqMtshx0FnFKZL54N2lQZ7wXoEJCQVT1o9A</strong>/edit</span>
                  <button
                    onClick={() => copyToClipboard('1xWK5VMJatqMtshx0FnFKZL54N2lQZ7wXoEJCQVT1o9A', 'Contoh ID Spreadsheet')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors ml-2 shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LANGKAH 3: GOOGLE APPS SCRIPT */}
        {activeStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                <Code className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white">Langkah 3: Deploy Google Apps Script Web App</h4>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Apps Script bertindak sebagai API gateway aman yang menghubungkan aplikasi web ke Google Drive dan Google Sheets secara real-time.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">1</span>
                  Buka Editor Apps Script dari Google Spreadsheet
                </span>
                <p className="text-slate-300 ml-7 leading-relaxed">
                  Pada tab Google Sheets yang baru dibuat &gt; klik menu atas <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">2</span>
                  Tempel Kode Gateway API (Code.gs)
                </span>
                <p className="text-slate-300 ml-7 leading-relaxed">
                  Hapus seluruh kode default di editor, lalu salin dan tempelkan kode lengkap berikut:
                </p>

                <div className="ml-7 space-y-2">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-900 rounded-t-xl border border-slate-800">
                    <span className="text-xs font-mono text-slate-400">google-apps-script/Code.gs</span>
                    <button
                      onClick={() => copyToClipboard(appsScriptCode, 'Kode Apps Script (Code.gs)')}
                      className="flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedSection === 'Kode Apps Script (Code.gs)' ? 'Tersalin!' : 'Salin Kode Lengkap'}</span>
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-950 border border-slate-800 rounded-b-xl text-[11px] font-mono text-purple-300 overflow-x-auto max-h-60">
                    {appsScriptCode}
                  </pre>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">3</span>
                  Deploy sebagai Web App (Penerapan Baru)
                </span>
                <div className="ml-7 space-y-2 text-slate-300 leading-relaxed">
                  <p>1. Klik tombol biru <strong>Deploy (Terapkan) &gt; New deployment (Penerapan baru)</strong>.</p>
                  <p>2. Pilih jenis penerapan: <strong>Web app (Aplikasi web)</strong>.</p>
                  <p>3. Konfigurasi wajib:</p>
                  <ul className="list-disc ml-5 space-y-1 text-slate-300">
                    <li><strong>Description:</strong> <code>Bank Soal Gateway API v2.5</code></li>
                    <li><strong>Execute as (Jalankan sebagai):</strong> <strong className="text-amber-300">Me (email Anda)</strong></li>
                    <li><strong>Who has access (Siapa yang memiliki akses):</strong> <strong className="text-emerald-400">Anyone (Siapa saja)</strong></li>
                  </ul>
                  <p>4. Klik <strong>Deploy</strong> &gt; Berikan otorisasi izin (Authorize access) &gt; Salin <strong>Web app URL</strong>.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LANGKAH 4: API & QUERY SPECIFICATION */}
        {activeStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                <Terminal className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white">Langkah 4: Kontrak API & Spesifikasi Query Payload</h4>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Seluruh aksi dari antarmuka React dikirimkan via Express API dan diarahkan oleh Storage Router melalui query payload JSON.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left">
                  <thead className="bg-slate-950 text-slate-400 text-[11px] font-bold uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-3">Action Name</th>
                      <th className="p-3">Metode</th>
                      <th className="p-3">Tujuan / Fungsi</th>
                      <th className="p-3">Target Payload Wajib</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr className="hover:bg-slate-800/50">
                      <td className="p-3 font-mono font-bold text-amber-300">test_connection</td>
                      <td className="p-3 font-semibold text-purple-400">POST</td>
                      <td className="p-3">Diagnosa kesehatan live & cek kuota storage</td>
                      <td className="p-3 font-mono text-[11px]">driveFolderId, spreadsheetId</td>
                    </tr>
                    <tr className="hover:bg-slate-800/50">
                      <td className="p-3 font-mono font-bold text-emerald-300">uploadFile</td>
                      <td className="p-3 font-semibold text-purple-400">POST</td>
                      <td className="p-3">Upload binary PDF & simpan baris metadata</td>
                      <td className="p-3 font-mono text-[11px]">base64, fileName, metadata, user</td>
                    </tr>
                    <tr className="hover:bg-slate-800/50">
                      <td className="p-3 font-mono font-bold text-blue-300">createBankSoal</td>
                      <td className="p-3 font-semibold text-purple-400">POST</td>
                      <td className="p-3">Simpan metadata baris baru ke sheet BANK_SOAL</td>
                      <td className="p-3 font-mono text-[11px]">data: BankSoal, user</td>
                    </tr>
                    <tr className="hover:bg-slate-800/50">
                      <td className="p-3 font-mono font-bold text-blue-300">updateBankSoal</td>
                      <td className="p-3 font-semibold text-purple-400">POST</td>
                      <td className="p-3">Perbarui data atau revisi berkas</td>
                      <td className="p-3 font-mono text-[11px]">id, data: Partial&lt;BankSoal&gt;</td>
                    </tr>
                    <tr className="hover:bg-slate-800/50">
                      <td className="p-3 font-mono font-bold text-rose-300">deleteBankSoal</td>
                      <td className="p-3 font-semibold text-purple-400">POST</td>
                      <td className="p-3">Pindahkan ke Sampah (Soft Delete)</td>
                      <td className="p-3 font-mono text-[11px]">id, user</td>
                    </tr>
                    <tr className="hover:bg-slate-800/50">
                      <td className="p-3 font-mono font-bold text-indigo-300">syncDrive</td>
                      <td className="p-3 font-semibold text-purple-400">POST</td>
                      <td className="p-3">Verifikasi kesesuaian file Drive dan row Sheets</td>
                      <td className="p-3 font-mono text-[11px]">driveFolderId, spreadsheetId</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Example JSON Payload Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Contoh Format JSON POST Payload (uploadFile):</span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(
                          {
                            action: 'uploadFile',
                            base64: 'JVBERi0xLjQKJ...',
                            fileName: 'Soal_Matematika_9.pdf',
                            metadata: {
                              judul: 'PAS Matematika Kelas 9',
                              mata_pelajaran: 'Matematika',
                              kelas: '9',
                              kurikulum: 'Kurikulum Merdeka',
                            },
                            driveFolderId: '1cYgXdF66T1GKMw3Dkd26J55E5HZPIRBG',
                            spreadsheetId: '1xWK5VMJatqMtshx0FnFKZL54N2lQZ7wXoEJCQVT1o9A',
                          },
                          null,
                          2
                        ),
                        'Contoh Payload'
                      )
                    }
                    className="text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Salin JSON</span>
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto">
{`{
  "action": "uploadFile",
  "base64": "JVBERi0xLjQKJ...",
  "fileName": "Soal_Matematika_9.pdf",
  "metadata": {
    "judul": "PAS Matematika Kelas 9",
    "mata_pelajaran": "Matematika",
    "kelas": "9",
    "kurikulum": "Kurikulum Merdeka"
  },
  "driveFolderId": "1cYgXdF66T1GKMw3Dkd26J55E5HZPIRBG",
  "spreadsheetId": "1xWK5VMJatqMtshx0FnFKZL54N2lQZ7wXoEJCQVT1o9A"
}`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
