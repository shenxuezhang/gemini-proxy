import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { corsPreflight, jsonWithCors } from "@/lib/cors";
import { cleanBase64 } from "@/lib/utils/base64";
import { compressToJpeg, resizeImage } from "@/lib/utils/resize";

export const maxDuration = 180;

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const ALLOWED_MODELS = [
  "gemini-3.1-flash-image-preview",
  "gemini-3-pro-image-preview",
  "gemini-2.5-flash-image",
];
const FALLBACK_MODEL = "gemini-2.5-flash-image";

type HistoryItem = {
  role: "user" | "model";
  parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string }; thoughtSignature?: string }>;
};

type ChatParams = { aspectRatio?: string; temperature?: number; imageSize?: string };

type ChatRequestBody = {
  history?: HistoryItem[];
  message: string | Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
  model?: string;
  params?: ChatParams;
};

function buildContents(
  history: HistoryItem[],
  messageParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>
) {
  const contents: Array<{ role: string; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }> = [];
  for (const h of history) {
    contents.push({
      role: h.role,
      parts: h.parts.map((p) => {
        if (p.inlineData) {
          return { inlineData: { mimeType: p.inlineData.mimeType || "image/png", data: cleanBase64(p.inlineData.data) } };
        }
        return { text: p.text || "" };
      }),
    });
  }
  contents.push({
    role: "user",
    parts: messageParts.map((p) => {
      if (p.inlineData) {
        return { inlineData: { mimeType: p.inlineData!.mimeType || "image/png", data: cleanBase64(p.inlineData!.data) } };
      }
      return { text: p.text || "" };
    }),
  });
  return contents;
}

function parseResponse(response: {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: { data?: string; mimeType?: string };
        text?: string;
        thoughtSignature?: string;
      }>;
    };
  }>;
}) {
  const candidate = response.candidates?.[0];
  if (!candidate?.content?.parts) return null;
  let imageData: string | null = null;
  let responseMimeType = "image/png";
  let textContent = "";
  let thoughtSignature: string | undefined;
  for (const part of candidate.content.parts) {
    if (part.inlineData?.data) {
      imageData = part.inlineData.data;
      responseMimeType = part.inlineData.mimeType || "image/png";
    }
    if (part.text) textContent += part.text;
    if (part.thoughtSignature) thoughtSignature = part.thoughtSignature;
  }
  return { imageData, responseMimeType, textContent, thoughtSignature };
}

