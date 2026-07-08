import { parse } from "csv-parse/sync";
import { logger } from "../utils/logger";

/**
 * Parses a CSV Buffer into an array of objects representing the raw rows.
 * Headers are dynamically detected and used as object keys.
 */
export function parseCsv(buffer: Buffer): Record<string, string>[] {
  try {
    const rawContent = buffer.toString("utf-8").trim();
    if (!rawContent) {
      throw new Error("CSV file is empty");
    }

    const records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true // automatically strip Byte Order Mark if present
    });

    return records;
  } catch (error: any) {
    logger.error("Failed to parse CSV buffer:", error.message || error);
    throw new Error(error.message || "Malformed or unparseable CSV file");
  }
}
