import { isValidDate } from "../app/modals/add-tx";

it("accepts real calendar dates", () => {
  expect(isValidDate("2026-02-28")).toBe(true);
  expect(isValidDate("2024-02-29")).toBe(true);
});

it("rejects overflow and malformed dates", () => {
  expect(isValidDate("2026-02-31")).toBe(false);
  expect(isValidDate("2025-02-29")).toBe(false);
  expect(isValidDate("2026-2-03")).toBe(false);
});
