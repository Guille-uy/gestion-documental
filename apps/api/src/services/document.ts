import { PrismaClient } from "@prisma/client";
import {
  uploadFile,
  downloadFile,
  deleteFile,
  getFileMetadata,
} from "../utils/google-drive.js";
import { NotFoundError, ValidationError, AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

const prisma = new PrismaClient();

export async function createDocument(
  data: {
    code: string;
    title: string;
    description?: string;
    type: string;
    area: string;
  },
  userId: string
) {
  // Check if document code already exists
  const existing = await prisma.document.findUnique({
    where: { code: data.code },
  });

  if (existing) {
    throw new ValidationError("Document with this code already exists");
  }

  const document = await prisma.document.create({
    data: {
      code: data.code,
      title: data.title,
      description: data.description,
      type: data.type,
      area: data.area,
      status: "DRAFT",
      currentVersionLabel: "v1.0",
      createdBy: userId,
      updatedBy: userId,
    },
  });

  // Create initial version record
  await prisma.documentVersion.create({
    data: {
      documentId: document.id,
      versionLabel: "v1.0",
      googleDriveFileId: "",
      status: "DRAFT",
      createdBy: userId,
    },
  });

  // Log the action
  await prisma.auditLog.create({
    data: {
      userId,
      action: "CREATE_DOCUMENT",
      entityType: "Document",
      entityId: document.id,
      documentId: document.id,
      metadata: {
        code: document.code,
        title: document.title,
      },
    },
  });

  logger.info("Document created", {
    documentId: document.id,
    code: document.code,
  });

  return formatDocument(document);
}

export async function uploadDocumentFile(
  documentId: string,
  fileName: string,
  fileContent: Buffer,
  userId: string
) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new NotFoundError("Document not found");
  }

  // Determine MIME type based on file extension
  const ext = fileName.split(".").pop()?.toLowerCase();
  let mimeType = "application/octet-stream";
  if (ext === "pdf") mimeType = "application/pdf";
  else if (ext === "docx")
    mimeType =
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  else if (ext === "xlsx")
    mimeType =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  // Upload to Google Drive
  const fileId = await uploadFile(fileName, mimeType, fileContent);

  // Update document with file reference
  const updated = await prisma.document.update({
    where: { id: documentId },
    data: {
      googleDriveFileId: fileId,
      updatedBy: userId,
    },
  });

  // Update current version with file reference
  await prisma.documentVersion.updateMany({
    where: {
      documentId: documentId,
      versionLabel: document.currentVersionLabel,
    },
    data: {
      googleDriveFileId: fileId,
    },
  });

  // Log the action
  await prisma.auditLog.create({
    data: {
      userId,
      action: "UPDATE_DOCUMENT",
      entityType: "Document",
      entityId: documentId,
      documentId: documentId,
      metadata: {
        fileName,
        fileId,
      },
    },
  });

  logger.info("Document file uploaded", { documentId, fileId, fileName });

  return formatDocument(updated);
}

export async function getDocument(documentId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      versions: {
        orderBy: { createdAt: "desc" },
      },
      comments: {
        orderBy: { createdAt: "desc" },
        include: {
          authorUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!document) {
    throw new NotFoundError("Document not found");
  }

  return formatDocumentWithDetails(document);
}

export async function updateDocument(
  documentId: string,
  data: {
    title?: string;
    description?: string;
    area?: string;
    nextReviewDate?: Date | null;
  },
  userId: string
) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new NotFoundError("Document not found");
  }

  const updated = await prisma.document.update({
    where: { id: documentId },
    data: {
      ...data,
      updatedBy: userId,
    },
  });

  // Log the action
  await prisma.auditLog.create({
    data: {
      userId,
      action: "UPDATE_DOCUMENT",
      entityType: "Document",
      entityId: documentId,
      documentId: documentId,
      metadata: {
        changes: Object.keys(data),
      },
    },
  });

  logger.info("Document updated", { documentId });

  return formatDocument(updated);
}

export async function submitForReview(
  documentId: string,
  reviewerIds: string[],
  comments: string | undefined,
  userId: string
) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new NotFoundError("Document not found");
  }

  if (document.status !== "DRAFT") {
    throw new ValidationError("Only draft documents can be submitted for review");
  }

  // Update document status
  const updated = await prisma.document.update({
    where: { id: documentId },
    data: {
      status: "IN_REVIEW",
      updatedBy: userId,
    },
  });

  // Create review tasks for reviewers
  for (const reviewerId of reviewerIds) {
    await prisma.reviewTask.create({
      data: {
        documentId,
        assignedTo: reviewerId,
        status: "PENDING",
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: reviewerId,
        type: "DOCUMENT_SUBMITTED",
        title: "Document Review Request",
        message: `Document "${document.title}" has been submitted for your review`,
        entityType: "Document",
        entityId: documentId,
        documentId,
      },
    });
  }

  // Log the action
  await prisma.auditLog.create({
    data: {
      userId,
      action: "SUBMIT_FOR_REVIEW",
      entityType: "Document",
      entityId: documentId,
      documentId,
      metadata: {
        reviewerCount: reviewerIds.length,
        comments,
      },
    },
  });

  logger.info("Document submitted for review", {
    documentId,
    reviewerCount: reviewerIds.length,
  });

  return formatDocument(updated);
}

