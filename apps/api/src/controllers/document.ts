import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import {
  createDocument,
  uploadDocumentFile,
  getDocument,
  updateDocument,
  submitForReview,
  approveReview,
  publishDocument,
  listDocuments,
  downloadDocument,
} from "../services/document.js";
import { CreateDocumentSchema, UpdateDocumentSchema } from "@dms/shared";

export const createDocumentHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const parsed = CreateDocumentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid request" });
    }

    const document = await createDocument(parsed.data, req.user.userId);

    res.status(201).json({
      success: true,
      data: document,
    });
  }
);

export const uploadFileHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { documentId } = req.params;

    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file provided" });
    }

    const document = await uploadDocumentFile(
      documentId,
      req.file.originalname,
      req.file.buffer,
      req.user.userId
    );

    res.json({
      success: true,
      data: document,
    });
  }
);

export const getDocumentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { documentId } = req.params;

    const document = await getDocument(documentId);

    res.json({
      success: true,
      data: document,
    });
  }
);

export const updateDocumentHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { documentId } = req.params;
    const parsed = UpdateDocumentSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid request" });
    }

    const document = await updateDocument(documentId, parsed.data, req.user.userId);

    res.json({
      success: true,
      data: document,
    });
  }
);

export const submitForReviewHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { documentId } = req.params;
    const { reviewers, comments } = req.body;

    if (!Array.isArray(reviewers) || reviewers.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one reviewer is required",
      });
    }

    const document = await submitForReview(
      documentId,
      reviewers,
      comments,
      req.user.userId
    );

    res.json({
      success: true,
      data: document,
    });
  }
);

export const approveReviewHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { documentId, reviewTaskId } = req.params;
    const { action, comments } = req.body;

    if (!["APPROVE", "REQUEST_CHANGES"].includes(action)) {
      return res.status(400).json({
        success: false,
        error: "Invalid action",
      });
    }

    const result = await approveReview(
      documentId,
      reviewTaskId,
      action,
      comments,
      req.user.userId
    );

    res.json({
      success: true,
      data: result,
    });
  }
);

export const publishDocumentHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { documentId } = req.params;
    const { comments } = req.body;

    const document = await publishDocument(documentId, comments, req.user.userId);

    res.json({
      success: true,
      data: document,
    });
  }
);

export const listDocumentsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const filters = {
      status: req.query.status as string | undefined,
      area: req.query.area as string | undefined,
      type: req.query.type as string | undefined,
      search: req.query.search as string | undefined,
    };

    const result = await listDocuments(page, Math.min(limit, 100), filters);

    res.json({
      success: true,
      data: result,
    });
  }
);

export const downloadDocumentHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { documentId } = req.params;

    const { content, fileName } = await downloadDocument(documentId, req.user.userId);

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", "application/octet-stream");
    res.send(content);
  }
);
