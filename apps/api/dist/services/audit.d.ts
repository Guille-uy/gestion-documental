export declare function getAuditLogs(page?: number, limit?: number, filters?: {
    action?: string;
    userId?: string;
    entityType?: string;
    from?: Date;
    to?: Date;
}): Promise<{
    items: any;
    total: any;
    page: number;
    limit: number;
    totalPages: number;
}>;
export declare function logAuditAction(userId: string, action: string, entityType: string, entityId?: string, metadata?: Record<string, any>): Promise<void>;
//# sourceMappingURL=audit.d.ts.map