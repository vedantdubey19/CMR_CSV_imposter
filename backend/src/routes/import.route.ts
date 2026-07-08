import { Router } from "express";
import { uploadMiddleware } from "../middleware/upload.middleware";
import { handleImport } from "../controllers/import.controller";

const router = Router();

// Endpoint for CSV importation
router.post("/import", uploadMiddleware, handleImport);

export default router;
