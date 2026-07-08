import { Request, Response, NextFunction } from "express";
import { parseCsv } from "../services/csvParser.service";
import { prepareBatches } from "../services/batcher.service";
import { mapBatchToCrm } from "../services/ai.service";
import { validateRecord } from "../services/validator.service";
import { HttpError } from "../middleware/errorHandler.middleware";
import { CrmRecord, SkippedRecord } from "../types/crm.types";
import { logger } from "../utils/logger";

/**
 * Handles the upload, parsing, AI mapping, validation, and aggregation of CSV rows.
 */
export async function handleImport(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      throw new HttpError("No file uploaded. Please upload a CSV file using field name 'file'.", 400);
    }

    // 1. Parse uploaded CSV buffer into raw rows
    let rawRows: Record<string, string>[];
    try {
      rawRows = parseCsv(req.file.buffer);
    } catch (parseError: any) {
      throw new HttpError(`CSV parsing failed: ${parseError.message}`, 400);
    }

    if (rawRows.length === 0) {
      throw new HttpError("CSV file is empty or contains no records.", 422);
    }

    logger.info(`Received CSV file. Header mapping found. Total rows: ${rawRows.length}`);

    // 2. Split rows into batches of 15-20 rows
    const batches = prepareBatches(rawRows, 15);
    const imported: CrmRecord[] = [];
    const skipped: SkippedRecord[] = [];
    const columnMapping: Record<string, string> = {};

    // 3. Process batches sequentially to respect rate limits and allow robust retries
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      logger.info(`Processing batch ${i + 1}/${batches.length} (Spreadsheet rows ${batch[0].rowIndex} to ${batch[batch.length - 1].rowIndex})`);

      try {
        // AI mapping call with internal retry mechanism
        const mappedRecords = await mapBatchToCrm(batch, i + 1);
        
        // Track which rows from the input batch were returned by the AI
        const processedIndices = new Set<number>();

        for (const mappedRec of mappedRecords) {
          const rowIndex = Number(mappedRec.rowIndex);
          processedIndices.add(rowIndex);

          const originalItem = batch.find((item) => item.rowIndex === rowIndex);
          const rawRow = originalItem ? originalItem.data : {};

          // Validate record mapped by the LLM
          const valResult = validateRecord(mappedRec);

          if (valResult.isValid && valResult.validatedRecord) {
            imported.push(valResult.validatedRecord);
            extractMappingFromPairs(rawRow, valResult.validatedRecord, columnMapping);
          } else {
            skipped.push({
              rowIndex: isNaN(rowIndex) ? 0 : rowIndex,
              reason: valResult.reason || "Validation failed",
              rawRow
            });
          }
        }

        // Verify if any rows from the original batch were completely omitted by the LLM
        for (const item of batch) {
          if (!processedIndices.has(item.rowIndex)) {
            logger.warn(`Spreadsheet row ${item.rowIndex} was omitted by the AI model in batch ${i + 1}`);
            skipped.push({
              rowIndex: item.rowIndex,
              reason: "Row omitted by AI mapping engine",
              rawRow: item.data
            });
          }
        }

      } catch (batchError: any) {
        // A single batch failure must never crash the whole request.
        // We log it and record all rows in this batch as skipped.
        logger.error(`Entire batch ${i + 1} failed: ${batchError.message || batchError}`);
        
        for (const item of batch) {
          skipped.push({
            rowIndex: item.rowIndex,
            reason: "AI processing failed for this batch",
            rawRow: item.data
          });
        }
      }
    }

    // 4. Return results
    res.status(200).json({
      imported,
      skipped,
      totalImported: imported.length,
      totalSkipped: skipped.length,
      columnMapping
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Compares raw row entries with parsed/validated fields to trace which header mapped to which CRM property.
 */
function extractMappingFromPairs(
  rawRow: Record<string, string>,
  crmRecord: CrmRecord,
  mappingAccumulator: Record<string, string>
): void {
  const crmKeys = [
    "email",
    "mobile_without_country_code",
    "country_code",
    "created_at",
    "name",
    "company",
    "city",
    "state",
    "country",
    "lead_owner",
    "crm_status",
    "data_source",
    "possession_time",
    "description",
    "crm_note"
  ];

  for (const rawKey of Object.keys(rawRow)) {
    if (mappingAccumulator[rawKey]) continue;
    const rawVal = String(rawRow[rawKey]).trim().toLowerCase();
    if (!rawVal || rawVal === "undefined" || rawVal === "null") continue;

    for (const crmKey of crmKeys) {
      const crmVal = String((crmRecord as any)[crmKey]).trim().toLowerCase();
      if (!crmVal) continue;

      // Handle emails
      if (crmKey === "email" && crmVal.includes(rawVal)) {
        mappingAccumulator[rawKey] = crmKey;
        break;
      }
      // Handle phone digit matches
      if (crmKey === "mobile_without_country_code") {
        const rawDigits = rawVal.replace(/\D/g, "");
        const crmDigits = crmVal.replace(/\D/g, "");
        if (rawDigits.length >= 7 && crmDigits.length >= 7 && (rawDigits.includes(crmDigits) || crmDigits.includes(rawDigits))) {
          mappingAccumulator[rawKey] = crmKey;
          break;
        }
      }
      // Handle standard text overlap
      if (crmVal === rawVal || crmVal.includes(rawVal) || rawVal.includes(crmVal)) {
        if (rawVal.length > 2) {
          mappingAccumulator[rawKey] = crmKey;
          break;
        }
      }
    }
  }
}
