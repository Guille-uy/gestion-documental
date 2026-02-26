import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger.js";

const prisma = new PrismaClient();

export async function getNotifications(
  userId: string,
  page: number = 1,
  limit: number = 20,
  unreadOnly: boolean = false
) {
  const skip = (page - 1) * limit;

  const where: any = { userId };
  if (unreadOnly) {
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

export async function markNotificationAsRead(notificationId: string) {
  const notification = await prisma.notification.update({
    where: { id: notificationId },
    data: {
      readAt: new Date(),
    },
  });

  return notification;
}

export async function markAllNotificationsAsRead(userId: string) {
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

export async function getUnreadCount(userId: string) {
  const count = await prisma.notification.count({
    where: {
      userId,
      readAt: null,
    },
  });

  return count;
}

export async function deleteNotification(notificationId: string) {
  await prisma.notification.delete({
    where: { id: notificationId },
  });
}
