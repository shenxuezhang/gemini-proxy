import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { corsPreflight, jsonWithCors } from "@/lib/cors";
import { cleanBase64 } from "@/lib/utils/base64";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function OPTIONS() {
  return corsPreflight();
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
      return jsonWithCors({ error: "Expected multipart/form-data" }, { status: 400 });
    }

    const form = await req.formData();
    const prompt = (form.get("prompt") as string) || "";

    if (!prompt) {
      return jsonWithCors({ error: "Missing prompt" }, { status: 400 });
    }

    const contents: (
      | { text: string }
      | { inlineData: { mimeType: string; data: string } }
    )[] = [];

    contents.push({ text: prompt });

    const imageFiles = form.getAll("imageFiles");
    for (const imageFile of imageFiles) {
      if (imageFile && imageFile instanceof File) {
        const buf = await imageFile.arrayBuffer();
        const b64 = Buffer.from(buf).toString("base64");
        contents.push({
          inlineData: {
            mimeType: imageFile.type || "image/png",
            data: b64,
          },
        });
      }
    }

    const singleImageFile = form.get("imageFile");
    if (
      singleImageFile &&
      singleImageFile instanceof File &&
      contents.length === 1
    ) {
      const buf = await singleImageFile.arrayBuffer();
      const b64 = Buffer.from(buf).toString("base64");
      contents.push({
        inlineData: {
          mimeType: singleImageFile.type || "image/png",
          data: b64,
        },
      });
    }

    const imageBase64 = (form.get("imageBase64") as string) || undefined;
    const imageMimeType = (form.get("imageMimeType") as string) || undefined;

    if (imageBase64 && contents.length === 1) {
      contents.push({
        inlineData: {
          mimeType: imageMimeType || "image/png",
          data: cleanBase64(imageBase64),
        },
      });
    }

    if (contents.length < 2) {
      return jsonWithCors({ error: "No images provided for editing" }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: contents,
      config: { responseModalities: ["TEXT", "IMAGE"] },
    });

    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) {
      return jsonWithCors({ error: "No image generated" }, { status: 500 });
    }

    let imageData: string | null = null;
    let responseMimeType = "image/png";

    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) {
        imageData = part.inlineData.data;
        responseMimeType = part.inlineData.mimeType || "image/png";
        break;
      }
    }

    if (!imageData) {
      return jsonWithCors({ error: "No image generated" }, { status: 500 });
    }

    return jsonWithCors({
      image: {
        imageBytes: imageData,
        mimeType: responseMimeType,
      },
    });
  } catch (error) {
    const err = error as Error;
    console.error("Error editing image with Gemini:", err);
    const msg = err.message || "Failed to edit image";
    return jsonWithCors({ error: "Failed to edit image", details: msg }, { status: 500 });
  }
}
