# GrowEasy CSV Importer - Frontend Client

A Next.js App Router + TypeScript + Tailwind CSS client dashboard that handles local CSV previews, estimates AI processing progress, and displays interactive tables comparing successfully imported records against skipped ones.

## 🛠️ Tech Stack
- **Framework**: Next.js (v15 App Router)
- **Styling**: Tailwind CSS (v4)
- **Parsing**: Papaparse (client-side preview)
- **Icons**: Lucide React
- **Language**: TypeScript

## 📋 Environment Variables
Create a `.env.local` file in the `frontend/` directory.

```bash
# Do NOT hardcode API URLs. Set the URL of your backend gateway.
NEXT_PUBLIC_API_URL=http://localhost:5001
```

## 🚀 Setup & Execution

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Dev Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to view the application.

3. **Build Application**:
   ```bash
   npm run build
   ```

4. **Start Production Build**:
   ```bash
   npm run start
   ```

## 📐 Features Overview

- **UploadZone**: Clean drag-and-drop area with file-type (.csv only) and file-size (<200MB) client validations.
- **CsvPreviewTable**: High-performance scrollable preview showing raw columns and rows of the loaded spreadsheet before making LLM calls.
- **ProgressIndicator**: Simulated smooth progress bar that estimates batch execution timings (1.5s per batch of 15 records).
- **ImportResultTable**: Tabbed visualization displaying successfully imported leads and skipped logs. Each skipped row is inspectable, expanding to render a structured grid of the original row keys.
- **Color Palette**: Premium dark dashboard layout utilizing deep grays (`#030712`), indigo accents, subtle glassmorphic backdrop-blurs, and glowing hover states.
