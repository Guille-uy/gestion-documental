import { z } from "zod";
// ============= Enums =============
export var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["QUALITY_MANAGER"] = "QUALITY_MANAGER";
    UserRole["DOCUMENT_OWNER"] = "DOCUMENT_OWNER";
    UserRole["REVIEWER"] = "REVIEWER";
    UserRole["APPROVER"] = "APPROVER";
    UserRole["READER"] = "READER";
})(UserRole || (UserRole = {}));
export var DocumentStatus;
(function (DocumentStatus) {
    DocumentStatus["DRAFT"] = "DRAFT";
    DocumentStatus["IN_REVIEW"] = "IN_REVIEW";
    DocumentStatus["APPROVED"] = "APPROVED";
    DocumentStatus["PUBLISHED"] = "PUBLISHED";
    DocumentStatus["OBSOLETE"] = "OBSOLETE";
})(DocumentStatus || (DocumentStatus = {}));
export var DocumentType;
(function (DocumentType) {
    DocumentType["SOP"] = "SOP";
    DocumentType["POLICY"] = "POLICY";
    DocumentType["WI"] = "WI";
    DocumentType["FORM"] = "FORM";
    DocumentType["RECORD"] = "RECORD";
})(DocumentType || (DocumentType = {}));
export var NotificationType;
(function (NotificationType) {
    NotificationType["DOCUMENT_SUBMITTED"] = "DOCUMENT_SUBMITTED";
    NotificationType["DOCUMENT_APPROVED"] = "DOCUMENT_APPROVED";
    NotificationType["DOCUMENT_PUBLISHED"] = "DOCUMENT_PUBLISHED";
    NotificationType["REVIEW_REQUESTED"] = "REVIEW_REQUESTED";
    NotificationType["REVIEW_REMINDER"] = "REVIEW_REMINDER";
    NotificationType["DOCUMENT_CHANGED"] = "DOCUMENT_CHANGED";
    NotificationType["USER_ASSIGNED"] = "USER_ASSIGNED";
})(NotificationType || (NotificationType = {}));
export var AuditAction;
(function (AuditAction) {
    AuditAction["LOGIN"] = "LOGIN";
    AuditAction["LOGOUT"] = "LOGOUT";
    AuditAction["CREATE_DOCUMENT"] = "CREATE_DOCUMENT";
    AuditAction["UPDATE_DOCUMENT"] = "UPDATE_DOCUMENT";
    AuditAction["DELETE_DOCUMENT"] = "DELETE_DOCUMENT";
    AuditAction["PUBLISH_DOCUMENT"] = "PUBLISH_DOCUMENT";
    AuditAction["DOWNLOAD_DOCUMENT"] = "DOWNLOAD_DOCUMENT";
    AuditAction["CREATE_USER"] = "CREATE_USER";
    AuditAction["UPDATE_USER"] = "UPDATE_USER";
    AuditAction["DELETE_USER"] = "DELETE_USER";
    AuditAction["ASSIGN_ROLE"] = "ASSIGN_ROLE";
    AuditAction["SUBMIT_FOR_REVIEW"] = "SUBMIT_FOR_REVIEW";
    AuditAction["APPROVE_REVIEW"] = "APPROVE_REVIEW";
    AuditAction["REQUEST_CHANGES"] = "REQUEST_CHANGES";
})(AuditAction || (AuditAction = {}));
// ============= DTOs =============
// Auth
export const LoginRequestSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});
export const LoginResponseSchema = z.object({
    accessToken: z.string(),
    refreshToken: z.string().optional(),
    user: z.object({
        id: z.string(),
        email: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        role: z.nativeEnum(UserRole),
        area: z.string().nullable(),
        isActive: z.boolean(),
    }),
});
// User
export const UserSchema = z.object({
    id: z.string(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.nativeEnum(UserRole),
    area: z.string().nullable(),
    isActive: z.boolean(),
    createdAt: z.date().or(z.string()),
    updatedAt: z.date().or(z.string()),
});
export const CreateUserSchema = z.object({
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    role: z.nativeEnum(UserRole),
    area: z.string().nullable().optional(),
    password: z.string().min(8),
});
export const UpdateUserSchema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    role: z.nativeEnum(UserRole).optional(),
    area: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
});
// Document
export const DocumentMetadataSchema = z.object({
    id: z.string(),
    code: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    type: z.nativeEnum(DocumentType),
    area: z.string(),
    status: z.nativeEnum(DocumentStatus),
    currentVersionLabel: z.string(),
    googleDriveFileId: z.string(),
    fileUrl: z.string().optional(),
    createdBy: z.string(),
    createdAt: z.date().or(z.string()),
    updatedBy: z.string(),
    updatedAt: z.date().or(z.string()),
    publishedAt: z.date().or(z.string()).nullable(),
    nextReviewDate: z.date().or(z.string()).nullable(),
    reviewedBy: z.string().nullable(),
});
export const CreateDocumentSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    type: z.string().min(1),
    area: z.string().min(1),
});
export const CreateAreaSchema = z.object({
    name: z.string().min(1),
    code: z.string().min(1).max(10),
    description: z.string().optional(),
});
export const UpdateAreaSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
});
export const CreateDocumentTypeConfigSchema = z.object({
    name: z.string().min(1),
    code: z.string().min(1).max(20),
    prefix: z.string().min(1).max(10),
    description: z.string().optional(),
});
export const UpdateDocumentTypeConfigSchema = z.object({
    name: z.string().min(1).optional(),
    prefix: z.string().min(1).max(10).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
});
export const UpdateDocumentSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    area: z.string().optional(),
    nextReviewDate: z.date().optional().nullable(),
});
export const DocumentVersionSchema = z.object({
    id: z.string(),
    documentId: z.string(),
    versionLabel: z.string(),
    googleDriveFileId: z.string(),
    createdAt: z.date().or(z.string()),
    createdBy: z.string(),
    status: z.nativeEnum(DocumentStatus),
});
// Document Workflow
export const SubmitForReviewSchema = z.object({
    comments: z.string().optional(),
    reviewers: z.array(z.string()).min(1),
});
export const ReviewActionSchema = z.object({
    action: z.enum(["APPROVE", "REQUEST_CHANGES"]),
    comments: z.string().optional(),
});
export const PublishDocumentSchema = z.object({
    comments: z.string().optional(),
});
// Notification
export const NotificationSchema = z.object({
    id: z.string(),
    userId: z.string(),
    type: z.nativeEnum(NotificationType),
    title: z.string(),
    message: z.string(),
    entityType: z.string(),
    entityId: z.string(),
    createdAt: z.date().or(z.string()),
    readAt: z.date().or(z.string()).nullable(),
});
// Audit Log
export const AuditLogSchema = z.object({
    id: z.string(),
    userId: z.string(),
    action: z.nativeEnum(AuditAction),
    entityType: z.string(),
    entityId: z.string().nullable(),
    metadata: z.record(z.any()).nullable(),
    ipAddress: z.string().nullable(),
    createdAt: z.date().or(z.string()),
});
// API Response Wrapper
export const ApiResponseSchema = z.object({
    success: z.boolean(),
    data: z.any().optional(),
    error: z.string().optional(),
    message: z.string().optional(),
});
// Pagination
export const PaginationParamsSchema = z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
});
export const PaginatedResponseSchema = z.object({
    items: z.array(z.any()),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
});
