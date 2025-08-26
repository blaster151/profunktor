import { describe, it, expect } from "vitest";
import { demoJeffSmithModel } from "../fp-computational-topos-framework";

describe("Jeff Smith criterion (toy)", () => {
  it("reports c0–c3 and builds a model surface", () => {
    const { model, report } = demoJeffSmithModel();
    expect(model.isCofibration).toBeTypeOf("function");
    expect(report.c0).toBe(true);
    expect(report.c1).toBe(true);
    expect(report.c2).toBe(true);
    expect(report.c3).toBe(true);
  });
});
