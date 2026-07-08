import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import Groq from "groq-sdk";
import { getCrmExtractionPrompt } from "../prompts/crmExtraction.prompt";
import { BatchItem } from "./batcher.service";
import { logger } from "../utils/logger";

let geminiClient: GoogleGenAI | null = null;
let anthropicClient: Anthropic | null = null;
let groqClient: Groq | null = null;

function initializeClients() {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (geminiKey && !geminiClient) {
    logger.info("Initializing Gemini GenAI Client dynamically");
    geminiClient = new GoogleGenAI({ apiKey: geminiKey });
  }
  if (anthropicKey && !anthropicClient) {
    logger.info("Initializing Anthropic Claude Client dynamically");
    anthropicClient = new Anthropic({ apiKey: anthropicKey });
  }
  if (groqKey && !groqClient) {
    logger.info("Initializing Groq Client dynamically");
    groqClient = new Groq({ apiKey: groqKey });
  }

  if (!geminiClient && !anthropicClient && !groqClient) {
    logger.warn("No AI API Keys resolved at invocation time. All AI mapping requests will fail.");
  }
}

/**
 * Strips markdown code block formatting and parses the clean JSON text.
 */
export function cleanAndParseJson(text: string): any {
  let cleaned = text.trim();
  
  // Strip starting ```json or ``` and ending ```
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\n?/i, "")
      .replace(/\n?```$/, "")
      .trim();
  }
  
  return JSON.parse(cleaned);
}

/**
 * Validates the shape of the LLM response.
 */
function isValidCrmBatchResponse(parsed: any): boolean {
  if (!Array.isArray(parsed)) return false;
  for (const item of parsed) {
    if (typeof item !== "object" || item === null) return false;
    if (typeof item.rowIndex !== "number") return false;
  }
  return true;
}

/**
 * Maps a batch of CSV rows to the CRM schema using either Gemini or Claude.
 * Handles up to 2 corrections/retries if JSON parsing or shape validation fails.
 */
export async function mapBatchToCrm(
  batchItems: BatchItem[],
  batchIndex: number
): Promise<any[]> {
  initializeClients();
  const systemPrompt = getCrmExtractionPrompt();
  const inputMessage = JSON.stringify(batchItems, null, 2);

  if (geminiClient) {
    try {
      return await callGeminiWithRetry(inputMessage, systemPrompt, batchItems, batchIndex);
    } catch (geminiError: any) {
      logger.warn(`Gemini batch mapping failed: ${geminiError.message || geminiError}. Attempting fallback...`);
      if (groqClient) {
        logger.info("Falling back to Groq API...");
        return await callGroqWithRetry(inputMessage, systemPrompt, batchItems, batchIndex);
      }
      if (anthropicClient) {
        logger.info("Falling back to Anthropic API...");
        return await callAnthropicWithRetry(inputMessage, systemPrompt, batchItems, batchIndex);
      }
      throw geminiError;
    }
  }

  if (anthropicClient) {
    try {
      return await callAnthropicWithRetry(inputMessage, systemPrompt, batchItems, batchIndex);
    } catch (anthropicError: any) {
      logger.warn(`Anthropic batch mapping failed: ${anthropicError.message || anthropicError}. Attempting fallback...`);
      if (groqClient) {
        logger.info("Falling back to Groq API...");
        return await callGroqWithRetry(inputMessage, systemPrompt, batchItems, batchIndex);
      }
      throw anthropicError;
    }
  }

  if (groqClient) {
    return await callGroqWithRetry(inputMessage, systemPrompt, batchItems, batchIndex);
  }

  throw new Error("No AI API client initialized. Set GEMINI_API_KEY, ANTHROPIC_API_KEY, or GROQ_API_KEY in the environment.");
}

/**
 * Executes the mapping with Gemini API, retrying if the output is malformed.
 */
async function callGeminiWithRetry(
  initialInput: string,
  systemPrompt: string,
  batchItems: BatchItem[],
  batchIndex: number
): Promise<any[]> {
  const client = geminiClient!;
  const contents: any[] = [
    { role: "user", parts: [{ text: initialInput }] }
  ];

  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      logger.info(`Sending Batch ${batchIndex} to Gemini (Attempt ${attempt + 1})`);
      
      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Received empty response from Gemini");
      }

      logger.debug(`Gemini response for batch ${batchIndex}: ${responseText}`);

      try {
        const parsed = cleanAndParseJson(responseText);
        if (isValidCrmBatchResponse(parsed)) {
          return parsed;
        } else {
          throw new Error("Response shape was invalid (missing array structure or rowIndex)");
        }
      } catch (parseError: any) {
        logger.warn(`Failed to parse Gemini response for batch ${batchIndex} (Attempt ${attempt + 1}): ${parseError.message}`);
        
        // Setup next turn with correction message
        contents.push({ role: "model", parts: [{ text: responseText }] });
        contents.push({
          role: "user",
          parts: [{
            text: "Your last response was invalid JSON or did not match the expected schema. Return ONLY a valid JSON array of objects matching the schema. Ensure every object includes its 'rowIndex'."
          }]
        });
      }
    } catch (apiError: any) {
      logger.error(`Gemini API Error on batch ${batchIndex} (Attempt ${attempt + 1}):`, apiError.message || apiError);
      if (attempt === 2) {
        throw apiError; // bubble up if final attempt fails
      }
      // wait a bit before retrying on API/network errors
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw new Error(`AI extraction failed after retries on batch ${batchIndex}`);
}

/**
 * Executes the mapping with Anthropic Claude API, retrying if the output is malformed.
 */
async function callAnthropicWithRetry(
  initialInput: string,
  systemPrompt: string,
  batchItems: BatchItem[],
  batchIndex: number
): Promise<any[]> {
  const client = anthropicClient!;
  const messages: any[] = [
    { role: "user", content: initialInput }
  ];

  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      logger.info(`Sending Batch ${batchIndex} to Claude (Attempt ${attempt + 1})`);

      const message = await client.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 4000,
        system: systemPrompt,
        messages: messages
      });

      const responseText = message.content[0].type === "text" ? message.content[0].text : "";
      if (!responseText) {
        throw new Error("Received empty response from Claude");
      }

      logger.debug(`Claude response for batch ${batchIndex}: ${responseText}`);

      try {
        const parsed = cleanAndParseJson(responseText);
        if (isValidCrmBatchResponse(parsed)) {
          return parsed;
        } else {
          throw new Error("Response shape was invalid (missing array structure or rowIndex)");
        }
      } catch (parseError: any) {
        logger.warn(`Failed to parse Claude response for batch ${batchIndex} (Attempt ${attempt + 1}): ${parseError.message}`);
        
        messages.push({ role: "assistant", content: responseText });
        messages.push({
          role: "user",
          content: "Your last response was invalid JSON or did not match the expected schema. Return ONLY a valid JSON array of objects matching the schema. Ensure every object includes its 'rowIndex'."
        });
      }
    } catch (apiError: any) {
      logger.error(`Claude API Error on batch ${batchIndex} (Attempt ${attempt + 1}):`, apiError.message || apiError);
      if (attempt === 2) {
        throw apiError;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw new Error(`AI extraction failed after retries on batch ${batchIndex}`);
}

/**
 * Executes the mapping with Groq API, retrying if the output is malformed.
 */
async function callGroqWithRetry(
  initialInput: string,
  systemPrompt: string,
  batchItems: BatchItem[],
  batchIndex: number
): Promise<any[]> {
  const client = groqClient!;
  const messages: any[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: initialInput }
  ];

  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      logger.info(`Sending Batch ${batchIndex} to Groq (Attempt ${attempt + 1})`);

      const completion = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        response_format: { type: "json_object" }
      });

      const responseText = completion.choices[0]?.message?.content || "";
      if (!responseText) {
        throw new Error("Received empty response from Groq");
      }

      logger.debug(`Groq response for batch ${batchIndex}: ${responseText}`);

      try {
        const parsed = cleanAndParseJson(responseText);
        
        // Normalize if Llama wraps the array in a single root object (e.g. { "data": [...] })
        let normalized = parsed;
        if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
          const keys = Object.keys(parsed);
          if (keys.length === 1 && Array.isArray(parsed[keys[0]])) {
            normalized = parsed[keys[0]];
          }
        }

        if (isValidCrmBatchResponse(normalized)) {
          return normalized;
        } else {
          throw new Error("Response shape was invalid (missing array structure or rowIndex)");
        }
      } catch (parseError: any) {
        logger.warn(`Failed to parse Groq response for batch ${batchIndex} (Attempt ${attempt + 1}): ${parseError.message}`);
        
        messages.push({ role: "assistant", content: responseText });
        messages.push({
          role: "user",
          content: "Your last response was invalid JSON or did not match the expected schema. Return ONLY a valid JSON array of objects matching the schema. Ensure every object includes its 'rowIndex'."
        });
      }
    } catch (apiError: any) {
      logger.error(`Groq API Error on batch ${batchIndex} (Attempt ${attempt + 1}):`, apiError.message || apiError);
      if (attempt === 2) {
        throw apiError;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw new Error(`AI extraction failed after retries on batch ${batchIndex}`);
}
