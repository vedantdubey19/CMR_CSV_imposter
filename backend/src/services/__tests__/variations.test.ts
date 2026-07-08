import { parseCsv } from "../csvParser.service";
import { validateRecord } from "../validator.service";

describe("CSV Variation and Checklist Edge Cases", () => {
  
  describe("Variation 2: Custom headers and dynamic mapping validation", () => {
    it("should successfully parse raw headers even if different", () => {
      const csvBuffer = Buffer.from(
        "Full Name,Phone,Email Address,Notes\n" +
        "Steve Rogers,123456,cap@avengers.com,First Avenger"
      );
      const parsed = parseCsv(csvBuffer);
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toHaveProperty("Full Name", "Steve Rogers");
      expect(parsed[0]).toHaveProperty("Phone", "123456");
      expect(parsed[0]).toHaveProperty("Email Address", "cap@avengers.com");
      expect(parsed[0]).toHaveProperty("Notes", "First Avenger");
    });
  });

  describe("Variation 3: Multiple emails or phones in a single cell", () => {
    it("should allow validator to clean standard record and parse individual fields", () => {
      const aiMappedRecord = {
        name: "Tony Stark",
        email: "tony@stark.com",
        mobile_without_country_code: "9999999999",
        crm_note: "Additional email(s): ironman@stark.com, boss@stark.com | Additional mobile(s): 8888888888",
        crm_status: "SALE_DONE",
        data_source: "leads_on_demand"
      };

      const valResult = validateRecord(aiMappedRecord);
      expect(valResult.isValid).toBe(true);
      expect(valResult.validatedRecord?.email).toBe("tony@stark.com");
      expect(valResult.validatedRecord?.mobile_without_country_code).toBe("9999999999");
      expect(valResult.validatedRecord?.crm_note).toContain("Additional email(s): ironman@stark.com");
    });
  });

  describe("Variation 4: Rows missing both email and phone (skipped leads)", () => {
    it("should reject records that have neither email nor mobile number", () => {
      const aiMappedRecord = {
        name: "Bruce Banner",
        email: "",
        mobile_without_country_code: "",
        crm_status: "GOOD_LEAD_FOLLOW_UP"
      };

      const valResult = validateRecord(aiMappedRecord);
      expect(valResult.isValid).toBe(false);
      expect(valResult.reason).toBe("No email or mobile number found");
    });
  });

  describe("Variation 5: Inconsistent date formats", () => {
    it("should parse standard dates and blank out unparseable ones", () => {
      // Scenario A: Standard date parseable by Date.parse
      const recordA = {
        name: "Thor Odinson",
        email: "thor@asgard.com",
        created_at: "25-Jun-2026"
      };
      const valA = validateRecord(recordA);
      expect(valA.isValid).toBe(true);
      expect(valA.validatedRecord?.created_at).toBe(new Date("25-Jun-2026").toISOString());

      // Scenario B: Excel number format or unparseable text
      const recordB = {
        name: "Loki Odinson",
        email: "loki@asgard.com",
        created_at: "not-a-valid-date-string"
      };
      const valB = validateRecord(recordB);
      expect(valB.isValid).toBe(true);
      expect(valB.validatedRecord?.created_at).toBe("");
      expect(valB.validatedRecord?.crm_note).toContain("[Original Date: not-a-valid-date-string]");
    });
  });

  describe("Variation 7: Malformed or empty CSV", () => {
    it("should throw a clear error when parsing empty buffer", () => {
      const emptyBuffer = Buffer.from("   \n   \n");
      expect(() => parseCsv(emptyBuffer)).toThrow("CSV file is empty");
    });
  });
});
