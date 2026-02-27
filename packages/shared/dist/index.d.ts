import { z } from "zod";
export declare enum UserRole {
    ADMIN = "ADMIN",
    QUALITY_MANAGER = "QUALITY_MANAGER",
    DOCUMENT_OWNER = "DOCUMENT_OWNER",
    REVIEWER = "REVIEWER",
    APPROVER = "APPROVER",
    READER = "READER"
}
export declare enum DocumentStatus {
    DRAFT = "DRAFT",
    IN_REVIEW = "IN_REVIEW",
    APPROVED = "APPROVED",
    PUBLISHED = "PUBLISHED",
    OBSOLETE = "OBSOLETE"
}
export declare enum DocumentType {
    SOP = "SOP",// Standard Operating Procedure
    POLICY = "POLICY",
    WI = "WI",// Work Instruction
    FORM = "FORM",
    RECORD = "RECORD"
}
export declare enum NotificationType {
    DOCUMENT_SUBMITTED = "DOCUMENT_SUBMITTED",
    DOCUMENT_APPROVED = "DOCUMENT_APPROVED",
    DOCUMENT_PUBLISHED = "DOCUMENT_PUBLISHED",
    REVIEW_REQUESTED = "REVIEW_REQUESTED",
    REVIEW_REMINDER = "REVIEW_REMINDER",
    DOCUMENT_CHANGED = "DOCUMENT_CHANGED",
    USER_ASSIGNED = "USER_ASSIGNED"
}
export declare enum AuditAction {
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
    REQUEST_CHANGES = "REQUEST_CHANGES"
}
export declare const LoginRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export declare const LoginResponseSchema: z.ZodObject<{
    accessToken: z.ZodString;
    refreshToken: z.ZodOptional<z.ZodString>;
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        role: z.ZodNativeEnum<typeof UserRole>;
        area: z.ZodNullable<z.ZodString>;
        isActive: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        email: string;
        id: string;
        firstName: string;
        lastName: string;
        role: UserRole;
        area: string | null;
        isActive: boolean;
    }, {
        email: string;
        id: string;
        firstName: string;
        lastName: string;
        role: UserRole;
        area: string | null;
        isActive: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    accessToken: string;
    user: {
        email: string;
        id: string;
        firstName: string;
        lastName: string;
        role: UserRole;
        area: string | null;
        isActive: boolean;
    };
    refreshToken?: string | undefined;
}, {
    accessToken: string;
    user: {
        email: string;
        id: string;
        firstName: string;
        lastName: string;
        role: UserRole;
        area: string | null;
        isActive: boolean;
    };
    refreshToken?: string | undefined;
}>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    role: z.ZodNativeEnum<typeof UserRole>;
    area: z.ZodNullable<z.ZodString>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    updatedAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
}, "strip", z.ZodTypeAny, {
    email: string;
    id: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    area: string | null;
    isActive: boolean;
    createdAt: string | Date;
    updatedAt: string | Date;
}, {
    email: string;
    id: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    area: string | null;
    isActive: boolean;
    createdAt: string | Date;
    updatedAt: string | Date;
}>;
export type User = z.infer<typeof UserSchema>;
export declare const CreateUserSchema: z.ZodObject<{
    email: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    role: z.ZodNativeEnum<typeof UserRole>;
    area: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    area?: string | null | undefined;
}, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    area?: string | null | undefined;
}>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export declare const UpdateUserSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodNativeEnum<typeof UserRole>>;
    area: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    role?: UserRole | undefined;
    area?: string | null | undefined;
    isActive?: boolean | undefined;
}, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    role?: UserRole | undefined;
    area?: string | null | undefined;
    isActive?: boolean | undefined;
}>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export declare const DocumentMetadataSchema: z.ZodObject<{
    id: z.ZodString;
    code: z.ZodString;
    title: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    type: z.ZodNativeEnum<typeof DocumentType>;
    area: z.ZodString;
    status: z.ZodNativeEnum<typeof DocumentStatus>;
    currentVersionLabel: z.ZodString;
    googleDriveFileId: z.ZodString;
    fileUrl: z.ZodOptional<z.ZodString>;
    createdBy: z.ZodString;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    updatedBy: z.ZodString;
    updatedAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    publishedAt: z.ZodNullable<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
    nextReviewDate: z.ZodNullable<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
    reviewedBy: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code: string;
    type: DocumentType;
    status: DocumentStatus;
    id: string;
    area: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    title: string;
    description: string | null;
    currentVersionLabel: string;
    googleDriveFileId: string;
    createdBy: string;
    updatedBy: string;
    publishedAt: string | Date | null;
    nextReviewDate: string | Date | null;
    reviewedBy: string | null;
    fileUrl?: string | undefined;
}, {
    code: string;
    type: DocumentType;
    status: DocumentStatus;
    id: string;
    area: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    title: string;
    description: string | null;
    currentVersionLabel: string;
    googleDriveFileId: string;
    createdBy: string;
    updatedBy: string;
    publishedAt: string | Date | null;
    nextReviewDate: string | Date | null;
    reviewedBy: string | null;
    fileUrl?: string | undefined;
}>;
export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;
export declare const CreateDocumentSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodString;
    area: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: string;
    area: string;
    title: string;
    description?: string | undefined;
}, {
    type: string;
    area: string;
    title: string;
    description?: string | undefined;
}>;
export type CreateDocument = z.infer<typeof CreateDocumentSchema>;
export declare const CreateAreaSchema: z.ZodObject<{
    name: z.ZodString;
    code: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    description?: string | undefined;
}, {
    code: string;
    name: string;
    description?: string | undefined;
}>;
export type CreateArea = z.infer<typeof CreateAreaSchema>;
export declare const UpdateAreaSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    isActive?: boolean | undefined;
    description?: string | undefined;
    name?: string | undefined;
}, {
    isActive?: boolean | undefined;
    description?: string | undefined;
    name?: string | undefined;
}>;
export type UpdateArea = z.infer<typeof UpdateAreaSchema>;
export declare const CreateDocumentTypeConfigSchema: z.ZodObject<{
    name: z.ZodString;
    code: z.ZodString;
    prefix: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    prefix: string;
    description?: string | undefined;
}, {
    code: string;
    name: string;
    prefix: string;
    description?: string | undefined;
}>;
export type CreateDocumentTypeConfig = z.infer<typeof CreateDocumentTypeConfigSchema>;
export declare const UpdateDocumentTypeConfigSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    prefix: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    isActive?: boolean | undefined;
    description?: string | undefined;
    name?: string | undefined;
    prefix?: string | undefined;
}, {
    isActive?: boolean | undefined;
    description?: string | undefined;
    name?: string | undefined;
    prefix?: string | undefined;
}>;
export type UpdateDocumentTypeConfig = z.infer<typeof UpdateDocumentTypeConfigSchema>;
export declare const UpdateDocumentSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    area: z.ZodOptional<z.ZodString>;
    nextReviewDate: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
}, "strip", z.ZodTypeAny, {
    area?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    nextReviewDate?: Date | null | undefined;
}, {
    area?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    nextReviewDate?: Date | null | undefined;
}>;
export type UpdateDocument = z.infer<typeof UpdateDocumentSchema>;
export declare const DocumentVersionSchema: z.ZodObject<{
    id: z.ZodString;
    documentId: z.ZodString;
    versionLabel: z.ZodString;
    googleDriveFileId: z.ZodString;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    createdBy: z.ZodString;
    status: z.ZodNativeEnum<typeof DocumentStatus>;
}, "strip", z.ZodTypeAny, {
    status: DocumentStatus;
    id: string;
    createdAt: string | Date;
    googleDriveFileId: string;
    createdBy: string;
    documentId: string;
    versionLabel: string;
}, {
    status: DocumentStatus;
    id: string;
    createdAt: string | Date;
    googleDriveFileId: string;
    createdBy: string;
    documentId: string;
    versionLabel: string;
}>;
export type DocumentVersion = z.infer<typeof DocumentVersionSchema>;
export declare const SubmitForReviewSchema: z.ZodObject<{
    comments: z.ZodOptional<z.ZodString>;
    reviewers: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    reviewers: string[];
    comments?: string | undefined;
}, {
    reviewers: string[];
    comments?: string | undefined;
}>;
export type SubmitForReview = z.infer<typeof SubmitForReviewSchema>;
export declare const ReviewActionSchema: z.ZodObject<{
    action: z.ZodEnum<["APPROVE", "REQUEST_CHANGES"]>;
    comments: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    action: "REQUEST_CHANGES" | "APPROVE";
    comments?: string | undefined;
}, {
    action: "REQUEST_CHANGES" | "APPROVE";
    comments?: string | undefined;
}>;
export type ReviewAction = z.infer<typeof ReviewActionSchema>;
export declare const PublishDocumentSchema: z.ZodObject<{
    comments: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    comments?: string | undefined;
}, {
    comments?: string | undefined;
}>;
export type PublishDocument = z.infer<typeof PublishDocumentSchema>;
export declare const NotificationSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    type: z.ZodNativeEnum<typeof NotificationType>;
    title: z.ZodString;
    message: z.ZodString;
    entityType: z.ZodString;
    entityId: z.ZodString;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    readAt: z.ZodNullable<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
}, "strip", z.ZodTypeAny, {
    message: string;
    type: NotificationType;
    id: string;
    createdAt: string | Date;
    title: string;
    userId: string;
    entityType: string;
    entityId: string;
    readAt: string | Date | null;
}, {
    message: string;
    type: NotificationType;
    id: string;
    createdAt: string | Date;
    title: string;
    userId: string;
    entityType: string;
    entityId: string;
    readAt: string | Date | null;
}>;
export type Notification = z.infer<typeof NotificationSchema>;
export declare const AuditLogSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    action: z.ZodNativeEnum<typeof AuditAction>;
    entityType: z.ZodString;
    entityId: z.ZodNullable<z.ZodString>;
    metadata: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodAny>>;
    ipAddress: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string | Date;
    action: AuditAction;
    userId: string;
    entityType: string;
    entityId: string | null;
    metadata: Record<string, any> | null;
    ipAddress: string | null;
}, {
    id: string;
    createdAt: string | Date;
    action: AuditAction;
    userId: string;
    entityType: string;
    entityId: string | null;
    metadata: Record<string, any> | null;
    ipAddress: string | null;
}>;
export type AuditLog = z.infer<typeof AuditLogSchema>;
export declare const ApiResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodAny>;
    error: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    message?: string | undefined;
    data?: any;
    error?: string | undefined;
}, {
    success: boolean;
    message?: string | undefined;
    data?: any;
    error?: string | undefined;
}>;
export type ApiResponse<T = any> = {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
};
export declare const PaginationParamsSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>;
export type PaginationParams = z.infer<typeof PaginationParamsSchema>;
export declare const PaginatedResponseSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodAny, "many">;
    total: z.ZodNumber;
    page: z.ZodNumber;
    limit: z.ZodNumber;
    totalPages: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    items: any[];
    total: number;
    totalPages: number;
}, {
    page: number;
    limit: number;
    items: any[];
    total: number;
    totalPages: number;
}>;
export type PaginatedResponse<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};
