import { describe, expect, it } from "vitest";
import { explainDeliveryStatus } from "../src/lib/delivery-recovery";

describe("explainDeliveryStatus", () => {
  it("marks a bounce as blocking", () => {
    expect(explainDeliveryStatus("bounced").blocking).toBe(true);
  });

  it("marks a spam complaint as blocking", () => {
    expect(explainDeliveryStatus("complained").blocking).toBe(true);
  });

  it("marks provider suppression as blocking", () => {
    expect(explainDeliveryStatus("suppressed").blocking).toBe(true);
  });

  it("marks a plain send failure as retryable", () => {
    expect(explainDeliveryStatus("failed").blocking).toBe(false);
  });

  it("falls back safely for an unrecognized status", () => {
    const result = explainDeliveryStatus("mystery");
    expect(result.blocking).toBe(true);
    expect(result.label).toBe("mystery");
  });
});
