import OpenAI from "openai";
import type { OutputData } from "@editorjs/editorjs";
import { isValidLanguageCode, getLanguageByCode } from "@/lib/languages";

export class TranslationService {
  private client: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.client = new OpenAI({
        apiKey,
      });
    }
  }

  /**
   * Translate a simple text string
   */
  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<string> {
    if (!this.client) {
      throw new Error("OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.");
    }

    if (!isValidLanguageCode(targetLanguage)) {
      throw new Error(`Invalid target language code: ${targetLanguage}`);
    }

    if (sourceLanguage && !isValidLanguageCode(sourceLanguage)) {
      throw new Error(`Invalid source language code: ${sourceLanguage}`);
    }

    if (!text || text.trim().length === 0) {
      return text;
    }

    const targetLang = getLanguageByCode(targetLanguage);
    const sourceLang = sourceLanguage ? getLanguageByCode(sourceLanguage) : null;

    const systemPrompt = `You are a professional translator. Translate the given text to ${targetLang?.name || targetLanguage}. 
${sourceLang ? `The source language is ${sourceLang.name}.` : "Detect the source language automatically."}
Preserve the meaning, tone, and style. Return only the translated text without any explanations or additional text.`;

    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: text,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const translatedText = response.choices[0]?.message?.content?.trim() || text;
      return translatedText;
    } catch (error) {
      console.error("Error translating text:", error);
      throw new Error("Failed to translate text. Please check your OpenAI API key and try again.");
    }
  }

  /**
   * Translate Editor.js content blocks
   */
  async translatePostContent(
    content: OutputData,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<OutputData> {
    if (!this.client) {
      throw new Error("OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.");
    }

    if (!content || !content.blocks || !Array.isArray(content.blocks)) {
      return content;
    }

    const translatedBlocks = await Promise.all(
      content.blocks.map(async (block) => {
        // Translate text content based on block type
        switch (block.type) {
          case "header":
            if (block.data?.text) {
              const translatedText = await this.translateText(
                block.data.text,
                targetLanguage,
                sourceLanguage
              );
              return {
                ...block,
                data: {
                  ...block.data,
                  text: translatedText,
                },
              };
            }
            return block;

          case "paragraph":
            if (block.data?.text) {
              const translatedText = await this.translateText(
                block.data.text,
                targetLanguage,
                sourceLanguage
              );
              return {
                ...block,
                data: {
                  ...block.data,
                  text: translatedText,
                },
              };
            }
            return block;

          case "list":
            if (block.data?.items && Array.isArray(block.data.items)) {
              const translatedItems = await Promise.all(
                block.data.items.map(async (item: string | { content?: string; text?: string }) => {
                  const itemText = typeof item === "string" ? item : item.content || item.text || "";
                  if (itemText) {
                    const translatedText = await this.translateText(
                      itemText,
                      targetLanguage,
                      sourceLanguage
                    );
                    return typeof item === "string" ? translatedText : { ...item, content: translatedText, text: translatedText };
                  }
                  return item;
                })
              );
              return {
                ...block,
                data: {
                  ...block.data,
                  items: translatedItems,
                },
              };
            }
            return block;

          case "quote":
            const quoteData: any = { ...block.data };
            if (block.data?.text) {
              quoteData.text = await this.translateText(
                block.data.text,
                targetLanguage,
                sourceLanguage
              );
            }
            if (block.data?.caption) {
              quoteData.caption = await this.translateText(
                block.data.caption,
                targetLanguage,
                sourceLanguage
              );
            }
            return {
              ...block,
              data: quoteData,
            };

          case "linkTool":
            const linkData: any = { ...block.data };
            if (block.data?.title) {
              linkData.title = await this.translateText(
                block.data.title,
                targetLanguage,
                sourceLanguage
              );
            }
            if (block.data?.description) {
              linkData.description = await this.translateText(
                block.data.description,
                targetLanguage,
                sourceLanguage
              );
            }
            return {
              ...block,
              data: linkData,
            };

          case "image":
            const imageData: any = { ...block.data };
            if (block.data?.caption) {
              imageData.caption = await this.translateText(
                block.data.caption,
                targetLanguage,
                sourceLanguage
              );
            }
            if (block.data?.alt) {
              imageData.alt = await this.translateText(
                block.data.alt,
                targetLanguage,
                sourceLanguage
              );
            }
            return {
              ...block,
              data: imageData,
            };

          case "code":
            // Code blocks are usually not translated, but we can translate comments if needed
            // For now, we'll leave code blocks as-is
            return block;

          default:
            // For unknown block types, try to translate any text fields
            return block;
        }
      })
    );

    return {
      ...content,
      blocks: translatedBlocks,
    };
  }
}




