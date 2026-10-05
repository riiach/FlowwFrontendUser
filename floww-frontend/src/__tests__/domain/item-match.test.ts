import { it, expect } from "vitest";
import { matchItem, ITEMS } from "@/lib/domain/draft/item-match";
it("matches only the supported two items and rejects ambiguous scope", () => {
  expect(matchItem("타이레놀 500mg")).toBe(ITEMS.acetaminophen);
  expect(matchItem("아세트아미노펜")).toBe(ITEMS.acetaminophen);
  expect(matchItem("Ibuprofen")).toBe(ITEMS.ibuprofen);
  expect(matchItem("타이레놀 또는 이부프로펜")).toBeNull();
  expect(matchItem("비타민")).toBeNull();
});
