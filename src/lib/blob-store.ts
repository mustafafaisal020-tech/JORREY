import { Redis } from "@upstash/redis";
import fs from "fs";
import path from "path";

const IS_VERCEL = !!process.env.VERCEL;
const DATA_DIR = path.join(process.cwd(), "data");

let _redis: Redis | null = null;
function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return _redis;
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
  fs.writeFileSync(path.join(DATA_DIR, `${key}.json`), JSON.stringify(data, null, 2));
}

export async function readStore<T>(key: string, fallback: T): Promise<T> {
  if (!IS_VERCEL) return readFromFile(key, fallback);
  try {
    const data = await getRedis().get<T>(key);
    return data ?? fallback;
  } catch {
    return fallback;
  }
}

export async function writeStore<T>(key: string, data: T): Promise<void> {
  if (!IS_VERCEL) {
    writeToFile(key, data);
    return;
  }
  await getRedis().set(key, data);
}
