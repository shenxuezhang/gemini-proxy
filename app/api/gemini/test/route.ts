import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { corsPreflight, jsonWithCors } from "@/lib/cors";

/** 诊断接口：测试 Gemini API 连接与图片模型 */
export async function OPTIONS() {
  return corsPreflight();
}

export async function GET() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return jsonWithCors({ ok: false, error: "GEMINI_API_KEY 未配置" }, { status: 500 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const res = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: "生成一张红色圆形",
      config: { responseModalities: ["TEXT", "IMAGE"] },
    });

    const parts = res.candidates?.[0]?.content?.parts ?? [];
    const hasImage = parts.some((p) => p.inlineData?.data);

    return jsonWithCors({
      ok: true,
      message: "Gemini API 连接正常",
      hasImage: !!hasImage,
      partsCount: parts.length,
    });
  } catch (error) {
    const err = error as Error;
    console.error("Gemini test error:", err);
    const msg = err.message || "Unknown error";
    const hint =
      msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network")
        ? "网络无法访问 Google API，请检查代理或 VPN"
        : msg.includes("403") || msg.includes("PERMISSION")
          ? "API Key 无效或未开通计费"
          : msg.includes("404") || msg.includes("NOT_FOUND")
            ? "模型不可用，请检查 API 权限"
            : undefined;

    return jsonWithCors(
      { ok: false, error: msg, hint },
      { status: 500 }
    );
  }
}
