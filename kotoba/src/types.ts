/**
 * nist kotoba — record types + pure hierarchy helpers.
 *
 * Mirrors the com.etzhayyim.apps.nist.element Lexicon record shape. NIST
 * Cybersecurity Framework (CSF) 2.0 — a public, 3-axis-clean control taxonomy.
 * Per ADR-2605203000 Option B + ADR-2605172000 (kotoba substrate).
 *
 * CSF 2.0 is a 3-level hierarchy:
 *   Function     2 letters         GV ID PR DE RS RC   (6 functions)
 *   Category     {Function}.{XX}   e.g. ID.AM
 *   Subcategory  {Category}-{NN}   e.g. ID.AM-01
 *
 * Identity hierarchy:
 *   did:web:nist.etzhayyim.com                       — controller
 *   did:web:nist.etzhayyim.com:csf:{code}            — a CSF element node
 */

export const NIST_DID_PREFIX = "did:web:nist.etzhayyim.com:" as const;

export type CsfLevel = "function" | "category" | "subcategory";

/** The 6 CSF 2.0 Functions (GOVERN added in 2.0). */
export const CSF_FUNCTIONS = ["GV", "ID", "PR", "DE", "RS", "RC"] as const;
export type CsfFunction = (typeof CSF_FUNCTIONS)[number];

export interface CsfElement {
  /** CSF code (canonical key): function / category / subcategory. */
  code: string;
  /** Canonical English title. */
  title: string;
  level: CsfLevel;
  /** 2-letter Function (= code.slice(0, 2)). */
  function: CsfFunction;
  /** Parent code (function for a category, category for a subcategory), or null. */
  parent: string | null;
  description?: string;
  /** Implementation examples, where published (subcategories). */
  examples?: string[];
  source?: string;
  /** ISO datetime the element was published in the CSF version. */
  publishedAt: string;
}

const FUNCTION_SET: ReadonlySet<string> = new Set(CSF_FUNCTIONS);

const RE_FUNCTION = /^[A-Z]{2}$/;
const RE_CATEGORY = /^[A-Z]{2}\.[A-Z]{2}$/;
const RE_SUBCATEGORY = /^[A-Z]{2}\.[A-Z]{2}-\d{2}$/;

/** True for a well-formed CSF 2.0 code whose Function is one of the six. */
export function isValidCsfCode(code: string): boolean {
  const fn = code.slice(0, 2);
  if (!FUNCTION_SET.has(fn)) return false;
  return RE_FUNCTION.test(code) || RE_CATEGORY.test(code) || RE_SUBCATEGORY.test(code);
}

/** Hierarchy level for a CSF code. */
export function csfLevel(code: string): CsfLevel {
  if (RE_SUBCATEGORY.test(code)) return "subcategory";
  if (RE_CATEGORY.test(code)) return "category";
  if (RE_FUNCTION.test(code)) return "function";
  throw new Error(`invalid CSF code: ${code}`);
}

/** 2-letter Function of any CSF code. */
export function functionOf(code: string): CsfFunction {
  const fn = code.slice(0, 2);
  if (!FUNCTION_SET.has(fn)) throw new Error(`invalid CSF function in: ${code}`);
  return fn as CsfFunction;
}

/** Parent code: subcategory → category, category → function, function → null. */
export function parentOf(code: string): string | null {
  if (!isValidCsfCode(code)) throw new Error(`invalid CSF code: ${code}`);
  if (RE_SUBCATEGORY.test(code)) return code.slice(0, code.indexOf("-"));
  if (RE_CATEGORY.test(code)) return code.slice(0, 2);
  return null;
}

/** Ancestor chain, function-first (excludes the code itself). */
export function ancestorsOf(code: string): string[] {
  const out: string[] = [];
  let p = parentOf(code);
  while (p) {
    out.unshift(p);
    p = parentOf(p);
  }
  return out;
}

export function elementDid(code: string): string {
  return `${NIST_DID_PREFIX}csf:${code}`;
}

/** rkey — '.' and '-' are not valid in a TID-style rkey segment; flatten. */
export function elementRkey(code: string): string {
  return code.replace(/[.-]/g, "_");
}
