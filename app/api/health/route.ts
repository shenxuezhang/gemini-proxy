import { NextResponse } from "next/server";

/** 健康检查：用于验证服务是否正常运行 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "emag-gemini-proxy",
    timestamp: new Date().toISOString(),
    apis: [
      "/api/gemini/generate",
      "/api/gemini/edit",
      "/api/gemini/chat",
      "/api/imagen/generate",
      "/api/veo/generate",
      "/api/veo/operation",
      "/api/veo/download",
    ],
  });
}
