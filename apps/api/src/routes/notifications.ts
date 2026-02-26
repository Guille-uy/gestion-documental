import { Router } from "express";
import {
  getNotificationsHandler,
  markAsReadHandler,
  markAllAsReadHandler,
  getUnreadCountHandler,
  deleteNotificationHandler,
} from "../controllers/notification.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// All notification routes require authentication
router.use(authMiddleware);

router.get("/", getNotificationsHandler);
router.get("/unread/count", getUnreadCountHandler);
router.patch("/:notificationId/read", markAsReadHandler);
router.post("/mark-all-read", markAllAsReadHandler);
router.delete("/:notificationId", deleteNotificationHandler);

export default router;
