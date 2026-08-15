import { afterEach, describe, expect, it, vi } from "vitest";

const { destroyMock, getImageMock } = vi.hoisted(() => ({
  destroyMock: vi.fn(),
  getImageMock: vi.fn(),
}));

vi.mock("pdf-parse", () => ({
  PDFParse: class {
    getImage = getImageMock;
    destroy = destroyMock;
  },
}));

import { extractFirstPagePdfImages } from "../../modules/resume-analysis/pdf.service.js";

const png = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01,
]);
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x01]);
const webp = Buffer.from("RIFF0000WEBPpayload", "ascii");
const unsupported = Buffer.from("GIF89a", "ascii");

function image(data: Buffer, width: number, height: number) {
  return { data: new Uint8Array(data), width, height, name: "synthetic" };
}

describe("Resume PDF embedded image extraction", () => {
  afterEach(() => {
    getImageMock.mockReset();
    destroyMock.mockReset();
  });

  it("extracts only supported first-page images using the bounded pdf-parse options", async () => {
    getImageMock.mockResolvedValue({
      pages: [
        {
          pageNumber: 1,
          images: [
            image(png, 300, 400),
            image(jpeg, 200, 250),
            image(webp, 150, 200),
            image(unsupported, 500, 500),
          ],
        },
      ],
    });

    const result = await extractFirstPagePdfImages(Buffer.from("%PDF-test"));

    expect(getImageMock).toHaveBeenCalledWith({
      partial: [1],
      imageThreshold: 80,
      imageDataUrl: false,
      imageBuffer: true,
    });
    expect(result.map((candidate) => candidate.mimeType)).toEqual([
      "image/png",
      "image/jpeg",
      "image/webp",
    ]);
    expect(result.map((candidate) => candidate.buffer)).toEqual([
      png,
      jpeg,
      webp,
    ]);
    expect(destroyMock).toHaveBeenCalledTimes(1);
  });

  it("deduplicates identical bytes and sorts by pixel area with stable ties", async () => {
    const firstTie = Buffer.concat([png, Buffer.from([0x10])]);
    const secondTie = Buffer.concat([jpeg, Buffer.from([0x20])]);
    const largest = Buffer.concat([webp, Buffer.from([0x30])]);
    getImageMock.mockResolvedValue({
      pages: [
        {
          pageNumber: 1,
          images: [
            image(firstTie, 200, 200),
            image(firstTie, 400, 400),
            image(secondTie, 100, 400),
            image(largest, 500, 300),
          ],
        },
      ],
    });

    const result = await extractFirstPagePdfImages(Buffer.from("%PDF-test"));

    expect(result.map((candidate) => candidate.buffer)).toEqual([
      largest,
      firstTie,
      secondTie,
    ]);
    expect(result.map(({ width, height }) => [width, height])).toEqual([
      [500, 300],
      [200, 200],
      [100, 400],
    ]);
  });

  it("skips invalid dimensions and missing buffers", async () => {
    getImageMock.mockResolvedValue({
      pages: [
        {
          pageNumber: 1,
          images: [
            image(png, 0, 100),
            image(jpeg, 100, -1),
            { width: 100, height: 100, name: "missing-data" },
          ],
        },
      ],
    });

    await expect(
      extractFirstPagePdfImages(Buffer.from("%PDF-test")),
    ).resolves.toEqual([]);
    expect(destroyMock).toHaveBeenCalledTimes(1);
  });

  it("treats image extraction failure as optional and always destroys the parser", async () => {
    getImageMock.mockRejectedValue(new Error("synthetic extraction failure"));

    await expect(
      extractFirstPagePdfImages(Buffer.from("%PDF-test")),
    ).resolves.toEqual([]);
    expect(destroyMock).toHaveBeenCalledTimes(1);
  });
});
