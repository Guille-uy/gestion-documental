import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getAuditLogs(
  page: number = 1,
  limit: number = 50,
  filters?: {
    action?: string;
    userId?: string;
    entityType?: string;
    from?: Date;
    to?: Date;
  }
) {
  const skip = (page - 1) * limit;

  const where: any = {};

  if (filters?.action) {
    where.action = filters.action;
  }
  if (filters?.userId) {
    where.userId = filters.userId;
  }
  if (filters?.entityType) {
    where.entityType = filters.entityType;
  }
  if (filters?.from || filters?.to) {
    where.createdAt = {};
    if (filters.from) {
      where.createdAt.gte = filters.from;
    }
    if (filters.to) {
      where.createdAt.lte = filters.to;
    }
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    items: logs.map((log: any) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      user: log.user,
      metadata: log.metadata,
      createdAt: log.createdAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function logAuditAction(
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: Record<string, any>
) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entityType,
      entityId: entityId ?? "",
      metadata,
    },
  });
}
