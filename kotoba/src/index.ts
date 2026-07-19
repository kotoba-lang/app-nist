/**
 * nist kotoba — barrel + programmatic read API.
 *
 * Per ADR-2605203000 Option B Phase E reference impl. NIST CSF 2.0 control
 * taxonomy on the etzhayyim substrate (AT PDS records; no RW). Mirrors the
 * open-isic/cpc kotoba read pattern.
 *
 *   import { getByCode, getChildren, queryByFunction } from "@etzhayyim/nist-kotoba";
 */

export type { CsfElement, CsfLevel, CsfFunction } from "./types.js";
export {
  CSF_FUNCTIONS,
  csfLevel,
  functionOf,
  parentOf,
  ancestorsOf,
  isValidCsfCode,
  elementDid,
  elementRkey,
} from "./types.js";

import { Etzhayyim } from "@etzhayyim/sdk";
import {
  csfLevel,
  elementRkey,
  isValidCsfCode,
  type CsfElement,
  type CsfFunction,
} from "./types.js";

const COLLECTION = "com.etzhayyim.apps.nist.element";

function defaultClient(): Etzhayyim {
  return new Etzhayyim({
    did: "did:web:etzhayyim.com",
    pdsUrl: "https://pds.etzhayyim.com",
    ipfsGateway: "https://ipfs.etzhayyim.com",
    l2RpcUrl: "https://mainnet.base.org",
  });
}

/** Read a single CSF element by exact code (rkey = flattened code). */
export async function getByCode(
  code: string,
  opts: { client?: Etzhayyim } = {}
): Promise<CsfElement | null> {
  if (!isValidCsfCode(code)) return null;
  const e = opts.client ?? defaultClient();
  const { records } = await e.read<CsfElement>({
    collection: COLLECTION,
    rkey: elementRkey(code),
    fetchBlobs: false,
  });
  return records[0]?.value ?? null;
}

/** All elements under a Function (the function, its categories + subcategories). */
export async function queryByFunction(
  fn: CsfFunction,
  opts: { limit?: number; client?: Etzhayyim } = {}
): Promise<CsfElement[]> {
  const e = opts.client ?? defaultClient();
  const { records } = await e.read<CsfElement>({
    collection: COLLECTION,
    prefix: fn,
    limit: opts.limit ?? 200,
    fetchBlobs: false,
  });
  return records.map((r) => r.value);
}

/**
 * Direct children of `code`: categories of a function, or subcategories of a
 * category. A subcategory has no children → []. Filters a prefix scan to the
 * direct-child level + parent match.
 */
export async function getChildren(
  code: string,
  opts: { limit?: number; client?: Etzhayyim } = {}
): Promise<CsfElement[]> {
  if (!isValidCsfCode(code)) return [];
  const level = csfLevel(code);
  if (level === "subcategory") return [];
  const childLevel = level === "function" ? "category" : "subcategory";
  const e = opts.client ?? defaultClient();
  const { records } = await e.read<CsfElement>({
    collection: COLLECTION,
    prefix: elementRkey(code),
    limit: opts.limit ?? 200,
    fetchBlobs: false,
  });
  return records
    .map((r) => r.value)
    .filter((v) => v.level === childLevel && v.parent === code);
}
