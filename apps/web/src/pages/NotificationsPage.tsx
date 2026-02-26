import React, { useEffect, useState } from "react";
import { apiService } from "../services/api.js";
import { Button } from "../components/Button.js";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const limit = 20;

  useEffect(() => {
    fetchNotifications();
  }, [page, unreadOnly]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getNotifications({
        page,
        limit,
        unreadOnly,
      });
      setNotifications(response.data.data.items);
      setTotal(response.data.data.total);
    } catch (error) {
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, readAt: new Date() } : n
        )
      );
    } catch (error) {
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date() }))
      );
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await apiService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      toast.success("Notification deleted");
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <Button onClick={handleMarkAllAsRead} variant="secondary" size="sm">
          Mark All as Read
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => {
              setUnreadOnly(e.target.checked);
              setPage(1);
            }}
            className="rounded"
          />
          <span className="text-sm font-medium">Show unread only</span>
        </label>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">No notifications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border-l-4 flex items-start justify-between ${
                notification.readAt
                  ? "bg-gray-50 border-gray-300"
                  : "bg-blue-50 border-blue-500"
              }`}
            >
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">
                  {notification.title}
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  {notification.message}
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>

              <div className="flex gap-2 ml-4">
                {!notification.readAt && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="p-2 hover:bg-gray-200 rounded"
                  >
                    ✓
                  </button>
                )}
                <button
                  onClick={() => handleDelete(notification.id)}
                  className="p-2 hover:bg-red-200 rounded text-red-600"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-gray-600">
            Showing {(page - 1) * limit + 1} to{" "}
            {Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
