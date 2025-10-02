import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tool } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.error("API_KEY environment variable not set.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY! });

const MASK_PROMPT_KEY = "#FF00FF"; // Bright pink for masking

const getBase64Data = (base64String: string): string => {
  return base64String.split(',')[1];
};

const getClosestAspectRatio = (width: number, height: number): '1:1' | '3:4' | '4:3' | '9:16' | '16:9' => {
  if (width <= 0 || height <= 0) {
    return '1:1'; // Default
  }
  const ratio = width / height;

  const supportedRatios = [
    { name: '1:1' as const, value: 1 },
    { name: '3:4' as const, value: 3 / 4 },
    { name: '4:3' as const, value: 4 / 3 },
    { name: '9:16' as const, value: 9 / 16 },
    { name: '16:9' as const, value: 16 / 9 },
  ];

  let closest = supportedRatios[0];
  let minDifference = Math.abs(ratio - closest.value);

  for (let i = 1; i < supportedRatios.length; i++) {
    const difference = Math.abs(ratio - supportedRatios[i].value);
    if (difference < minDifference) {
      minDifference = difference;
      closest = supportedRatios[i];
    }
  }

  return closest.name;
};

export const generateImageFromText = async (prompt: string, width: number = 1024, height: number = 1024): Promise<string> => {
  try {
    const aspectRatio = getClosestAspectRatio(width, height);
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: aspectRatio,
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      return `data:image/png;base64,${base64ImageBytes}`;
    }
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Error generating image from text:", error);
    throw error;
  }
};

const editImage = async (imageBase64: string, mimeType: string, prompt: string): Promise<string> => {
  const response = await ai.models.generateContent({
    // FIX: Use correct model name 'gemini-2.5-flash-image' instead of deprecated 'gemini-2.5-flash-image-preview'.
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: getBase64Data(imageBase64),
            mimeType: mimeType,
          },
        },
        { text: prompt },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const base64ImageBytes = part.inlineData.data;
      return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
    }
  }
  throw new Error("No edited image returned from API.");
};


export const generateImageFromDraw = async (drawingBase64: string, mimeType: string, prompt: string): Promise<string> => {
  const fullPrompt = `Based on the following drawing and description, generate a detailed and high-quality image. Description: "${prompt}"`;
  return editImage(drawingBase64, mimeType, fullPrompt);
};

export const generativeFill = async (maskedImageBase64: string, mimeType: string, prompt: string): Promise<string> => {
  const fullPrompt = `In the provided image, fill the area marked with the color ${MASK_PROMPT_KEY} based on the following instruction, blending it seamlessly with the rest of the image: "${prompt}"`;
  return editImage(maskedImageBase64, mimeType, fullPrompt);
};

export const removeBackground = async (imageBase64: string, mimeType: string): Promise<string> => {
  const prompt = "Remove the background from this image. The subject should be perfectly preserved. The new background must be transparent. Return the result as a PNG file.";
  return editImage(imageBase64, mimeType, prompt);
};

const suggestionPrompts: Record<Tool, string> = {
  [Tool.HOME]: "", // Not applicable
  [Tool.FILES]: "", // Not applicable
  [Tool.TEXT_TO_IMAGE]: "You are a creative assistant for an AI image generation tool. Generate 5 diverse and inspiring text-to-image prompts. The prompts should be detailed and cover different styles like photorealism, fantasy, and abstract art. If the user has started typing, use it as inspiration.",
  [Tool.DRAW_TO_IMAGE]: "You are a creative assistant for an AI image generation tool. A user has provided a simple sketch. Generate 5 diverse prompts that could transform the sketch into a masterpiece, suggesting different art styles and interpretations (e.g., 'a detailed oil painting of...', 'a charcoal sketch of...', 'a vibrant watercolor of...').",
  [Tool.GENERATIVE_FILL]: "You are a creative assistant for an AI image generation tool. A user has masked part of their image. Generate 5 creative, concise ideas for what to fill the masked area with. The ideas should be short phrases.",
  [Tool.REMOVE_BACKGROUND]: "" // Not applicable
};

export const getPromptSuggestions = async (tool: Tool, currentPrompt?: string): Promise<string[]> => {
  try {
    const systemInstruction = suggestionPrompts[tool];
    if (!systemInstruction) return [];
    
    const userMessage = currentPrompt 
      ? `The user's current prompt is: "${currentPrompt}". Generate suggestions based on this.`
      : "The user has not typed anything yet. Generate some general, creative ideas.";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              description: 'A list of 5 prompt suggestions.',
              items: { type: Type.STRING }
            }
          },
          required: ['suggestions']
        },
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    
    if (result.suggestions && Array.isArray(result.suggestions)) {
      return result.suggestions.filter((s): s is string => typeof s === 'string');
    }
    return [];

  } catch (error) {
    console.error(`Error fetching prompt suggestions for ${tool}:`, error);
    return []; // Return empty array on error to avoid breaking the UI
  }
};
