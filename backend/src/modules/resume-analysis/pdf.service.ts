import { createHash } from "node:crypto";
import { PDFParse } from "pdf-parse";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/appError.js";

export interface ExtractedPdf {
  text: string;
  pageCount: number;
  characterCount: number;
}

export type ExtractedPdfImageCandidate = {
  buffer: Buffer;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  width: number;
  height: number;
};

function imageMimeType(
  buffer: Buffer,
): ExtractedPdfImageCandidate["mimeType"] | undefined {
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  return undefined;
}

export async function extractFirstPagePdfImages(
  buffer: Buffer,
): Promise<ExtractedPdfImageCandidate[]> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });

  try {
    const result = await parser.getImage({
      partial: [1],
      imageThreshold: 80,
      imageDataUrl: false,
      imageBuffer: true,
    });
    const firstPage =
      result.pages.find((page) => page.pageNumber === 1) ?? result.pages[0];
    if (!firstPage) return [];

    const seen = new Set<string>();
    const candidates: Array<ExtractedPdfImageCandidate & { index: number }> = [];

    firstPage.images.forEach((image, index) => {
      if (!(image.data instanceof Uint8Array)) return;
      if (
        !Number.isFinite(image.width) ||
        !Number.isFinite(image.height) ||
        image.width <= 0 ||
        image.height <= 0
      ) {
        return;
      }

      const imageBuffer = Buffer.from(image.data);
      const mimeType = imageMimeType(imageBuffer);
      if (!mimeType) return;
      const checksum = createHash("sha256").update(imageBuffer).digest("hex");
      if (seen.has(checksum)) return;
      seen.add(checksum);

      candidates.push({
        buffer: imageBuffer,
        mimeType,
        width: image.width,
        height: image.height,
        index,
      });
    });

    candidates.sort((left, right) => {
      const areaDifference = right.width * right.height - left.width * left.height;
      return areaDifference === 0 ? left.index - right.index : areaDifference;
    });

    return candidates.map(({ index: _index, ...candidate }) => candidate);
  } catch {
    return [];
  } finally {
    try {
      await parser.destroy();
    } catch {
      // Embedded-image extraction is optional, including parser cleanup.
    }
  }
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
