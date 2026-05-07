import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  if (mimeType === "application/pdf") {
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
