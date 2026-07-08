# AI-Powered CSV Importer (GrowEasy Assignment)

A production-grade, full-stack monorepo that maps arbitrary, unpredictable CSV spreadsheets (Facebook Lead Export, Google Ads Export, real estate CRM exports, manual sheets) to a fixed CRM destination schema. Instead of relying on brittle, hardcoded column-header matching, this project leverages a Large Language Model (Gemini or Claude) to dynamically map, clean, and validate data on the fly.

---

## 🏗️ Architecture Overview

The pipeline is stateless, lightweight, and processes data in memory. Below is the data flow:

```
                  +-----------------------------------------+
                  |         Next.js Frontend Client         |
                  |   - Drag & Drop Upload Zone             |
                  |   - Client-side Preview (Papaparse)     |
                  |   - Smooth Progress Estimation          |
                  |   - Interactive Mapped/Skipped Tables   |
                  +--------------------+--------------------+
                                       |
                            multipart/form-data
                                       v
                  +-----------------------------------------+
                  |         Express Backend Server          |
                  |   - Multer file ingestion (<200MB)        |
                  |   - CSV Parser (csv-parse/sync)         |
                  |   - Batcher Service (15 rows/batch)     |
                  +--------------------+--------------------+
                                       |
                         Batch JSON payload + System Prompt
                                       v
                  +-----------------------------------------+
                  |           LLM Mapping Engine            |
                  |   - Gemini / Claude / Groq Llama 3      |
                  |   - Multi-turn error correction retry    |
                  +--------------------+--------------------+
                                       |
                               Raw JSON response
                                       v
                  +-----------------------------------------+
                  |          CRM Record Validator           |
                  |   - Contact presence (Email / Phone)    |
                  |   - Strict Enum Constraints             |
                  |   - ISO-8651 Date normalization         |
                  +--------------------+--------------------+
                                       |
                               Aggregated JSON
                                       v
                               Frontend Render
```

---

## 💡 Prompt Design Rationale

The prompt at [crmExtraction.prompt.ts](file:///Users/vedantdubey_20/Documents/WORK%20OF%20ANTIGRAVITY/ww/backend/src/prompts/crmExtraction.prompt.ts) is the core of the system. The key design patterns implemented are:

1. **Spreadsheet Row Indexing (`rowIndex`)**: Each row is sent to the LLM with its relative spreadsheet row number (starting at row 2, accommodating row 1 headers). The LLM is instructed to output this `rowIndex` unmodified. This allows the backend to:
   - Match AI results back to the original CSV record even if the AI changes the order.
   - Detect if the AI omitted a row and mark it as skipped.
   - Present skipped records to users with their exact Excel spreadsheet line numbers.
2. **Strict Output Constraint**: The prompt enforces a raw JSON array structure with no markdown code fences (\`\`\`json ... \`\`\`) or prose. Additionally, the backend cleans the output and runs in-flight multi-turn error correction (retrying up to 2 times) if JSON formatting is corrupted.
3. **Multi-Value Rule**: Columns containing multiple emails or phone numbers are split: the first is used as the primary, and subsequent values are formatted and appended to `crm_note` to prevent loss of secondary contact channels.
4. **Catch-All Mapping**: Columns that do not fit the target schema (e.g. customized questions, property queries, budgets) are structured as `[Header Name]: [Value]` and appended to `crm_note` to preserve context.
5. **No Hallucinations**: Standardizing enums (`crm_status` and `data_source`) and dates. If the LLM returns invalid enums, the validator blanks them out and records the original value in `crm_note` to avoid silent data loss.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation & Run

1. **Clone and Enter the Workspace**:
   ```bash
   cd groweasy-csv-importer
   ```

2. **Setup the Backend**:
   ```bash
   cd backend
   npm install
   # Create a .env file from .env.example
   cp .env.example .env
   # Add your GEMINI_API_KEY, ANTHROPIC_API_KEY, or GROQ_API_KEY to .env
   npm run dev
   ```
   The backend will run at `http://localhost:5001`.

3. **Setup the Frontend**:
   Open a new terminal window:
   ```bash
   cd frontend
   npm install
   # Create a .env.local file from .env.example
   cp .env.example .env.local
   npm run dev
   ```
   The frontend will run at `http://localhost:3000`.

### 🐳 Run via Docker Compose (Bonus Points)
To build and launch both services dynamically in isolated containers, run:
```bash
# Build and run containers
docker-compose up --build
```
This will mount the backend on `http://localhost:5001` and the frontend client on `http://localhost:3000` automatically.

---

## 🧪 Testing

The backend is equipped with comprehensive unit tests for parsing, batching, validations, and edge-case handling. Run them using:

```bash
cd backend
npm test
```

---

## ⚠️ Known Limitations

1. **Stateless Nature**: Processing is entirely in-memory per request. A database layer is required for historical import logs or persistent lead lookup.
2. **API Rate Limits**: The batching size is set to 15 to balance token usage and performance. Very large CSV files (e.g., 5,000+ rows) may trigger LLM provider rate limits unless a job queue (like BullMQ) or rate-limit throttle is implemented.
3. **In-cell Parsing Ambiguity**: Separators in multi-value cells (like commas vs. spaces) are mapped contextually by the LLM, which might occasionally lead to minor normalization variations.
