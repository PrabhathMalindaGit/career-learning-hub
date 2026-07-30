import {
  existsSync,
  readFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const frontendRoot = process.cwd();
const publicRoot = resolve(frontendRoot, "public");
const indexPath = resolve(frontendRoot, "index.html");

const svgAssets = [
  "career-learning-hub.svg",
  "career-learning-hub-mark.svg",
  "career-learning-hub-monochrome.svg",
  "career-learning-hub-reversed.svg",
  "favicon.svg",
] as const;

const approvedColours = new Set([
  "#18211b",
  "#1e6039",
  "#287a4a",
  "#f4f7f5",
  "#ffffff",
]);

function brandPath(filename: string) {
  return resolve(publicRoot, "brand", filename);
}

function readAsset(filename: string) {
  const path = brandPath(filename);
  expect(existsSync(path), `${filename} should exist`).toBe(true);
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

describe("production brand assets", () => {
  it.each(svgAssets)(
    "%s contains real solid vector geometry",
    (filename) => {
      const svg = readAsset(filename);
      const geometry = svg.match(
        /<(?:path|rect|circle|ellipse|line|polyline|polygon)\b/g,
      );
      const colours = svg.match(/#[0-9a-fA-F]{6}\b/g) ?? [];

      expect(svg).toContain("<svg");
      expect(svg).toContain("viewBox=");
      expect(svg).toContain("<title");
      expect(geometry?.length ?? 0).toBeGreaterThan(0);
      expect(svg).not.toMatch(
        /<(?:image|linearGradient|radialGradient|filter)\b/,
      );
      expect(svg).not.toContain("data:image/");
      for (const colour of colours) {
        expect(approvedColours.has(colour.toLowerCase())).toBe(true);
      }
    },
  );

  it("keeps the approved wordmark and single-colour contract", () => {
    const primary = readAsset("career-learning-hub.svg");
    const monochrome = readAsset(
      "career-learning-hub-monochrome.svg",
    );
    const monochromeColours = new Set(
      monochrome.match(/#[0-9a-fA-F]{6}\b/g)?.map(
        (colour) => colour.toLowerCase(),
      ),
    );

    expect(primary).toContain("Career Learning Hub");
    expect(monochromeColours).toEqual(new Set(["#18211b"]));
  });

  it.each([
    ["favicon-32.png", 32, 32],
    ["app-icon-192.png", 192, 192],
    ["app-icon-512.png", 512, 512],
  ] as const)(
    "%s is a PNG with exact %d by %d dimensions",
    (filename, expectedWidth, expectedHeight) => {
      const path = brandPath(filename);
      expect(existsSync(path), `${filename} should exist`).toBe(true);
      const png = existsSync(path)
        ? readFileSync(path)
        : Buffer.alloc(24);

      expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
      expect(png.readUInt32BE(16)).toBe(expectedWidth);
      expect(png.readUInt32BE(20)).toBe(expectedHeight);
    },
  );

  it("connects favicon and application icon metadata", () => {
    const manifestPath = resolve(publicRoot, "site.webmanifest");
    expect(
      existsSync(manifestPath),
      "site.webmanifest should exist",
    ).toBe(true);
    const manifest = existsSync(manifestPath)
      ? JSON.parse(readFileSync(manifestPath, "utf8")) as {
          name?: string;
          short_name?: string;
          icons?: Array<{
            src?: string;
            sizes?: string;
            type?: string;
          }>;
        }
      : {};
    const index = readFileSync(indexPath, "utf8");

    expect(manifest.name).toBe("Career Learning Hub");
    expect(manifest.short_name).toBe("Career Learning Hub");
    expect(manifest.icons).toEqual([
      {
        src: "/brand/app-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ]);
    expect(index).toContain("<title>Career Learning Hub</title>");
    expect(index).toContain(
      'rel="icon" href="/brand/favicon.svg" type="image/svg+xml"',
    );
    expect(index).toContain(
      'rel="icon" href="/brand/favicon-32.png" sizes="32x32"',
    );
    expect(index).toContain(
      'rel="manifest" href="/site.webmanifest"',
    );
  });
});
