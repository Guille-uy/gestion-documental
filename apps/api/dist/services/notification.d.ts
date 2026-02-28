export declare function getNotifications(userId: string, page?: number, limit?: number, unreadOnly?: boolean, archivedOnly?: boolean): Promise<{
    items: any;
    total: any;
    page: number;
    limit: number;
    totalPages: number;
}>;
export declare function markNotificationAsRead(notificationId: string): Promise<any>;
export declare function markAllNotificationsAsRead(userId: string): Promise<void>;
export declare function getUnreadCount(userId: string): Promise<any>;
export declare function archiveNotification(notificationId: string): Promise<void>;
export declare function restoreNotification(notificationId: string): Promise<void>;
export declare function deleteNotification(notificationId: string): Promise<void>;
//# sourceMappingURL=notification.d.ts.map