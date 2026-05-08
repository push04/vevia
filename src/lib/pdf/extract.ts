import mammoth from "mammoth";

function ensureBrowserGlobals(): void {
  const isNode = typeof globalThis !== "undefined" && typeof (globalThis as Record<string, unknown>).window === "undefined";
  if (!isNode) return;

  // pdfjs-dist (used by pdf-parse) relies on browser geometry APIs.
  // Polyfill them for Node.js / serverless environments.

  if (typeof (globalThis as Record<string, unknown>).DOMMatrixReadOnly === "undefined") {
    class DOMMatrixReadOnly {
      a: number; b: number; c: number; d: number; e: number; f: number;
      m11: number; m12: number; m13: number; m14: number;
      m21: number; m22: number; m23: number; m24: number;
      m31: number; m32: number; m33: number; m34: number;
      m41: number; m42: number; m43: number; m44: number;
      is2D: boolean; isIdentity: boolean;

      constructor(init?: string | number[]) {
        this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
        this.m11 = 1; this.m12 = 0; this.m13 = 0; this.m14 = 0;
        this.m21 = 0; this.m22 = 1; this.m23 = 0; this.m24 = 0;
        this.m31 = 0; this.m32 = 0; this.m33 = 1; this.m34 = 0;
        this.m41 = 0; this.m42 = 0; this.m43 = 0; this.m44 = 1;
        this.is2D = true; this.isIdentity = true;
        if (typeof init === "string") {
          // minimal CSS matrix parsing
          const m = init.match(/matrix3?d?\(([^)]+)\)/);
          if (m) {
            const vals = m[1].split(",").map(Number);
            if (vals.length === 6) {
              this.a = vals[0]; this.b = vals[1]; this.c = vals[2];
              this.d = vals[3]; this.e = vals[4]; this.f = vals[5];
            } else if (vals.length === 16) {
              this.m11 = vals[0]; this.m12 = vals[1]; this.m13 = vals[2]; this.m14 = vals[3];
              this.m21 = vals[4]; this.m22 = vals[5]; this.m23 = vals[6]; this.m24 = vals[7];
              this.m31 = vals[8]; this.m32 = vals[9]; this.m33 = vals[10]; this.m34 = vals[11];
              this.m41 = vals[12]; this.m42 = vals[13]; this.m43 = vals[14]; this.m44 = vals[15];
              this.is2D = false;
            }
          }
        } else if (Array.isArray(init) && init.length >= 6) {
          this.a = init[0]; this.b = init[1]; this.c = init[2]; this.d = init[3];
          this.e = init[4]; this.f = init[5];
          this.is2D = true;
        }
      }

      translate(tx: number, ty: number, tz?: number): DOMMatrix {
        return new DOMMatrix([this.a, this.b, this.c, this.d, this.e + tx, this.f + ty]);
      }
      scale(sx: number, sy?: number): DOMMatrix {
        return new DOMMatrix([this.a * sx, this.b * sx, this.c * (sy ?? sx), this.d * (sy ?? sx), this.e, this.f]);
      }
      rotate(angle: number): DOMMatrix {
        const rad = angle * Math.PI / 180;
        const cos = Math.cos(rad), sin = Math.sin(rad);
        return new DOMMatrix([
          this.a * cos + this.c * sin, this.b * cos + this.d * sin,
          this.a * -sin + this.c * cos, this.b * -sin + this.d * cos,
          this.e, this.f,
        ]);
      }
      toJSON(): Record<string, number> {
        return { a: this.a, b: this.b, c: this.c, d: this.d, e: this.e, f: this.f };
      }
    }

    class DOMMatrix extends DOMMatrixReadOnly {
      constructor(init?: string | number[]) { super(init); }
      multiply(other: DOMMatrix): DOMMatrix { return this; }
      invertSelf(): DOMMatrix { return this; }
    }

    class DOMPoint {
      x: number; y: number; z: number; w: number;
      constructor(x = 0, y = 0, z = 0, w = 1) { this.x = x; this.y = y; this.z = z; this.w = w; }
    }

    class DOMRect {
      x: number; y: number; width: number; height: number;
      constructor(x = 0, y = 0, width = 0, height = 0) { this.x = x; this.y = y; this.width = width; this.height = height; }
      get top(): number { return this.y; }
      get left(): number { return this.x; }
      get right(): number { return this.x + this.width; }
      get bottom(): number { return this.y + this.height; }
    }

    (globalThis as Record<string, unknown>).DOMMatrixReadOnly = DOMMatrixReadOnly;
    (globalThis as Record<string, unknown>).DOMMatrix = DOMMatrix;
    (globalThis as Record<string, unknown>).DOMPoint = DOMPoint;
    (globalThis as Record<string, unknown>).DOMRect = DOMRect;
  }
}

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  if (mimeType === "application/pdf") {
    ensureBrowserGlobals();
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    return parsed.text ?? "";
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value ?? "";
  }

  if (mimeType.startsWith("text/")) {
    return buffer.toString("utf8");
  }

  throw new Error(`Unsupported resume MIME type: ${mimeType}`);
}
