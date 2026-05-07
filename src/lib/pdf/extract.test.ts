import { describe, expect, it } from "vitest";

import { extractTextFromFile } from "./extract";

describe("extractTextFromFile", () => {
  it("extracts text/plain", async () => {
    const text = "hello resume";
    const result = await extractTextFromFile(Buffer.from(text, "utf8"), "text/plain");
    expect(result).toContain(text);
  });

  it("throws on unsupported type", async () => {
    await expect(
      extractTextFromFile(Buffer.from("x", "utf8"), "application/octet-stream"),
    ).rejects.toThrow(/Unsupported resume MIME type/);
  });
});

