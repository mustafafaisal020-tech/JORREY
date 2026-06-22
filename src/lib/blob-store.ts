/**
 * Storage abstraction:
 *   - Development (no VERCEL env var): reads/writes local data/*.json files
 *   - Production (Vercel): reads/writes Vercel Blob; falls back to committed
 *     data files on first read before any blob exists
 *
 * CDN cache-busting: Vercel Blob serves public files via CDN. After a put(),
 * a subsequent fetch of the same URL can return a stale cached response.
 * We append ?t=<epoch-ms> to every read URL so each request hits origin.
 */
import { put, list } from "@vercel/blob";
import fs from "fs";
import path from "path";

const IS_VERCEL = !!process.env.VERCEL;
const DATA_DIR = path.join(process.cwd(), "data");
const BLOB_PREFIX = "jorrey-data/";

function readFromFile<T>(key: string, fallback: T): T {
  const file = path.join(DATA_DIR, `${key}.json`);
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function writeToFile<T>(key: string, data: T): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(DATA_DIR, `${key}.json`),
    JSON.stringify(data, null, 2)
  );
}

export async function readStore<T>(key: string, fallback: T): Promise<T> {
  if (!IS_VERCEL) return readFromFile(key, fallback);

  try {
    const { blobs } = await list({ prefix: `${BLOB_PREFIX}${key}.json` });
    if (blobs.length > 0) {
      // Append timestamp to bypass CDN cache — ensures we always get the
      // version just written, not a stale edge-cached copy.
      const blobUrl = new URL(blobs[0].url);
      blobUrl.searchParams.set("t", Date.now().toString());
      const res = await fetch(blobUrl.toString(), { cache: "no-store" });
      if (res.ok) return (await res.json()) as T;
    }
  } catch {
    // fall through to committed file
  }

  // No blob written yet — use data committed in the repo as seed
  return readFromFile(key, fallback);
}

export async function writeStore<T>(key: string, data: T): Promise<void> {
  if (!IS_VERCEL) {
    writeToFile(key, data);
    return;
  }
  await put(`${BLOB_PREFIX}${key}.json`, JSON.stringify(data, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}
