export interface BatchItem {
  rowIndex: number; // 1-indexed row number in the CSV file (row 1 is header, row 2 is first data row)
  data: Record<string, string>;
}

/**
 * Splits an array into chunks of a specified size.
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Prepares raw CSV rows by associating them with their spreadsheet row index
 * (assuming header is row 1, data starts at row 2) and chunking them into batches.
 */
export function prepareBatches(
  rows: Record<string, string>[],
  batchSize: number = 15
): BatchItem[][] {
  const items: BatchItem[] = rows.map((row, index) => ({
    rowIndex: index + 2,
    data: row
  }));
  return chunkArray(items, batchSize);
}
