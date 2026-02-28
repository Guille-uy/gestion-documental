import { asyncHandler } from "../middleware/error.js";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, getUnreadCount, archiveNotification, restoreNotification, deleteNotification, } from "../services/notification.js";
export const getNotificationsHandler = asyncHandler(async (req, res) => {
    if (!req.user)
        return res.status(401).json({ success: false, error: "Not authenticated" });
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const unreadOnly = req.query.unreadOnly === "true";
    const archivedOnly = req.query.archivedOnly === "true";
    const result = await getNotifications(req.user.userId, page, limit, unreadOnly, archivedOnly);
    res.json({ success: true, data: result });
});
export const markAsReadHandler = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const notification = await markNotificationAsRead(notificationId);
    res.json({ success: true, data: notification });
});
export const markAllAsReadHandler = asyncHandler(async (req, res) => {
    if (!req.user)
        return res.status(401).json({ success: false, error: "Not authenticated" });
    await markAllNotificationsAsRead(req.user.userId);
    res.json({ success: true, message: "All notifications marked as read" });
});
export const getUnreadCountHandler = asyncHandler(async (req, res) => {
    if (!req.user)
        return res.status(401).json({ success: false, error: "Not authenticated" });
    const count = await getUnreadCount(req.user.userId);
    res.json({ success: true, data: { count } });
});
export const archiveNotificationHandler = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    await archiveNotification(notificationId);
    res.json({ success: true, message: "Notification archived" });
});
export const restoreNotificationHandler = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    await restoreNotification(notificationId);
    res.json({ success: true, message: "Notification restored" });
});
export const deleteNotificationHandler = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    await deleteNotification(notificationId);
    res.json({ success: true, message: "Notification deleted" });
});
//# sourceMappingURL=notification.js.map