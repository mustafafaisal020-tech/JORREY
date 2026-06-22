import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 82;

async function compressImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
  const img = sharp(buffer).rotate(); // auto-orient from EXIF
  const meta = await img.metadata();

  const needsResize =
    (meta.width && meta.width > MAX_DIMENSION) ||
    (meta.height && meta.height > MAX_DIMENSION);

  if (needsResize) {
    img.resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true });
  }

  // GIFs stay as-is (sharp can't re-encode animated GIFs well)
  if (mimeType === "image/gif") return img.toBuffer();

  return img.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const isGif = file.type === "image/gif";
    const compressed = await compressImage(rawBuffer, file.type);
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${isGif ? "gif" : "jpg"}`;

    if (process.env.VERCEL) {
      const blob = await put(`jorrey-products/${filename}`, compressed, {
        access: "public",
        contentType: isGif ? "image/gif" : "image/jpeg",
      });
      return NextResponse.json({ url: blob.url });
    }

    const uploadDir = path.join(process.cwd(), "public", "products");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    fs.writeFileSync(path.join(uploadDir, filename), compressed);
    return NextResponse.json({ url: `/products/${filename}` });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
