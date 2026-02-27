import { Router } from "express";
import multer from "multer";
import {
  createDocumentHandler,
  uploadFileHandler,
  getDocumentHandler,
  updateDocumentHandler,
  submitForReviewHandler,
  approveReviewHandler,
  publishDocumentHandler,
  listDocumentsHandler,
  downloadDocumentHandler,
  createNewVersionHandler,
} from "../controllers/document.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

// All document routes require authentication
router.use(authMiddleware);

// Document CRUD
router.post("/", createDocumentHandler);
router.get("/", listDocumentsHandler);
router.get("/:documentId", getDocumentHandler);
router.patch("/:documentId", updateDocumentHandler);

// File operations
router.post("/:documentId/upload", upload.single("file"), uploadFileHandler);
router.get("/:documentId/download", downloadDocumentHandler);

// Workflow operations
router.post("/:documentId/submit-review", submitForReviewHandler);
router.post("/:documentId/reviews/:reviewTaskId/approve", approveReviewHandler);
router.post("/:documentId/publish", publishDocumentHandler);
router.post("/:documentId/new-version", createNewVersionHandler);

export default router;
