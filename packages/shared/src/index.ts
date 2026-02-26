import { z } from "zod";

// ============= Enums =============
export enum UserRole {
  ADMIN = "ADMIN",
  QUALITY_MANAGER = "QUALITY_MANAGER",
  DOCUMENT_OWNER = "DOCUMENT_OWNER",
  REVIEWER = "REVIEWER",
  APPROVER = "APPROVER",
  READER = "READER",
}

export enum DocumentStatus {
  DRAFT = "DRAFT",
  IN_REVIEW = "IN_REVIEW",
  APPROVED = "APPROVED",
  PUBLISHED = "PUBLISHED",
  OBSOLETE = "OBSOLETE",
}

export enum DocumentType {
  SOP = "SOP", // Standard Operating Procedure
  POLICY = "POLICY",
  WI = "WI", // Work Instruction
  FORM = "FORM",
  RECORD = "RECORD",
}

export enum NotificationType {
  DOCUMENT_SUBMITTED = "DOCUMENT_SUBMITTED",
  DOCUMENT_APPROVED = "DOCUMENT_APPROVED",
  DOCUMENT_PUBLISHED = "DOCUMENT_PUBLISHED",
  REVIEW_REQUESTED = "REVIEW_REQUESTED",
  REVIEW_REMINDER = "REVIEW_REMINDER",
  DOCUMENT_CHANGED = "DOCUMENT_CHANGED",
  USER_ASSIGNED = "USER_ASSIGNED",
}

export enum AuditAction {
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  CREATE_DOCUMENT = "CREATE_DOCUMENT",
  UPDATE_DOCUMENT = "UPDATE_DOCUMENT",
  DELETE_DOCUMENT = "DELETE_DOCUMENT",
  PUBLISH_DOCUMENT = "PUBLISH_DOCUMENT",
  DOWNLOAD_DOCUMENT = "DOWNLOAD_DOCUMENT",
  CREATE_USER = "CREATE_USER",
  UPDATE_USER = "UPDATE_USER",
  DELETE_USER = "DELETE_USER",
  ASSIGN_ROLE = "ASSIGN_ROLE",
  SUBMIT_FOR_REVIEW = "SUBMIT_FOR_REVIEW",
  APPROVE_REVIEW = "APPROVE_REVIEW",
  REQUEST_CHANGES = "REQUEST_CHANGES",
}

// ============= DTOs =============

// Auth
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

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
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

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
export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.nativeEnum(UserRole),
  area: z.string().nullable().optional(),
  password: z.string().min(8),
});
export type CreateUser = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.nativeEnum(UserRole).optional(),
  area: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateUser = z.infer<typeof UpdateUserSchema>;

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
export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;

export const CreateDocumentSchema = z.object({
  code: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.nativeEnum(DocumentType),
  area: z.string().min(1),
});
export type CreateDocument = z.infer<typeof CreateDocumentSchema>;

export const UpdateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  area: z.string().optional(),
  nextReviewDate: z.date().optional().nullable(),
});
export type UpdateDocument = z.infer<typeof UpdateDocumentSchema>;

export const DocumentVersionSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  versionLabel: z.string(),
  googleDriveFileId: z.string(),
  createdAt: z.date().or(z.string()),
  createdBy: z.string(),
  status: z.nativeEnum(DocumentStatus),
});
export type DocumentVersion = z.infer<typeof DocumentVersionSchema>;

// Document Workflow
export const SubmitForReviewSchema = z.object({
  comments: z.string().optional(),
  reviewers: z.array(z.string()).min(1),
});
export type SubmitForReview = z.infer<typeof SubmitForReviewSchema>;

export const ReviewActionSchema = z.object({
  action: z.enum(["APPROVE", "REQUEST_CHANGES"]),
  comments: z.string().optional(),
});
export type ReviewAction = z.infer<typeof ReviewActionSchema>;

export const PublishDocumentSchema = z.object({
  comments: z.string().optional(),
});
export type PublishDocument = z.infer<typeof PublishDocumentSchema>;

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
export type Notification = z.infer<typeof NotificationSchema>;

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
export type AuditLog = z.infer<typeof AuditLogSchema>;

// API Response Wrapper
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// Pagination
export const PaginationParamsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});
export type PaginationParams = z.infer<typeof PaginationParamsSchema>;

export const PaginatedResponseSchema = z.object({
  items: z.array(z.any()),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});
export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
