import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { corsPreflight, jsonWithCors } from "@/lib/cors";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/** 尝试用 Imagen 4 作为备选（Gemini 图片模型可能因网络/区域不可用） */
async function fallbackToImagen(prompt: string) {
  const resp = await ai.models.generateImages({
    model: "imagen-4.0-fast-generate-001",
    prompt,
    config: { aspectRatio: "1:1" },
  });
  const image = resp.generatedImages?.[0]?.image;
  if (!image?.imageBytes) return null;
  return {
    imageBytes: image.imageBytes,
    mimeType: image.mimeType || "image/png",
  };
}

export async function OPTIONS() {
  return corsPreflight();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = (body?.prompt as string) || "";
    const useImagen = body?.useImagen === true;

    if (!prompt) {
      return jsonWithCors({ error: "Missing prompt" }, { status: 400 });
    }

    if (useImagen) {
      const result = await fallbackToImagen(prompt);
      if (!result) {
        return jsonWithCors({ error: "Imagen failed to generate image" }, { status: 500 });
      }
      return jsonWithCors({ image: result });
    }

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: prompt,
        config: { responseModalities: ["TEXT", "IMAGE"] },
      });
    } catch (geminiErr) {
      const msg = (geminiErr as Error).message;
      if (msg?.includes("fetch") || msg?.includes("network") || msg?.includes("ECONNREFUSED")) {
        const imagenResult = await fallbackToImagen(prompt);
        if (imagenResult) {
          return jsonWithCors({
            image: imagenResult,
            fallback: "gemini_unavailable_used_imagen",
          });
        }
      }
      throw geminiErr;
    }

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      const imagenResult = await fallbackToImagen(prompt);
      if (imagenResult) {
        return jsonWithCors({
          image: imagenResult,
          fallback: "gemini_no_candidates_used_imagen",
        });
      }
      const blockReason = response.promptFeedback?.blockReason || "unknown";
      return jsonWithCors(
        { error: "No image generated", details: `candidates empty, blockReason: ${blockReason}` },
        { status: 500 }
      );
    }

    const parts = candidates[0].content?.parts;
    if (!parts || parts.length === 0) {
      const imagenResult = await fallbackToImagen(prompt);
      if (imagenResult) {
        return jsonWithCors({
          image: imagenResult,
          fallback: "gemini_no_parts_used_imagen",
        });
      }
      return jsonWithCors(
        { error: "No image generated", details: "parts empty" },
        { status: 500 }
      );
    }

    let imageData = null;
    let imageMimeType = "image/png";

    for (const part of parts) {
      if (part.inlineData) {
        imageData = part.inlineData.data;
        imageMimeType = part.inlineData.mimeType || "image/png";
        break;
      }
    }

    if (!imageData) {
      const imagenResult = await fallbackToImagen(prompt);
      if (imagenResult) {
        return jsonWithCors({
          image: imagenResult,
          fallback: "gemini_no_image_used_imagen",
        });
      }
      return jsonWithCors(
        { error: "No image generated", details: "no inlineData in parts" },
        { status: 500 }
      );
    }

    return jsonWithCors({
      image: {
        imageBytes: imageData,
        mimeType: imageMimeType,
      },
    });
  } catch (error) {
    const err = error as Error;
    console.error("Error generating image:", err);
    const message = err.message || "Failed to generate image";
    return jsonWithCors(
      { error: "Failed to generate image", details: message },
      { status: 500 }
    );
  }
}
