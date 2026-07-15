import { describe, expect, it } from "vitest";

import { formatClauseIqDate, formatClauseIqTimestamp } from "./clauseiq-v6a-format";

describe("ClauseIQ v6a date formatting", () => {
  it("uses the agreed numeric date and 24-hour timestamp format", () => {
    expect(formatClauseIqDate("2026-07-15T09:05:00")).toBe("2026/07/15");
    expect(formatClauseIqTimestamp("2026-07-15T09:05:00")).toBe("2026/07/15 · 09:05");
  });
});
