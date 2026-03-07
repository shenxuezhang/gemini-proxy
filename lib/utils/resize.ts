import sharp from "sharp";

/** 将 base64 图片缩放到指定尺寸，返回 base64 与 mimeType */
export async function resizeImage(
  base64Data: string,
  width: number,
  height: number,
  mimeType = "image/png"
): Promise<{ data: string; mimeType: string }> {
  const buffer = Buffer.from(base64Data, "base64");
  const format = mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpeg" : "png";
  const resized = await sharp(buffer)
    .resize(width, height, { fit: "cover" })
    .toFormat(format, { quality: 95 })
    .toBuffer();
  return {
    data: resized.toString("base64"),
    mimeType: format === "jpeg" ? "image/jpeg" : "image/png",
  };
}
