import { Response } from "express";
import { PrismaClient } from "@prisma/client";
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
  createNewVersion,
  confirmDocumentRead,
  getDocumentReadConfirmations,
  getMyTasks,
  addDocumentComment,
} from "../services/document.js";
import { CreateDocumentSchema, UpdateDocumentSchema } from "@dms/shared";

const prisma = new PrismaClient();

// Roles that can access documents across all areas
const PRIVILEGED_ROLES = ["ADMIN", "QUALITY_MANAGER"];
// Roles that can access documents they are explicitly assigned to review (across areas)
const REVIEW_ROLES = ["REVIEWER", "APPROVER"];

/** Returns true if the user has access to the given document area */
async function hasAreaAccess(
  user: NonNullable<AuthenticatedRequest["user"]>,
  documentId: string,
  documentArea: string
): Promise<boolean> {
  // Privileged roles: full access
  if (PRIVILEGED_ROLES.includes(user.role)) return true;
  // No area assigned: skip restriction (backward compatible)
  if (!user.area) return true;
  // Same area: allow
  if (documentArea === user.area) return true;
  // REVIEWER / APPROVER: allow if assigned to a review task for this document
  if (REVIEW_ROLES.includes(user.role)) {
    const task = await prisma.reviewTask.findFirst({
      where: { documentId, assignedTo: user.userId },
    });
    if (task) return true;
  }
  return false;
}

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
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const { documentId } = req.params;
    const document = await getDocument(documentId);

    // Area-based access control
    if (!(await hasAreaAccess(req.user, documentId, document.area))) {
      return res.status(403).json({ success: false, error: "Acceso denegado: el documento pertenece a otra área" });
    }

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
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const filters: {
      status?: string;
      area?: string;
      type?: string;
      search?: string;
    } = {
      status: req.query.status as string | undefined,
      area: req.query.area as string | undefined,
      type: req.query.type as string | undefined,
      search: req.query.search as string | undefined,
    };

    // Area-based access control:
    // Non-privileged roles with an assigned area are restricted to that area only.
    // Their requested area filter is ignored and replaced with their own area.
    if (!PRIVILEGED_ROLES.includes(req.user.role) && req.user.area) {
      filters.area = req.user.area;
    }

    const sort = {
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: (req.query.sortOrder as "asc" | "desc" | undefined) ?? "desc",
    };

    const result = await listDocuments(page, Math.min(limit, 100), filters, sort);

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

    // Area access check before serving file
    const docMeta = await getDocument(documentId);
    if (!(await hasAreaAccess(req.user, documentId, docMeta.area))) {
      return res.status(403).json({ success: false, error: "Acceso denegado: el documento pertenece a otra área" });
    }

    const { content, fileName, mimeType } = await downloadDocument(documentId, req.user.userId);

    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Length", content.length);
    res.send(content);
  }
);

export const createNewVersionHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    const { documentId } = req.params;
    const { changes } = req.body;
    const document = await createNewVersion(documentId, changes, req.user.userId);
    res.status(201).json({ success: true, data: document });
  }
);

// #12 — Confirmación de lectura
export const confirmReadHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    const { documentId } = req.params;
    const confirmation = await confirmDocumentRead(documentId, req.user.userId);
    res.json({ success: true, data: confirmation });
  }
);

export const getConfirmationsHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    const { documentId } = req.params;
    const result = await getDocumentReadConfirmations(documentId);
    res.json({ success: true, data: result });
  }
);

export const myTasksHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    const tasks = await getMyTasks(req.user.userId);
    res.json({ success: true, data: tasks });
  }
);

export const addCommentHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    const { documentId } = req.params;
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ success: false, error: "El comentario no puede estar vacío" });
    }
    const comment = await addDocumentComment(documentId, req.user.userId, content.trim());
    res.status(201).json({ success: true, data: comment });
  }
);