export async function approveReview(
  documentId: string,
  reviewTaskId: string,
  action: "APPROVE" | "REQUEST_CHANGES",
  comments: string | undefined,
  userId: string
) {
  const reviewTask = await prisma.reviewTask.findUnique({
    where: { id: reviewTaskId },
  });

  if (!reviewTask) {
    throw new NotFoundError("Review task not found");
  }

  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new NotFoundError("Document not found");
  }

  // Update review task
  const newStatus =
    action === "APPROVE" ? "APPROVED" : "CHANGES_REQUESTED";
  await prisma.reviewTask.update({
    where: { id: reviewTaskId },
    data: {
      status: newStatus,
      action: action,
      comments: comments,
      completedAt: new Date(),
    },
  });

  // If changes requested, revert document to DRAFT
  if (action === "REQUEST_CHANGES") {
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "DRAFT",
        updatedBy: userId,
      },
    });

    // Notify document owner
    await prisma.notification.create({
      data: {
        userId: document.createdBy,
        type: "REVIEW_REQUESTED",
        title: "Changes Requested",
        message: `Reviewer has requested changes to "${document.title}"`,
        entityType: "Document",
        entityId: documentId,
        documentId,
      },
    });

    logger.info("Changes requested for document", { documentId });
  }

  // Log the action
  await prisma.auditLog.create({
    data: {
      userId,
      action: action === "APPROVE" ? "APPROVE_REVIEW" : "REQUEST_CHANGES",
      entityType: "ReviewTask",
      entityId: reviewTaskId,
      documentId,
      metadata: {
        comments,
      },
    },
  });

  return { success: true };
}

export async function publishDocument(
  documentId: string,
  comments: string | undefined,
  userId: string
) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new NotFoundError("Document not found");
  }

  // Check if all reviews are approved
  const pendingReviews = await prisma.reviewTask.count({
    where: {
      documentId,
      status: "PENDING",
    },
  });

  if (pendingReviews > 0) {
    throw new ValidationError("All reviews must be completed before publishing");
  }

  const updated = await prisma.document.update({
    where: { id: documentId },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      reviewedBy: userId,
      updatedBy: userId,
    },
  });

  // Update version status
  await prisma.documentVersion.updateMany({
    where: {
      documentId,
      versionLabel: document.currentVersionLabel,
    },
    data: {
      status: "PUBLISHED",
    },
  });

  // Create notifications for all readers in the same area
  const readers = await prisma.user.findMany({
    where: {
      role: "READER",
      area: document.area,
    },
  });

  for (const reader of readers) {
    await prisma.notification.create({
      data: {
        userId: reader.id,
        type: "DOCUMENT_PUBLISHED",
        title: "New Document Published",
        message: `Document "${document.title}" has been published`,
        entityType: "Document",
        entityId: documentId,
        documentId,
      },
    });
  }

  // Log the action
  await prisma.auditLog.create({
    data: {
      userId,
      action: "PUBLISH_DOCUMENT",
      entityType: "Document",
      entityId: documentId,
      documentId,
      metadata: {
        comments,
      },
    },
  });

  logger.info("Document published", { documentId });

  return formatDocument(updated);
}

export async function listDocuments(
  page: number = 1,
  limit: number = 20,
  filters?: {
    status?: string;
    area?: string;
    type?: string;
    search?: string;
  }
) {
  const skip = (page - 1) * limit;

  const where: any = {};

  if (filters?.status) {
    where.status = filters.status;
  }
  if (filters?.area) {
    where.area = filters.area;
  }
  if (filters?.type) {
    where.type = filters.type;
  }
  if (filters?.search) {
    where.OR = [
      { code: { contains: filters.search, mode: "insensitive" } },
      { title: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.document.count({ where }),
  ]);

  return {
    items: documents.map(formatDocument),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function downloadDocument(documentId: string, userId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new NotFoundError("Document not found");
  }

  if (!document.googleDriveFileId) {
    throw new AppError(400, "Document file not attached");
  }

  // Log the download
  await prisma.auditLog.create({
    data: {
      userId,
      action: "DOWNLOAD_DOCUMENT",
      entityType: "Document",
      entityId: documentId,
      documentId,
      metadata: {
        fileName: document.title,
      },
    },
  });

  const fileContent = await downloadFile(document.googleDriveFileId);

  return {
    content: fileContent,
    fileName: `${document.code}_v${document.currentVersionLabel}.pdf`,
  };
}

// Helper functions
function formatDocument(doc: any) {
  return {
    id: doc.id,
    code: doc.code,
    title: doc.title,
    description: doc.description,
    type: doc.type,
    area: doc.area,
    status: doc.status,
    currentVersionLabel: doc.currentVersionLabel,
    googleDriveFileId: doc.googleDriveFileId,
    createdBy: doc.createdBy,
    createdAt: doc.createdAt,
    updatedBy: doc.updatedBy,
    updatedAt: doc.updatedAt,
    publishedAt: doc.publishedAt,
    nextReviewDate: doc.nextReviewDate,
  };
}

function formatDocumentWithDetails(doc: any) {
  return {
    ...formatDocument(doc),
    versions: doc.versions,
    comments: doc.comments.map((c: any) => ({
      id: c.id,
      content: c.content,
      author: c.authorUser,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
  };
}
