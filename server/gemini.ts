import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAi(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

export async function suggestMetadataFromText(
  filename: string,
  rawText?: string
): Promise<{
  judul: string;
  mata_pelajaran: string;
  jenjang: string;
  kelas: string;
  kurikulum: string;
  bab: string;
  topik: string;
  subtopik?: string;
  jenis_soal: string;
  tingkat_kesulitan: string;
  tahun: number;
  semester: string;
  tags: string[];
  deskripsi: string;
}> {
  const currentYear = new Date().getFullYear();
  
  // Rule-based fallback if no Gemini or if it fails
  const fallback = generateRuleBasedMetadata(filename, rawText, currentYear);

  try {
    const ai = getAi();
    if (!ai) {
      return fallback;
    }

    const prompt = `Anda adalah asisten cerdas untuk sistem Bank Soal Guru Indonesia.
Analisis nama file dan/atau potongan teks soal berikut untuk mengekstrak metadata bank soal yang terstruktur dan akurat dalam format JSON valid.

Nama File: "${filename}"
Konteks / Isi: "${rawText ? rawText.slice(0, 1000) : ''}"

Petunjuk Kategori:
- mata_pelajaran: "Matematika", "Bahasa Indonesia", "Bahasa Inggris", "IPA", "IPS", "Fisika", "Kimia", "Biologi", "Ekonomi", "Geografi", "Sosiologi", "Sejarah", "Informatika", "PAI", "PJOK"
- jenjang: "SD", "SMP", "SMA", "SMK"
- kelas: "1" sampai "12"
- kurikulum: "Kurikulum Merdeka", "Kurikulum 2013"
- jenis_soal: "Pilihan Ganda", "Essay", "Campuran", "HOTS", "AKM", "SNBT", "Tryout", "PAS", "PAT", "PTS", "Ujian Sekolah"
- tingkat_kesulitan: "Mudah", "Sedang", "Sulit"
- semester: "Ganjil", "Genap", atau "Semua"

Balas HANYA dengan JSON objek (tanpa markdown formatting lainnya):
{
  "judul": "...",
  "mata_pelajaran": "...",
  "jenjang": "...",
  "kelas": "...",
  "kurikulum": "...",
  "bab": "...",
  "topik": "...",
  "subtopik": "...",
  "jenis_soal": "...",
  "tingkat_kesulitan": "...",
  "tahun": ${currentYear},
  "semester": "...",
  "tags": ["...", "..."],
  "deskripsi": "..."
}`;

    // Attempt generation with primary model, retry once with exponential delay if 503
    let responseText = '';
    const modelsToTry = ['gemini-3.7-flash'];

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        if (response && response.text) {
          responseText = response.text;
          break;
        }
      } catch (callErr: any) {
        const errMsg = String(callErr?.message || callErr);
        // If 503 temporary overload, wait 600ms and try once more before fallback
        if (errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand')) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          try {
            const retryRes = await ai.models.generateContent({
              model: modelName,
              contents: prompt,
              config: {
                responseMimeType: 'application/json',
              },
            });
            if (retryRes && retryRes.text) {
              responseText = retryRes.text;
              break;
            }
          } catch {
            // Will fallback gracefully below
          }
        }
      }
    }

    if (!responseText) {
      return fallback;
    }

    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      judul: parsed.judul || fallback.judul,
      mata_pelajaran: parsed.mata_pelajaran || fallback.mata_pelajaran,
      jenjang: parsed.jenjang || fallback.jenjang,
      kelas: String(parsed.kelas || fallback.kelas),
      kurikulum: parsed.kurikulum || fallback.kurikulum,
      bab: parsed.bab || fallback.bab,
      topik: parsed.topik || fallback.topik,
      subtopik: parsed.subtopik || fallback.subtopik,
      jenis_soal: parsed.jenis_soal || fallback.jenis_soal,
      tingkat_kesulitan: parsed.tingkat_kesulitan || fallback.tingkat_kesulitan,
      tahun: Number(parsed.tahun) || fallback.tahun,
      semester: parsed.semester || fallback.semester,
      tags: Array.isArray(parsed.tags) ? parsed.tags : fallback.tags,
      deskripsi: parsed.deskripsi || fallback.deskripsi,
    };
  } catch {
    // Seamless heuristic rule-based fallback without breaking the upload flow
    return fallback;
  }
}

