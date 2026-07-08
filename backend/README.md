# GrowEasy CSV Importer - Backend API

The Node.js/Express + TypeScript backend server that powers the AI CSV Importer. It parses CSV file buffers, batches rows, invokes LLM mapping engines, and validates CRM schemas in a stateless pipeline.

## 🛠️ Tech Stack
- **Runtime**: Node.js
- **Framework**: Express (with TypeScript)
- **CSV Ingestion**: Multer (In-memory storage) + csv-parse
- **AI Integrations**: Gemini Node SDK (`@google/genai`), Claude Node SDK (`@anthropic-ai/sdk`), Groq SDK (`groq-sdk`)
- **Testing**: Jest + ts-jest

## 📋 Environment Variables
Create a `.env` file in the `backend/` directory.

```bash
PORT=5001
NODE_ENV=development
ALLOWED_ORIGIN=http://localhost:3000

# Provide at least one API key:
GEMINI_API_KEY=your_gemini_api_key_here
# ANTHROPIC_API_KEY=your_anthropic_api_key_here
# GROQ_API_KEY=your_groq_api_key_here
```

## 🚀 Setup & Execution

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run in Development Mode (Nodemon + ts-node)**:
   ```bash
   npm run dev
   ```

3. **Build TypeScript for Production**:
   ```bash
   npm run build
   ```

4. **Start Production Build**:
   ```bash
   npm start
   ```

5. **Run Test Suites**:
   ```bash
   npm test
   ```

## 🔌 API Documentation

### `POST /api/import`
Uploads a CSV file to be parsed and mapped.

- **Request headers**: `Content-Type: multipart/form-data`
- **Request body**: `file` (a single CSV file attachment)
- **Response status codes**:
  - `200 OK`: Import pipeline executed (returns lists of imported and skipped rows)
  - `400 Bad Request`: Missing file, file too large (&gt;200MB), or invalid extension
  - `422 Unprocessable Entity`: The CSV was parsed but had no records
  - `500 Internal Server Error`: Unexpected exception
- **Response format**:
```json
{
  "imported": [
    {
      "created_at": "2026-06-24T15:15:00.000Z",
      "name": "Rajesh Kumar",
      "email": "rajesh@gmail.com",
      "country_code": "+91",
      "mobile_without_country_code": "9876543210",
      "company": "",
      "city": "Bangalore",
      "state": "",
      "country": "India",
      "lead_owner": "",
      "crm_status": "GOOD_LEAD_FOLLOW_UP",
      "crm_note": "Additional email(s): rajesh.work@gmail.com | Campaign Name: Eden Park 3BHK Campaign",
      "data_source": "eden_park",
      "possession_time": "",
      "description": "Interested in 3BHK facing east."
    }
  ],
  "skipped": [
    {
      "rowIndex": 3,
      "reason": "No email or mobile number found",
      "rawRow": {
        "full_name": "Unknown User",
        "phone_number": "",
        "email_address": "",
        "created_time": "13/05/2026",
        "campaign_name": "Sarjapur Plots"
      }
    }
  ],
  "totalImported": 1,
  "totalSkipped": 1
}
```
