import { CrmRecord, CrmStatus, DataSource } from "../types/crm.types";

const VALID_STATUSES = new Set<CrmStatus>([
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE"
]);

const VALID_DATA_SOURCES = new Set<DataSource>([
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
  ""
]);

export interface ValidationResult {
  isValid: boolean;
  validatedRecord?: CrmRecord;
  reason?: string;
}

/**
 * Validates a single LLM-mapped record according to GrowEasy's business rules.
 */
export function validateRecord(record: any): ValidationResult {
  if (!record || typeof record !== "object") {
    return { isValid: false, reason: "Record is not a valid object" };
  }

  // Safe string retrieval helper
  const getString = (val: any): string => {
    if (val === null || val === undefined) return "";
    return String(val).trim();
  };

  const name = getString(record.name);
  const email = getString(record.email);
  const country_code = getString(record.country_code);
  
  // Clean phone number from typical separators, keeping only digits
  const mobile_without_country_code = getString(record.mobile_without_country_code)
    .replace(/[\s\-\(\)\+]/g, "");

  const company = getString(record.company);
  const city = getString(record.city);
  const state = getString(record.state);
  const country = getString(record.country);
  const lead_owner = getString(record.lead_owner);
  const possession_time = getString(record.possession_time);
  const description = getString(record.description);
  let crm_note = getString(record.crm_note);

  // Validate crm_status
  let crm_status: CrmStatus | "" = "";
  const rawStatus = getString(record.crm_status).toUpperCase();
  if (VALID_STATUSES.has(rawStatus as CrmStatus)) {
    crm_status = rawStatus as CrmStatus;
  } else if (rawStatus !== "") {
    // Blank it out, but preserve original value in notes so data is not silently lost
    crm_note = crm_note 
      ? `${crm_note} | [Original Status: ${rawStatus}]`
      : `[Original Status: ${rawStatus}]`;
  }

  // Validate data_source
  let data_source: DataSource = "";
  const rawSource = getString(record.data_source).toLowerCase();
  if (VALID_DATA_SOURCES.has(rawSource as DataSource)) {
    data_source = rawSource as DataSource;
  } else if (rawSource !== "") {
    // Blank it out, but preserve original value in notes
    crm_note = crm_note
      ? `${crm_note} | [Original Source: ${rawSource}]`
      : `[Original Source: ${rawSource}]`;
  }

  // Validate created_at
  let created_at = getString(record.created_at);
  if (created_at) {
    const timestamp = Date.parse(created_at);
    if (isNaN(timestamp)) {
      // Blank it out, preserve original in notes
      crm_note = crm_note
        ? `${crm_note} | [Original Date: ${created_at}]`
        : `[Original Date: ${created_at}]`;
      created_at = "";
    } else {
      created_at = new Date(timestamp).toISOString();
    }
  }

  // Skip condition: both email and mobile are missing
  if (!email && !mobile_without_country_code) {
    return { isValid: false, reason: "No email or mobile number found" };
  }

  const validatedRecord: CrmRecord = {
    created_at,
    name,
    email,
    country_code,
    mobile_without_country_code,
    company,
    city,
    state,
    country,
    lead_owner,
    crm_status,
    crm_note,
    data_source,
    possession_time,
    description
  };

  return { isValid: true, validatedRecord };
}
export { VALID_STATUSES, VALID_DATA_SOURCES };
