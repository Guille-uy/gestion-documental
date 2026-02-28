import { PrismaClient } from "@prisma/client";
import { NotFoundError, ValidationError, AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
const prisma = new PrismaClient();
async function generateDocumentCode(type) {
    // Try to get prefix from DocumentTypeConfig table first
    const typeConfig = await prisma.documentTypeConfig.findFirst({
        where: { code: type, isActive: true },
    });
    const fallbackPrefixes = {
        SOP: "PO", POLICY: "POL", WI: "IT", FORM: "FOR", RECORD: "REG",
    };
    const prefix = typeConfig?.prefix || fallbackPrefixes[type] || type.slice(0, 3).toUpperCase();
    const year = new Date().getFullYear();
    const count = await prisma.document.count({ where: { type } });
    let seq = count + 1;
    let attempts = 0;
    while (attempts < 30) {
        const code = `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
        const existing = await prisma.document.findUnique({ where: { code } });
        if (!existing)
            return code;
        seq++;
        attempts++;
    }
    return `${prefix}-${year}-${Date.now().toString().slice(-6)}`;
}
export async function createDocument(data, userId) {
    const code = await generateDocumentCode(data.type);
    const document = await prisma.document.create({
        data: {
            code,
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
export async function uploadDocumentFile(documentId, fileName, fileContent, userId) {
    const document = await prisma.document.findUnique({
        where: { id: documentId },
    });
    if (!document) {
        throw new NotFoundError("Document not found");
    }
    // Determine MIME type from extension
    const ext = fileName.split(".").pop()?.toLowerCase();
    let mimeType = "application/octet-stream";
    if (ext === "pdf")
        mimeType = "application/pdf";
    else if (ext === "docx")
        mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    else if (ext === "xlsx")
        mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    // Store file content directly in the database
    await prisma.documentVersion.updateMany({
        where: { documentId, versionLabel: document.currentVersionLabel },
        data: { fileContent, fileName, fileSize: fileContent.length, mimeType },
    });
    // Mark document as having a file (use a local marker)
    const updated = await prisma.document.update({
        where: { id: documentId },
        data: { googleDriveFileId: `local:${document.currentVersionLabel}`, updatedBy: userId },
    });
    await prisma.auditLog.create({
        data: {
            userId,
            action: "UPDATE_DOCUMENT",
            entityType: "Document",
            entityId: documentId,
            documentId,
            metadata: { fileName, fileSize: fileContent.length },
        },
    });
    logger.info("Document file stored in DB", { documentId, fileName });
    return formatDocument(updated);
}
export async function getDocument(documentId) {
    const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
            versions: {
                orderBy: { createdAt: "desc" },
                select: { id: true, versionLabel: true, fileName: true, fileSize: true, mimeType: true, status: true, createdAt: true, createdBy: true },
            },
            comments: {
                orderBy: { createdAt: "desc" },
                include: {
                    authorUser: {
                        select: { id: true, firstName: true, lastName: true, email: true },
                    },
                },
            },
            reviewTasks: {
                orderBy: { createdAt: "desc" },
                include: {
                    user: {
                        select: { id: true, firstName: true, lastName: true, email: true },
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
export async function updateDocument(documentId, data, userId) {
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
export async function submitForReview(documentId, reviewerIds, comments, userId) {
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
export async function approveReview(documentId, reviewTaskId, action, comments, userId) {
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
    const newStatus = action === "APPROVE" ? "APPROVED" : "CHANGES_REQUESTED";
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
export async function publishDocument(documentId, comments, userId) {
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
export async function listDocuments(page = 1, limit = 20, filters) {
    const skip = (page - 1) * limit;
    const where = {};
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
export async function downloadDocument(documentId, userId) {
    const document = await prisma.document.findUnique({
        where: { id: documentId },
    });
    if (!document) {
        throw new NotFoundError("Document not found");
    }
    if (!document.googleDriveFileId) {
        throw new AppError(400, "El documento no tiene archivo adjunto");
    }
    const version = await prisma.documentVersion.findFirst({
        where: { documentId, versionLabel: document.currentVersionLabel },
    });
    if (!version?.fileContent) {
        throw new AppError(400, "Contenido del archivo no encontrado");
    }
    await prisma.auditLog.create({
        data: {
            userId,
            action: "DOWNLOAD_DOCUMENT",
            entityType: "Document",
            entityId: documentId,
            documentId,
            metadata: { fileName: version.fileName || document.title },
        },
    });
    return {
        content: Buffer.from(version.fileContent),
        fileName: version.fileName || `${document.code}_v${document.currentVersionLabel}.pdf`,
        mimeType: version.mimeType || "application/octet-stream",
    };
}
export async function createNewVersion(documentId, changes, userId) {
    const document = await prisma.document.findUnique({ where: { id: documentId } });
    if (!document)
        throw new NotFoundError("Document not found");
    if (document.status !== "PUBLISHED") {
        throw new ValidationError("Solo se puede crear una nueva versión de documentos publicados");
    }
    // Increment major version: v1.0 → v2.0
    const match = document.currentVersionLabel.match(/v(\d+)\.(\d+)/);
    const newMajor = match ? parseInt(match[1]) + 1 : 2;
    const newVersionLabel = `v${newMajor}.0`;
    // Mark old published version as OBSOLETE
    await prisma.documentVersion.updateMany({
        where: { documentId, versionLabel: document.currentVersionLabel },
        data: { status: "OBSOLETE" },
    });
    // Create the new version record
    await prisma.documentVersion.create({
        data: {
            documentId,
            versionLabel: newVersionLabel,
            googleDriveFileId: "",
            status: "DRAFT",
            changes: changes || `Nueva versión ${newVersionLabel}. Revisión del documento ${document.code}.`,
            createdBy: userId,
        },
    });
    // Update document: back to DRAFT with new version label
    const updated = await prisma.document.update({
        where: { id: documentId },
        data: {
            status: "DRAFT",
            currentVersionLabel: newVersionLabel,
            googleDriveFileId: "",
            publishedAt: null,
            reviewedBy: null,
            updatedBy: userId,
        },
    });
    await prisma.auditLog.create({
        data: {
            userId,
            action: "CREATE_NEW_VERSION",
            entityType: "Document",
            entityId: documentId,
            documentId,
            metadata: { previousVersion: document.currentVersionLabel, newVersion: newVersionLabel, changes },
        },
    });
    logger.info("New document version created", { documentId, newVersionLabel });
    return formatDocument(updated);
}
// Helper functions
function formatDocument(doc) {
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
function formatDocumentWithDetails(doc) {
    return {
        ...formatDocument(doc),
        versions: doc.versions,
        comments: (doc.comments || []).map((c) => ({
            id: c.id,
            content: c.content,
            author: c.authorUser,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
        })),
        reviewTasks: (doc.reviewTasks || []).map((t) => ({
            id: t.id,
            status: t.status,
            action: t.action,
            comments: t.comments,
            completedAt: t.completedAt,
            createdAt: t.createdAt,
            reviewer: t.user,
        })),
    };
}
//# sourceMappingURL=document.js.map