import { NextResponse } from "next/server";

/** CORS 头，供 API 路由使用（Vercel 部署需与 vercel.json、middleware 一致） */
export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

/** 预检 OPTIONS 响应 */
export function corsPreflight() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/** 为 JSON 响应添加 CORS 头 */
export function jsonWithCors<T>(data: T, init?: ResponseInit) {
  const res = NextResponse.json(data, init);
  Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}
