/**
 * Pure-helper tests — NIST CSF 2.0 code parsing + hierarchy.
 *
 * Locks the CSF 2.0 three-level structure (Function / Category / Subcategory)
 * and the six-function set (GOVERN added in 2.0). A failure here is a deliberate
 * framework-revision change, not a regression.
 */

import { describe, expect, it } from "vitest";
import {
  CSF_FUNCTIONS,
  ancestorsOf,
  csfLevel,
  functionOf,
  isValidCsfCode,
  parentOf,
  elementRkey,
} from "./types.js";
import { toCsfElement } from "./seed.js";

describe("CSF_FUNCTIONS", () => {
  it("has the six CSF 2.0 functions incl. GOVERN", () => {
    expect([...CSF_FUNCTIONS]).toEqual(["GV", "ID", "PR", "DE", "RS", "RC"]);
  });
});

describe("isValidCsfCode", () => {
  it.each(["GV", "ID", "PR", "DE", "RS", "RC", "ID.AM", "ID.AM-01", "GV.OC-05"])(
    "accepts %s",
    (c) => expect(isValidCsfCode(c)).toBe(true)
  );
  it.each(["XX", "XX.AM", "ID.AM-1", "ID.AM-001", "ID-AM", "id.am", "ID.", "I"])(
    "rejects %s",
    (c) => expect(isValidCsfCode(c)).toBe(false)
  );
});

describe("csfLevel", () => {
  it.each([
    ["ID", "function"],
    ["ID.AM", "category"],
    ["ID.AM-01", "subcategory"],
  ])("%s → %s", (code, level) => {
    expect(csfLevel(code)).toBe(level);
  });
  it("throws on invalid", () => {
    expect(() => csfLevel("ID.AM-1")).toThrow();
  });
});

describe("functionOf", () => {
  it.each([
    ["GV", "GV"],
    ["ID.AM", "ID"],
    ["RC.RP-01", "RC"],
  ])("%s → %s", (code, fn) => {
    expect(functionOf(code)).toBe(fn);
  });
});

describe("parentOf", () => {
  it("function has null parent", () => {
    expect(parentOf("ID")).toBeNull();
  });
  it("category → function", () => {
    expect(parentOf("ID.AM")).toBe("ID");
  });
  it("subcategory → category", () => {
    expect(parentOf("ID.AM-01")).toBe("ID.AM");
  });
});

describe("ancestorsOf", () => {
  it("subcategory chain function-first", () => {
    expect(ancestorsOf("ID.AM-01")).toEqual(["ID", "ID.AM"]);
  });
  it("function has no ancestors", () => {
    expect(ancestorsOf("GV")).toEqual([]);
  });
});

describe("elementRkey", () => {
  it("flattens '.' and '-' for the rkey", () => {
    expect(elementRkey("ID.AM-01")).toBe("ID_AM_01");
    expect(elementRkey("GV")).toBe("GV");
  });
});

describe("toCsfElement (seeder derivation)", () => {
  it("derives level/function/parent for a subcategory", () => {
    const x = toCsfElement({ code: "ID.AM-01", title: "Inventories of hardware" });
    expect(x.level).toBe("subcategory");
    expect(x.function).toBe("ID");
    expect(x.parent).toBe("ID.AM");
    expect(x.publishedAt).toBe("2024-02-26T00:00:00Z");
  });
  it("rejects an invalid code", () => {
    expect(() => toCsfElement({ code: "ZZ.QQ-99", title: "x" })).toThrow();
  });
});
