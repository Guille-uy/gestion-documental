import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger.js";

const prisma = new PrismaClient();

export function startCronJobs() {
  // Daily at 8am UTC — review reminders
  cron.schedule("0 8 * * *", async () => {
    logger.info("[Cron] Running daily review reminders");
    try {
      await sendReviewReminders();
    } catch (err) {
      logger.error("[Cron] Error in review reminders", { err });
    }
  });

  logger.info("[Cron] Jobs scheduled (daily @ 08:00 UTC)");
}

async function sendReviewReminders() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const in31days = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);

  const docs = await prisma.document.findMany({
    where: {
      status: "PUBLISHED",
      nextReviewDate: { lte: in31days },
    },
  });

  let created = 0;

  for (const doc of docs) {
    if (!doc.nextReviewDate) continue;

    const daysLeft = Math.round(
      (doc.nextReviewDate.getTime() - now.getTime()) / 86400000
    );

    // Only notify at milestones: overdue, ≤7d, ≤14d, ≤30d
    const withinRange = daysLeft <= 30;
    if (!withinRange) continue;

    // One notification per document per day max
    const already = await prisma.notification.findFirst({
      where: {
        userId: doc.createdBy,
        documentId: doc.id,
        type: "REVIEW_REMINDER",
        createdAt: { gte: todayStart },
      },
    });
    if (already) continue;

    const label =
      daysLeft < 0
        ? `vencida hace ${Math.abs(daysLeft)} día${Math.abs(daysLeft) !== 1 ? "s" : ""}`
        : daysLeft === 0
        ? "hoy"
        : `en ${daysLeft} día${daysLeft !== 1 ? "s" : ""}`;

    await prisma.notification.create({
      data: {
        userId: doc.createdBy,
        type: "REVIEW_REMINDER",
        title: `Revisión: ${doc.code}`,
        message: `"${doc.title}" (${doc.area}) tiene revisión programada ${label}.`,
        entityType: "Document",
        entityId: doc.id,
        documentId: doc.id,
      },
    });
    created++;
  }

  logger.info(
    `[Cron] Review reminders: ${created} notifications created for ${docs.length} docs checked`
  );
}
