import { chunkArray, prepareBatches } from "../batcher.service";

describe("Batcher Service", () => {
  describe("chunkArray", () => {
    it("should split an array into chunks of the specified size", () => {
      const input = [1, 2, 3, 4, 5, 6, 7, 8];
      const result = chunkArray(input, 3);
      expect(result).toEqual([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8]
      ]);
    });

    it("should handle empty arrays", () => {
      const result = chunkArray([], 5);
      expect(result).toEqual([]);
    });

    it("should handle size larger than array length", () => {
      const input = [1, 2];
      const result = chunkArray(input, 5);
      expect(result).toEqual([[1, 2]]);
    });
  });

  describe("prepareBatches", () => {
    it("should map raw rows to BatchItems with 1-based row index starting from 2", () => {
      const rawRows = [
        { name: "Alice", email: "alice@example.com" },
        { name: "Bob", email: "bob@example.com" }
      ];

      const batches = prepareBatches(rawRows, 1); // batch size 1 to easily test chunking

      expect(batches).toHaveLength(2);
      expect(batches[0]).toEqual([
        {
          rowIndex: 2,
          data: { name: "Alice", email: "alice@example.com" }
        }
      ]);
      expect(batches[1]).toEqual([
        {
          rowIndex: 3,
          data: { name: "Bob", email: "bob@example.com" }
        }
      ]);
    });
  });
});