function generateRuleBasedMetadata(filename: string, rawText = '', year: number) {
  const cleanName = filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
  const lower = (cleanName + ' ' + rawText).toLowerCase();

  let subject = 'Matematika';
  if (lower.includes('indonesia')) subject = 'Bahasa Indonesia';
  else if (lower.includes('inggris') || lower.includes('english')) subject = 'Bahasa Inggris';
  else if (lower.includes('fisika')) subject = 'Fisika';
  else if (lower.includes('kimia')) subject = 'Kimia';
  else if (lower.includes('biologi')) subject = 'Biologi';
  else if (lower.includes('ipa')) subject = 'IPA';
  else if (lower.includes('ips')) subject = 'IPS';
  else if (lower.includes('ekonomi')) subject = 'Ekonomi';
  else if (lower.includes('sejarah')) subject = 'Sejarah';
  else if (lower.includes('informatika') || lower.includes('komputer')) subject = 'Informatika';

  let jenjang = 'SMP';
  let kelas = '9';
  if (lower.includes('sma') || lower.includes('kelas 10') || lower.includes('kelas 11') || lower.includes('kelas 12') || lower.includes('snbt') || lower.includes('utbk')) {
    jenjang = 'SMA';
    if (lower.includes('10')) kelas = '10';
    else if (lower.includes('11')) kelas = '11';
    else if (lower.includes('12')) kelas = '12';
    else kelas = '12';
  } else if (lower.includes('sd') || lower.includes('kelas 1') || lower.includes('kelas 2') || lower.includes('kelas 3') || lower.includes('kelas 4') || lower.includes('kelas 5') || lower.includes('kelas 6')) {
    jenjang = 'SD';
    kelas = '6';
  } else if (lower.includes('smk')) {
    jenjang = 'SMK';
    kelas = '11';
  } else {
    if (lower.includes('7')) kelas = '7';
    else if (lower.includes('8')) kelas = '8';
    else if (lower.includes('9')) kelas = '9';
  }

  let jenis_soal = 'Pilihan Ganda';
  if (lower.includes('hots')) jenis_soal = 'HOTS';
  else if (lower.includes('akm')) jenis_soal = 'AKM';
  else if (lower.includes('snbt') || lower.includes('utbk')) jenis_soal = 'SNBT';
  else if (lower.includes('tryout') || lower.includes('to')) jenis_soal = 'Tryout';
  else if (lower.includes('pas')) jenis_soal = 'PAS';
  else if (lower.includes('pat')) jenis_soal = 'PAT';
  else if (lower.includes('pts') || lower.includes('uts')) jenis_soal = 'PTS';
  else if (lower.includes('essay') || lower.includes('esai')) jenis_soal = 'Essay';

  let kesulitan = 'Sedang';
  if (lower.includes('sulit') || lower.includes('hots') || lower.includes('olimpiade')) kesulitan = 'Sulit';
  else if (lower.includes('mudah') || lower.includes('dasar')) kesulitan = 'Mudah';

  let bab = 'Pendalaman Materi';
  let topik = 'Latihan Soal & Pembahasan';
  if (lower.includes('persamaan kuadrat')) {
    bab = 'Persamaan dan Fungsi Kuadrat';
    topik = 'Akar Persamaan Kuadrat';
  } else if (lower.includes('pythagoras')) {
    bab = 'Teorema Pythagoras';
    topik = 'Perhitungan Sisi Segitiga';
  } else if (lower.includes('trigonometri')) {
    bab = 'Trigonometri';
    topik = 'Aturan Sinus & Cosinus';
  } else if (lower.includes('gelombang')) {
    bab = 'Gelombang Elektromagnetik';
    topik = 'Spektrum dan Frekuensi';
  } else if (lower.includes('sel')) {
    bab = 'Struktur dan Fungsi Sel';
    topik = 'Organel Sel & Pembelahan';
  } else if (lower.includes('eksposisi')) {
    bab = 'Teks Eksposisi';
    topik = 'Struktur Gagasan dan Fakta';
  }

  const tags = [
    `#${subject.replace(/\s+/g, '')}`,
    `#Kelas${kelas}`,
    `#${jenjang}`,
    `#${jenis_soal.replace(/\s+/g, '')}`,
    `#${kesulitan}`
  ];

  return {
    judul: cleanName.replace(/\b\w/g, l => l.toUpperCase()),
    mata_pelajaran: subject,
    jenjang,
    kelas,
    kurikulum: 'Kurikulum Merdeka',
    bab,
    topik,
    subtopik: 'Analisis Soal Mandiri',
    jenis_soal,
    tingkat_kesulitan: kesulitan,
    tahun: year,
    semester: 'Ganjil',
    tags,
    deskripsi: `Kumpulan paket soal ${subject} untuk ${jenjang} Kelas ${kelas} dengan fokus pada materi ${bab} - ${topik}.`,
  };
}