export async function OPTIONS() {
  return corsPreflight();
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const { history = [], message, model: modelParam, params: paramsParam } = body;

    const ALLOWED_ASPECT_RATIOS = ["1:1", "1:4", "1:8", "2:3", "3:2", "3:4", "4:1", "4:3", "4:5", "5:4", "8:1", "9:16", "16:9", "21:9", "1340:1785"];
    const SHEIN_TO_GEMINI: Record<string, string> = { "1340:1785": "3:4" };
    const rawRatio = paramsParam?.aspectRatio && ALLOWED_ASPECT_RATIOS.includes(paramsParam.aspectRatio)
      ? paramsParam.aspectRatio
      : undefined;
    const aspectRatio = rawRatio ? (SHEIN_TO_GEMINI[rawRatio] ?? rawRatio) : undefined;
    const temperature = paramsParam?.temperature != null && paramsParam.temperature >= 0 && paramsParam.temperature <= 2
      ? paramsParam.temperature
      : undefined;
    const ALLOWED_IMAGE_SIZES = ["512px", "1K", "2K", "4K"];
    const imageSize = paramsParam?.imageSize && ALLOWED_IMAGE_SIZES.includes(paramsParam.imageSize)
      ? paramsParam.imageSize
      : "2K";

    const messageParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> =
      typeof message === "string"
        ? [{ text: message }]
        : Array.isArray(message)
          ? message
          : [];

    if (messageParts.length === 0 || (!messageParts.some((p) => p.text) && !messageParts.some((p) => p.inlineData))) {
      return jsonWithCors({ error: "Missing or invalid message" }, { status: 400 });
    }

    const model = modelParam && ALLOWED_MODELS.includes(modelParam)
      ? modelParam
      : "gemini-3.1-flash-image-preview";

    const buildConfig = (useModel: string) => {
      const c: Record<string, unknown> = { responseModalities: ["TEXT", "IMAGE"] };
      const imgCfg: Record<string, string> = { aspectRatio: aspectRatio || "1:1" };
      if (useModel.startsWith("gemini-3")) imgCfg.imageSize = imageSize;
      c.imageConfig = imgCfg;
      if (temperature != null) c.temperature = temperature;
      return c;
    };
    const useFallback = history.length === 0;

    /** 构建符合 Gemini API 的 contents：{ role, parts }[] */
    const toApiContents = () =>
      buildContents(history, messageParts).map((c) => ({
        role: c.role,
        parts: c.parts.map((p) => (p.text ? { text: p.text } : { inlineData: p.inlineData })),
      }));

    const callGenerateContent = async (useModel: string) => {
      return ai.models.generateContent({ model: useModel, contents: toApiContents(), config: buildConfig(useModel) });
    };

    if (useFallback) {
      const tryWithFallback = async (useModel: string): Promise<Awaited<ReturnType<typeof callGenerateContent>>> => {
        try {
          return await callGenerateContent(useModel);
        } catch (e) {
          const m = String((e as Error)?.message || "");
          if ((m.includes("500") || m.includes("INTERNAL") || m.includes("Internal error")) && useModel !== FALLBACK_MODEL) {
            await new Promise((r) => setTimeout(r, 1500));
            return tryWithFallback(FALLBACK_MODEL);
          }
          throw e;
        }
      };
      const response = await tryWithFallback(model);
      const parsed = parseResponse(response);
      if (!parsed?.imageData) {
        return jsonWithCors(
          {
            error: parsed ? "No image in response" : "No response from model",
            text: parsed?.textContent,
            hint: "纯文本提示可能无法生成图片，建议上传参考图或使用更具体的描述。",
          },
          { status: 500 }
        );
      }
      let imageBytes = parsed.imageData;
      let responseMimeType = parsed.responseMimeType;
      if (rawRatio === "1340:1785") {
        const resized = await resizeImage(imageBytes!, 1340, 1785, responseMimeType);
        imageBytes = resized.data;
        responseMimeType = resized.mimeType;
      } else {
        const compressed = await compressToJpeg(imageBytes!, responseMimeType);
        imageBytes = compressed.data;
        responseMimeType = compressed.mimeType;
      }
      return jsonWithCors({
        image: { imageBytes, mimeType: responseMimeType },
        text: parsed.textContent || undefined,
        thoughtSignature: parsed.thoughtSignature,
      });
    }

    const historyContents = history.map((h) => ({
      role: h.role as "user" | "model",
      parts: h.parts.map((p) => {
        if (p.inlineData) {
          const part: { inlineData: { mimeType: string; data: string }; thoughtSignature?: string } = {
            inlineData: { mimeType: p.inlineData.mimeType || "image/png", data: cleanBase64(p.inlineData.data) },
          };
          if (p.thoughtSignature) part.thoughtSignature = p.thoughtSignature;
          return part;
        }
        return { text: p.text || "" };
      }),
    }));

    const sendParts = messageParts.map((p) => {
      if (p.inlineData) {
        return { inlineData: { mimeType: p.inlineData!.mimeType || "image/png", data: cleanBase64(p.inlineData!.data) } };
      }
      return { text: p.text || "" };
    });

    const callChatSend = async (useModel: string) => {
      const cfg = buildConfig(useModel);
      const chat = ai.chats.create({ model: useModel, config: cfg, history: historyContents });
      return chat.sendMessage({
        message: sendParts.length === 1 && sendParts[0]!.text ? sendParts[0]!.text : sendParts,
        config: cfg,
      });
    };

    const tryChatWithFallback = async (useModel: string) => {
      try {
        return await callChatSend(useModel);
      } catch (e) {
        const m = String((e as Error)?.message || "");
        if ((m.includes("500") || m.includes("INTERNAL") || m.includes("Internal error")) && useModel !== FALLBACK_MODEL) {
          await new Promise((r) => setTimeout(r, 1500));
          return tryChatWithFallback(FALLBACK_MODEL);
        }
        throw e;
      }
    };

    try {
      let response = await tryChatWithFallback(model);

      const parsed = parseResponse(response);
      if (!parsed?.imageData) {
        return jsonWithCors(
          {
            error: parsed ? "No image in response" : "No response from model",
            text: parsed?.textContent,
            hint: "纯文本提示可能无法生成图片，建议上传参考图或使用更具体的描述。",
          },
          { status: 500 }
        );
      }
      let imgBytes = parsed.imageData;
      let imgMime = parsed.responseMimeType;
      if (rawRatio === "1340:1785") {
        const resized = await resizeImage(imgBytes!, 1340, 1785, imgMime);
        imgBytes = resized.data;
        imgMime = resized.mimeType;
      } else {
        const compressed = await compressToJpeg(imgBytes!, imgMime);
        imgBytes = compressed.data;
        imgMime = compressed.mimeType;
      }
      return jsonWithCors({
        image: { imageBytes: imgBytes, mimeType: imgMime },
        text: parsed.textContent || undefined,
        thoughtSignature: parsed.thoughtSignature,
      });
    } catch (chatErr) {
      if (history.length === 0) {
        const contents = buildContents([], messageParts).map((c) => ({
          role: c.role,
          parts: c.parts.map((p) => (p.text ? { text: p.text } : { inlineData: p.inlineData })),
        }));
        const response = await ai.models.generateContent({ model, contents, config: buildConfig(model) });
        const parsed = parseResponse(response);
        if (parsed?.imageData) {
          let imgBytes = parsed.imageData;
          let imgMime = parsed.responseMimeType;
          if (rawRatio === "1340:1785") {
            const resized = await resizeImage(imgBytes!, 1340, 1785, imgMime);
            imgBytes = resized.data;
            imgMime = resized.mimeType;
          } else {
            const compressed = await compressToJpeg(imgBytes!, imgMime);
            imgBytes = compressed.data;
            imgMime = compressed.mimeType;
          }
          return jsonWithCors({
            image: { imageBytes: imgBytes, mimeType: imgMime },
            text: parsed.textContent || undefined,
            thoughtSignature: parsed.thoughtSignature,
          });
        }
      }
      throw chatErr;
    }
  } catch (error) {
    const err = error as Error & { error?: { message?: string; status?: string }; status?: number; code?: number };
    const rawMsg = err.error?.message || err.message || "Unknown error";
    console.error("Chat API error:", rawMsg, err);
    const msg = typeof rawMsg === "string" ? rawMsg : JSON.stringify(rawMsg);
    const is503 = msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("high demand");
    const is429 = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota");
    const isInternal = msg.includes("Internal error") || msg.includes("INTERNAL") || err.error?.status === "INTERNAL";
    let errorMsg = "Chat failed";
    let hint: string | undefined;

    if (is503) {
      errorMsg = "当前模型负载较高";
      hint = "请稍后重试，或切换到 Flash 模型（速度更快、更稳定）";
    } else if (is429) {
      errorMsg = "请求过于频繁或配额已用尽";
      hint = "请稍后重试，或切换到 Flash 模型";
    } else if (isInternal) {
      errorMsg = "服务暂时不可用";
      hint = "Google API 内部错误，已尝试稳定版模型。请稍后重试，或检查 API Key、网络及计费状态";
    } else if (msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network")) {
      hint = "请检查：1) 网络能否访问 Google API  2) 若在国内需配置代理  3) API Key 是否有效且已开通计费";
    }

    const details = is503 || is429 || isInternal ? undefined : msg;
    return jsonWithCors(
      { error: errorMsg, details, hint },
      { status: 500 }
    );
  }
}
