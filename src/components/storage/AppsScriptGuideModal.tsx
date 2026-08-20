import React, { useState } from "react";
import {
  X,
  Code2,
  Copy,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  FileSpreadsheet,
  HardDrive,
  Layers,
} from "lucide-react";
import { GOOGLE_APPS_SCRIPT_CODE } from "../../utils/googleAppsScriptCode";
import { toast } from "../ui/Toast";

interface AppsScriptGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppsScriptGuideModal: React.FC<AppsScriptGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    toast.success("Script Berhasil Disalin!", "Tempel di Google Apps Script editor Anda");
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div
      id="apps-script-guide-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-850 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Panduan Deploy & Integrasi Google Apps Script
              </h3>
              <p className="text-xs text-slate-400">
                Jembatan serverless untuk menyimpan PDF ke Google Drive dan mengindeks ke Spreadsheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Step by step guide */}
          <div className="bg-slate-850 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>5 Langkah Mudah Menghubungkan Google Drive & Spreadsheet:</span>
            </h4>

            <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed font-medium">
              <li>
                Buka{" "}
                <a
                  href="https://script.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:underline font-semibold"
                >
                  script.google.com (Google Apps Script)
                </a>{" "}
                dan buat <strong>Project Baru</strong>.
              </li>
              <li>
                Hapus semua kode bawaan di <code className="bg-slate-800 px-1 py-0.5 rounded text-blue-300">Code.gs</code>, lalu <strong>tempel (paste) kode lengkap</strong> dari kotak di bawah ini.
              </li>
              <li>
                Klik tombol <strong>Deploy &gt; New deployment (Deployment baru)</strong> di sudut kanan atas.
              </li>
              <li>
                Pilih jenis <strong>Web App</strong>, lalu atur:
                <ul className="list-disc list-inside pl-5 mt-1 text-slate-400">
                  <li><strong>Execute as:</strong> Me (email akun Google Anda)</li>
                  <li><strong>Who has access:</strong> Anyone (Siapa saja)</li>
                </ul>
              </li>
              <li>
                Klik <strong>Deploy</strong>, izinkan akses (Authorize Access), lalu <strong>salin URL Web App</strong> yang berakhiran <code className="bg-slate-800 px-1 py-0.5 rounded text-emerald-300">/exec</code> ke menu Penyimpanan Google pada aplikasi ini.
              </li>
            </ol>

            {/* Vercel Compatibility Note */}
            <div className="p-3.5 bg-blue-950/40 border border-blue-800/60 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-blue-300 font-bold text-xs">
                <span>⚡ Dukungan Khusus Vercel & Hosting Statis:</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Aplikasi ini dilengkapi <strong>Direct GAS Bridge (CORS Safe)</strong> & <strong>Auto-Hybrid Failover</strong>. Saat di-deploy ke <strong>Vercel</strong>, aplikasi secara otomatis dapat langsung terhubung ke Google Apps Script tanpa memerlukan server backend Node.js terpisah!
              </p>
            </div>
          </div>

          {/* Copyable Code Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs uppercase tracking-wider">
                Kode Google Apps Script (Code.gs):
              </span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs shadow-md transition-all"
              >
                {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Tersalin!" : "Salin Kode Lengkap"}</span>
              </button>
            </div>

            <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-[11px] text-slate-300 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
              <pre className="whitespace-pre">{GOOGLE_APPS_SCRIPT_CODE}</pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold rounded-xl text-xs"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
