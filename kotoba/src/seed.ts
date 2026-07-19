/**
 * Seeder: NIST CSF 2.0 element JSONs → AT Records via @etzhayyim/sdk.
 *
 * Replaces the RW seed path (was `vertex_nist_*`) with a straight-line PDS write
 * loop. Idempotent: rkey = flattened code. Reads element JSONs from a directory
 * (default ../data/elements, overridable with --dir= or ETZ_NIST_DATA_DIR); each
 * file is a SourceElement with at least { code, title }; level/function/parent
 * are derived.
 *
 * Usage:
 *   pnpm tsx src/seed.ts                  # all elements under the data dir
 *   pnpm tsx src/seed.ts --only=ID.AM-01  # one code
 *   pnpm tsx src/seed.ts --dir=/path      # custom data dir
 */

import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Etzhayyim } from "@etzhayyim/sdk";
import {
  csfLevel,
  elementRkey,
  functionOf,
  isValidCsfCode,
  parentOf,
  type CsfElement,
} from "./types.js";

const COLLECTION = "com.etzhayyim.apps.nist.element";
const CSF_PUBLISHED_AT_DEFAULT = "2024-02-26T00:00:00Z"; // CSF 2.0 release

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_DIR =
  process.env.ETZ_NIST_DATA_DIR ?? join(__dirname, "..", "..", "data", "elements");

const e = new Etzhayyim({
  did: process.env.ETZ_SEEDER_DID ?? "did:web:etzhayyim.com",
  pdsUrl: process.env.ETZ_PDS_URL ?? "https://pds.etzhayyim.com",
  ipfsApiUrl: process.env.ETZ_IPFS_API_URL,
  l2RpcUrl: process.env.ETZ_L2_RPC_URL ?? "https://mainnet.base.org",
});

interface SourceElement {
  code: string;
  title: string;
  description?: string;
  examples?: string[];
  source?: string;
  publishedAt?: string;
}

interface Args {
  dir?: string;
  only?: string;
}

function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (const a of argv) {
    const m = a.match(/^--(\w+)(?:=(.*))?$/);
    if (m) (out as Record<string, string | undefined>)[m[1]] = m[2];
  }
  return out;
}

/** Derive the full CsfElement (level/function/parent) from a source row. */
export function toCsfElement(src: SourceElement): CsfElement {
  if (!isValidCsfCode(src.code)) {
    throw new Error(`invalid CSF code: ${src.code}`);
  }
  return {
    code: src.code,
    title: src.title,
    level: csfLevel(src.code),
    function: functionOf(src.code),
    parent: parentOf(src.code),
    description: src.description,
    examples: src.examples,
    source: src.source,
    publishedAt: src.publishedAt ?? CSF_PUBLISHED_AT_DEFAULT,
  };
}

async function loadElements(dir: string): Promise<SourceElement[]> {
  const entries = await readdir(dir);
  const out: SourceElement[] = [];
  for (const entry of entries) {
    if (!entry.endsWith(".json")) continue;
    out.push(JSON.parse(await readFile(join(dir, entry), "utf8")) as SourceElement);
  }
  out.sort((a, b) => a.code.localeCompare(b.code));
  return out;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const dir = args.dir ?? DEFAULT_DATA_DIR;
  const elements = (await loadElements(dir)).filter((x) =>
    args.only ? x.code === args.only : true
  );
  console.log(`[seed] writing ${elements.length} CSF elements from ${dir}`);

  let ok = 0;
  let err = 0;
  for (const src of elements) {
    try {
      const record = toCsfElement(src);
      await e.write({
        collection: COLLECTION,
        record: record as unknown as Record<string, unknown>,
        rkey: elementRkey(record.code),
      });
      ok += 1;
    } catch (e2) {
      err += 1;
      console.error(`[seed] FAILED code=${src.code}: ${(e2 as Error).message}`);
    }
  }
  console.log(`[seed] DONE ok=${ok} err=${err}`);
}

const isMain =
  import.meta.url.startsWith("file:") &&
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"));
if (isMain) {
  main().catch((err) => {
    console.error("[seed] fatal:", err);
    process.exit(2);
  });
}
