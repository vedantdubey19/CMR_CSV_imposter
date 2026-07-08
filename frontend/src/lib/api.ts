import { ImportResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Uploads the original CSV file to the backend import endpoint.
 */
export async function uploadCsvFile(file: File): Promise<ImportResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/import`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
  }

  return response.json();
}
