import { PDFParse } from "pdf-parse";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/appError.js";

export interface ExtractedPdf {
  text: string;
  pageCount: number;
  characterCount: number;
}

export async function extractPdfText(
  buffer: Buffer,
): Promise<ExtractedPdf> {
  const parser = new PDFParse({
    data: new Uint8Array(buffer),
  });

  try {
    const parsed = await parser.getText();

    if (parsed.total > env.RESUME_PDF_MAX_PAGES) {
      throw new AppError(
        413,
        "PDF_PAGE_LIMIT_EXCEEDED",
        `The PDF exceeds the ${env.RESUME_PDF_MAX_PAGES}-page limit.`,
      );
    }

    const normalized = parsed.text
      .replace(/\r\n?/g, "\n")
      .replace(/[\t\f\v]+/g, " ")
      .replace(/ {2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (normalized.length < 50) {
      throw new AppError(
        422,
        "PDF_TEXT_INSUFFICIENT",
        "The PDF contains too little extractable text. Scanned-image OCR is not included yet.",
      );
    }

    if (normalized.length > env.RESUME_PDF_MAX_TEXT_CHARACTERS) {
      throw new AppError(
        413,
        "PDF_TEXT_LIMIT_EXCEEDED",
        `Extracted text exceeds the ${env.RESUME_PDF_MAX_TEXT_CHARACTERS}-character limit.`,
      );
    }

    return {
      text: normalized,
      pageCount: parsed.total,
      characterCount: normalized.length,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw new AppError(
      422,
      "PDF_EXTRACTION_FAILED",
      "Text could not be extracted from the uploaded PDF.",
    );
  } finally {
    await parser.destroy();
  }
}
