import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatPercentage } from "./utils";

interface RankingEntry {
  position: number;
  participant: { name: string; email: string };
  totalScore: number;
  totalHits: number;
  hitPercentage: number;
}

export async function generateRankingPDF(data: RankingEntry[]) {
  const pdfDoc = await PDFDocument.create();
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const GREEN = rgb(0.39, 0.78, 0.20);
  const DARK_GREEN = rgb(0.08, 0.43, 0.22);
  const DARK = rgb(0.10, 0.12, 0.09);
  const GRAY = rgb(0.61, 0.64, 0.60);

  const ROWS_PER_PAGE = 25;
  const totalPages = Math.ceil(data.length / ROWS_PER_PAGE) || 1;

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    const page = pdfDoc.addPage([595, 842]);
    const { height } = page.getSize();

    // Header bar
    page.drawRectangle({ x: 0, y: height - 90, width: 595, height: 90, color: DARK_GREEN });

    page.drawText("Bolão FWC 2026", {
      x: 40, y: height - 40, size: 20, font: helveticaBold, color: GREEN,
    });
    page.drawText("Ranking Geral — Bolão Esportivo Corporativo", {
      x: 40, y: height - 62, size: 10, font: helvetica, color: rgb(1, 1, 1),
    });

    const now = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric",
    });
    page.drawText(`Gerado em: ${now}`, {
      x: 350, y: height - 62, size: 9, font: helvetica, color: rgb(0.8, 0.95, 0.7),
    });
    page.drawText(`Pág. ${pageIdx + 1} de ${totalPages}`, {
      x: 500, y: height - 40, size: 9, font: helvetica, color: rgb(0.8, 0.95, 0.7),
    });

    // Table header
    const tableTop = height - 115;
    page.drawRectangle({
      x: 30, y: tableTop - 20, width: 535, height: 22, color: rgb(0.96, 0.99, 0.96),
    });

    const headers = ["Pos.", "Nome", "Email", "Pontos", "Acertos", "% Acerto"];
    const colX = [38, 70, 200, 360, 415, 470];

    headers.forEach((h, i) => {
      page.drawText(h, { x: colX[i], y: tableTop - 14, size: 7.5, font: helveticaBold, color: GRAY });
    });

    page.drawLine({
      start: { x: 30, y: tableTop - 22 },
      end: { x: 565, y: tableTop - 22 },
      thickness: 0.5,
      color: rgb(0.9, 0.95, 0.88),
    });

    // Rows
    const pageEntries = data.slice(pageIdx * ROWS_PER_PAGE, (pageIdx + 1) * ROWS_PER_PAGE);

    pageEntries.forEach((entry, idx) => {
      const rowY = tableTop - 36 - idx * 22;

      if (idx % 2 === 0) {
        page.drawRectangle({ x: 30, y: rowY - 6, width: 535, height: 20, color: rgb(0.98, 1, 0.97) });
      }

      const pos = `${entry.position}.`;
      page.drawText(pos, {
        x: colX[0], y: rowY + 4, size: 8,
        font: entry.position <= 3 ? helveticaBold : helvetica,
        color: entry.position === 1 ? DARK_GREEN : DARK,
      });

      const name = entry.participant.name.length > 22
        ? entry.participant.name.substring(0, 22) + "..."
        : entry.participant.name;
      page.drawText(name, { x: colX[1], y: rowY + 4, size: 8, font: helveticaBold, color: DARK });

      const email = entry.participant.email.length > 28
        ? entry.participant.email.substring(0, 28) + "..."
        : entry.participant.email;
      page.drawText(email, { x: colX[2], y: rowY + 4, size: 7.5, font: helvetica, color: GRAY });

      page.drawText(`${entry.totalScore} pts`, { x: colX[3], y: rowY + 4, size: 8, font: helveticaBold, color: DARK_GREEN });
      page.drawText(`${entry.totalHits}`, { x: colX[4], y: rowY + 4, size: 8, font: helvetica, color: DARK });
      page.drawText(formatPercentage(entry.hitPercentage), { x: colX[5], y: rowY + 4, size: 8, font: helvetica, color: DARK });

      page.drawLine({
        start: { x: 30, y: rowY - 7 }, end: { x: 565, y: rowY - 7 },
        thickness: 0.3, color: rgb(0.94, 0.97, 0.92),
      });
    });

    // Footer
    page.drawLine({ start: { x: 30, y: 50 }, end: { x: 565, y: 50 }, thickness: 0.5, color: rgb(0.9, 0.95, 0.88) });
    page.drawText("Bolão FWC 2026 — Gerenciamento de Bolão Corporativo", {
      x: 30, y: 35, size: 7.5, font: helvetica, color: GRAY,
    });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ranking-bolao-${new Date().toISOString().split("T")[0]}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
