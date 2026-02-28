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
  confirmReadHandler,
  getConfirmationsHandler,
  myTasksHandler,
  addCommentHandler,
  archiveDocumentHandler,
  deleteDocumentHandler,
  bulkDocumentsHandler,
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

// My pending review tasks
router.get("/my-tasks", myTasksHandler);

// Bulk operations
router.patch("/bulk", bulkDocumentsHandler);

// Document CRUD
router.post("/", createDocumentHandler);
router.get("/", listDocumentsHandler);
router.get("/:documentId", getDocumentHandler);
router.patch("/:documentId", updateDocumentHandler);
router.patch("/:documentId/archive", archiveDocumentHandler);
router.delete("/:documentId", deleteDocumentHandler);

// File operations
router.post("/:documentId/upload", upload.single("file"), uploadFileHandler);
router.get("/:documentId/download", downloadDocumentHandler);

// Workflow operations
router.post("/:documentId/submit-review", submitForReviewHandler);
router.post("/:documentId/reviews/:reviewTaskId/approve", approveReviewHandler);
router.post("/:documentId/publish", publishDocumentHandler);
router.post("/:documentId/new-version", createNewVersionHandler);

// Read confirmation (#12)
router.post("/:documentId/confirm-read", confirmReadHandler);
router.get("/:documentId/confirmations", getConfirmationsHandler);

// Document comments
router.post("/:documentId/comments", addCommentHandler);

export default router;
