import { Router } from "express";
import {
  getNotificationsHandler,
  markAsReadHandler,
  markAllAsReadHandler,
  getUnreadCountHandler,
  archiveNotificationHandler,
  restoreNotificationHandler,
  deleteNotificationHandler,
} from "../controllers/notification.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getNotificationsHandler);
router.get("/unread/count", getUnreadCountHandler);
router.patch("/:notificationId/read", markAsReadHandler);
router.post("/mark-all-read", markAllAsReadHandler);
router.patch("/:notificationId/archive", archiveNotificationHandler);
router.patch("/:notificationId/restore", restoreNotificationHandler);
router.delete("/:notificationId", deleteNotificationHandler);

export default router;
