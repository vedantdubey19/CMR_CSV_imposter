import multer from "multer";
import path from "path";

// In-memory file storage
const storage = multer.memoryStorage();

// File size limit: 200MB
const MAX_FILE_SIZE = 200 * 1024 * 1024;

/**
 * Filter to reject non-CSV files based on file extension.
 */
const csvFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (ext !== ".csv") {
    cb(new Error("Only CSV files are allowed"));
    return;
  }
  
  cb(null, true);
};

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: csvFilter
}).single("file"); // expect 'file' as form field name
