import { validateRecord } from "../validator.service";

describe("Validator Service", () => {
  it("should validate a correct record with email and phone", () => {
    const input = {
      name: "John Doe",
      email: "john@example.com",
      mobile_without_country_code: "9876543210",
      crm_status: "GOOD_LEAD_FOLLOW_UP",
      data_source: "leads_on_demand",
      created_at: "2026-06-25T10:00:00.000Z"
    };

    const result = validateRecord(input);
    expect(result.isValid).toBe(true);
    expect(result.validatedRecord).toBeDefined();
    expect(result.validatedRecord?.name).toBe("John Doe");
    expect(result.validatedRecord?.email).toBe("john@example.com");
    expect(result.validatedRecord?.mobile_without_country_code).toBe("9876543210");
    expect(result.validatedRecord?.crm_status).toBe("GOOD_LEAD_FOLLOW_UP");
    expect(result.validatedRecord?.data_source).toBe("leads_on_demand");
  });

  it("should fail validation if both email and phone are empty", () => {
    const input = {
      name: "John Doe",
      email: "",
      mobile_without_country_code: "",
      crm_status: "GOOD_LEAD_FOLLOW_UP"
    };

    const result = validateRecord(input);
    expect(result.isValid).toBe(false);
    expect(result.reason).toBe("No email or mobile number found");
  });

  it("should pass validation if email is missing but phone is present", () => {
    const input = {
      name: "John Doe",
      email: "",
      mobile_without_country_code: "9876543210",
      crm_status: "GOOD_LEAD_FOLLOW_UP"
    };

    const result = validateRecord(input);
    expect(result.isValid).toBe(true);
    expect(result.validatedRecord?.mobile_without_country_code).toBe("9876543210");
  });

  it("should blank out crm_status if invalid and note it in crm_note", () => {
    const input = {
      name: "John Doe",
      email: "john@example.com",
      crm_status: "INVALID_STATUS",
      crm_note: "Wants call back."
    };

    const result = validateRecord(input);
    expect(result.isValid).toBe(true);
    expect(result.validatedRecord?.crm_status).toBe("");
    expect(result.validatedRecord?.crm_note).toContain("[Original Status: INVALID_STATUS]");
  });

  it("should blank out data_source if invalid and note it in crm_note", () => {
    const input = {
      name: "John Doe",
      email: "john@example.com",
      data_source: "invalid_source"
    };

    const result = validateRecord(input);
    expect(result.isValid).toBe(true);
    expect(result.validatedRecord?.data_source).toBe("");
    expect(result.validatedRecord?.crm_note).toContain("[Original Source: invalid_source]");
  });

  it("should format created_at date to ISO format if valid, else blank it out and note in crm_note", () => {
    const inputValid = {
      name: "John Doe",
      email: "john@example.com",
      created_at: "Jun 25, 2026 15:30"
    };
    const resultValid = validateRecord(inputValid);
    expect(resultValid.isValid).toBe(true);
    expect(resultValid.validatedRecord?.created_at).toBe(new Date("Jun 25, 2026 15:30").toISOString());

    const inputInvalid = {
      name: "John Doe",
      email: "john@example.com",
      created_at: "not-a-date"
    };
    const resultInvalid = validateRecord(inputInvalid);
    expect(resultInvalid.isValid).toBe(true);
    expect(resultInvalid.validatedRecord?.created_at).toBe("");
    expect(resultInvalid.validatedRecord?.crm_note).toContain("[Original Date: not-a-date]");
  });
});
