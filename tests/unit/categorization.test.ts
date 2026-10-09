import { describe, it, expect } from "vitest";
import { suggestCategoryFromText } from "@/lib/categorization";

describe("Keyword-Based Auto-Categorization", () => {
  it("suggests IT category for Wi-Fi and network keywords", () => {
    const result = suggestCategoryFromText("The wifi network in room 204 is disconnecting constantly");
    expect(result).not.toBeNull();
    expect(result?.category).toBe("IT");
    expect(result?.matchedKeywords).toContain("wifi");
    expect(result?.matchedKeywords).toContain("network");
  });

  it("suggests HOSTEL category for hostel room and mess keywords", () => {
    const result = suggestCategoryFromText("Hostel room geyser is broken and leaking water on the floor");
    expect(result).not.toBeNull();
    expect(result?.category).toBe("HOSTEL");
    expect(result?.matchedKeywords).toContain("hostel");
    expect(result?.matchedKeywords).toContain("room");
  });

  it("suggests ACADEMICS category for exam and grade keywords", () => {
    const result = suggestCategoryFromText("Discrepancy in my semester exam marks and grade card");
    expect(result).not.toBeNull();
    expect(result?.category).toBe("ACADEMICS");
  });

  it("suggests LIBRARY category for book return and journal keywords", () => {
    const result = suggestCategoryFromText("Need assistance with returning library book and paying fine");
    expect(result).not.toBeNull();
    expect(result?.category).toBe("LIBRARY");
  });

  it("suggests ADMINISTRATION category for fee and certificate keywords", () => {
    const result = suggestCategoryFromText("Request for bonafide certificate from administration office");
    expect(result).not.toBeNull();
    expect(result?.category).toBe("ADMINISTRATION");
  });

  it("returns null for non-matching or very short text", () => {
    expect(suggestCategoryFromText("hi")).toBeNull();
    expect(suggestCategoryFromText("random unrelated statement without keywords")).toBeNull();
  });
});
