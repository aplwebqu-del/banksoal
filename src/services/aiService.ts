import { AiMetadataSuggestion } from "../types";

export async function getAiMetadataSuggestions(params: {
  fileName: string;
  fileTitle?: string;
  extractedText?: string;
}): Promise<{
  suggestion: AiMetadataSuggestion;
  source: "gemini" | "heuristic" | "fallback";
  confidence: number;
}> {
  try {
    const res = await fetch("/api/ai/suggest-metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        return {
          suggestion: json.data,
          source: json.source || "gemini",
          confidence: json.data.confidence || 85,
        };
      }
    }
  } catch (err) {
    console.warn("Server AI metadata endpoint unreachable, using client rule parser:", err);
  }

  // Client-side heuristic parser fallback
  const fallback = generateClientHeuristicMetadata(params.fileName || params.fileTitle || "");
  return {
    suggestion: fallback,
    source: "fallback",
    confidence: 80,
  };
}

function generateClientHeuristicMetadata(text: string): AiMetadataSuggestion {
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
  else if (lower.includes("pai") || lower.includes("agama")) mataPelajaran = "PAI";
  else if (lower.includes("ppkn") || lower.includes("pancasila")) mataPelajaran = "PPKn";
  else if (lower.includes("informatika") || lower.includes("komputer") || lower.includes("tik")) mataPelajaran = "Informatika";

  let jenjang: "SD" | "SMP" | "SMA" | "SMK" = "SMA";
  let kelas = "10";
  if (lower.includes("sd") || lower.includes("kelas 1") || lower.includes("kelas 2") || lower.includes("kelas 3") || lower.includes("kelas 4") || lower.includes("kelas 5") || lower.includes("kelas 6")) {
    jenjang = "SD";
    kelas = "5";
  } else if (lower.includes("smp") || lower.includes("kelas 7") || lower.includes("kelas 8") || lower.includes("kelas 9")) {
    jenjang = "SMP";
    kelas = "8";
  } else if (lower.includes("12") || lower.includes("xii")) {
    jenjang = "SMA";
    kelas = "12";
  } else if (lower.includes("11") || lower.includes("xi")) {
    jenjang = "SMA";
    kelas = "11";
  }

  let jenisSoal: any = "Pilihan Ganda";
  if (lower.includes("hots")) jenisSoal = "HOTS (Higher Order Thinking)";
  else if (lower.includes("akm") || lower.includes("literasi") || lower.includes("numerasi")) jenisSoal = "AKM (Asesmen Kompetensi)";
  else if (lower.includes("uraian") || lower.includes("essay")) jenisSoal = "Uraian / Essay";
  else if (lower.includes("pts") || lower.includes("pas") || lower.includes("pat")) jenisSoal = "Campuran (PG & Essay)";

  let kurikulum = "Kurikulum Merdeka";
  if (lower.includes("k13") || lower.includes("2013")) kurikulum = "Kurikulum 2013 (K13 Revisi)";

  const tags = [mataPelajaran, `Kelas ${kelas}`, jenjang, kurikulum];
  if (lower.includes("pts")) tags.push("PTS");
  if (lower.includes("pas")) tags.push("PAS");
  if (lower.includes("utbk") || lower.includes("snbt")) tags.push("SNBT/UTBK");
  if (lower.includes("hots")) tags.push("HOTS");

  return {
    mataPelajaran,
    jenjang,
    kelas,
    kurikulum,
    bab: "Bab 1: Eksplorasi Konsep & Latihan Mandiri",
    topik: "Pemahaman Materi & Pendalaman Konsep",
    subtopik: "Analisis Soal Terstruktur",
    jenisSoal,
    tingkatKesulitan: "Sedang",
    tahun: "2024/2025",
    semester: "Ganjil",
    tags: Array.from(new Set(tags)),
    deskripsi: `Koleksi soal arsip pengajar mata pelajaran ${mataPelajaran} jenjang ${jenjang} Kelas ${kelas} kurikulum ${kurikulum}.`,
    confidence: 85,
  };
}
