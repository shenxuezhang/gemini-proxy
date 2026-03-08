import sharp from "sharp";

/** 将 base64 图片缩放到指定尺寸，统一输出 JPEG 以减小体积（约 50–70%） */
export async function resizeImage(
  base64Data: string,
  width: number,
  height: number,
  mimeType = "image/png"
): Promise<{ data: string; mimeType: string }> {
  const buffer = Buffer.from(base64Data, "base64");
  const resized = await sharp(buffer)
    .resize(width, height, { fit: "cover" })
    .toFormat("jpeg", { quality: 85 })
    .toBuffer();
  return {
    data: resized.toString("base64"),
    mimeType: "image/jpeg",
  };
}

/** 统一转 JPEG 压缩，减小传输体积约 50–70% */
export async function compressToJpeg(
  base64Data: string,
  mimeType = "image/png"
): Promise<{ data: string; mimeType: string }> {
  const buffer = Buffer.from(base64Data, "base64");
  const out = await sharp(buffer)
    .toFormat("jpeg", { quality: 85 })
    .toBuffer();
  return { data: out.toString("base64"), mimeType: "image/jpeg" };
}
