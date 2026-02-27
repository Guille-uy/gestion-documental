import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  listAreasHandler, createAreaHandler, updateAreaHandler, deleteAreaHandler,
  listDocumentTypesHandler, createDocumentTypeHandler, updateDocumentTypeHandler, deleteDocumentTypeHandler,
} from "../controllers/config.js";

const router = Router();
router.use(authMiddleware);

// Areas
router.get("/areas", listAreasHandler);
router.post("/areas", createAreaHandler);
router.patch("/areas/:id", updateAreaHandler);
router.delete("/areas/:id", deleteAreaHandler);

// Document Types
router.get("/document-types", listDocumentTypesHandler);
router.post("/document-types", createDocumentTypeHandler);
router.patch("/document-types/:id", updateDocumentTypeHandler);
router.delete("/document-types/:id", deleteDocumentTypeHandler);

export default router;
