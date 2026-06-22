import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";

const IS_VERCEL = !!process.env.VERCEL;
const DATA_DIR = path.join(process.cwd(), "data");
const BLOB_PREFIX = "jorrey-data/";

// Derive the public base URL from the token — avoids calling list() on every
// read, which burned through Advanced Operations (2k/month free limit).
// Token format: vercel_blob_rw_<STORE_ID>_<SECRET>
function getBlobBaseUrl(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN ?? "";
  const match = token.match(/vercel_blob_rw_([^_]+)_/i);
  if (!match) throw new Error("BLOB_READ_WRITE_TOKEN is missing or malformed");
  return `https://${match[1].toLowerCase()}.public.blob.vercel-storage.com`;
}

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
    // Construct URL directly — no list() call needed since we use addRandomSuffix: false.
    // Append ?t= to bypass CDN cache so we always see the latest write.
    const url = `${getBlobBaseUrl()}/${BLOB_PREFIX}${key}.json?t=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) return (await res.json()) as T;
    // 404 means blob not yet created — fall through to seed file
  } catch {
    // fall through
  }

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
