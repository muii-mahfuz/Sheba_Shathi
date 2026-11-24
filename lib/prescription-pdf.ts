import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Prescription } from "@/lib/types";

/** Small, dependency-free prescription export. The standard PDF font keeps the
 * document printable everywhere; the clinical record remains available in the
 * app for Bangla text. */

/**
 * Characters the standard PDF fonts can actually draw (WinAnsi: ASCII, Latin-1,
 * and the handful of punctuation marks Windows put in the 0x80–0x9F gap).
 */
const WIN_ANSI = /[^\x20-\x7E\xA0-\xFF–—‘’“”‚„†‡•…‰‹›ŒœŠšŸŽžƒˆ˜€™]/g;

/**
 * Bangla is the default locale, so a diagnosis written here is very often Bangla
 * — and `drawText` throws outright on the first glyph Helvetica cannot encode,
 * which turned every such download into a generic error toast. Embedding a
 * Bengali face would mean shipping a megabyte of font and a fontkit dependency,
 * so the export stays Latin and says plainly where the original is instead.
 * A prescription that silently loses its diagnosis is far worse than one that
 * points the reader back to the record.
 */
function safe(text: string): string {
  const cleaned = text.replace(WIN_ANSI, "").replace(/\s+/g, " ").trim();
  if (cleaned.length > 0) return cleaned;
  return text.trim().length > 0 ? "[Bangla text - see the record in the app]" : "";
}
export async function prescriptionPdf(prescription: Prescription): Promise<Blob> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.08, 0.12, 0.16);
  let y = 790;
  const line = (text: string, size = 10, font = regular, color = ink) => { page.drawText(safe(text).slice(0, 100), { x: 48, y, size, font, color }); y -= size + 7; };
  // Sanitised before wrapping, so a Bangla field collapses to one marker line
  // rather than one per wrapped chunk.
  const wrapped = (text: string, size = 10, font = regular) => { const clean = safe(text); for (const part of clean.match(/.{1,88}(?:\s|$)/g) ?? [clean]) line(part.trim(), size, font); };
  line("SHEBA SHATHI", 22, bold, rgb(0.03, 0.4, 0.42));
  line("Digital prescription", 10, regular, rgb(0.35, 0.38, 0.4)); y -= 12;
  page.drawLine({ start: { x: 48, y }, end: { x: 547, y }, thickness: 1, color: rgb(0.8, 0.83, 0.83) }); y -= 25;
  line(`Serial: ${prescription.serial}`, 10, bold); line(`Issued: ${new Date(prescription.issuedAt).toLocaleDateString("en-GB")}`); y -= 8;
  line("PATIENT", 9, bold, rgb(0.03, 0.4, 0.42)); line(`${prescription.patientName} · ${prescription.patientAge} · ${prescription.patientGender}`); y -= 8;
  line("PRESCRIBER", 9, bold, rgb(0.03, 0.4, 0.42)); line(`Dr. ${prescription.doctorName} · ${prescription.doctorQualifications.join(", ")}`); line(`BMDC: ${prescription.doctorLicense}`); y -= 12;
  line("DIAGNOSIS", 9, bold, rgb(0.03, 0.4, 0.42)); wrapped(prescription.diagnosis); y -= 8;
  line("MEDICINES", 9, bold, rgb(0.03, 0.4, 0.42));
  prescription.medicines.forEach((medicine, index) => { line(`${index + 1}. ${medicine.name} ${medicine.strength} (${medicine.form})`, 10, bold); line(`   ${medicine.frequency} · ${medicine.durationDays} days${medicine.instruction ? ` · ${medicine.instruction}` : ""}`, 9); });
  if (prescription.advice.length) { y -= 8; line("ADVICE", 9, bold, rgb(0.03, 0.4, 0.42)); prescription.advice.forEach((item) => wrapped(`• ${item}`, 9)); }
  if (prescription.tests.length) { y -= 8; line("TESTS", 9, bold, rgb(0.03, 0.4, 0.42)); prescription.tests.forEach((item) => wrapped(`• ${item}`, 9)); }
  if (prescription.followUpDays) { y -= 8; line(`Follow up in ${prescription.followUpDays} days`, 10, bold); }
  page.drawText("Issued through Sheba Shathi after a remote consultation.", { x: 48, y: 48, size: 8, font: regular, color: rgb(0.4, 0.42, 0.44) });
  const bytes = await pdf.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}
