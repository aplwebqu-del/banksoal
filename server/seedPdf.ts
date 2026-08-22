import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export async function createSamplePdf(
  outputPath: string,
  title: string,
  subject: string,
  grade: string,
  level: string,
  questions: string[]
): Promise<number> {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Page 1: Header & Questions
  let page = pdfDoc.addPage([595.28, 841.89]); // A4 dimensions
  const { width, height } = page.getSize();

  // Draw Header decorative line & banner
  page.drawRectangle({
    x: 40,
    y: height - 90,
    width: width - 80,
    height: 60,
    color: rgb(0.08, 0.38, 0.74),
  });

  page.drawText('BANK SOAL TERPADU — REPOSITORI NASIONAL', {
    x: 55,
    y: height - 55,
    size: 10,
    font: fontBold,
    color: rgb(0.85, 0.92, 1.0),
  });

  page.drawText(title.toUpperCase(), {
    x: 55,
    y: height - 75,
    size: 14,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  // Metadata Sub-banner
  page.drawRectangle({
    x: 40,
    y: height - 135,
    width: width - 80,
    height: 35,
    color: rgb(0.94, 0.96, 0.98),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
  });

  const metaLine1 = `Mata Pelajaran: ${subject}  |  Kelas/Jenjang: ${grade} (${level})  |  Tahun: 2025/2026`;
  page.drawText(metaLine1, {
    x: 50,
    y: height - 115,
    size: 9,
    font: fontBold,
    color: rgb(0.2, 0.25, 0.3),
  });

  const metaLine2 = `Petunjuk: Pilihlah satu jawaban yang paling tepat atau kerjakan sesuai instruksi masing-masing butir soal.`;
  page.drawText(metaLine2, {
    x: 50,
    y: height - 128,
    size: 8,
    font: fontOblique,
    color: rgb(0.4, 0.45, 0.5),
  });

  // Draw Questions
  let currentY = height - 165;
  const bottomMargin = 60;

  for (let i = 0; i < questions.length; i++) {
    const qNum = i + 1;
    const qText = questions[i];

    if (currentY < bottomMargin + 100) {
      // Add new page
      page = pdfDoc.addPage([595.28, 841.89]);
      currentY = height - 60;
      
      // Page header
      page.drawText(`${title} - Halaman 2`, {
        x: 40,
        y: height - 40,
        size: 8,
        font: fontOblique,
        color: rgb(0.5, 0.5, 0.5),
      });
      page.drawLine({
        start: { x: 40, y: height - 45 },
        end: { x: width - 40, y: height - 45 },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });
      currentY -= 20;
    }

    // Question Number badge
    page.drawRectangle({
      x: 40,
      y: currentY - 14,
      width: 22,
      height: 18,
      color: rgb(0.08, 0.38, 0.74),
    });

    page.drawText(`${qNum}`, {
      x: qNum >= 10 ? 43 : 48,
      y: currentY - 10,
      size: 10,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    // Question text (wrap lines roughly)
    const words = qText.split(' ');
    let line = '';
    let textY = currentY - 8;

    for (const w of words) {
      const testLine = line + (line ? ' ' : '') + w;
      if (testLine.length > 70) {
        page.drawText(line, {
          x: 70,
          y: textY,
          size: 10,
          font: fontRegular,
          color: rgb(0.1, 0.1, 0.1),
        });
        line = w;
        textY -= 14;
      } else {
        line = testLine;
      }
    }
    if (line) {
      page.drawText(line, {
        x: 70,
        y: textY,
        size: 10,
        font: fontRegular,
        color: rgb(0.1, 0.1, 0.1),
      });
      textY -= 14;
    }

    // Options A, B, C, D
    const options = [
      'A. Pilihan jawaban pertama yang relevan dengan konsep pertanyaan.',
      'B. Pilihan jawaban kedua sebagai opsi pembanding rasional.',
      'C. Pilihan jawaban ketiga dengan analisis variabel terukur.',
      'D. Pilihan jawaban keempat sebagai kunci atau distraktor efektif.',
    ];

    for (const opt of options) {
      page.drawText(opt, {
        x: 80,
        y: textY,
        size: 9,
        font: fontRegular,
        color: rgb(0.2, 0.25, 0.3),
      });
      textY -= 13;
    }

    currentY = textY - 12;
  }

  // Footer on all pages
  const pageCount = pdfDoc.getPageCount();
  const pages = pdfDoc.getPages();
  for (let idx = 0; idx < pageCount; idx++) {
    const p = pages[idx];
    const { width: pWidth } = p.getSize();
    p.drawLine({
      start: { x: 40, y: 40 },
      end: { x: pWidth - 40, y: 40 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    p.drawText(`Bank Soal PDF v2.6 • Dokumen Arsip Pengajar • Halaman ${idx + 1} dari ${pageCount}`, {
      x: 40,
      y: 26,
      size: 8,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });
    p.drawText('CONFIDENTIAL / AKADEMIK', {
      x: pWidth - 170,
      y: 26,
      size: 8,
      font: fontBold,
      color: rgb(0.08, 0.38, 0.74),
    });
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
  return pageCount;
}

export async function createSamplePdfBuffer(
  title: string,
  subject: string,
  level: string,
  grade: string,
  questions: string[] = []
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  page.drawRectangle({
    x: 40,
    y: height - 90,
    width: width - 80,
    height: 60,
    color: rgb(0.08, 0.38, 0.74),
  });

  page.drawText('BANK SOAL TERPADU — GOOGLE DRIVE STORAGE', {
    x: 55,
    y: height - 55,
    size: 10,
    font: fontBold,
    color: rgb(0.85, 0.92, 1.0),
  });

  page.drawText(title.toUpperCase(), {
    x: 55,
    y: height - 75,
    size: 13,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(`Mata Pelajaran: ${subject} | ${level} Kelas ${grade}`, {
    x: 55,
    y: height - 120,
    size: 10,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });

  const qList =
    questions.length > 0
      ? questions
      : [
          '1. Jelaskan konsep dasar materi ini beserta contoh penerapannya dalam kehidupan sehari-hari!',
          '2. Selesaikan butir soal berikut dengan menyertakan langkah-langkah analitis terperinci.',
          '3. Analisislah studi kasus di atas dan tentukan kesimpulan yang paling tepat!',
        ];

  let currentY = height - 160;
  for (const q of qList) {
    page.drawText(q, {
      x: 55,
      y: currentY,
      size: 9.5,
      font: fontRegular,
      color: rgb(0.1, 0.1, 0.1),
    });
    currentY -= 35;
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

