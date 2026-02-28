import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger.js";
const prisma = new PrismaClient();
export async function getNotifications(userId, page = 1, limit = 20, unreadOnly = false, archivedOnly = false) {
    const skip = (page - 1) * limit;
    const where = { userId };
    if (archivedOnly) {
        where.archivedAt = { not: null };
    }
    else {
        // Default: hide archived notifications
        where.archivedAt = null;
        if (unreadOnly)
            where.readAt = null;
    }
    const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
        prisma.notification.count({ where }),
    ]);
    return {
        items: notifications,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}
export async function markNotificationAsRead(notificationId) {
    const notification = await prisma.notification.update({
        where: { id: notificationId },
        data: {
            readAt: new Date(),
        },
    });
    return notification;
}
export async function markAllNotificationsAsRead(userId) {
    await prisma.notification.updateMany({
        where: {
            userId,
            readAt: null,
        },
        data: {
            readAt: new Date(),
        },
    });
    logger.info("All notifications marked as read", { userId });
}
export async function getUnreadCount(userId) {
    const count = await prisma.notification.count({
        where: {
            userId,
            readAt: null,
            archivedAt: null,
        },
    });
    return count;
}
export async function archiveNotification(notificationId) {
    const now = new Date();
    await prisma.notification.update({
        where: { id: notificationId },
        data: {
            archivedAt: now,
            // Also mark as read when archiving
            readAt: now,
        },
    });
}
export async function restoreNotification(notificationId) {
    await prisma.notification.update({
        where: { id: notificationId },
        data: { archivedAt: null },
    });
}
export async function deleteNotification(notificationId) {
    await prisma.notification.delete({
        where: { id: notificationId },
    });
}
//# sourceMappingURL=notification.js.map